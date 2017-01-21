'use strict';

const Promise = require('bluebird');

const Errors = require('./errors');
const Terminal = require('./terminal');

module.exports = {

  activeGameAlreadyExists: function(channelId) {
    const message = 'A game is already in progress.';

    postMessage(channelId, message);
  },

  alreadyJoined: function(channelId, username) {
    const message = `You've already joined, ${username}. Stop trying to spam everyone.`;

    postMessage(channelId, message);
  },

  gameInProgress: function(channelId) {
    const message = 'There is already a game in progress.';

    postMessage(channelId, message);
  },

  getChannelInfo: function(channel) {
    const webClient = Terminal.getWebClient();

    return new Promise((resolve, reject) => {
      webClient.channels.info(channel, (err, result) => {
        if (err) {
          return reject(err);
        }

        if (result.ok) {
          return resolve(result.channel);
        }

        if (result.error === 'channel_not_found') {
          return reject(new Errors.ChannelNotFoundError());
        }

        return reject(result.error);
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

        if (result.ok) {
          return resolve(result.user);
        }

        if (result.error === 'user_not_found') {
          return reject(new Errors.UserNotFoundError());
        }

        return reject(result.error);
      });
    });
  },

  newFromDirectMessages: function(channelId) {
    const message = 'Can\'t initiate a new game by direct message.';

    postMessage(channelId, message);
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

  noGameInProgress: function(channelId) {
    const messages = [
      'No game is in progress.',
      'You can start a new game by typing `new`.'
    ];

    postMessage(channelId, messages.join('\n'));
  },

  joinFromDirectMessages: function(channelId) {
    const message = 'Can\'t join a game by direct message.';

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
