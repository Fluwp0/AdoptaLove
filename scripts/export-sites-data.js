const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'backend', '.env') });
const mysql = require('mysql2/promise');

const rootDirectory = path.join(__dirname, '..');
const outputDirectory = path.join(rootDirectory, '.sites-migration');
const uploadsDirectory = path.join(rootDirectory, 'backend', 'uploads');
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

async function collectAssets(rowsByTable) {
  const referencedUrls = new Set(
    (rowsByTable.mascotas || [])
      .map((row) => row.foto_url)
      .filter((value) => typeof value === 'string' && value.startsWith('/uploads/'))
  );
  const assets = [];

  for (const url of referencedUrls) {
    const key = url.replace(/^\/uploads\//, '');
    const absolutePath = path.resolve(uploadsDirectory, key);

    if (!absolutePath.startsWith(path.resolve(uploadsDirectory))) {
      continue;
    }

    try {
      const contents = await fs.readFile(absolutePath);
      assets.push({
        bytes: contents.length,
        key: key.replace(/\\/g, '/'),
        relativePath: path.relative(rootDirectory, absolutePath).replace(/\\/g, '/'),
        sha256: crypto.createHash('sha256').update(contents).digest('hex')
      });
    } catch (_error) {
      assets.push({ key, missing: true, relativePath: null });
    }
  }

  return assets;
}

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'adoptalove',
    dateStrings: true,
    supportBigNumbers: true
  });

  try {
    const tables = {};

    for (const table of tableOrder) {
      const [rows] = await connection.query(`SELECT * FROM \`${table}\` ORDER BY id`);
      tables[table] = rows;
    }

    const assets = await collectAssets(tables);
    const payload = {
      format: 'adoptalove-sites-migration-v1',
      exportedAt: new Date().toISOString(),
      tables
    };
    const manifest = {
      assets,
      format: payload.format,
      rowCounts: Object.fromEntries(tableOrder.map((table) => [table, tables[table].length]))
    };

    await fs.mkdir(outputDirectory, { recursive: true });
    await Promise.all([
      fs.writeFile(path.join(outputDirectory, 'data.json'), JSON.stringify(payload)),
      fs.writeFile(path.join(outputDirectory, 'manifest.json'), JSON.stringify(manifest, null, 2))
    ]);

    console.log(
      JSON.stringify({
        assets: assets.length,
        missingAssets: assets.filter((asset) => asset.missing).length,
        outputDirectory,
        rowCounts: manifest.rowCounts
      })
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error(`No se pudo preparar la migración: ${error.message}`);
  process.exit(1);
});
