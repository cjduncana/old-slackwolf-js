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
        const Player = this.sequelize.models.Player;
        const User = this.sequelize.models.User;

        this.hasMany(Player, {
          as: 'players',
          foreignKey: 'gameId'
        });

        Player.belongsTo(User, {
          as: 'user',
          foreignKey: 'userId'
        });

        return this.findById(id, {
          include: [{
            model: Player,
            as: 'players',
            include: [{
              model: User,
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
