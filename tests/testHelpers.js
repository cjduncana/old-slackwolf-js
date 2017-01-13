'use strict';

const chai = require('chai');
const fs = require('fs');
const path = require('path');

const Server = require('../lib/server');

const Commands = {};

const pathToCommands = path.normalize(__dirname + '/../commands/');

fs.readdirSync(pathToCommands).forEach((filename) => {
  Commands[intoTitle(filename)] = require(`${pathToCommands}/${filename}`);
});

Object.assign(global, {
  expect: chai.expect,
  Commands,
  Server
});

function intoTitle(filename) {
  const firstLetter = filename.charAt(0).toUpperCase();
  const rest = filename.slice(1).replace(/\.js$/, '');
  return firstLetter + rest;
}
