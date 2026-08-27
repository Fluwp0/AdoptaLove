const crypto = require('crypto');
const path = require('path');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const env = require('../config/env');
const { deleteUploadedFile, readUploadedFile, storeUploadedFile } = require('../services/fileStorage');
const { handleMigrationRequest } = require('./migrationApi');
const aboutController = require('../modules/about/about.controller');
const adminController = require('../modules/admin/admin.controller');
const adoptionRequestController = require('../modules/adoptionRequests/adoptionRequest.controller');
const authController = require('../modules/auth/auth.controller');
const chatbotController = require('../modules/chatbot/chatbot.controller');
const compatibilityController = require('../modules/compatibility/compatibility.controller');
const donationController = require('../modules/donations/donation.controller');
const foundationController = require('../modules/foundation/foundation.controller');
const petController = require('../modules/pets/pet.controller');

const routes = [];
const IMAGE_MIME_BY_EXTENSION = new Map([
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.png', 'image/png'],
  ['.webp', 'image/webp']
]);

function route(method, pattern, controller, options = {}) {
  routes.push({ method, pattern, controller, ...options });
}

route('GET', /^\/api\/about\/stats\/?$/, aboutController.getStats);
route('POST', /^\/api\/auth\/register\/?$/, authController.register);
route('POST', /^\/api\/auth\/login\/?$/, authController.login);
route('GET', /^\/api\/auth\/me\/?$/, authController.me, { auth: true });
route('PATCH', /^\/api\/auth\/me\/location\/?$/, authController.updateLocation, { auth: true });
route('GET', /^\/api\/(?:mascotas|pets)\/?$/, petController.listAvailablePets);
route('GET', /^\/api\/(?:mascotas|pets)\/(\d+)\/?$/, petController.getPetById, { params: ['id'] });
route('GET', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/me\/activa\/?$/, adoptionRequestController.getMyActiveAdoptionRequest, { auth: true });
route('GET', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/me\/?$/, adoptionRequestController.listMyAdoptionRequests, { auth: true });
route('PATCH', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/(\d+)\/cancelar\/?$/, adoptionRequestController.cancelOwnAdoptionRequest, { auth: true, params: ['id'] });
route('PATCH', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/(\d+)\/estado\/?$/, adoptionRequestController.updateAdoptionRequestStatus, { auth: true, params: ['id'] });
route('GET', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/(\d+)\/?$/, adoptionRequestController.getAdoptionRequestById, { auth: true, params: ['id'] });
route('GET', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/?$/, adoptionRequestController.listAdoptionRequests, { auth: true });
route('POST', /^\/api\/(?:solicitudes-adopcion|adoption-requests)\/?$/, adoptionRequestController.createAdoptionRequest, { auth: true });
route('GET', /^\/api\/compatibility\/questions\/?$/, compatibilityController.getQuestions);
route('POST', /^\/api\/compatibility\/match\/?$/, compatibilityController.matchPets);
route('GET', /^\/api\/chatbot\/questions\/?$/, chatbotController.listQuestions);
route('POST', /^\/api\/chatbot\/ask\/?$/, chatbotController.askQuestion);
route('GET', /^\/api\/donations\/summary\/?$/, donationController.getDonationSummary);
route('GET', /^\/api\/donations\/?$/, donationController.listDonations);
route('POST', /^\/api\/donations\/?$/, donationController.createDonation);
route('GET', /^\/api\/admin\/metrics\/?$/, adminController.getMetrics, { auth: true });
route('GET', /^\/api\/admin\/users\/?$/, adminController.listUsers, { auth: true });
route('POST', /^\/api\/admin\/users\/?$/, adminController.createUser, { auth: true });
route('PUT', /^\/api\/admin\/users\/(\d+)\/?$/, adminController.updateUser, { auth: true, params: ['id'] });
route('DELETE', /^\/api\/admin\/users\/(\d+)\/?$/, adminController.deleteUser, { auth: true, params: ['id'] });
route('GET', /^\/api\/admin\/pets\/review\/?$/, adminController.listPetsForReview, { auth: true });
route('GET', /^\/api\/admin\/pets\/?$/, adminController.listPets, { auth: true });
route('POST', /^\/api\/admin\/pets\/?$/, adminController.createPet, { auth: true, multipart: true });
route('GET', /^\/api\/admin\/pets\/(\d+)\/?$/, adminController.getPet, { auth: true, params: ['id'] });
route('PUT', /^\/api\/admin\/pets\/(\d+)\/?$/, adminController.updatePet, { auth: true, multipart: true, params: ['id'] });
route('DELETE', /^\/api\/admin\/pets\/(\d+)\/?$/, adminController.deletePet, { auth: true, params: ['id'] });
route('PATCH', /^\/api\/admin\/pets\/(\d+)\/approve\/?$/, adminController.approvePet, { auth: true, params: ['id'] });
route('PATCH', /^\/api\/admin\/pets\/(\d+)\/reject\/?$/, adminController.rejectPet, { auth: true, params: ['id'] });
route('GET', /^\/api\/admin\/pet-modifications\/?$/, adminController.listPetModifications, { auth: true });
route('PATCH', /^\/api\/admin\/pet-modifications\/(\d+)\/approve\/?$/, adminController.approvePetModification, { auth: true, params: ['id'] });
route('PATCH', /^\/api\/admin\/pet-modifications\/(\d+)\/reject\/?$/, adminController.rejectPetModification, { auth: true, params: ['id'] });
route('DELETE', /^\/api\/admin\/pet-modifications\/(\d+)\/?$/, adminController.discardPetModification, { auth: true, params: ['id'] });
route('GET', /^\/api\/(?:foundation|fundacion)\/dashboard\/?$/, foundationController.getDashboard, { auth: true });
route('GET', /^\/api\/(?:foundation|fundacion)\/pets\/?$/, foundationController.listPets, { auth: true });
route('POST', /^\/api\/(?:foundation|fundacion)\/pets\/?$/, foundationController.createPet, { auth: true, multipart: true });
route('PUT', /^\/api\/(?:foundation|fundacion)\/pets\/(\d+)\/?$/, foundationController.updatePet, { auth: true, multipart: true, params: ['id'] });
route('PATCH', /^\/api\/(?:foundation|fundacion)\/pets\/(\d+)\/status\/?$/, foundationController.updatePetStatus, { auth: true, params: ['id'] });
route('DELETE', /^\/api\/(?:foundation|fundacion)\/pets\/(\d+)\/?$/, foundationController.deletePet, { auth: true, params: ['id'] });
route('GET', /^\/api\/(?:foundation|fundacion)\/adoption-requests\/?$/, foundationController.listAdoptionRequests, { auth: true });
route('PATCH', /^\/api\/(?:foundation|fundacion)\/adoption-requests\/(\d+)\/status\/?$/, foundationController.updateAdoptionRequestStatus, { auth: true, params: ['id'] });

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers });
}

function authenticate(request) {
  const [scheme, token] = String(request.headers.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  try {
    const decoded = jwt.verify(token, env.jwt.secret);
    return { id: decoded.sub, rol: decoded.rol };
  } catch (_error) {
    return null;
  }
}

function sanitizeFileName(value = '') {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
    .slice(0, 48) || 'mascota';
}

function hasExpectedImageSignature(buffer, mimetype) {
  if (!Buffer.isBuffer(buffer)) {
    return false;
  }

  if (mimetype === 'image/jpeg') {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimetype === 'image/png') {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimetype === 'image/webp') {
    return (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    );
  }

  return false;
}

async function cleanupUploadedFile(file) {
  if (!file) {
    return;
  }

  try {
    await deleteUploadedFile(file);
  } catch (error) {
    console.warn('No se pudo limpiar una imagen subida tras un error:', error.message);
  }
}

async function parseBody(request, multipart) {
  if (multipart) {
    const form = await request.formData();
    const body = {};
    let file = null;

    for (const [key, value] of form.entries()) {
      if (typeof value === 'string') {
        body[key] = value;
      } else if (key === 'imagen' && value.size > 0) {
        if (file) {
          const error = new Error('Sólo puedes subir una imagen por solicitud.');
          error.statusCode = 400;
          throw error;
        }

        const extension = path.extname(value.name).toLowerCase();
        const expectedMimeType = IMAGE_MIME_BY_EXTENSION.get(extension);
        if (!expectedMimeType || value.type !== expectedMimeType) {
          const error = new Error('La imagen debe ser JPG, JPEG, PNG o WEBP y su extensión debe coincidir con el archivo.');
          error.statusCode = 400;
          throw error;
        }
        if (value.size > 3 * 1024 * 1024) {
          const error = new Error('La imagen no puede superar 3 MB.');
          error.statusCode = 400;
          throw error;
        }

        const buffer = Buffer.from(await value.arrayBuffer());
        if (!hasExpectedImageSignature(buffer, value.type)) {
          const error = new Error('El contenido de la imagen no coincide con un formato permitido.');
          error.statusCode = 400;
          throw error;
        }

        file = {
          buffer,
          filename: `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${sanitizeFileName(path.basename(value.name, extension))}${extension}`,
          mimetype: value.type,
          originalname: value.name,
          size: value.size
        };
      }
    }

    if (file) {
      await storeUploadedFile(file, 'mascotas');
    }

    return { body, file };
  }

  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    return { body: {}, file: null };
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return { body: {}, file: null };
  }
  return { body: await request.json(), file: null };
}

async function invokeController(controller, requestState) {
  let response = null;
  let nextError = null;
  let statusCode = 200;
  const headers = new Headers();
  const res = {
    json(body) {
      response = json(body, statusCode, headers);
      return this;
    },
    send(body) {
      response = new Response(body, { status: statusCode, headers });
      return this;
    },
    setHeader(name, value) {
      headers.set(name, value);
      return this;
    },
    status(code) {
      statusCode = code;
      return this;
    }
  };
  await controller(requestState, res, (error) => {
    nextError = error || new Error('Error de servidor');
  });

  if (nextError) {
    return json(
      { message: nextError.statusCode ? nextError.message : 'Internal server error' },
      nextError.statusCode || 500
    );
  }
  return response || new Response(null, { status: 204 });
}

async function handleUpload(pathname) {
  const file = await readUploadedFile(pathname.replace(/^\/(?:api\/)?uploads\//, ''));
  if (!file) {
    return json({ status: 'error', message: 'Imagen no encontrada.' }, 404);
  }
  const headers = {
    'Cache-Control': 'public, max-age=86400',
    'Content-Type': file.contentType || 'application/octet-stream'
  };
  if (file.etag) headers.ETag = file.etag;
  return new Response(file.body, { status: 200, headers });
}

async function handleSitesApiRequest(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204 });
  }
  if (pathname.startsWith('/api/internal/sites-migration/')) {
    return handleMigrationRequest(request, pathname);
  }
  if (pathname.startsWith('/uploads/') || pathname.startsWith('/api/uploads/')) {
    return handleUpload(pathname);
  }
  if (pathname === '/api/health') {
    return json({ status: 'ok', app: 'AdoptaLove API' });
  }
  if (pathname === '/api/health/db') {
    try {
      await db.query('SELECT 1 AS ok');
      return json({ status: 'ok', database: 'connected' });
    } catch (_error) {
      return json({ message: 'Database connection failed' }, 500);
    }
  }

  for (const definition of routes) {
    const match = pathname.match(definition.pattern);
    if (!match || request.method !== definition.method) continue;

    const user = definition.auth ? authenticate(request) : null;
    if (definition.auth && !user) {
      return json({ status: 'error', message: 'Token inválido' }, 401);
    }

    let parsed;
    try {
      parsed = await parseBody(request, definition.multipart);
      const params = Object.fromEntries(
        (definition.params || []).map((name, index) => [name, match[index + 1]])
      );
      const controllerResponse = await invokeController(definition.controller, {
        body: parsed.body,
        file: parsed.file,
        headers: Object.fromEntries(request.headers),
        params,
        query: Object.fromEntries(url.searchParams),
        user
      });

      if (parsed.file && controllerResponse.status >= 400) {
        await cleanupUploadedFile(parsed.file);
      }

      return controllerResponse;
    } catch (error) {
      await cleanupUploadedFile(parsed?.file);
      return json({ message: error.statusCode ? error.message : 'Internal server error' }, error.statusCode || 500);
    }
  }

  return json({ status: 'error', message: 'Ruta no encontrada.' }, 404);
}

module.exports = { handleSitesApiRequest };
