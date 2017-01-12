'use strict';

const Sequelize = require('sequelize');

const Slack = require('../lib/slack');

module.exports = function(db) {
  const User = db.define('User', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    username: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false,
      get: function() {
        return '@' + this.getDataValue('username');
      },
      set: function(username) {
        if (username.startsWith('@')) {
          const formatted = username.slice(1, username.length);
          this.setDataValue('username', formatted);
        } else {
          this.setDataValue('username', username);
        }
      }
    }
  }, {
    classMethods: {
      createUser: function(id) {
        return Slack.getUserInfo(id)
        .then((user) => {
          return this.create({
            id: user.id,
            username: user.name
          });
        });
      },

      getUser: function(id) {
        return this.findById(id)
        .then((user) => {
          if (user) {
            return user;
          }

          return this.createUser(id);
        });
      }
    },

    tableName: 'users'
  });

  return User;
};
