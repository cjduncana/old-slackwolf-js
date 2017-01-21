'use strict';

const Promise = require('bluebird');

const Errors = require('../lib/errors');
const Helpers = require('../lib/helpers');
const Models = require('../lib/models');
const Server = require('../lib/server');
const Slack = require('../lib/slack');

module.exports = function({ args = [], channel: channelId, user: userId }) {
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

  return Promise.props({
    channel: Channel.getChannel(channelId),
    initiator: User.getUser(userId)
  })
  .then(({ channel, initiator }) => {
    return Game.createGame(channel.id, initiator.id);
  })
  .then(({ id, channelId, initiatorId }) => {
    Slack.newGameCreated(channelId);
    return Player.createPlayer(id, initiatorId);
  })
  .then((player) => {
    return player.getUser();
  })
  .then((user) => {
    Slack.newPlayerJoined(channelId, [{ user }]);
    return log.info(`A game was created by ${user.id}.`);
  })
  .catch(Errors.ChannelNotFoundError, () => {
    Slack.newFromDirectMessages(channelId);
    return log.error('Tried to create a game from the direct messages.');
  })
  .catch(Errors.ExistingActiveGameError, () => {
    Slack.activeGameAlreadyExists(channelId);
    return log.error('An active game already exists.');
  })
  .catch(Errors.ExistingOpenGameError, () => {
    Slack.openGameAlreadyExists(channelId);
    return log.error('An open game already exists.');
  })
  .catch((err) => {
    return log.error(`The following error was encountered: "${err.message}".`);
  });
};
