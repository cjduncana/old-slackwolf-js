'use strict';

const path = require('path');
const slackTerminal = require('slack-terminalize');

const { token } = require('../config/slack');

let webClient;

module.exports = {
  getWebClient: function() {
    return webClient;
  },

  start: function() {
    slackTerminal.init(token, {}, {
      CONFIG_DIR: path.normalize(__dirname + '/../config'),
      COMMAND_DIR: path.normalize(__dirname + '/../commands')
    });

    webClient = slackTerminal.getWebClient();
  }
};
