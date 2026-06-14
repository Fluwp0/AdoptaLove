const adminModel = require('./admin.model');

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const PET_SIZES = new Set(['pequeno', 'mediano', 'grande']);
const PET_SEXES = new Set(['macho', 'hembra', 'desconocido']);
const PET_NAME_MAX_LENGTH = 40;
const DESCRIPTION_MIN_WORDS = 20;

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensureAdmin(user) {
  if (!ADMIN_ROLES.has(user?.rol)) {
    throw createServiceError(403, 'Solo un administrador puede acceder a esta sección.');
  }
}

function getUserId(user) {
  const userId = Number(user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(401, 'Debes iniciar sesión como administrador.');
  }

  return userId;
}

function cleanText(value, maxLength = null) {
  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    return '';
  }

  return maxLength ? text.slice(0, maxLength) : text;
}

function normalizeNullableText(value, maxLength = null) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function countWords(value = '') {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function parseOptionalInteger(value) {
  if (value === '' || value === null || value === undefined) {
    return null;
  }

  return Number(value);
}

function getUploadedImagePath(file) {
  return file?.filename ? `/uploads/mascotas/${file.filename}` : null;
}

function normalizeAdminPetPayload(payload = {}, file = null) {
  const publicadoPorNombre = cleanText(
    payload.publicado_por_nombre ?? payload.publicadoPorNombre,
    160
  );
  const nombre = cleanText(payload.nombre);
  const especie = cleanText(payload.especie, 80);
  const raza = normalizeNullableText(payload.raza, 120);
  const sexo = cleanText(payload.sexo || 'desconocido');
  const tamano = cleanText(payload.tamano || 'mediano');
  const descripcion = cleanText(payload.descripcion);
  const fotoUrl = getUploadedImagePath(file) || normalizeNullableText(payload.foto_url, 500);
  const edadAniosRaw = parseOptionalInteger(payload.edad_anios);
  const edadMesesRaw = parseOptionalInteger(payload.edad_meses);
  const hasAnyAge = edadAniosRaw !== null || edadMesesRaw !== null;
  const edadAnios = edadAniosRaw ?? 0;
  const edadMeses = edadMesesRaw ?? 0;

  if (!publicadoPorNombre) {
    throw createServiceError(400, 'Publicado por / Fundación o responsable es obligatorio.');
  }

  if (!nombre) {
    throw createServiceError(400, 'Nombre es obligatorio.');
  }

  if (nombre.length > PET_NAME_MAX_LENGTH) {
    throw createServiceError(400, 'El nombre de la mascota no puede superar los 40 caracteres.');
  }

  if (!especie) {
    throw createServiceError(400, 'Especie es obligatoria.');
  }

  if (!descripcion) {
    throw createServiceError(400, 'La descripción es obligatoria.');
  }

  if (countWords(descripcion) < DESCRIPTION_MIN_WORDS) {
    throw createServiceError(400, 'La descripción debe tener al menos 20 palabras.');
  }

  if (!PET_SEXES.has(sexo)) {
    throw createServiceError(400, 'Sexo inválido.');
  }

  if (!PET_SIZES.has(tamano)) {
    throw createServiceError(400, 'Tamaño inválido.');
  }

  if (!hasAnyAge) {
    throw createServiceError(400, 'Debes indicar la edad en años, meses o ambos.');
  }

  if (!Number.isInteger(edadAnios) || edadAnios < 0 || edadAnios > 30) {
    throw createServiceError(400, 'La edad en años debe estar entre 0 y 30.');
  }

  if (!Number.isInteger(edadMeses) || edadMeses < 0 || edadMeses > 11) {
    throw createServiceError(400, 'La edad en meses debe estar entre 0 y 11.');
  }

  return {
    descripcion,
    edadAnios,
    edadMeses,
    especie,
    estado: 'disponible',
    fotoUrl,
    nombre,
    publicadoPorNombre,
    raza,
    sexo,
    tamano
  };
}

async function getMetrics(user) {
  ensureAdmin(user);
  return adminModel.getMetrics();
}

async function createPet(user, payload, file = null) {
  ensureAdmin(user);
  const pet = normalizeAdminPetPayload(payload, file);

  return adminModel.createPet({
    ...pet,
    publicadoPorUsuarioId: getUserId(user)
  });
}

module.exports = {
  createPet,
  getMetrics
};