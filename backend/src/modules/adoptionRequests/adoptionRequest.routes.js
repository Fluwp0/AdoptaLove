const { Router } = require('express');
const { requireAuth } = require('../../middlewares/authMiddleware');
const {
  cancelOwnAdoptionRequest,
  createAdoptionRequest,
  getAdoptionRequestById,
  getMyActiveAdoptionRequest,
  listMyAdoptionRequests,
  listAdoptionRequests,
  updateAdoptionRequestStatus
} = require('./adoptionRequest.controller');

const router = Router();

router.get('/', listAdoptionRequests);
router.get('/me', requireAuth, listMyAdoptionRequests);
router.get('/me/activa', requireAuth, getMyActiveAdoptionRequest);
router.get('/:id', getAdoptionRequestById);
router.patch('/:id/cancelar', requireAuth, cancelOwnAdoptionRequest);
router.patch('/:id/estado', updateAdoptionRequestStatus);
router.post('/', requireAuth, createAdoptionRequest);

module.exports = router;
