const foundationService = require('./foundation.service');
const { deleteUploadedFile } = require('../../services/fileStorage');

async function removeUploadedFile(file) {
  if (!file) {
    return;
  }

  try {
    await deleteUploadedFile(file);
  } catch (_error) {
    // If cleanup fails, keep the original validation or service error.
  }
}

async function getDashboard(req, res, next) {
  try {
    const dashboard = await foundationService.getDashboard(req.user);

    return res.json({
      status: 'ok',
      data: dashboard
    });
  } catch (error) {
    return next(error);
  }
}

async function listPets(req, res, next) {
  try {
    const pets = await foundationService.getPets(req.user);

    return res.json({
      status: 'ok',
      total: pets.length,
      data: pets
    });
  } catch (error) {
    return next(error);
  }
}

async function createPet(req, res, next) {
  try {
    const pet = await foundationService.createPet(req.user, req.body, req.file);

    return res.status(201).json({
      status: 'ok',
      message: 'Tus cambios fueron enviados correctamente. Un administrador de AdoptaLove revisará la publicación antes de que sea visible para los adoptantes.',
      data: pet
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

async function updatePet(req, res, next) {
  try {
    const pet = await foundationService.updatePet(req.user, req.params.id, req.body, req.file);
    const isModificationRequest = Boolean(pet?.modificacion_en_revision);

    return res.json({
      status: 'ok',
      message: isModificationRequest
        ? 'Tus cambios fueron enviados correctamente. Un administrador de AdoptaLove revisará la modificación antes de aplicarla a la publicación.'
        : 'Tus cambios fueron enviados correctamente. Un administrador de AdoptaLove revisará la publicación antes de que sea visible para los adoptantes.',
      data: pet
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

async function updatePetStatus(req, res, next) {
  try {
    const pet = await foundationService.updatePetStatus(req.user, req.params.id, req.body);

    return res.json({
      status: 'ok',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function deletePet(req, res, next) {
  try {
    const pet = await foundationService.deletePet(req.user, req.params.id);

    return res.json({
      status: 'ok',
      message: 'Publicación eliminada correctamente.',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function listAdoptionRequests(req, res, next) {
  try {
    const requests = await foundationService.getAdoptionRequests(req.user);

    return res.json({
      status: 'ok',
      total: requests.length,
      data: requests
    });
  } catch (error) {
    return next(error);
  }
}

async function updateAdoptionRequestStatus(req, res, next) {
  try {
    const request = await foundationService.updateAdoptionRequestStatus(
      req.user,
      req.params.id,
      req.body
    );

    return res.json({
      status: 'ok',
      data: request
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createPet,
  deletePet,
  getDashboard,
  listAdoptionRequests,
  listPets,
  updateAdoptionRequestStatus,
  updatePet,
  updatePetStatus
};
