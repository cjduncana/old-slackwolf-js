'use strict';

const Promise = require('bluebird');

module.exports = {
  up: function(action, Sequelize) {

    return Promise.all([
      action.createTable('channels', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },

        // Sequelize Properties
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      }),
      action.createTable('games', {
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
        },

        // Sequelize Properties
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      }),
      action.createTable('players', {
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
        },

        // Sequelize Properties
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      }),
      action.createTable('users', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        username: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false
        },

        // Sequelize Properties
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      })
    ])
    .then(() => {
      return Promise.all([
        action.addIndex('games', ['channelId'], { indexName: 'channelId' }),
        action.addIndex('games', ['initiatorId'], { indexName: 'initiatorId' }),
        action.addIndex('games', ['status'], { indexName: 'status' }),
        action.addIndex('players', ['userId'], { indexName: 'userId' }),
        action.addIndex('players', ['gameId'], { indexName: 'gameId' })
      ]);
    });
  },

  down: function(action) {

    return Promise.all([
      action.removeIndex('games', 'channelId'),
      action.removeIndex('games', 'initiatorId'),
      action.removeIndex('games', 'status'),
      action.removeIndex('players', 'userId'),
      action.removeIndex('players', 'gameId')
    ])
    .then(() => {
      return Promise.all([
        action.dropTable('channels'),
        action.dropTable('games'),
        action.dropTable('players'),
        action.dropTable('users')
      ]);
    });
  }
};
