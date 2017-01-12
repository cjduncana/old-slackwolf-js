'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

function initialize() {
  const config = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: `${process.env.DB_NAME}${process.env.NODE_ENV === 'test' ? '_test' : ''}`,
    host: process.env.DB_HOST || 'mysql',
    dialect: process.env.DB_DIALECT || 'mysql'
  };

  const sequelize = new Sequelize(config.database, config.username, config.password, Object.assign({}, config, {
    dialectOptions: {
      connectTimeout: 20000
    },
    logging: false
  }));

  const pathToModels = path.normalize(__dirname + '/../models');

  fs.readdirSync(pathToModels).forEach((file) => {
    require(`${pathToModels}/${file}`)(sequelize);
  });

  return sequelize.sync()
  .then((db) => {

    fs.readdirSync(pathToModels).forEach((file) => {
      const associations = require(`${pathToModels}/${file}`).associations;
      associations && associations(db.models);
    });

    return db.models;
  });
}

module.exports = { initialize };
