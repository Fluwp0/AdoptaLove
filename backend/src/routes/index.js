const { Router } = require('express');
const authRoutes = require('../modules/auth/auth.routes');
const userRoutes = require('../modules/users/user.routes');
const petRoutes = require('../modules/pets/pet.routes');
const adoptionRequestRoutes = require('../modules/adoptionRequests/adoptionRequest.routes');
const adoptionRoutes = require('../modules/adoptions/adoption.routes');
const compatibilityRoutes = require('../modules/compatibility/compatibility.routes');
const chatbotRoutes = require('../modules/chatbot/chatbot.routes');
const donationRoutes = require('../modules/donations/donation.routes');
const adminRoutes = require('../modules/admin/admin.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/mascotas', petRoutes);
router.use('/pets', petRoutes);
router.use('/solicitudes-adopcion', adoptionRequestRoutes);
router.use('/adoption-requests', adoptionRequestRoutes);
router.use('/adoptions', adoptionRoutes);
router.use('/compatibility', compatibilityRoutes);
router.use('/chatbot', chatbotRoutes);
router.use('/donations', donationRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
