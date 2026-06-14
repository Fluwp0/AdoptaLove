const adoptionRequestModel = require('./adoptionRequest.model');

const ALLOWED_STATUS_UPDATES = new Set([
  'aprobada',
  'rechazada',
  'en_revision',
  'pendiente'
]);
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

async function getAdoptionRequests() {
  return adoptionRequestModel.findAdoptionRequests();
}

async function getAdoptionRequestById(id) {
  const solicitudId = Number(id);

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return null;
  }

  return adoptionRequestModel.findAdoptionRequestDetailById(solicitudId);
}

async function updateAdoptionRequestStatus(id, payload = {}) {
  const solicitudId = Number(id);
  const estado = typeof payload.estado === 'string' ? payload.estado.trim() : '';

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    throw createServiceError(404, 'Solicitud no encontrada');
  }

  if (!ALLOWED_STATUS_UPDATES.has(estado)) {
    throw createServiceError(400, 'Estado inválido');
  }

  const solicitud = await adoptionRequestModel.updateAdoptionRequestStatus(
    solicitudId,
    estado
  );

  if (!solicitud) {
    throw createServiceError(404, 'Solicitud no encontrada');
  }

  return solicitud;
}

async function cancelOwnAdoptionRequest(id, authenticatedUser = {}) {
  const solicitudId = Number(id);
  const userId = parseRequiredId(authenticatedUser.id, 'usuario_id');

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    throw createServiceError(404, 'Solicitud no encontrada');
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
  getActiveAdoptionRequestForUser,
  getAdoptionRequestById,
  getAdoptionRequestsForUser,
  getAdoptionRequests,
  updateAdoptionRequestStatus
};
