module.exports = {
  apps: [{
    name: 'marin-pest-control-backend',
    script: 'dist/index.js',
    cwd: './backend',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    // Health check
    health_check_grace_period: 3000,
    // Auto restart on file changes (disabled in production)
    ignore_watch: [
      'node_modules',
      'logs',
      'dist'
    ],
    // Environment variables
    env_file: '.env',
    // Process management
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    // Logging
    log_type: 'json',
    // Monitoring
    pmx: true,
    // Advanced options
    node_args: '--max-old-space-size=1024',
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000
  }]
};