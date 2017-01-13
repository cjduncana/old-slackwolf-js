'use strict';

const errorFactory = require('error-factory');

const Errors = {
  ExistingActiveGameError: errorFactory('ExistingActiveGameError', {
    message: 'Existing Active Game',
    code: 'ExistingActiveGameError'
  }),
  ExistingOpenGameError: errorFactory('ExistingOpenGameError', {
    message: 'Existing Open Game',
    code: 'ExistingOpenGameError'
  })
};

module.exports = Errors;
