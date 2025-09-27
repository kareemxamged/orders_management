module.exports = {
    apps: [{
        name: 'order-system',
        script: 'npm',
        args: 'run preview -- --host 0.0.0.0 --port 4176',
        cwd: '/var/www/orders_sys',
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            VITE_SUPABASE_URL: 'https://tcmohnvzuguerxgcppus.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjbW9obnZ6dWd1ZXJ4Z2NwcHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4OTA0NzMsImV4cCI6MjA3NDQ2NjQ3M30.VXBapGKtHFgteoTOA4P5OnNFHNVAM2Vb_DD2pbeTgH0',
            VITE_APP_NAME: 'Orders_Management_sys',
            VITE_APP_VERSION: '1.0.0'
        },
        env_production: {
            NODE_ENV: 'production'
        },
        error_file: '/var/www/orders_sys/logs/err.log',
        out_file: '/var/www/orders_sys/logs/out.log',
        log_file: '/var/www/orders_sys/logs/combined.log',
        time: true
    }]
}