const jwt = require('jsonwebtoken');
const env = require('../config/env');

function requireAuth(req, res, next, options = {}) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  const unauthorizedMessage = options.unauthorizedMessage || 'Token no proporcionado';
  const invalidTokenMessage = options.invalidTokenMessage || 'Token inválido';

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      status: 'error',
      message: unauthorizedMessage
    });
  }

  try {
    const decoded = jwt.verify(token, env.jwt.secret);

    req.user = {
      id: decoded.sub,
      rol: decoded.rol
    };

    return next();
  } catch (_error) {
    return res.status(401).json({
      status: 'error',
      message: invalidTokenMessage
    });
  }
}

function requireAuthWithMessage(message) {
  return (req, res, next) =>
    requireAuth(req, res, next, {
      invalidTokenMessage: message,
      unauthorizedMessage: message
    });
}

module.exports = { requireAuth, requireAuthWithMessage };
