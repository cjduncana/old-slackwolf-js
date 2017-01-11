'use strict';

const Server = require('./lib/server');
const Terminal = require('./lib/terminal');

Server.start()
.then(() => {
  Terminal.start();
});
