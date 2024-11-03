module.exports = {
    apps: [{
      name: "your-app-name",
      script: "./index.js",
      watch: false,
      instances: 1,
      autorestart: false,
      cron_restart: "0 12 * * *",
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }]
  }