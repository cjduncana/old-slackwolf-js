'use strict';

const chai = require('chai');
const fs = require('fs');
const path = require('path');

const database = require('../lib/database');

const Commands = {};

const pathToCommands = path.normalize(__dirname + '/../commands/');

fs.readdirSync(pathToCommands).forEach((filename) => {
  Commands[intoTitle(filename)] = require(`${pathToCommands}/${filename}`);
});

database.initialize()
.then((Models) => {
  Object.assign(global, { Models });
});

Object.assign(global, {
  expect: chai.expect,
  Commands
});

function intoTitle(filename) {
  const firstLetter = filename.charAt(0).toUpperCase();
  const rest = filename.slice(1).replace(/\.js$/, '');
  return firstLetter + rest;
}
