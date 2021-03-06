'use strict';

require('../testHelpers');

const Promise = require('bluebird');

const Errors = require('../../lib/errors');
const Slack = require('../../lib/slack');

const { New } = Commands;

let Models;

let logInfoStub;
let logErrorStub;

let activeGameAlreadyExistsStub;
let getChannelInfoStub;
let getUserInfoStub;
let newGameCreatedStub;
let newFromDirectMessagesStub;
let newPlayerJoinedStub;
let openGameAlreadyExistsStub;

describe('New Command', () => {
  const validCommand = {
    args: [],
    channel: 'C6894674734',
    user: 'U9221481298'
  };

  before((done) => {
    getChannelInfoStub = sinon.stub(Slack, 'getChannelInfo');
    getChannelInfoStub.rejects('not_authed');

    const channel = { id: 'C6894674734', name: 'the-channel' };
    getChannelInfoStub.withArgs('C6894674734')
      .resolves(channel);

    getChannelInfoStub.withArgs('C1285498827')
      .rejects(new Errors.ChannelNotFoundError());

    getUserInfoStub = sinon.stub(Slack, 'getUserInfo');
    getUserInfoStub.rejects('not_authed');

    const user = { id: 'U9221481298', name: 'johndoe' };
    getUserInfoStub.withArgs('U9221481298')
      .resolves(user);

    activeGameAlreadyExistsStub = sinon.stub(Slack, 'activeGameAlreadyExists');
    newGameCreatedStub = sinon.stub(Slack, 'newGameCreated');
    newFromDirectMessagesStub = sinon.stub(Slack, 'newFromDirectMessages');
    newPlayerJoinedStub = sinon.stub(Slack, 'newPlayerJoined');
    openGameAlreadyExistsStub = sinon.stub(Slack, 'openGameAlreadyExists');

    Server.start()
    .then(({ logger, models }) => {
      logInfoStub = sinon.stub(logger, 'info');
      logErrorStub = sinon.stub(logger, 'error');

      Models = models;
      return done();
    });
  });

  beforeEach((done) => {
    activeGameAlreadyExistsStub.reset();
    logInfoStub.reset();
    logErrorStub.reset();
    newGameCreatedStub.reset();
    newFromDirectMessagesStub.reset();
    newPlayerJoinedStub.reset();
    openGameAlreadyExistsStub.reset();

    cleanDatabase()
    .then(() => done())
    .catch(done);
  });

  after((done) => {
    activeGameAlreadyExistsStub.restore();
    logInfoStub.restore();
    logErrorStub.restore();
    getChannelInfoStub.restore();
    getUserInfoStub.restore();
    newGameCreatedStub.restore();
    newFromDirectMessagesStub.restore();
    newPlayerJoinedStub.restore();
    openGameAlreadyExistsStub.restore();

    cleanDatabase()
    .then(() => done())
    .catch(done);
  });

  describe('success', () => {

    it('should start a new Game if the New command was given', (done) => {
      New(validCommand)
      .then(() => {
        checkStubsOtherThanThese({
          newGameCreated: true,
          newPlayerJoined: true,
          logInfo: true
        });

        // New Game Created was called exactly once
        expect(newGameCreatedStub.args).to.have.lengthOf(1);
        // The first time New Game Created was called it only had one argument
        expect(newGameCreatedStub.args[0]).to.have.lengthOf(1);
        expect(newGameCreatedStub.args[0][0]).to.be.equal('C6894674734');

        // New Player Joined was called exactly once
        expect(newPlayerJoinedStub.args).to.have.lengthOf(1);
        // The first time New Player Joined was called it only had two arguments
        expect(newPlayerJoinedStub.args[0]).to.have.lengthOf(2);
        expect(newPlayerJoinedStub.args[0][0]).to.be.equal('C6894674734');

        expect(newPlayerJoinedStub.args[0][1]).to.be.instanceof(Array);
        const players = newPlayerJoinedStub.args[0][1];
        expect(players).to.have.lengthOf(1);
        const [player] = players;
        expect(player.user.username).to.equal('@johndoe');

        // Log Info was called exactly once
        expect(logInfoStub.args).to.have.lengthOf(1);
        // The first time Log Info was called it only had one argument
        expect(logInfoStub.args[0]).to.have.lengthOf(1);
        expect(logInfoStub.args[0][0]).to.be.equal('A game was created by U9221481298.');

        return getAllObjects();
      })
      .then(({ channels, games, players, users }) => {
        expect(channels).to.have.lengthOf(1);

        const [channel] = channels;
        expect(channel.id).to.be.equal('C6894674734');
        expect(channel.name).to.be.equal('the-channel');

        expect(games).to.have.lengthOf(1);

        const [game] = games;
        expect(game.channelId).to.be.equal('C6894674734');
        expect(game.initiatorId).to.be.equal('U9221481298');
        expect(game.status).to.be.equal('Open');

        expect(players).to.have.lengthOf(1);

        const [player] = players;
        expect(player.userId).to.be.equal('U9221481298');
        expect(player.gameId).to.be.equal(game.id);

        expect(users).to.have.lengthOf(1);

        const [user] = users;
        expect(user.id).to.be.equal('U9221481298');
        expect(user.username).to.be.equal('@johndoe');

        return destroyAll([channel, game, user]);
      })
      .then(() => done())
      .catch(done);
    });
  });

  describe('error states', () => {

    it('should do nothing if an error occurs', (done) => {
      const getChannelStub = sinon.stub(Models.Channel, 'getChannel');
      getChannelStub.rejects(new Error('Error in New'));

      New(validCommand)
      .then(() => {
        getChannelStub.restore();

        checkStubsOtherThanThese({ logError: true });

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: "Error in New".');

        return checkForEmptyDatabase(done);
      })
      .catch(done);
    });

    it('should do nothing if the Channel was not found', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        channel: 'C1285498827'
      });

      New(invalidCommand)
      .then(() => {
        checkStubsOtherThanThese({
          newFromDirectMessages: true,
          logError: true
        });

        // New From Direct Messages was called exactly once
        expect(newFromDirectMessagesStub.args).to.have.lengthOf(1);
        // The first time New From Direct Messages was called it only had one argument
        expect(newFromDirectMessagesStub.args[0]).to.have.lengthOf(1);
        expect(newFromDirectMessagesStub.args[0][0]).to.be.equal('C1285498827');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('Tried to create a game from the direct messages.');

        return checkForEmptyDatabase(done);
      })
      .catch(done);
    });

    it('should do nothing if there is already an active Game', (done) => {
      const sampleGame = {
        channelId: 'C6894674734',
        initiatorId: 'U0079555710',
        status: 'Active'
      };

      Models.Game.create(sampleGame)
      .then(() => New(validCommand))
      .then(() => {
        checkStubsOtherThanThese({
          activeGameAlreadyExists: true,
          logError: true
        });

        // Active Game Already Exists was called exactly once
        expect(activeGameAlreadyExistsStub.args).to.have.lengthOf(1);
        // The first time Active Game Already Exists was called it only had one argument
        expect(activeGameAlreadyExistsStub.args[0]).to.have.lengthOf(1);
        expect(activeGameAlreadyExistsStub.args[0][0]).to.be.equal('C6894674734');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('An active game already exists.');

        return getAllObjects();
      })
      .then(({ channels, games, players, users }) => {
        expect(channels).to.have.lengthOf(1);

        const [channel] = channels;
        expect(channel.id).to.be.equal('C6894674734');
        expect(channel.name).to.be.equal('the-channel');

        expect(games).to.have.lengthOf(1);

        const [game] = games;
        expect(game.channelId).to.be.equal('C6894674734');
        expect(game.initiatorId).to.be.equal('U0079555710');
        expect(game.status).to.be.equal('Active');

        expect(players).to.be.empty;

        expect(users).to.have.lengthOf(1);

        const [user] = users;
        expect(user.id).to.be.equal('U9221481298');
        expect(user.username).to.be.equal('@johndoe');

        return destroyAll([channel, game, user]);
      })
      .then(() => done())
      .catch(done);
    });

    it('should do nothing if there is already an open Game', (done) => {
      const sampleGame = {
        channelId: 'C6894674734',
        initiatorId: 'U2681058991',
        status: 'Open'
      };

      Models.Game.create(sampleGame)
      .then(() => New(validCommand))
      .then(() => {
        checkStubsOtherThanThese({
          openGameAlreadyExists: true,
          logError: true
        });

        // Open Game Already Exists was called exactly once
        expect(openGameAlreadyExistsStub.args).to.have.lengthOf(1);
        // The first time Open Game Already Exists was called it only had one argument
        expect(openGameAlreadyExistsStub.args[0]).to.have.lengthOf(1);
        expect(openGameAlreadyExistsStub.args[0][0]).to.be.equal('C6894674734');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('An open game already exists.');

        return getAllObjects();
      })
      .then(({ channels, games, players, users }) => {
        expect(channels).to.have.lengthOf(1);

        const [channel] = channels;
        expect(channel.id).to.be.equal('C6894674734');
        expect(channel.name).to.be.equal('the-channel');

        expect(games).to.have.lengthOf(1);

        const [game] = games;
        expect(game.channelId).to.be.equal('C6894674734');
        expect(game.initiatorId).to.be.equal('U2681058991');
        expect(game.status).to.be.equal('Open');

        expect(players).to.be.empty;

        expect(users).to.have.lengthOf(1);

        const [user] = users;
        expect(user.id).to.be.equal('U9221481298');
        expect(user.username).to.be.equal('@johndoe');

        return destroyAll([channel, game, user]);
      })
      .then(() => done())
      .catch(done);
    });

    describe('missing information', () => {

      it('should do nothing if any arguments were provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand, {
          args: ['should', 'have', 'no', 'arguments']
        });

        New(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: arguments were given to this command.');

          return checkForEmptyDatabase(done);
        })
        .catch(done);
      });

      it('should do nothing if no Channel is provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand);
        delete invalidCommand.channel;

        New(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: no Channel ID was provided.');

          return checkForEmptyDatabase(done);
        })
        .catch(done);
      });

      it('should do nothing if no User is provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand);
        delete invalidCommand.user;

        New(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: no User ID was provided.');

          return checkForEmptyDatabase(done);
        })
        .catch(done);
      });

      describe('multiple errors', () => {

        it('should show one error if only one error occurred', (done) => {
          const invalidCommand = Object.assign({}, validCommand, {
            args: ['should', 'have', 'no', 'arguments']
          });

          New(invalidCommand)
          .then(() => {
            checkStubsOtherThanThese({ logError: true });

            // Log Error was called exactly once
            expect(logErrorStub.args).to.have.lengthOf(1);
            // The first time Log Error was called it only had one argument
            expect(logErrorStub.args[0]).to.have.lengthOf(1);
            expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: arguments were given to this command.');

            return checkForEmptyDatabase(done);
          })
          .catch(done);
        });

        it('should show two errors if only two errors occurred', (done) => {
          const invalidCommand = Object.assign({}, validCommand, {
            args: ['should', 'have', 'no', 'arguments']
          });
          delete invalidCommand.channel;

          New(invalidCommand)
          .then(() => {
            checkStubsOtherThanThese({ logError: true });

            // Log Error was called exactly once
            expect(logErrorStub.args).to.have.lengthOf(1);
            // The first time Log Error was called it only had one argument
            expect(logErrorStub.args[0]).to.have.lengthOf(1);
            expect(logErrorStub.args[0][0]).to.be.equal('The following errors were encountered: arguments were given to this command and no Channel ID was provided.');

            return checkForEmptyDatabase(done);
          })
          .catch(done);
        });

        it('should show three errors if only three errors occurred', (done) => {
          const invalidCommand = {
            args: ['should', 'have', 'no', 'arguments']
          };

          New(invalidCommand)
          .then(() => {
            checkStubsOtherThanThese({ logError: true });

            // Log Error was called exactly once
            expect(logErrorStub.args).to.have.lengthOf(1);
            // The first time Log Error was called it only had one argument
            expect(logErrorStub.args[0]).to.have.lengthOf(1);
            expect(logErrorStub.args[0][0]).to.be.equal('The following errors were encountered: arguments were given to this command, no Channel ID was provided, and no User ID was provided.');

            return checkForEmptyDatabase(done);
          })
          .catch(done);
        });
      });
    });
  });
});

function cleanDatabase() {
  return getAllObjects()
  .then(({ channels, games, players, users }) => {
    return Promise.all([
      destroyAll(channels),
      destroyAll(games),
      destroyAll(players),
      destroyAll(users)
    ]);
  });
}

function checkForEmptyDatabase(done) {
  return getAllObjects()
  .then(({ channels, games, players, users }) => {
    expect(channels).to.be.empty;
    expect(games).to.be.empty;
    expect(players).to.be.empty;
    expect(users).to.be.empty;

    return done();
  });
}

function getAllObjects() {
  return Promise.props({
    channels: Models.Channel.findAll(),
    games: Models.Game.findAll(),
    players: Models.Player.findAll(),
    users: Models.User.findAll()
  });
}

function checkStubsOtherThanThese(options = {}) {
  if (!options.activeGameAlreadyExists) {
    expect(activeGameAlreadyExistsStub.args).to.be.empty;
  }

  if (!options.logInfo) {
    expect(logInfoStub.args).to.be.empty;
  }

  if (!options.logError) {
    expect(logErrorStub.args).to.be.empty;
  }

  if (!options.newGameCreated) {
    expect(newGameCreatedStub.args).to.be.empty;
  }

  if (!options.newFromDirectMessages) {
    expect(newFromDirectMessagesStub.args).to.be.empty;
  }

  if (!options.newPlayerJoined) {
    expect(newPlayerJoinedStub.args).to.be.empty;
  }

  if (!options.openGameAlreadyExists) {
    expect(openGameAlreadyExistsStub.args).to.be.empty;
  }
}
