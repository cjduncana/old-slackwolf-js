'use strict';

const Models = require('./models');

module.exports = {
  start: function() {
    return Models.createModels();
  }
};
