const fs = require('fs/promises');
const path = require('path');

const rootDirectory = path.join(__dirname, '..');
const migrationDirectory = path.join(rootDirectory, '.sites-migration');

function requiredEnvironment(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable ${name}.`);
  }
  return value;
}

function migrationHeaders(contentType) {
  const headers = {
    Authorization: `Bearer ${requiredEnvironment('MIGRATION_TOKEN')}`,
    'Content-Type': contentType
  };
  const bypassToken = process.env.SITES_AUTH_BYPASS_TOKEN;
  if (bypassToken) {
    headers['OAI-Sites-Authorization'] = `Bearer ${bypassToken}`;
  }
  return headers;
}

function contentTypeFor(key) {
  const extension = path.extname(key).toLowerCase();
  return {
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp'
  }[extension] || 'application/octet-stream';
}

async function assertResponse(response) {
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Sites respondió ${response.status}: ${body.slice(0, 300)}`);
  }
  return body ? JSON.parse(body) : {};
}

async function main() {
  const siteUrl = requiredEnvironment('SITE_URL').replace(/\/$/, '');
  const [data, manifest] = await Promise.all([
    fs.readFile(path.join(migrationDirectory, 'data.json')),
    fs.readFile(path.join(migrationDirectory, 'manifest.json'), 'utf8').then(JSON.parse)
  ]);

  const dataResult = await assertResponse(
    await fetch(`${siteUrl}/api/internal/sites-migration/data`, {
      body: data,
      headers: migrationHeaders('application/json'),
      method: 'POST'
    })
  );
  const files = [];

  for (const asset of manifest.assets.filter((item) => !item.missing)) {
    const contents = await fs.readFile(path.join(rootDirectory, asset.relativePath));
    const result = await assertResponse(
      await fetch(
        `${siteUrl}/api/internal/sites-migration/file?key=${encodeURIComponent(asset.key)}`,
        {
          body: contents,
          headers: migrationHeaders(contentTypeFor(asset.key)),
          method: 'PUT'
        }
      )
    );
    files.push(result);
  }

  console.log(
    JSON.stringify({
      data: dataResult,
      filesCreated: files.filter((item) => item.created).length,
      filesSkipped: files.filter((item) => item.skipped).length
    })
  );
}

main().catch((error) => {
  console.error(`No se pudo importar en Sites: ${error.message}`);
  process.exit(1);
});
