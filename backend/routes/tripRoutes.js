const express = require('express');
const router = express.Router();
const {
  createTrip,
  acceptTrip,
  confirmTrip,
  updateTripStatus,
  cancelTrip,
  rateTrip,
  skipRating,
  getTripHistory,
  getActiveTrip,
  shareTrip,
  acceptFare,
  rejectFare,
  counterFare,
  acceptCounterOffer,
  driverCounterOffer
} = require('../controllers/tripController');
const { protect, authorize, checkApproval } = require('../middleware/auth');

router.post('/', protect, authorize('student'), checkApproval, createTrip);
router.put('/:id/accept', protect, authorize('driver', 'moto_rider'), checkApproval, acceptTrip);
router.put('/:id/confirm', protect, authorize('driver', 'moto_rider'), checkApproval, confirmTrip);
router.put('/:id/status', protect, authorize('driver', 'moto_rider'), checkApproval, updateTripStatus);
router.put('/:id/cancel', protect, cancelTrip);
router.put('/:id/rate', protect, authorize('student'), rateTrip);
router.put('/:id/skip-rating', protect, authorize('student'), skipRating);
router.put('/:id/share', protect, authorize('student'), shareTrip);
router.put('/:id/accept-fare', protect, authorize('student'), checkApproval, acceptFare);
router.put('/:id/reject-fare', protect, authorize('student', 'driver', 'moto_rider'), rejectFare);
router.put('/:id/counter-fare', protect, authorize('student'), checkApproval, counterFare);
router.put('/:id/accept-counter', protect, authorize('driver', 'moto_rider'), checkApproval, acceptCounterOffer);
router.put('/:id/driver-counter', protect, authorize('driver', 'moto_rider'), checkApproval, driverCounterOffer);
router.get('/history', protect, getTripHistory);
router.get('/active', protect, getActiveTrip);

module.exports = router;
