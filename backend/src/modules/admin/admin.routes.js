const { Router } = require('express');
const { requireAuth } = require('../../middlewares/authMiddleware');
const { uploadPetImage } = require('../../middlewares/uploadMiddleware');
const adminController = require('./admin.controller');

const router = Router();

router.use(requireAuth);

router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.listUsers);
router.post('/users', adminController.createUser);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/pets', adminController.listPets);
router.get('/pets/review', adminController.listPetsForReview);
router.post('/pets', uploadPetImage.single('imagen'), adminController.createPet);
router.get('/pets/:id', adminController.getPet);
router.put('/pets/:id', uploadPetImage.single('imagen'), adminController.updatePet);
router.delete('/pets/:id', adminController.deletePet);
router.patch('/pets/:id/approve', adminController.approvePet);
router.patch('/pets/:id/reject', adminController.rejectPet);
router.get('/pet-modifications', adminController.listPetModifications);
router.patch('/pet-modifications/:id/approve', adminController.approvePetModification);
router.patch('/pet-modifications/:id/reject', adminController.rejectPetModification);
router.delete('/pet-modifications/:id', adminController.discardPetModification);

module.exports = router;
