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

module.exports = {
  createPet,
  getMetrics
};