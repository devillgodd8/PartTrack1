/**
 * Global error handler — catches unhandled errors and returns consistent JSON.
 */
function errorHandler(err, req, res, _next) {
  console.error('Unhandled error:', err);

  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message || 'Internal server error';

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
