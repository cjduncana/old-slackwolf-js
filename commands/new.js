'use strict';

const Promise = require('bluebird');

const Errors = require('../lib/errors');
const Models = require('../lib/models');
const Server = require('../lib/server');
const Slack = require('../lib/slack');

module.exports = function({ args = [], channel: channelId, user: userId }) {
  const log = Server.getLogger();
  const { Channel, Game, Player, User } = Models.getModels();

  if (args.length || !channelId || !userId) {
    log.error(constructErrorMessage(args.length, !channelId, !userId));
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

function constructErrorMessage(hasArguments, missingChannel, missingUser) {
  const errors = [];

  if (hasArguments) {
    errors.push('arguments were given to this command');
  }
  if (missingChannel) {
    errors.push('no Channel ID was provided');
  }
  if (missingUser) {
    errors.push('no User ID was provided');
  }

  const message = [];

  if (errors.length === 1) {
    message.push('The following error was encountered: ');
    message.push(errors.join('') + '.');
  } else if (errors.length === 2) {
    message.push('The following errors were encountered: ');
    message.push(errors.join(' and ') + '.');
  } else {
    const errorQuantity = errors.length;
    message.push('The following errors were encountered: ');
    const commaSeparated = errors.slice(0, errorQuantity - 1);
    message.push(commaSeparated.join(', ') + ', and ');
    const lastError = errors[errorQuantity - 1];
    message.push(lastError + '.');
  }

  return message.join('');
}
