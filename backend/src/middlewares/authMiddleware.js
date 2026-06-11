const jwt = require('jsonwebtoken');
const env = require('../config/env');

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      status: 'error',
      message: 'Token no proporcionado'
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
      message: 'Token inválido'
    });
  }
}

module.exports = { requireAuth };
