const adoptionRequestModel = require('./adoptionRequest.model');

const ALLOWED_STATUS_UPDATES = new Set([
  'aprobada',
  'rechazada',
  'en_revision',
  'pendiente'
]);

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

async function createAdoptionRequest(payload = {}) {
  const adoptanteUsuarioId = parseRequiredId(
    payload.adoptante_usuario_id,
    'adoptante_usuario_id'
  );
  const mascotaId = parseRequiredId(payload.mascota_id, 'mascota_id');
  const mensaje =
    typeof payload.mensaje === 'string' && payload.mensaje.trim()
      ? payload.mensaje.trim()
      : null;

  const usuario = await adoptionRequestModel.findUserById(adoptanteUsuarioId);

  if (!usuario) {
    throw createServiceError(404, 'Usuario no encontrado');
  }

  const mascota = await adoptionRequestModel.findPetById(mascotaId);

  if (!mascota) {
    throw createServiceError(404, 'Mascota no encontrada');
  }

  return adoptionRequestModel.createAdoptionRequest({
    adoptanteUsuarioId,
    mascotaId,
    mensaje
  });
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

module.exports = {
  createAdoptionRequest,
  getAdoptionRequestById,
  getAdoptionRequests,
  updateAdoptionRequestStatus
};
