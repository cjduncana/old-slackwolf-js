'use strict';

const Promise = require('bluebird');

const Slack = require('../lib/slack');
const Models = require('../lib/models');

module.exports = function({ args = [], channel: channelId, user: userId }) {
  const { Channel, Game, User } = Models.getModels();

  if (args.length || !channelId || !userId) {
    return Promise.resolve(false);
  }

  return Promise.props({
    initiator: User.getUser(userId),
    channel: Channel.getChannel(channelId)
  })
  .then(({ initiator, channel }) => {
    return Game.newGame(initiator.id, channel.id);
  })
  .then(({ channelId }) => {
    Slack.newGameCreated(channelId);
    return true;
  })
  .catch((err) => {
    return err;
  });
};
