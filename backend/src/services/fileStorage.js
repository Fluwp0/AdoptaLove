const fs = require('fs/promises');
const path = require('path');
const env = require('../config/env');

const uploadsRoot = path.join(__dirname, '..', '..', 'uploads');

function normalizeStorageKey(value = '') {
  return String(value)
    .replace(/^\/+/, '')
    .replace(/^uploads\//, '')
    .replace(/\\/g, '/');
}

function getR2Bucket() {
  const { getRuntimeBindings } = require('../config/runtimeBindings');
  const bucket = getRuntimeBindings()?.[env.storage.r2Binding];

  if (!bucket) {
    const error = new Error(`No se encontró el binding R2 ${env.storage.r2Binding}.`);
    error.code = 'R2_BINDING_MISSING';
    throw error;
  }

  return bucket;
}

async function storeUploadedFile(file, directory = 'mascotas') {
  if (!file?.buffer || !file?.filename) {
    return file;
  }

  const key = normalizeStorageKey(`${directory}/${file.filename}`);

  if (env.storage.driver === 'r2') {
    await getR2Bucket().put(key, file.buffer, {
      httpMetadata: { contentType: file.mimetype }
    });
    file.storageKey = key;
    delete file.buffer;
    return file;
  }

  const destination = path.join(uploadsRoot, directory);
  await fs.mkdir(destination, { recursive: true });
  file.path = path.join(destination, file.filename);
  await fs.writeFile(file.path, file.buffer);
  delete file.buffer;
  return file;
}

async function deleteUploadedFile(file) {
  if (file?.storageKey && env.storage.driver === 'r2') {
    await getR2Bucket().delete(file.storageKey);
    return;
  }

  if (file?.path) {
    await fs.unlink(file.path).catch(() => {});
  }
}

async function readUploadedFile(urlPath) {
  const key = normalizeStorageKey(urlPath);

  if (!key || key.includes('..')) {
    return null;
  }

  if (env.storage.driver === 'r2') {
    const object = await getR2Bucket().get(key);

    if (!object) {
      return null;
    }

    return {
      body: Buffer.from(await object.arrayBuffer()),
      contentType: object.httpMetadata?.contentType || 'application/octet-stream',
      etag: object.httpEtag || object.etag || null
    };
  }

  const absolutePath = path.resolve(uploadsRoot, key);

  if (!absolutePath.startsWith(path.resolve(uploadsRoot))) {
    return null;
  }

  try {
    return {
      body: await fs.readFile(absolutePath),
      contentType: null,
      etag: null
    };
  } catch (_error) {
    return null;
  }
}

module.exports = {
  deleteUploadedFile,
  normalizeStorageKey,
  readUploadedFile,
  storeUploadedFile
};
