const { Router } = require('express');
const compatibilityController = require('./compatibility.controller');

const router = Router();

router.get('/questions', compatibilityController.getQuestions);
router.post('/match', compatibilityController.matchPets);

module.exports = router;
