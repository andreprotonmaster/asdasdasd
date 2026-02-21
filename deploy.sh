#!/bin/bash
set -e

# ── XCompanion deploy script ──
# Run from the server/ directory on your local machine
# Usage: ./deploy.sh

EC2_HOST="98.81.210.159"
SSH_KEY="C:\Users\andre\Desktop\pumpclawd-key.pem"
REMOTE_DIR="/opt/xcompanion"

echo "📦 Bundling server..."
bun build src/index.ts --outdir dist --target bun

echo "📤 Uploading to EC2..."
# Upload the bundled file + package files
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  dist/index.js \
  package.json \
  .env \
  ec2-user@$EC2_HOST:$REMOTE_DIR/

echo "🚀 Starting server on EC2..."
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ec2-user@$EC2_HOST << 'REMOTE'
  cd /opt/xcompanion
  export BUN_INSTALL="/root/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
  
  # Install dependencies if needed
  bun install --production 2>/dev/null || true
  
  # Start/restart with PM2
  pm2 stop xcompanion 2>/dev/null || true
  pm2 start index.js --name xcompanion --interpreter bun -- 
  pm2 save
  
  echo "✅ XCompanion API running!"
  pm2 status
REMOTE

echo "🎉 Deploy complete! API at http://$EC2_HOST:4000"
