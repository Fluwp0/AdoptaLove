const { Router } = require('express');
const { requireAuth } = require('../../middlewares/authMiddleware');
const { uploadPetImage } = require('../../middlewares/uploadMiddleware');
const adminController = require('./admin.controller');

const router = Router();

router.use(requireAuth);

router.get('/metrics', adminController.getMetrics);
router.post('/pets', uploadPetImage.single('imagen'), adminController.createPet);

module.exports = router;