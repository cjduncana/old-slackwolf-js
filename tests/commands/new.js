'use strict';

require('../testHelpers');

const Promise = require('bluebird');

const { New } = Commands;

let Models;

describe('New Command', () => {

  const validCommand = {
    args: [],
    channel: 'C1234567890',
    user: 'U1234567890'
  };

  before((done) => {
    Server.start()
    .then((models) => {
      Models = models;
      return done();
    });
  });

  beforeEach((done) => {
    cleanDatabase()
    .then(() => done())
    .catch(done);
  });

  describe('error states', () => {

    it('should do nothing if any arguments were provided', (done) => {
      const invalidCommand = Object.assign({}, validCommand, {
        args: ['should', 'have', 'no', 'arguments']
      });

      New(invalidCommand)
      .then((response) => {
        expect(response).to.be.equal('The following error was encountered: arguments were given to this command.');

        return checkForEmptyDatabase(done);
      })
      .catch(done);
    });

    it('should do nothing if no channel is provided', (done) => {
      const invalidCommand = Object.assign({}, validCommand);
      delete invalidCommand.channel;

      New(invalidCommand)
      .then((response) => {
        expect(response).to.be.equal('The following error was encountered: no Channel ID was provided.');

        return checkForEmptyDatabase(done);
      })
      .catch(done);
    });

    it('should do nothing if no user is provided', (done) => {
      const invalidCommand = Object.assign({}, validCommand);
      delete invalidCommand.user;

      New(invalidCommand)
      .then((response) => {
        expect(response).to.be.equal('The following error was encountered: no User ID was provided.');

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
        .then((response) => {
          expect(response).to.be.equal('The following error was encountered: arguments were given to this command.');

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
        .then((response) => {
          expect(response).to.be.equal('The following errors were encountered: arguments were given to this command and no Channel ID was provided.');

          return checkForEmptyDatabase(done);
        })
        .catch(done);
      });

      it('should show three errors if only three errors occurred', (done) => {
        const invalidCommand = {
          args: ['should', 'have', 'no', 'arguments']
        };

        New(invalidCommand)
        .then((response) => {
          expect(response).to.be.equal('The following errors were encountered: arguments were given to this command, no Channel ID was provided, and no User ID was provided.');

          return checkForEmptyDatabase(done);
        })
        .catch(done);
      });
    });
  });
});

function cleanDatabase() {
  return getAllObjects()
  .then(({ channels, games, players, user }) => {
    return Promise.all([
      destroyAll(channels),
      destroyAll(games),
      destroyAll(players),
      destroyAll(user)
    ]);
  });
}

function checkForEmptyDatabase(done) {
  return getAllObjects()
  .then(({ channels, games, players, user }) => {
    expect(channels).to.have.lengthOf(0);
    expect(games).to.have.lengthOf(0);
    expect(players).to.have.lengthOf(0);
    expect(user).to.have.lengthOf(0);

    return done();
  });
}

function getAllObjects() {
  return Promise.props({
    channels: Models.Channel.findAll(),
    games: Models.Game.findAll(),
    players: Models.Player.findAll(),
    user: Models.User.findAll()
  });
}
