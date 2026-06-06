const petService = require('./pet.service');

async function listAvailablePets(_req, res, next) {
  try {
    const mascotas = await petService.getAvailablePets();

    res.json({
      status: 'ok',
      total: mascotas.length,
      data: mascotas
    });
  } catch (error) {
    next(error);
  }
}

async function getPetById(req, res, next) {
  try {
    const mascota = await petService.getPetById(req.params.id);

    if (!mascota) {
      return res.status(404).json({
        status: 'error',
        message: 'Mascota no encontrada'
      });
    }

    return res.json({
      status: 'ok',
      data: mascota
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getPetById, listAvailablePets };
