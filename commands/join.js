'use strict';

const Promise = require('bluebird');

const Slack = require('../lib/slack');
const Models = require('../lib/models');

module.exports = function({ args, channel: channelId, user: userId }) {
  const { Channel, Game, Player, User } = Models.getModels();

  if (args.length || !channelId || !userId) {
    return Promise.resolve(false);
  }

  return Channel.getChannel(channelId)
  .then(({ id }) => {
    return Promise.props({
      currentGame: Game.getCurrentGame(id),
      joiner: User.getUser(userId)
    });
  })
  .then(({ currentGame, joiner }) => {
    return Player.createPlayer(currentGame.id, joiner.id);
  })
  .then(({ gameId }) => {
    return Game.getGame(gameId);
  })
  .then(({ channelId, players }) => {
    Slack.newPlayerJoined(channelId, players);
    return true;
  })
  .catch((err) => {
    return err;
  });
};
