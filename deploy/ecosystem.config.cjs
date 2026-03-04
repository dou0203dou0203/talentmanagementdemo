// PM2 設定ファイル
// Usage: pm2 start deploy/ecosystem.config.cjs
module.exports = {
    apps: [
        {
            name: 'talent-management',
            script: 'npx',
            args: 'tsx server/index.ts',
            cwd: '/opt/talent-management',     // ← サーバー上のパスに変更
            instances: 1,
            autorestart: true,
            watch: false,
            max_memory_restart: '512M',
            env: {
                NODE_ENV: 'production',
                PORT: 3001,
                JWT_SECRET: 'change-this-secret-in-production',  // ← 必ず変更
                CORS_ORIGIN: 'http://talent.yourcompany.co.jp',  // ← 自社ドメインに変更
            },
        },
    ],
};
