function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || (err.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
  const message =
    err.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar los 3 MB.'
      : err.message || 'Internal server error';

  res.status(statusCode).json({
    message
  });
}

module.exports = { errorHandler };
