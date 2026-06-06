const { Router } = require('express');
const {
  createAdoptionRequest,
  getAdoptionRequestById,
  listAdoptionRequests
} = require('./adoptionRequest.controller');

const router = Router();

router.get('/', listAdoptionRequests);
router.get('/:id', getAdoptionRequestById);
router.post('/', createAdoptionRequest);

module.exports = router;
