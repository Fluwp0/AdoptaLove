const foundationModel = require('./foundation.model');

const FOUNDATION_ROLES = new Set(['fundacion', 'administrador', 'admin']);
const ADMIN_ROLES = new Set(['administrador', 'admin']);
const PET_STATUSES = new Set(['disponible', 'en_revision', 'rechazada', 'adoptada', 'inactiva']);
const PET_SIZES = new Set(['pequeno', 'mediano', 'grande']);
const PET_SEXES = new Set(['macho', 'hembra', 'desconocido']);
const REQUEST_STATUSES = new Set(['en_revision', 'aprobada', 'rechazada']);
const PET_NAME_MAX_LENGTH = 40;
const DESCRIPTION_MIN_WORDS = 20;

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getUserId(user) {
  const userId = Number(user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(401, 'Debes iniciar sesión para acceder al panel');
  }

  return userId;
}

function ensureFoundationAccess(user) {
  if (!FOUNDATION_ROLES.has(user?.rol)) {
    throw createServiceError(403, 'Este panel está disponible solo para fundaciones registradas');
  }
}

function isAdmin(user) {
  return ADMIN_ROLES.has(user?.rol);
}

function getOwnerScope(user) {
  ensureFoundationAccess(user);
  return isAdmin(user) ? null : getUserId(user);
}

function parseId(value, message = 'Registro no encontrado') {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(404, message);
  }

  return id;
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

function normalizePetPayload(payload = {}, fallback = {}, options = {}) {
  const nombre = cleanText(payload.nombre ?? fallback.nombre);
  const especie = cleanText(payload.especie ?? fallback.especie, 80);
  const raza = normalizeNullableText(payload.raza ?? fallback.raza, 120);
  const sexo = cleanText(payload.sexo ?? fallback.sexo ?? 'desconocido');
  const tamano = cleanText(payload.tamano ?? fallback.tamano ?? 'mediano');
  const descripcion = cleanText(payload.descripcion ?? fallback.descripcion);
  const fotoUrl =
    options.uploadedImagePath ||
    normalizeNullableText(payload.foto_url ?? fallback.foto_url, 500);
  const estado = options.forceReview
    ? 'en_revision'
    : cleanText(payload.estado ?? fallback.estado ?? 'en_revision');
  const edadAniosRaw = parseOptionalInteger(payload.edad_anios ?? fallback.edad_anios);
  const edadMesesRaw = parseOptionalInteger(payload.edad_meses ?? fallback.edad_meses);
  const hasAnyAge = edadAniosRaw !== null || edadMesesRaw !== null;
  const edadAnios = edadAniosRaw ?? 0;
  const edadMeses = edadMesesRaw ?? 0;

  if (!nombre) {
    throw createServiceError(400, 'Nombre es obligatorio');
  }

  if (nombre.length > PET_NAME_MAX_LENGTH) {
    throw createServiceError(400, 'El nombre de la mascota no puede superar los 40 caracteres.');
  }

  if (!especie) {
    throw createServiceError(400, 'Especie es obligatoria');
  }

  if (!descripcion) {
    throw createServiceError(400, 'La descripción es obligatoria.');
  }

  if (countWords(descripcion) < DESCRIPTION_MIN_WORDS) {
    throw createServiceError(
      400,
      'La descripción debe tener al menos 20 palabras para que los adoptantes conozcan mejor a la mascota.'
    );
  }

  if (!PET_SEXES.has(sexo)) {
    throw createServiceError(400, 'Sexo inválido');
  }

  if (!PET_SIZES.has(tamano)) {
    throw createServiceError(400, 'Tamaño inválido');
  }

  if (!PET_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de mascota inválido');
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
    estado,
    fotoUrl,
    nombre,
    raza,
    sexo,
    tamano
  };
}

async function ensurePetPermission(petId, user) {
  const id = parseId(petId, 'Mascota no encontrada');
  const pet = await foundationModel.findPetById(id);

  if (!pet) {
    throw createServiceError(404, 'Mascota no encontrada');
  }

  if (pet.eliminada_at) {
    throw createServiceError(404, 'Mascota no encontrada');
  }

  if (!isAdmin(user) && Number(pet.publicado_por_usuario_id) !== getUserId(user)) {
    throw createServiceError(403, 'No puedes gestionar mascotas de otra fundación');
  }

  return pet;
}

async function ensureRequestPermission(requestId, user) {
  const id = parseId(requestId, 'Solicitud no encontrada');
  const request = await foundationModel.findAdoptionRequestById(id);

  if (!request) {
    throw createServiceError(404, 'Solicitud no encontrada');
  }

  if (!isAdmin(user) && Number(request.publicado_por_usuario_id) !== getUserId(user)) {
    throw createServiceError(403, 'No puedes gestionar postulaciones de otra fundación');
  }

  return request;
}

async function getDashboard(user) {
  const ownerScope = getOwnerScope(user);
  const [summary, pets, adoptionRequests] = await Promise.all([
    foundationModel.getDashboardSummary(ownerScope),
    foundationModel.findPetsByOwner(ownerScope),
    foundationModel.findAdoptionRequestsByOwner(ownerScope)
  ]);

  return {
    resumen: summary,
    mascotas: pets,
    postulaciones: adoptionRequests
  };
}

async function getPets(user) {
  return foundationModel.findPetsByOwner(getOwnerScope(user));
}

async function createPet(user, payload, file = null) {
  ensureFoundationAccess(user);
  const pet = normalizePetPayload(payload, {}, {
    forceReview: true,
    uploadedImagePath: getUploadedImagePath(file)
  });

  return foundationModel.createPet({
    ...pet,
    publicadoPorUsuarioId: getUserId(user)
  });
}

async function updatePet(user, petId, payload, file = null) {
  const currentPet = await ensurePetPermission(petId, user);
  const pet = normalizePetPayload(payload, currentPet, {
    forceReview: true,
    uploadedImagePath: getUploadedImagePath(file)
  });

  if (!isAdmin(user)) {
    const foundationUserId = getUserId(user);
    const pendingModification = await foundationModel.findPendingPetModificationRequest(
      currentPet.id,
      foundationUserId
    );
    const shouldCreateModificationRequest =
      currentPet.estado === 'disponible' || Boolean(pendingModification);

    if (!shouldCreateModificationRequest) {
      return foundationModel.updatePet(currentPet.id, pet);
    }

    const modification = await foundationModel.createPetModificationRequest({
      mascotaId: currentPet.id,
      fundacionUsuarioId: foundationUserId,
      estadoMascotaAnterior:
        pendingModification?.estado_mascota_anterior || currentPet.estado || 'disponible',
      datosPropuestos: {
        descripcion: pet.descripcion,
        edad_anios: pet.edadAnios,
        edad_meses: pet.edadMeses,
        especie: pet.especie,
        foto_url: pet.fotoUrl,
        nombre: pet.nombre,
        raza: pet.raza,
        sexo: pet.sexo,
        tamano: pet.tamano
      }
    });

    return {
      ...currentPet,
      estado: 'en_revision',
      modificacion_en_revision: modification
    };
  }

  return foundationModel.updatePet(currentPet.id, pet);
}

async function updatePetStatus(user, petId, payload = {}) {
  const currentPet = await ensurePetPermission(petId, user);
  const estado = cleanText(payload.estado);

  if (!isAdmin(user)) {
    throw createServiceError(403, 'El estado interno de la mascota debe ser gestionado por un administrador.');
  }

  if (!PET_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de mascota inválido');
  }

  return foundationModel.updatePetStatus(currentPet.id, estado);
}

async function deletePet(user, petId) {
  const currentPet = await ensurePetPermission(petId, user);

  await foundationModel.softDeletePet(currentPet.id);

  return { id: currentPet.id };
}

async function getAdoptionRequests(user) {
  return foundationModel.findAdoptionRequestsByOwner(getOwnerScope(user));
}

async function updateAdoptionRequestStatus(user, requestId, payload = {}) {
  const currentRequest = await ensureRequestPermission(requestId, user);
  const estado = cleanText(payload.estado);
  const motivoEstado = normalizeNullableText(payload.motivo_estado ?? payload.motivoEstado);

  if (!REQUEST_STATUSES.has(estado)) {
    throw createServiceError(400, 'Estado de postulación inválido');
  }

  if (['aprobada', 'rechazada'].includes(estado) && !motivoEstado) {
    throw createServiceError(400, 'Debes ingresar un motivo para aprobar o rechazar la postulación.');
  }

  return foundationModel.updateAdoptionRequestStatus(
    currentRequest.id,
    estado,
    motivoEstado ?? currentRequest.motivo_estado ?? null
  );
}

module.exports = {
  createPet,
  deletePet,
  getAdoptionRequests,
  getDashboard,
  getPets,
  updateAdoptionRequestStatus,
  updatePet,
  updatePetStatus
};
