module.exports = {
    apps: [
        {
            name: 'nodejs-sequelize-pm2',
            script: './bin/www',
            instances: 3,
            exec_mode: 'cluster',
            merge_logs: true,
            autorestart: true,
        }
    ]
};