'use strict';

const Sequelize = require('sequelize');

const Slack = require('../lib/slack');

module.exports = function(db) {
  const Channel = db.define('Channel', {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      unique: true,
      allowNull: false
    }
  }, {
    classMethods: {
      createChannel: function(id) {
        return Slack.getChannelInfo(id)
        .then((channel) => {
          return this.create({
            id: channel.id,
            name: channel.name
          });
        });
      },

      getChannel: function(id) {
        return this.findById(id)
        .then((channel) => {
          if (channel) {
            return channel;
          }

          return this.createChannel(id);
        });
      }
    },

    tableName: 'channels'
  });

  return Channel;
};
