const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Registration
router.post('/send-otp', userController.sendRegistrationOTP);
router.post('/verify-register', userController.verifyOTPAndRegister);

// Standard Login
router.post('/login', userController.loginUser);

// Profile & Preferences
router.get('/profile/:id', userController.getUserProfile); 
router.post('/preferences', userController.updateNotificationPreference);

// Account Recovery (The missing routes!)
router.post('/send-recovery-otp', userController.sendRecoveryOTP);
router.post('/reset-password', userController.resetPasswordWithOTP);
router.post('/recover', userController.recoverCredentials); 

module.exports = router;