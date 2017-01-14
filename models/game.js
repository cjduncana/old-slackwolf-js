'use strict';

const Sequelize = require('sequelize');

const Errors = require('../lib/errors');

module.exports = function(db) {
  const Game = db.define('Game', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
      primaryKey: true
    },
    channelId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    initiatorId: {
      type: Sequelize.STRING,
      allowNull: false
    },
    status: {
      type: Sequelize.ENUM('Open', 'Active', 'Closed'),
      allowNull: false,
      defaultValue: 'Open'
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
        return this.findOne({
          where: {
            channelId,
            status: { $ne: 'Closed' }
          }
        });
      },

      createGame: function(channelId, initiatorId) {
        return this.getCurrentGame(channelId)
        .then((game) => {
          if (game) {
            if (game.status === 'Active') {
              throw new Errors.ExistingActiveGameError();
            } else if (game.status === 'Open') {
              throw new Errors.ExistingOpenGameError();
            }
          }

          return this.create({ channelId, initiatorId });
        });
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
