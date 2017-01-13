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
  .catch(Errors.ExistingActiveGameError, ({ message: channelId }) => {
    Slack.activeGameAlreadyExists(channelId);
    return false;
  })
  .catch(Errors.ExistingOpenGameError, ({ message: channelId }) => {
    Slack.openGameAlreadyExists(channelId);
    return false;
  })
  .catch((err) => {
    return err;
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
