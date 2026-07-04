const { Router } = require('express');
const authController = require('./auth.controller');
const { requireAuth } = require('../../middlewares/authMiddleware');

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', requireAuth, authController.me);
router.patch('/me/location', requireAuth, authController.updateLocation);

module.exports = router;
