const { Router } = require('express');
const { createAdoptionRequest } = require('./adoptionRequest.controller');

const router = Router();

router.post('/', createAdoptionRequest);

module.exports = router;
