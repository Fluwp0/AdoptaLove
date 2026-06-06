const adoptionRequestService = require('./adoptionRequest.service');

async function createAdoptionRequest(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.createAdoptionRequest(req.body);

    return res.status(201).json({
      status: 'ok',
      data: solicitud
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message
      });
    }

    return next(error);
  }
}

async function listAdoptionRequests(_req, res, next) {
  try {
    const solicitudes = await adoptionRequestService.getAdoptionRequests();

    return res.json({
      status: 'ok',
      total: solicitudes.length,
      data: solicitudes
    });
  } catch (error) {
    return next(error);
  }
}

async function getAdoptionRequestById(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.getAdoptionRequestById(req.params.id);

    if (!solicitud) {
      return res.status(404).json({
        status: 'error',
        message: 'Solicitud no encontrada'
      });
    }

    return res.json({
      status: 'ok',
      data: solicitud
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAdoptionRequest,
  getAdoptionRequestById,
  listAdoptionRequests
};
