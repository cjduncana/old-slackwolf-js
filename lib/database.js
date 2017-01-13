'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');

const config = require('../config/database');

function initialize() {

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
