'use strict';

const Promise = require('bluebird');

const Errors = require('../lib/errors');
const Helpers = require('../lib/helpers');
const Models = require('../lib/models');
const Server = require('../lib/server');
const Slack = require('../lib/slack');

module.exports = function({ args, channel: channelId, user: userId }) {
  const log = Server.getLogger();
  const { Channel, Game, Player, User } = Models.getModels();

  if (args.length || !channelId || !userId) {
    const options = {
      hasArguments: args.length,
      missingChannel: !channelId,
      missingUser: !userId
    };

    log.error(Helpers.constructErrorMessage(options));
    return Promise.resolve();
  }

  return Channel.getChannel(channelId)
  .then(({ id }) => Game.getCurrentGame(id))
  .then((currentGame) => {
    if (!currentGame) {
      throw new Errors.NoCurrentGameError();
    }

    if (!currentGame.isOpen()) {
      throw new Errors.NoOpenGameError();
    }

    return Promise.props({
      currentGame,
      joiner: User.getUser(userId),
      players: currentGame.getPlayers()
    });
  })
  .then(({ currentGame, joiner, players }) => {
    if (players.some(({ userId }) => userId === joiner.id)) {
      throw new Errors.ExistingPlayerError(joiner.username);
    }

    return Player.createPlayer(currentGame.id, joiner.id);
  })
  .then(({ gameId }) => {
    return Game.getGame(gameId);
  })
  .then(({ channelId, players }) => {
    Slack.newPlayerJoined(channelId, players);
    return log.info(`${userId} has joined the game.`);
  })
  .catch(Errors.ChannelNotFoundError, () => {
    Slack.joinFromDirectMessages(channelId);
    return log.error('Tried to join a game from the direct messages.');
  })
  .catch(Errors.ExistingPlayerError, ({ message: username }) => {
    Slack.alreadyJoined(channelId, username);
    return log.error(`${username} has already joined the game.`);
  })
  .catch(Errors.NoCurrentGameError, () => {
    Slack.noGameInProgress(channelId);
    return log.error('No game in progress.');
  })
  .catch(Errors.NoOpenGameError, () => {
    Slack.gameInProgress(channelId);
    return log.error('There\'s a game in progress.');
  })
  .catch((err) => {
    return log.error(`The following error was encountered: "${err.message}".`);
  });
};
