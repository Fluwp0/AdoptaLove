const { Router } = require('express');
const {
  createAdoptionRequest,
  getAdoptionRequestById,
  listAdoptionRequests,
  updateAdoptionRequestStatus
} = require('./adoptionRequest.controller');

const router = Router();

router.get('/', listAdoptionRequests);
router.get('/:id', getAdoptionRequestById);
router.patch('/:id/estado', updateAdoptionRequestStatus);
router.post('/', createAdoptionRequest);

module.exports = router;
