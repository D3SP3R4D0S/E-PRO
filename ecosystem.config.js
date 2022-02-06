module.exports = {
    apps: [
        {
            name: 'EPRO',
            script: './bin/www',
            instances: 1,
            exec_mode: 'fork',
            merge_logs: true,
            autorestart: true,
        }
    ]
};