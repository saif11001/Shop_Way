const { db } = require('./index');

const Sequelize = require('sequelize');

const sequelize = new Sequelize(db.database, db.user, db.password, {
    host: db.host ,
    dialect: db.dialect
});

module.exports = sequelize;