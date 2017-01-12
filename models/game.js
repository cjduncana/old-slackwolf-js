'use strict';

const Sequelize = require('sequelize');

module.exports = function(db) {
  const Game = db.define('Game', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    initiatorId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    channelId: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    classMethods: {
      getGame: function(id) {
        return this.findById(id, {
          include: [{
            model: this.sequelize.models.Player,
            as: 'players',
            include: [{
              model: this.sequelize.models.User,
              as: 'user'
            }]
          }]
        });
      },

      getCurrentGame: function(channelId) {
        return this.findOne({ where: { channelId } });
      },

      newGame: function(initiatorId, channelId) {
        return this.create({ initiatorId, channelId });
      }
    },

    tableName: 'games'
  });

  return Game;
};

module.exports.associations = function({ Game, Player }) {
  Game.hasMany(Player, {
    as: 'players',
    foreignKey: 'gameId'
  });
};
