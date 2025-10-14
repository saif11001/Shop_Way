const bcrypt = require('bcrypt');
const Sequelize = require('sequelize');
const sequelize = require('../config/DB');
const userRole = require('../utils/userRole');

const User = sequelize.define('User', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            allowNull: false,
            primaryKey: true
        },
        firstName: {
            type: Sequelize.STRING,
            allowNull: true
        },
        lastName: {
            type: Sequelize.STRING,
            allowNull: true
        },
        email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            }
        },
        password: {
            type: Sequelize.STRING,
            allowNull: false
        },
        userRole: {
            type: Sequelize.ENUM(userRole.ADMIN, userRole.MANAGER, userRole.USER),
            allowNull: false,
            defaultValue: userRole.USER,
        },
        avatar: {
            type: Sequelize.STRING,
            allowNull: true
        },
        refreshToken: {
            type: Sequelize.TEXT,
            allowNull: true
        },
    },
    {
        defaultScope: {
            attributes: { exclude: ["password", "refreshToken"] }
        },
        scopes: {
            withPassword: { attributes: {} }
        },
        timestamps: true
    }
)

User.beforeCreate(async (user) => {
    if (user.password) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

User.beforeUpdate(async (user) => {
    if (user.changed("password")) {
        user.password = await bcrypt.hash(user.password, 10);
    }
});

module.exports = User;