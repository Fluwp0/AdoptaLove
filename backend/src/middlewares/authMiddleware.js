function requireAuth(_req, _res, next) {
  // TODO: validar JWT cuando se implemente autenticacion.
  next();
}

module.exports = { requireAuth };
