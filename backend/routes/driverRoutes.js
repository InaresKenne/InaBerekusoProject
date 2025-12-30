const express = require('express');
const router = express.Router();
const {
  updateStatus,
  updateLocation,
  uploadVehiclePhoto,
  uploadProfilePhoto,
  updateVehicleDetails,
  getAvailableDrivers,
  getDriverDetails,
  getEarnings,
  getDriverTrips
} = require('../controllers/driverController');
const { protect, authorize, checkApproval } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Public routes
router.get('/available', protect, getAvailableDrivers);
router.get('/:id', protect, getDriverDetails);

// Driver/Moto Rider only routes
router.put('/status', protect, authorize('driver', 'moto_rider'), checkApproval, updateStatus);
router.put('/location', protect, authorize('driver', 'moto_rider'), checkApproval, updateLocation);
router.post('/vehicle-photo', protect, authorize('driver', 'moto_rider'), upload.single('photo'), uploadVehiclePhoto);
router.post('/profile-photo', protect, upload.single('photo'), uploadProfilePhoto);
router.put('/vehicle', protect, authorize('driver', 'moto_rider'), updateVehicleDetails);
router.get('/earnings/details', protect, authorize('driver', 'moto_rider'), getEarnings);
router.get('/trips/history', protect, authorize('driver', 'moto_rider'), getDriverTrips);

module.exports = router;
