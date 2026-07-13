const crypto = require('crypto');
const db = require('../config/database');
const env = require('../config/env');
const { getRuntimeBindings } = require('../config/runtimeBindings');

const tableOrder = [
  'usuarios',
  'mascotas',
  'mascota_modificaciones',
  'solicitudes_adopcion',
  'adopciones',
  'donaciones',
  'chatbot_preguntas',
  'chatbot_respuestas',
  'preguntas_compatibilidad',
  'respuestas_compatibilidad'
];

function json(body, status = 200) {
  return Response.json(body, { status });
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ''));
  const rightBuffer = Buffer.from(String(right || ''));
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function isAuthorized(request) {
  const token = process.env.MIGRATION_TOKEN;
  const provided = String(request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  return Boolean(token && safeEqual(token, provided));
}

async function readBody(request, maxBytes) {
  const body = Buffer.from(await request.arrayBuffer());
  if (body.length > maxBytes) {
    const error = new Error('El archivo de migración supera el límite permitido.');
    error.statusCode = 413;
    throw error;
  }
  return body;
}

async function importData(request) {
  const payload = JSON.parse((await readBody(request, 25 * 1024 * 1024)).toString('utf8'));
  if (payload.format !== 'adoptalove-sites-migration-v1') {
    return json({ status: 'error', message: 'Formato de migración no reconocido.' }, 400);
  }

  await db.ensureSchema();
  const database = getRuntimeBindings()[env.storage.d1Binding];
  const report = {};

  for (const table of tableOrder) {
    const rows = Array.isArray(payload.tables?.[table]) ? payload.tables[table] : [];
    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const columns = Object.keys(row).filter((column) => /^[a-z_][a-z0-9_]*$/i.test(column));
      const result = await database
        .prepare(
          `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`
        )
        .bind(...columns.map((column) => row[column] ?? null))
        .run();
      const changes = Number(result.meta?.changes || 0);
      created += changes;
      skipped += changes ? 0 : 1;
    }

    report[table] = { created, skipped };
  }

  return json({ status: 'ok', tables: report });
}

async function importFile(request, url) {
  const key = String(url.searchParams.get('key') || '')
    .replace(/^\/+/, '')
    .replace(/\\/g, '/');
  if (!/^mascotas\/[a-zA-Z0-9._-]+$/.test(key)) {
    return json({ status: 'error', message: 'Ruta de imagen no válida.' }, 400);
  }

  const uploads = getRuntimeBindings()[env.storage.r2Binding];
  if (await uploads.head(key)) {
    return json({ status: 'ok', skipped: true });
  }

  const contents = await readBody(request, 4 * 1024 * 1024);
  await uploads.put(key, contents, {
    httpMetadata: { contentType: request.headers.get('content-type') || 'application/octet-stream' }
  });
  return json({ status: 'ok', created: true }, 201);
}

async function handleMigrationRequest(request, pathname) {
  if (
    process.env.MIGRATION_ENABLED !== 'true' ||
    process.env.DATABASE_DRIVER !== 'd1' ||
    process.env.STORAGE_DRIVER !== 'r2'
  ) {
    return json({ status: 'error', message: 'Migración disponible sólo en Sites.' }, 404);
  }
  if (!isAuthorized(request)) {
    return json({ status: 'error', message: 'No autorizado.' }, 401);
  }

  try {
    if (pathname.endsWith('/data') && request.method === 'POST') {
      return await importData(request);
    }
    if (pathname.endsWith('/file') && request.method === 'PUT') {
      return await importFile(request, new URL(request.url));
    }
    return json({ status: 'error', message: 'Operación no permitida.' }, 405);
  } catch (error) {
    console.error('Sites migration failed:', error.message);
    return json(
      {
        status: 'error',
        message: error.statusCode ? error.message : 'No se pudo completar la migración.'
      },
      error.statusCode || 500
    );
  }
}

module.exports = { handleMigrationRequest };
