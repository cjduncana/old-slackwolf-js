'use strict';

module.exports = {
  database: `${process.env.DB_NAME}${process.env.NODE_ENV === 'test' ? '_test' : ''}`,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'mysql',
  dialect: process.env.DB_DIALECT || 'mysql'
};
