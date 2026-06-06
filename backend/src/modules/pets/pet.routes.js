const { Router } = require('express');
const { getPetById, listAvailablePets } = require('./pet.controller');

const router = Router();

router.get('/', listAvailablePets);
router.get('/:id', getPetById);

module.exports = router;
