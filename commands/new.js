'use strict';

const Promise = require('bluebird');

const Slack = require('../lib/slack');
const Models = require('../lib/models');

const { Channel, Game, User } = Models.getModels();

module.exports = function({ args, channel: channelId, user: userId }) {
  if (args.length || !channelId || !userId) {
    return false;
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
    return;
  })
  .catch((err) => {
    console.log(err);
    return;
  });
};
