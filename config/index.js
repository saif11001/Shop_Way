require('dotenv').config();

module.exports = {
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 6060,

    db: {
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT
    },

    jwt: {
        accessSecret: process.env.JWT_SECRET_KEY,
        refreshSecret: process.env.JWT_REFRESH_SECRET,
        accessExpiry: '15m',
        refreshExpiry: '10d'
    } 
};