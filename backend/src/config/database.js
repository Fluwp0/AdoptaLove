const env = require('./env');

function createMysqlPool() {
  const mysql = require('mysql2/promise');

  return mysql.createPool({
    host: env.database.host,
    port: env.database.port,
    user: env.database.user,
    password: env.database.password,
    database: env.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });
}

function normalizeD1Sql(sql) {
  return String(sql)
    .replace(/\bINSERT\s+IGNORE\s+INTO\b/gi, 'INSERT OR IGNORE INTO')
    .replace(/\s+FOR\s+UPDATE\b/gi, '');
}

function normalizeD1Parameters(parameters = []) {
  return parameters.map((value) => {
    if (value === undefined) {
      return null;
    }

    if (value instanceof Date) {
      return value.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    }

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    return value;
  });
}

function getD1Database() {
  const { getRuntimeBindings } = require('./runtimeBindings');
  const database = getRuntimeBindings()?.[env.storage.d1Binding];

  if (!database) {
    const error = new Error(`No se encontró el binding D1 ${env.storage.d1Binding}.`);
    error.code = 'D1_BINDING_MISSING';
    throw error;
  }

  return database;
}

let schemaPromise = null;

async function ensureD1Schema(database = getD1Database()) {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      const { D1_SCHEMA_STATEMENTS } = require('../database/d1Schema');
      await database.batch(
        D1_SCHEMA_STATEMENTS.map((statement) => database.prepare(statement))
      );
    })().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }

  return schemaPromise;
}

async function queryD1(sql, parameters = []) {
  const database = getD1Database();
  await ensureD1Schema(database);

  const upperSql = String(sql).toUpperCase();

  if (upperSql.includes('INFORMATION_SCHEMA.COLUMNS')) {
    const [tableName, columnName] = parameters;
    const safeTableName = String(tableName || '').replace(/[^a-zA-Z0-9_]/g, '');
    const result = await database
      .prepare(`SELECT COUNT(*) AS total FROM pragma_table_info('${safeTableName}') WHERE name = ?`)
      .bind(columnName)
      .all();
    return [result.results || [], []];
  }

  if (upperSql.includes('INFORMATION_SCHEMA.TABLES')) {
    const result = await database
      .prepare("SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name = ?")
      .bind(parameters[0])
      .all();
    return [result.results || [], []];
  }

  const normalizedSql = normalizeD1Sql(sql);
  const statement = database.prepare(normalizedSql).bind(...normalizeD1Parameters(parameters));
  const queryType = normalizedSql.trim().split(/\s+/, 1)[0].toUpperCase();

  if (['SELECT', 'WITH', 'PRAGMA', 'EXPLAIN'].includes(queryType)) {
    const result = await statement.all();
    return [result.results || [], []];
  }

  const result = await statement.run();
  return [
    {
      affectedRows: Number(result.meta?.changes || 0),
      changedRows: Number(result.meta?.changes || 0),
      insertId: Number(result.meta?.last_row_id || 0)
    },
    []
  ];
}

function createD1Pool() {
  const connection = {
    beginTransaction: async () => {},
    commit: async () => {},
    query: queryD1,
    release: () => {},
    rollback: async () => {}
  };

  return {
    driver: 'd1',
    ensureSchema: ensureD1Schema,
    getConnection: async () => connection,
    query: queryD1
  };
}

const database = env.database.driver === 'd1' ? createD1Pool() : createMysqlPool();
database.driver = env.database.driver;

module.exports = database;
