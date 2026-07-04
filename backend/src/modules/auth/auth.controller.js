const authService = require('./auth.service');

function sendKnownError(error, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  return next(error);
}

async function register(req, res, next) {
  try {
    const session = await authService.register(req.body);

    return res.status(201).json({
      status: 'ok',
      data: session
    });
  } catch (error) {
    return sendKnownError(error, res, next);
  }
}

async function login(req, res, next) {
  try {
    const session = await authService.login(req.body);

    return res.json({
      status: 'ok',
      data: session
    });
  } catch (error) {
    return sendKnownError(error, res, next);
  }
}

async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuario no encontrado'
      });
    }

    return res.json({
      status: 'ok',
      data: { user }
    });
  } catch (error) {
    return next(error);
  }
}

async function updateLocation(req, res, next) {
  try {
    const user = await authService.updateMyLocation(req.user.id, req.body);

    return res.json({
      status: 'ok',
      data: { user }
    });
  } catch (error) {
    return sendKnownError(error, res, next);
  }
}

module.exports = {
  login,
  me,
  register,
  updateLocation
};
