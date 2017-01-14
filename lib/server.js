'use strict';

const Models = require('./models');
const Logger = require('./logger');

let logger;

module.exports = {
  getLogger: function() {
    return logger;
  },

  start: function() {
    return Models.createModels()
    .then((models) => {
      logger = Logger();
      return { logger, models };
    });
  }
};
