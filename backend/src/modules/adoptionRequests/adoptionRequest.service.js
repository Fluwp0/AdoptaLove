const adoptionRequestModel = require('./adoptionRequest.model');

const ADMIN_ROLES = new Set(['administrador', 'admin']);
const FOUNDATION_ROLES = new Set(['fundacion']);
const ADOPTER_ROLES = new Set(['adoptante']);
const ALLOWED_STATUS_UPDATES = new Set([
  'aprobada',
  'rechazada',
  'en_revision',
  'pendiente'
]);
const DECISION_STATUSES = new Set(['aprobada', 'rechazada']);
const REQUIRED_LOCATION_FIELDS = [
  ['region', 'regi\u00f3n'],
  ['comuna', 'comuna'],
  ['direccion', 'direcci\u00f3n'],
  ['numeracion', 'numeraci\u00f3n']
];
const ACTIVE_ADOPTION_STATUSES = new Set(['pendiente', 'en_revision']);
const ACTIVE_ADOPTION_MESSAGE =
  'Ya tienes una postulación en proceso. Debes esperar a que sea aprobada, rechazada o cancelarla desde tu perfil para poder postular a otra mascota.';
const ADOPTER_CANCEL_REASON = 'Postulación cancelada por el adoptante.';

function createServiceError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseRequiredId(value, fieldName) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(400, `${fieldName} es obligatorio`);
  }

  return id;
}

function parseRequestId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    throw createServiceError(404, 'Solicitud no encontrada.');
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

function getMissingRequiredLocationFields(user = {}) {
  return REQUIRED_LOCATION_FIELDS
    .filter(([field]) => !cleanText(user[field]))
    .map(([, label]) => label);
}

function getUserId(authenticatedUser = {}) {
  const userId = Number(authenticatedUser?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw createServiceError(401, 'Debes iniciar sesión para ver solicitudes.');
  }

  return userId;
}

function isAdmin(user = {}) {
  return ADMIN_ROLES.has(user?.rol);
}

function isFoundation(user = {}) {
  return FOUNDATION_ROLES.has(user?.rol);
}

function isAdopter(user = {}) {
  return ADOPTER_ROLES.has(user?.rol);
}

function ensureCanViewAdoptionRequest(user, request) {
  const userId = getUserId(user);

  if (isAdmin(user)) {
    return;
  }

  if (isAdopter(user) && Number(request.adoptante_usuario_id) === userId) {
    return;
  }

  if (isFoundation(user) && Number(request.publicado_por_usuario_id) === userId) {
    return;
  }

  throw createServiceError(403, 'No tienes permisos para ver esta solicitud.');
}

function ensureCanUpdateAdoptionRequestStatus(user, request) {
  const userId = getUserId(user);

  if (isAdmin(user)) {
    return;
  }

  if (isFoundation(user) && Number(request.publicado_por_usuario_id) === userId) {
    return;
  }

  throw createServiceError(403, 'No tienes permisos para modificar esta solicitud.');
}

async function ensureAdoptionRequestAccess(id, user) {
  const request = await adoptionRequestModel.findAdoptionRequestAccessById(id);

  if (!request) {
    throw createServiceError(404, 'Solicitud no encontrada.');
  }

  ensureCanViewAdoptionRequest(user, request);
  return request;
}

async function createAdoptionRequest(payload = {}, authenticatedUser = null) {
  const adoptanteUsuarioId = authenticatedUser?.id
    ? parseRequiredId(authenticatedUser.id, 'adoptante_usuario_id')
    : parseRequiredId(payload.adoptante_usuario_id, 'adoptante_usuario_id');
  const mascotaId = parseRequiredId(payload.mascota_id, 'mascota_id');
  const mensaje =
    typeof payload.mensaje === 'string' && payload.mensaje.trim()
      ? payload.mensaje.trim()
      : null;

  const usuario = await adoptionRequestModel.findUserById(adoptanteUsuarioId);

  if (!usuario) {
    throw createServiceError(404, 'Usuario no encontrado');
  }

  const missingLocationFields = getMissingRequiredLocationFields(usuario);

  if (missingLocationFields.length > 0) {
    throw createServiceError(
      400,
      `Completa tu ${missingLocationFields.join(', ')} antes de postular.`
    );
  }

  const activeRequest = await adoptionRequestModel.findActiveAdoptionRequestByUserId(
    adoptanteUsuarioId
  );

  if (activeRequest) {
    throw createServiceError(409, ACTIVE_ADOPTION_MESSAGE);
  }

  const mascota = await adoptionRequestModel.findPetById(mascotaId);

  if (!mascota) {
    throw createServiceError(404, 'Mascota no encontrada');
  }

  if (mascota.estado !== 'disponible') {
    throw createServiceError(400, 'Solo puedes postular a mascotas disponibles.');
  }

  return adoptionRequestModel.createAdoptionRequest({
    adoptanteUsuarioId,
    mascotaId,
    mensaje
  });
}

async function getAdoptionRequestsForUser(authenticatedUser = {}) {
  const userId = parseRequiredId(authenticatedUser.id, 'usuario_id');

  return adoptionRequestModel.findAdoptionRequestsByUserId(userId);
}

async function getActiveAdoptionRequestForUser(authenticatedUser = {}) {
  const userId = parseRequiredId(authenticatedUser.id, 'usuario_id');

  return adoptionRequestModel.findActiveAdoptionRequestByUserId(userId);
}

async function getAdoptionRequests(authenticatedUser = {}) {
  const userId = getUserId(authenticatedUser);

  if (isAdmin(authenticatedUser)) {
    return adoptionRequestModel.findAdoptionRequests();
  }

  if (isFoundation(authenticatedUser)) {
    return adoptionRequestModel.findAdoptionRequestsByFoundationUserId(userId);
  }

  if (isAdopter(authenticatedUser)) {
    return adoptionRequestModel.findAdoptionRequestsByUserId(userId);
  }

  throw createServiceError(403, 'No tienes permisos para ver esta solicitud.');
}

async function getAdoptionRequestById(id, authenticatedUser = {}) {
  const solicitudId = parseRequestId(id);
  await ensureAdoptionRequestAccess(solicitudId, authenticatedUser);

  const solicitud = await adoptionRequestModel.findAdoptionRequestDetailById(solicitudId);

  if (!solicitud) {
    throw createServiceError(404, 'Solicitud no encontrada.');
  }

  return solicitud;
}

async function updateAdoptionRequestStatus(id, payload = {}, authenticatedUser = {}) {
  const solicitudId = parseRequestId(id);
  const currentRequest = await adoptionRequestModel.findAdoptionRequestAccessById(solicitudId);

  if (!currentRequest) {
    throw createServiceError(404, 'Solicitud no encontrada.');
  }

  ensureCanUpdateAdoptionRequestStatus(authenticatedUser, currentRequest);

  const estado = cleanText(payload.estado);
  const motivoEstado = normalizeNullableText(
    payload.motivo_estado ?? payload.motivoEstado ?? payload.motivo,
    1000
  );

  if (!ALLOWED_STATUS_UPDATES.has(estado)) {
    throw createServiceError(400, 'Estado inválido');
  }

  if (DECISION_STATUSES.has(estado) && !motivoEstado) {
    throw createServiceError(400, 'Debes ingresar un motivo para aprobar o rechazar la postulación.');
  }

  const solicitud = await adoptionRequestModel.updateAdoptionRequestStatus(
    solicitudId,
    estado,
    motivoEstado ?? currentRequest.motivo_estado ?? null
  );

  if (!solicitud) {
    throw createServiceError(404, 'Solicitud no encontrada.');
  }

  return solicitud;
}

async function cancelOwnAdoptionRequest(id, authenticatedUser = {}) {
  const solicitudId = Number(id);
  const userId = parseRequiredId(authenticatedUser.id, 'usuario_id');

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    throw createServiceError(404, 'Solicitud no encontrada.');
  }

  const solicitud = await adoptionRequestModel.cancelOwnActiveAdoptionRequest(
    solicitudId,
    userId,
    ADOPTER_CANCEL_REASON
  );

  if (!solicitud) {
    throw createServiceError(400, 'Solo puedes cancelar una postulación activa propia.');
  }

  return solicitud;
}

module.exports = {
  ACTIVE_ADOPTION_STATUSES,
  ACTIVE_ADOPTION_MESSAGE,
  cancelOwnAdoptionRequest,
  createAdoptionRequest,
  ensureAdoptionRequestAccess,
  ensureCanUpdateAdoptionRequestStatus,
  ensureCanViewAdoptionRequest,
  getActiveAdoptionRequestForUser,
  getAdoptionRequestById,
  getAdoptionRequestsForUser,
  getAdoptionRequests,
  updateAdoptionRequestStatus
};
