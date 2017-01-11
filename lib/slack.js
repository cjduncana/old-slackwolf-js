'use strict';

const Promise = require('bluebird');

const Terminal = require('./terminal');

function getChannelInfo(channel) {
  const webClient = Terminal.getWebClient();

  return new Promise((resolve, reject) => {
    webClient.channels.info(channel, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result.channel);
    });
  });
}

function getUserInfo(user) {
  const webClient = Terminal.getWebClient();

  return new Promise((resolve, reject) => {
    webClient.users.info(user, (err, result) => {
      if (err) {
        return reject(err);
      }

      return resolve(result.user);
    });
  });
}

function newGameCreated(channelId) {
  postMessage(channelId, 'A new game lobby has been created.  Type join to play the next game.');
}

function newPlayerJoined(channelId, players) {
  const usernames = players.map(({ user }) => user.username);
  const message = 'Current lobby: ' + usernames.join(', ');

  postMessage(channelId, message);
}

module.exports = {
  getChannelInfo,
  getUserInfo,
  newGameCreated,
  newPlayerJoined
};

function postMessage(channelId, response, format) {
  const formattedResponse = (format) ? '```' + response + '```' : response;

  const webClient = Terminal.getWebClient();

  webClient.chat.postMessage(channelId, formattedResponse, {
    'as_user': true
  });
}
