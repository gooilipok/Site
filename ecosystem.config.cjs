// ecosystem.config.cjs - PM2 Configuration optimized for shared hosting / 500MB RAM VPS
module.exports = {
  apps: [
    {
      name: 'bausquad',
      script: './dist/server.cjs',
      // Strict memory restriction: forces V8 engine garbage collector to keep heap around 120-160 MB
      node_args: '--max-old-space-size=180',
      instances: 1,
      autorestart: true,
      watch: false,
      // Automatic soft restart if memory footprint exceeds 220 MB
      max_memory_restart: '220M',
      restart_delay: 4000,
      min_uptime: '15s',
      max_restarts: 30,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './pm2-err.log',
      out_file: './pm2-out.log',
      time: true
    }
  ]
};
