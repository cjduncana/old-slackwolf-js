'use strict';

const Promise = require('bluebird');

const Terminal = require('./terminal');

module.exports = {

  activeGameAlreadyExists: function(channelId) {
    const message = 'A game is already in progress.';

    postMessage(channelId, message);
  },

  getChannelInfo: function(channel) {
    const webClient = Terminal.getWebClient();

    return new Promise((resolve, reject) => {
      webClient.channels.info(channel, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.channel);
      });
    });
  },

  getUserInfo: function(user) {
    const webClient = Terminal.getWebClient();

    return new Promise((resolve, reject) => {
      webClient.users.info(user, (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve(result.user);
      });
    });
  },

  newGameCreated: function(channelId) {
    const message = 'A new game lobby has been created. Type `join` to play the next game.';

    postMessage(channelId, message);
  },

  newPlayerJoined: function(channelId, players) {
    const usernames = players.map(({ user }) => user.username);
    const message = 'Current lobby: ' + usernames.join(', ');

    postMessage(channelId, message);
  },

  openGameAlreadyExists: function(channelId) {
    const message = 'A game lobby is already open. Type `join` to play the next game.';

    postMessage(channelId, message);
  }
};

function postMessage(channelId, response) {
  const webClient = Terminal.getWebClient();

  webClient.chat.postMessage(channelId, response, {
    'as_user': true
  });
}
