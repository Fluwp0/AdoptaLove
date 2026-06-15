const aboutService = require('./about.service');

async function getStats(_req, res, next) {
  try {
    const stats = await aboutService.getStats();

    return res.json({
      status: 'ok',
      data: stats
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getStats
};
