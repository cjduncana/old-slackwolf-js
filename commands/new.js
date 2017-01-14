'use strict';

const Promise = require('bluebird');

const Errors = require('../lib/errors');
const Slack = require('../lib/slack');
const Models = require('../lib/models');

module.exports = function({ args = [], channel: channelId, user: userId }) {
  const { Channel, Game, User } = Models.getModels();

  if (args.length || !channelId || !userId) {
    return constructErrorMessage(args.length, !channelId, !userId);
  }

  return Promise.props({
    channel: Channel.getChannel(channelId),
    initiator: User.getUser(userId)
  })
  .then(({ channel, initiator }) => {
    return Game.newGame(channel.id, initiator.id);
  })
  .then(() => {
    Slack.newGameCreated(channelId);
    return 'A game was created.';
  })
  .catch(Errors.ChannelNotFoundError, () => {
    Slack.newFromDirectMessages(channelId);
    return 'Tried to create a game from the direct messages.';
  })
  .catch(Errors.ExistingActiveGameError, () => {
    Slack.activeGameAlreadyExists(channelId);
    return 'An active game already exists.';
  })
  .catch(Errors.ExistingOpenGameError, () => {
    Slack.openGameAlreadyExists(channelId);
    return 'An open game already exists.';
  })
  .catch((err) => {
    return `The following error was encountered: "${err.message}".`;
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

  return Promise.resolve(message.join(''));
}
