const chatbotService = require('./chatbot.service');

async function listQuestions(_req, res, next) {
  try {
    const questions = await chatbotService.getQuestions();

    return res.json({
      status: 'ok',
      data: questions
    });
  } catch (error) {
    return next(error);
  }
}

async function askQuestion(req, res, next) {
  try {
    const answer = await chatbotService.askQuestion(req.body);

    return res.json({
      status: 'ok',
      data: answer
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  askQuestion,
  listQuestions
};
