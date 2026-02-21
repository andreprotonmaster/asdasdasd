module.exports = {
  apps: [{
    name: 'xcompanion',
    script: '/usr/local/bin/bun',
    args: 'run /opt/xcompanion/index.js',
    cwd: '/opt/xcompanion',
    max_restarts: 10,
    restart_delay: 3000,
    max_memory_restart: '512M',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }]
};
