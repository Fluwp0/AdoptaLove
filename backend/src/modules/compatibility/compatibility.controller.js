const compatibilityService = require('./compatibility.service');

function sendKnownError(error, res, next) {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      status: 'error',
      message: error.message
    });
  }

  return next(error);
}

async function getQuestions(_req, res, next) {
  try {
    const questions = compatibilityService.getQuestions();

    return res.json({
      status: 'ok',
      data: questions
    });
  } catch (error) {
    return next(error);
  }
}

async function matchPets(req, res, next) {
  try {
    const match = await compatibilityService.matchPets(req.body);

    return res.json({
      status: 'ok',
      data: match
    });
  } catch (error) {
    return sendKnownError(error, res, next);
  }
}

module.exports = {
  getQuestions,
  matchPets
};
