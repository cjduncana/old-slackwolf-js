'use strict';

const Promise = require('bluebird');

const Slack = require('../lib/slack');
const Models = require('../lib/models');

const { Channel, Game, Player, User } = Models.getModels();

module.exports = function({ args, channel: channelId, user: userId }) {
  if (args.length || !channelId || !userId) {
    return;
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
    return;
  })
  .catch((err) => {
    console.log(err);
    return;
  });
};
