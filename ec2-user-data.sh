#!/bin/bash
set -e

# ── XCompanion API Server Bootstrap ──
# Runs on first boot of the EC2 instance

# Update system
yum update -y

# Install unzip (needed for bun)
yum install -y unzip tar gzip git

# Install Bun
export HOME=/root
curl -fsSL https://bun.sh/install | bash
export BUN_INSTALL="/root/.bun"
export PATH="$BUN_INSTALL/bin:$PATH"

# Make bun available system-wide
ln -sf /root/.bun/bin/bun /usr/local/bin/bun
ln -sf /root/.bun/bin/bunx /usr/local/bin/bunx

# Create app directory
mkdir -p /opt/xcompanion
cd /opt/xcompanion

# Write environment file
cat > .env << 'ENVEOF'
TURSO_URL=libsql://xcompanion-intensedejavu.aws-us-east-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzA5OTMzNDksImlkIjoiNTFkY2JlMDktZDBjYy00ZjMyLWJlODMtMzZmZWJmMDY3MmJkIiwicmlkIjoiZDgyYTcyMmItYmIyNy00MzVkLWJmMjAtYjJlNWMwYzkzNzBkIn0.5G0zNANd21fmezDObsNQSxTyBkwRl-kw6rC49PDPPADo67yK2uDz-qAvej51An6WFj5dw3sASWds0HhagchIAA
PORT=4000
ENVEOF

# Install PM2 globally via bun
bun install -g pm2

# Make pm2 available
ln -sf /root/.bun/bin/pm2 /usr/local/bin/pm2

# Create a placeholder — actual code will be deployed via SCP
echo "Waiting for code deployment..." > /opt/xcompanion/READY

# Set up nginx reverse proxy (port 80 → 4000)
amazon-linux-extras install nginx1 2>/dev/null || yum install -y nginx
cat > /etc/nginx/conf.d/xcompanion.conf << 'NGINX'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
NGINX

# Remove default server block
rm -f /etc/nginx/conf.d/default.conf
sed -i '/server {/,/}/d' /etc/nginx/nginx.conf 2>/dev/null || true

systemctl enable nginx
systemctl start nginx

echo "✅ XCompanion EC2 bootstrap complete"
