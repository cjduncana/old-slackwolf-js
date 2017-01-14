'use strict';

const errorFactory = require('error-factory');

const Errors = {
  ChannelNotFoundError: errorFactory('ChannelNotFoundError', {
    message: 'Channel Not Found',
    code: 'ChannelNotFoundError'
  }),
  ExistingActiveGameError: errorFactory('ExistingActiveGameError', {
    message: 'Existing Active Game',
    code: 'ExistingActiveGameError'
  }),
  ExistingOpenGameError: errorFactory('ExistingOpenGameError', {
    message: 'Existing Open Game',
    code: 'ExistingOpenGameError'
  }),
  UserNotFoundError: errorFactory('UserNotFoundError', {
    message: 'User Not Found',
    code: 'UserNotFoundError'
  })
};

module.exports = Errors;
