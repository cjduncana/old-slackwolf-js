'use strict';

const bunyan = require('bunyan');

const options = require('../config/logger');

module.exports = function() {
  return bunyan.createLogger(options);
};
