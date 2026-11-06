const local = {
  dialect: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'classroom',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || null,
  logging: false,
};
module.exports = {
  development: process.env.DATABASE_URL ? { ...local, use_env_variable: 'DATABASE_URL' } : local,
  test: { ...local, use_env_variable: 'TEST_DATABASE_URL', pool: { max: 1, min: 0, idle: 1000 } },
  production: { ...local, use_env_variable: 'DATABASE_URL' },
};
