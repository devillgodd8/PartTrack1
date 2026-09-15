require('dotenv').config();
const path = require('path');

const isPostgresUrl =
  process.env.DATABASE_URL &&
  (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));

const usePostgres =
  process.env.DB_CLIENT === 'pg' ||
  Boolean(isPostgresUrl) ||
  Boolean(process.env.PG_HOST);

let dbConfig;

if (usePostgres) {
  let connection;
  if (process.env.DATABASE_URL) {
    connection = {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    };
  } else {
    connection = {
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT) || 5432,
      database: process.env.PG_DATABASE || 'postgres',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      ssl: process.env.PG_SSL === 'false' ? false : { rejectUnauthorized: false },
    };
  }

  dbConfig = {
    client: 'pg',
    connection,
    pool: { min: 0, max: 10 },
    migrations: {
      directory: path.resolve(__dirname, 'src/db/migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'src/db/seeds'),
    },
  };
} else {
  dbConfig = {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, process.env.DB_PATH || './data/parttrack.db'),
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'src/db/migrations'),
    },
    seeds: {
      directory: path.resolve(__dirname, 'src/db/seeds'),
    },
  };
}

module.exports = {
  development: dbConfig,
  production: dbConfig,
};
