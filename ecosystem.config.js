module.exports = {
  apps: [
    {
      name: 'expenses',
      script: 'node_modules/.bin/next',
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
    },
  ],
};
