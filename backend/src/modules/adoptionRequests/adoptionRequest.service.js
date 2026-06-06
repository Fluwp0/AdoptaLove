const adoptionRequestModel = require('./adoptionRequest.model');

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

module.exports = { createAdoptionRequest };
