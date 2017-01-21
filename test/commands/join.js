'use strict';

require('../testHelpers');

const Promise = require('bluebird');

const Errors = require('../../lib/errors');
const Slack = require('../../lib/slack');

const { Join } = Commands;

let Models;

let logInfoStub;
let logErrorStub;

let getChannelInfoStub;
let getUserInfoStub;

let alreadyJoinedStub;
let gameInProgressStub;
let joinFromDirectMessagesStub;
let newPlayerJoinedStub;
let noGameInProgressStub;

describe('Join Command', () => {
  const validCommand = {
    args: [],
    channel: 'C6894674734',
    user: 'U0879064446'
  };

  before((done) => {
    getChannelInfoStub = sinon.stub(Slack, 'getChannelInfo');
    getChannelInfoStub.rejects('not_authed');

    const activeChannel = { id: 'C2821571870', name: 'active-channel' };
    getChannelInfoStub.withArgs('C2821571870')
      .resolves(activeChannel);

    const closedChannel = { id: 'C2566822032', name: 'closed-channel' };
    getChannelInfoStub.withArgs('C2566822032')
      .resolves(closedChannel);

    const openChannel = { id: 'C6894674734', name: 'open-channel' };
    getChannelInfoStub.withArgs('C6894674734')
      .resolves(openChannel);

    getChannelInfoStub.withArgs('C1285498827')
      .rejects(new Errors.ChannelNotFoundError());

    getUserInfoStub = sinon.stub(Slack, 'getUserInfo');
    getUserInfoStub.rejects('not_authed');

    const user = { id: 'U9221481298', name: 'johndoe' };
    getUserInfoStub.withArgs('U9221481298')
      .resolves(user);

    const joiner = { id: 'U0879064446', name: 'janedoe' };
    getUserInfoStub.withArgs('U0879064446')
      .resolves(joiner);

    alreadyJoinedStub = sinon.stub(Slack, 'alreadyJoined');
    gameInProgressStub = sinon.stub(Slack, 'gameInProgress');
    joinFromDirectMessagesStub = sinon.stub(Slack, 'joinFromDirectMessages');
    newPlayerJoinedStub = sinon.stub(Slack, 'newPlayerJoined');
    noGameInProgressStub = sinon.stub(Slack, 'noGameInProgress');

    Server.start()
    .then(({ logger, models }) => {
      logInfoStub = sinon.stub(logger, 'info');
      logErrorStub = sinon.stub(logger, 'error');

      Models = models;

      const sampleUser = {
        id: user.id,
        username: user.name
      };

      return Promise.props({
        activeChannel: Models.Channel.create(activeChannel),
        closedChannel: Models.Channel.create(closedChannel),
        openChannel: Models.Channel.create(openChannel),
        user: Models.User.create(sampleUser)
      });
    })
    .then(({ activeChannel, closedChannel, openChannel, user }) => {
      const sampleActiveGame = {
        channelId: activeChannel.id,
        initiatorId: user.id,
        status: 'Active'
      };
      const sampleClosedGame = {
        channelId: closedChannel.id,
        initiatorId: user.id,
        status: 'Closed'
      };
      const sampleOpenGame = {
        channelId: openChannel.id,
        initiatorId: user.id,
        status: 'Open'
      };

      return Promise.props({
        active: Models.Game.create(sampleActiveGame),
        closed: Models.Game.create(sampleClosedGame),
        open: Models.Game.create(sampleOpenGame)
      });
    })
    .then(({ open }) => {
      return Models.Player.createPlayer(open.id, open.initiatorId);
    })
    .delay(1000)
    .then(() => done())
    .catch(done);
  });

  beforeEach((done) => {
    logInfoStub.reset();
    logErrorStub.reset();
    alreadyJoinedStub.reset();
    gameInProgressStub.reset();
    joinFromDirectMessagesStub.reset();
    newPlayerJoinedStub.reset();
    noGameInProgressStub.reset();

    return done();
  });

  after((done) => {
    logInfoStub.restore();
    logErrorStub.restore();
    getChannelInfoStub.restore();
    getUserInfoStub.restore();
    alreadyJoinedStub.restore();
    gameInProgressStub.restore();
    joinFromDirectMessagesStub.restore();
    newPlayerJoinedStub.restore();
    noGameInProgressStub.restore();

    cleanDatabase()
    .then(() => done())
    .catch(done);
  });

  describe('success', () => {

    it('should add a User as a Player if the Join command was given', (done) => {
      Join(validCommand)
      .then(() => {
        checkStubsOtherThanThese({
          newPlayerJoined: true,
          logInfo: true
        });

        // Join Player Joined was called exactly once
        expect(newPlayerJoinedStub.args).to.have.lengthOf(1);
        // The first time Join Player Joined was called it only had two arguments
        expect(newPlayerJoinedStub.args[0]).to.have.lengthOf(2);
        expect(newPlayerJoinedStub.args[0][0]).to.be.equal('C6894674734');

        expect(newPlayerJoinedStub.args[0][1]).to.be.instanceof(Array);
        const players = newPlayerJoinedStub.args[0][1];
        expect(players).to.have.lengthOf(2);
        const [firstPlayer, secondPlayer] = players;
        expect(firstPlayer.user.username).to.equal('@johndoe');
        expect(secondPlayer.user.username).to.equal('@janedoe');

        // Log Info was called exactly once
        expect(logInfoStub.args).to.have.lengthOf(1);
        // The first time Log Info was called it only had one argument
        expect(logInfoStub.args[0]).to.have.lengthOf(1);
        expect(logInfoStub.args[0][0]).to.be.equal('U0879064446 has joined the game.');

        return done();
      })
      .catch(done);
    });
  });

  describe('error states', () => {

    it('should do nothing if an error occurs', (done) => {
      const getChannelStub = sinon.stub(Models.Channel, 'getChannel');
      getChannelStub.rejects(new Error('Error in Join'));

      Join(validCommand)
      .then(() => {
        getChannelStub.restore();

        checkStubsOtherThanThese({ logError: true });

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: "Error in Join".');

        return done();
      })
      .catch(done);
    });

    it('should do nothing if the Channel was not found', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        channel: 'C1285498827'
      });

      Join(invalidCommand)
      .then(() => {
        checkStubsOtherThanThese({
          joinFromDirectMessages: true,
          logError: true
        });

        // Join From Direct Messages was called exactly once
        expect(joinFromDirectMessagesStub.args).to.have.lengthOf(1);
        // The first time Join From Direct Messages was called it only had one argument
        expect(joinFromDirectMessagesStub.args[0]).to.have.lengthOf(1);
        expect(joinFromDirectMessagesStub.args[0][0]).to.be.equal('C1285498827');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('Tried to join a game from the direct messages.');

        return done();
      })
      .catch(done);
    });

    it('should do nothing if there is no current Game', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        channel: 'C2566822032'
      });

      Join(invalidCommand)
      .then(() => {
        checkStubsOtherThanThese({
          noGameInProgress: true,
          logError: true
        });

        // No Game In Progress was called exactly once
        expect(noGameInProgressStub.args).to.have.lengthOf(1);
        // The first time No Game In Progress was called it only had one argument
        expect(noGameInProgressStub.args[0]).to.have.lengthOf(1);
        expect(noGameInProgressStub.args[0][0]).to.be.equal('C2566822032');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('No game in progress.');

        return done();
      })
      .catch(done);
    });

    it('should do nothing if there is no open Game', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        channel: 'C2821571870'
      });

      Join(invalidCommand)
      .then(() => {
        checkStubsOtherThanThese({
          gameInProgress: true,
          logError: true
        });

        // Game In Progress was called exactly once
        expect(gameInProgressStub.args).to.have.lengthOf(1);
        // The first time Game In Progress was called it only had one argument
        expect(gameInProgressStub.args[0]).to.have.lengthOf(1);
        expect(gameInProgressStub.args[0][0]).to.be.equal('C2821571870');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('There\'s a game in progress.');

        return done();
      })
      .catch(done);
    });

    it('should do nothing if the User is already a Player', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        user: 'U9221481298'
      });

      Join(invalidCommand)
      .then(() => {
        checkStubsOtherThanThese({
          alreadyJoined: true,
          logError: true
        });

        // Already Joined was called exactly once
        expect(alreadyJoinedStub.args).to.have.lengthOf(1);
        // The first time Already Joined was called it only had two arguments
        expect(alreadyJoinedStub.args[0]).to.have.lengthOf(2);
        expect(alreadyJoinedStub.args[0][0]).to.be.equal('C6894674734');
        expect(alreadyJoinedStub.args[0][1]).to.be.equal('@johndoe');

        // Log Error was called exactly once
        expect(logErrorStub.args).to.have.lengthOf(1);
        // The first time Log Error was called it only had one argument
        expect(logErrorStub.args[0]).to.have.lengthOf(1);
        expect(logErrorStub.args[0][0]).to.be.equal('@johndoe has already joined the game.');

        return done();
      })
      .catch(done);
    });

    describe('missing information', () => {

      it('should do nothing if any arguments were provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand, {
          args: ['should', 'have', 'no', 'arguments']
        });

        Join(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: arguments were given to this command.');

          return done();
        })
        .catch(done);
      });

      it('should do nothing if no Channel is provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand);
        delete invalidCommand.channel;

        Join(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: no Channel ID was provided.');

          return done();
        })
        .catch(done);
      });

      it('should do nothing if no User is provided', (done) => {
        const invalidCommand = Object.assign({}, validCommand);
        delete invalidCommand.user;

        Join(invalidCommand)
        .then(() => {
          checkStubsOtherThanThese({ logError: true });

          // Log Error was called exactly once
          expect(logErrorStub.args).to.have.lengthOf(1);
          // The first time Log Error was called it only had one argument
          expect(logErrorStub.args[0]).to.have.lengthOf(1);
          expect(logErrorStub.args[0][0]).to.be.equal('The following error was encountered: no User ID was provided.');

          return done();
        })
        .catch(done);
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

function getAllObjects() {
  return Promise.props({
    channels: Models.Channel.findAll(),
    games: Models.Game.findAll(),
    players: Models.Player.findAll(),
    users: Models.User.findAll()
  });
}

function checkStubsOtherThanThese(options = {}) {
  if (!options.logInfo) {
    expect(logInfoStub.args).to.be.empty;
  }

  if (!options.logError) {
    expect(logErrorStub.args).to.be.empty;
  }

  if (!options.alreadyJoined) {
    expect(alreadyJoinedStub.args).to.be.empty;
  }

  if (!options.gameInProgress) {
    expect(gameInProgressStub.args).to.be.empty;
  }

  if (!options.joinFromDirectMessages) {
    expect(joinFromDirectMessagesStub.args).to.be.empty;
  }

  if (!options.newPlayerJoined) {
    expect(newPlayerJoinedStub.args).to.be.empty;
  }

  if (!options.noGameInProgress) {
    expect(noGameInProgressStub.args).to.be.empty;
  }
}
