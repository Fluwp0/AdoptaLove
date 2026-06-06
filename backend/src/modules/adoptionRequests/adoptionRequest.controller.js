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

module.exports = { createAdoptionRequest };
