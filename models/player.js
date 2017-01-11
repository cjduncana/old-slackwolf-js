'use strict';

const Sequelize = require('sequelize');

module.exports = function(db) {
  const Player = db.define('Player', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    userId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    gameId: {
      type: Sequelize.UUID,
      allowNull: false
    }
  }, {
    classMethods: {
      createPlayer: function(gameId, userId) {
        return this.create({ gameId, userId });
      }
    },

    tableName: 'players'
  });

  return Player;
};
