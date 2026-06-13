const { Router } = require('express');
const {
  askQuestion,
  listQuestions
} = require('./chatbot.controller');

const router = Router();

router.get('/questions', listQuestions);
router.post('/ask', askQuestion);

module.exports = router;
