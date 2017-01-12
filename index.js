'use strict';

require('dotenv').config();

const Server = require('./lib/server');
const Terminal = require('./lib/terminal');

Server.start()
.then(() => {
  Terminal.start();
});
