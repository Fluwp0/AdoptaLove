const fs = require('fs/promises');
const adminService = require('./admin.service');

async function removeUploadedFile(file) {
  if (!file?.path) {
    return;
  }

  try {
    await fs.unlink(file.path);
  } catch (_error) {
    // Keep the original validation or service error.
  }
}

async function getMetrics(req, res, next) {
  try {
    const metrics = await adminService.getMetrics(req.user);

    return res.json({
      status: 'ok',
      data: metrics
    });
  } catch (error) {
    return next(error);
  }
}

async function listPets(req, res, next) {
  try {
    const result = await adminService.listPetPublications(req.user, req.query);

    return res.json({
      status: 'ok',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function getPet(req, res, next) {
  try {
    const pet = await adminService.getPet(req.user, req.params.id);

    return res.json({
      status: 'ok',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function createPet(req, res, next) {
  try {
    const pet = await adminService.createPet(req.user, req.body, req.file);

    return res.status(201).json({
      status: 'ok',
      message: 'Mascota publicada correctamente desde el panel administrador.',
      data: pet
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

async function updatePet(req, res, next) {
  try {
    const pet = await adminService.updatePet(req.user, req.params.id, req.body, req.file);

    return res.json({
      status: 'ok',
      message: 'Publicación actualizada correctamente.',
      data: pet
    });
  } catch (error) {
    await removeUploadedFile(req.file);
    return next(error);
  }
}

async function deletePet(req, res, next) {
  try {
    const pet = await adminService.deletePet(req.user, req.params.id);

    return res.json({
      status: 'ok',
      message: 'Publicación eliminada correctamente.',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function listUsers(req, res, next) {
  try {
    const result = await adminService.listUsers(req.user, req.query);

    return res.json({
      status: 'ok',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function createUser(req, res, next) {
  try {
    const user = await adminService.createUser(req.user, req.body);

    return res.status(201).json({
      status: 'ok',
      message: 'Usuario creado correctamente.',
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

async function updateUser(req, res, next) {
  try {
    const user = await adminService.updateUser(req.user, req.params.id, req.body);

    return res.json({
      status: 'ok',
      message: 'Usuario actualizado correctamente.',
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteUser(req, res, next) {
  try {
    const user = await adminService.deactivateUser(req.user, req.params.id, req.body);

    return res.json({
      status: 'ok',
      message: 'Usuario desactivado correctamente.',
      data: user
    });
  } catch (error) {
    return next(error);
  }
}

async function listPetsForReview(req, res, next) {
  try {
    const result = await adminService.listPetPublications(req.user, req.query);

    return res.json({
      status: 'ok',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function approvePet(req, res, next) {
  try {
    const pet = await adminService.updatePetReviewStatus(
      req.user,
      req.params.id,
      'disponible',
      req.body
    );

    return res.json({
      status: 'ok',
      message: 'Publicación aprobada correctamente.',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function rejectPet(req, res, next) {
  try {
    const pet = await adminService.updatePetReviewStatus(
      req.user,
      req.params.id,
      'rechazada',
      req.body
    );

    return res.json({
      status: 'ok',
      message: 'Publicación rechazada correctamente.',
      data: pet
    });
  } catch (error) {
    return next(error);
  }
}

async function listPetModifications(req, res, next) {
  try {
    const result = await adminService.listPetModifications(req.user, req.query);

    return res.json({
      status: 'ok',
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    return next(error);
  }
}

async function approvePetModification(req, res, next) {
  try {
    const modification = await adminService.updatePetModificationStatus(
      req.user,
      req.params.id,
      'aprobada',
      req.body
    );

    return res.json({
      status: 'ok',
      message: 'Modificación aprobada correctamente.',
      data: modification
    });
  } catch (error) {
    return next(error);
  }
}

async function rejectPetModification(req, res, next) {
  try {
    const modification = await adminService.updatePetModificationStatus(
      req.user,
      req.params.id,
      'rechazada',
      req.body
    );

    return res.json({
      status: 'ok',
      message: 'Modificación rechazada correctamente.',
      data: modification
    });
  } catch (error) {
    return next(error);
  }
}

async function discardPetModification(req, res, next) {
  try {
    const modification = await adminService.discardPetModification(req.user, req.params.id);

    return res.json({
      status: 'ok',
      message: 'Solicitud de modificación descartada correctamente.',
      data: modification
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  approvePet,
  approvePetModification,
  createPet,
  createUser,
  deletePet,
  deleteUser,
  discardPetModification,
  getMetrics,
  getPet,
  listPetModifications,
  listPets,
  listPetsForReview,
  listUsers,
  rejectPet,
  rejectPetModification,
  updatePet,
  updateUser
};
