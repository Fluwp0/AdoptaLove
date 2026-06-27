const { Router } = require('express');
const { requireAuth, requireAuthWithMessage } = require('../../middlewares/authMiddleware');
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
const requireRequestAuth = requireAuthWithMessage('Debes iniciar sesión para ver solicitudes.');

router.get('/', requireRequestAuth, listAdoptionRequests);
router.get('/me', requireAuth, listMyAdoptionRequests);
router.get('/me/activa', requireAuth, getMyActiveAdoptionRequest);
router.get('/:id', requireRequestAuth, getAdoptionRequestById);
router.patch('/:id/cancelar', requireAuth, cancelOwnAdoptionRequest);
router.patch('/:id/estado', requireRequestAuth, updateAdoptionRequestStatus);
router.post('/', requireAuth, createAdoptionRequest);

module.exports = router;
