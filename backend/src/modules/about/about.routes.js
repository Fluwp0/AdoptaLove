const { Router } = require('express');
const aboutController = require('./about.controller');

const router = Router();

router.get('/stats', aboutController.getStats);

module.exports = router;
