module.exports = {
    apps: [{
        name: 'order-system',
        script: 'npm',
        args: 'run preview -- --host 0.0.0.0 --port 4173',
        cwd: '/var/www/orders_management',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            // استبدل هذه القيم ببيانات Supabase الصحيحة
            VITE_SUPABASE_URL: 'https://your-project.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'your_anon_key_here',
            VITE_APP_NAME: 'نظام إدارة الطلبات',
            VITE_APP_VERSION: '1.0.0'
        },
        env_production: {
            NODE_ENV: 'production'
        },
        error_file: './logs/err.log',
        out_file: './logs/out.log',
        log_file: './logs/combined.log',
        time: true
    }]
}