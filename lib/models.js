'use strict';

const Database = require('./database');

let models;

module.exports = {
  getModels: function() {
    return models;
  },

  createModels: function() {
    if (models) {
      return models;
    }

    return Database.initialize()
    .then((m) => {
      models = m;
      return models;
    });
  }
};
