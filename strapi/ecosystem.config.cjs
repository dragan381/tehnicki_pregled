module.exports = {
  apps: [
    {
      name: 'strapi',
      cwd: '/home/strapi/tehnicki_pregled/strapi',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Logging
      error_file: '/home/strapi/logs/strapi-error.log',
      out_file: '/home/strapi/logs/strapi-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Graceful restart
      kill_timeout: 5000,
      listen_timeout: 10000,
    },
  ],
};
