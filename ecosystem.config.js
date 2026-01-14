module.exports = {
  apps: [
    {
      name: 'expenses',
      script: 'npm',
      args: 'start',
      cwd: '/home/cloudpanel/htdocs/expenses.4tmrw.net',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      error_file: '/home/cloudpanel/htdocs/expenses.4tmrw.net/logs/error.log',
      out_file: '/home/cloudpanel/htdocs/expenses.4tmrw.net/logs/out.log',
      log_file: '/home/cloudpanel/htdocs/expenses.4tmrw.net/logs/combined.log',
    },
  ],
};
