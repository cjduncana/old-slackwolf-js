'use strict';

require('../testHelpers');

const { New } = Commands;

describe('New Command', () => {

  before((done) => {
    Server.start()
    .then((models) => {
      return done();
    });
  });

  it('should do nothing if no channel is provided', (done) => {
    New({})
    .then((response) => {
      expect(response).to.be.false;
      return done();
    });
  });
});
