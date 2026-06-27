const adoptionRequestService = require('./adoptionRequest.service');

async function createAdoptionRequest(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.createAdoptionRequest(req.body, req.user);

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

async function listMyAdoptionRequests(req, res, next) {
  try {
    const solicitudes = await adoptionRequestService.getAdoptionRequestsForUser(req.user);

    return res.json({
      status: 'ok',
      total: solicitudes.length,
      data: solicitudes
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

async function getMyActiveAdoptionRequest(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.getActiveAdoptionRequestForUser(req.user);

    return res.json({
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

async function listAdoptionRequests(req, res, next) {
  try {
    const solicitudes = await adoptionRequestService.getAdoptionRequests(req.user);

    return res.json({
      status: 'ok',
      total: solicitudes.length,
      data: solicitudes
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

async function getAdoptionRequestById(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.getAdoptionRequestById(
      req.params.id,
      req.user
    );

    return res.json({
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

async function updateAdoptionRequestStatus(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.updateAdoptionRequestStatus(
      req.params.id,
      req.body,
      req.user
    );

    return res.json({
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

async function cancelOwnAdoptionRequest(req, res, next) {
  try {
    const solicitud = await adoptionRequestService.cancelOwnAdoptionRequest(
      req.params.id,
      req.user
    );

    return res.json({
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

module.exports = {
  cancelOwnAdoptionRequest,
  createAdoptionRequest,
  getAdoptionRequestById,
  getMyActiveAdoptionRequest,
  listMyAdoptionRequests,
  listAdoptionRequests,
  updateAdoptionRequestStatus
};
