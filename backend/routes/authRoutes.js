const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  getMe,
  updateProfile,
  changePassword
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Register with optional photo uploads
router.post('/register', upload.fields([
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'vehiclePhoto', maxCount: 1 }
]), register);
router.post('/login', login);
router.get('/verify-email/:token', verifyEmail);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
