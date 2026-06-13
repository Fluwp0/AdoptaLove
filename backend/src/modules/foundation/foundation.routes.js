const { Router } = require('express');
const { requireAuth } = require('../../middlewares/authMiddleware');
const { uploadPetImage } = require('../../middlewares/uploadMiddleware');
const foundationController = require('./foundation.controller');

const router = Router();

router.use(requireAuth);

router.get('/dashboard', foundationController.getDashboard);
router.get('/pets', foundationController.listPets);
router.post('/pets', uploadPetImage.single('imagen'), foundationController.createPet);
router.put('/pets/:id', uploadPetImage.single('imagen'), foundationController.updatePet);
router.patch('/pets/:id/status', foundationController.updatePetStatus);
router.delete('/pets/:id', foundationController.deletePet);
router.get('/adoption-requests', foundationController.listAdoptionRequests);
router.patch(
  '/adoption-requests/:id/status',
  foundationController.updateAdoptionRequestStatus
);

module.exports = router;
