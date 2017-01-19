'use strict';

const chai = require('chai');
const fs = require('fs');
const path = require('path');
const Promise = require('bluebird');
const sinon = require('sinon');

const Server = require('../lib/server');

require('sinon-as-promised')(Promise);

const Commands = {};

const pathToCommands = path.normalize(__dirname + '/../commands/');

fs.readdirSync(pathToCommands).forEach((filename) => {
  Commands[intoTitle(filename)] = require(`${pathToCommands}/${filename}`);
});

function destroyAll(instances) {
  return Promise.each(instances, (instance) => {
    if (!instance.destroy) {
      throw new Error('Instance does not have a destroy function');
    }
    return instance.destroy();
  });
}

Object.assign(global, {
  expect: chai.expect,
  destroyAll,
  sinon,
  Commands,
  Server
});

function intoTitle(filename) {
  const firstLetter = filename.charAt(0).toUpperCase();
  const rest = filename.slice(1).replace(/\.js$/, '');
  return firstLetter + rest;
}
