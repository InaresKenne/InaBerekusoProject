const Trip = require('../models/Trip');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a trip request
// @route   POST /api/trips
// @access  Private (Student)
exports.createTrip = async (req, res) => {
  try {
    console.log('📝 Creating trip request:', req.body);
    const { driverId, pickupLocation, dropoffLocation, estimatedFare } = req.body;

    // Validate driver
    const driver = await User.findById(driverId);
    if (!driver || !['driver', 'moto_rider'].includes(driver.role)) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    if (!driver.isApproved) {
      return res.status(400).json({
        success: false,
        message: 'Driver is not approved'
      });
    }

    // Create trip
    const trip = await Trip.create({
      student: req.user._id,
      driver: driverId,
      pickupLocation,
      dropoffLocation,
      estimatedFare,
      status: 'pending'
    });

    // Create notification for driver
    await Notification.create({
      user: driverId,
      title: 'New Ride Request',
      message: `${req.user.firstName} ${req.user.lastName} has requested a ride`,
      type: 'ride_request',
      relatedTrip: trip._id,
      relatedUser: req.user._id
    });

    // Emit real-time notification via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').to(driverId.toString()).emit('trip_request', {
        trip: await trip.populate('student', 'firstName lastName profilePhoto phoneNumber')
      });
    }

    // Populate trip with student and driver details before sending response
    await trip.populate('student', 'firstName lastName profilePhoto phoneNumber');
    await trip.populate('driver', 'firstName lastName profilePhoto phoneNumber vehicleMake vehicleModel vehicleColor licensePlate rating totalRatings');

    res.status(201).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Accept trip request with fare proposal
// @route   PUT /api/trips/:id/accept
// @access  Private (Driver/Moto Rider)
exports.acceptTrip = async (req, res) => {
  try {
    const { proposedFare } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Trip cannot be accepted'
      });
    }

    if (!proposedFare || proposedFare <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid fare amount'
      });
    }

    trip.status = 'fare_proposed';
    trip.proposedFare = proposedFare;
    trip.fareStatus = 'proposed';
    trip.fareHistory.push({
      amount: proposedFare,
      proposedBy: 'driver',
      timestamp: new Date()
    });
    await trip.save();

    // Update driver status to busy
    await User.findByIdAndUpdate(req.user._id, { driverStatus: 'busy' });

    // Create notification for student
    await Notification.create({
      user: trip.student,
      title: 'Ride Accepted',
      message: `${req.user.firstName} has accepted your ride request`,
      type: 'ride_accepted',
      relatedTrip: trip._id,
      relatedUser: req.user._id
    });

    // Emit real-time notification
    if (req.app.get('io')) {
      req.app.get('io').to(trip.student.toString()).emit('trip_accepted', {
        trip: await trip.populate('driver', 'firstName lastName profilePhoto phoneNumber vehicleMake vehicleModel vehicleColor licensePlate')
      });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Confirm arrival at pickup location
// @route   PUT /api/trips/:id/confirm
// @access  Private (Driver/Moto Rider)
exports.confirmTrip = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('student', 'firstName lastName profilePhoto phoneNumber')
      .populate('driver', 'firstName lastName profilePhoto vehicleDetails phoneNumber');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Verify driver is the one assigned to trip
    if (trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to confirm this trip'
      });
    }

    // Check if trip is in correct state
    if (trip.status !== 'driver_on_way' && trip.status !== 'accepted') {
      return res.status(400).json({
        success: false,
        message: 'Trip cannot be confirmed in current state'
      });
    }

    // Update trip status to driver_arrived
    trip.status = 'driver_arrived';
    await trip.save();

    // Create notification for student
    await Notification.create({
      user: trip.student._id,
      title: 'Driver Arrived',
      message: `${req.user.firstName} has arrived at the pickup location`,
      type: 'driver_arrived',
      relatedTrip: trip._id,
      relatedUser: req.user._id
    });

    // Emit socket event to student
    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${trip._id}`).emit('trip_updated', {
        trip,
        message: 'Driver has arrived at pickup location'
      });
      io.to(trip.student._id.toString()).emit('driver_arrived', {
        trip
      });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update trip status
// @route   PUT /api/trips/:id/status
// @access  Private (Driver/Moto Rider)
exports.updateTripStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    const validStatusTransitions = {
      'accepted': ['driver_on_way', 'cancelled'],
      'driver_on_way': ['driver_arrived', 'cancelled'],
      'driver_arrived': ['in_progress', 'cancelled'],
      'in_progress': ['completed']
    };

    if (!validStatusTransitions[trip.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status transition'
      });
    }

    trip.status = status;

    if (status === 'in_progress') {
      trip.startTime = new Date();
    }

    if (status === 'completed') {
      trip.endTime = new Date();
      // Calculate duration in minutes
      trip.duration = Math.round((trip.endTime - trip.startTime) / (1000 * 60));
      
      // Update driver earnings
      const fare = trip.estimatedFare || trip.actualFare || 0;
      const driver = await User.findById(req.user._id);
      
      await User.findByIdAndUpdate(req.user._id, {
        driverStatus: 'available',
        'earnings.daily': driver.earnings.daily + fare,
        'earnings.weekly': driver.earnings.weekly + fare,
        'earnings.total': driver.earnings.total + fare
      });
    }

    await trip.save();

    // Create notification for student
    const notificationMessages = {
      'driver_on_way': 'Your driver is on the way',
      'driver_arrived': 'Your driver has arrived',
      'in_progress': 'Your trip has started',
      'completed': 'Your trip has been completed'
    };

    if (notificationMessages[status]) {
      await Notification.create({
        user: trip.student,
        title: 'Trip Update',
        message: notificationMessages[status],
        type: status === 'driver_arrived' ? 'driver_arrived' : status === 'completed' ? 'trip_completed' : 'system',
        relatedTrip: trip._id
      });
    }

    // Emit real-time update
    if (req.app.get('io')) {
      req.app.get('io').to(trip.student.toString()).emit('trip_status_updated', {
        tripId: trip._id,
        status: trip.status
      });
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Cancel trip
// @route   PUT /api/trips/:id/cancel
// @access  Private
exports.cancelTrip = async (req, res) => {
  try {
    const { reason } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user is student or driver of this trip
    const isStudent = trip.student.toString() === req.user._id.toString();
    const isDriver = trip.driver.toString() === req.user._id.toString();

    if (!isStudent && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (['completed', 'cancelled'].includes(trip.status)) {
      return res.status(400).json({
        success: false,
        message: 'Trip cannot be cancelled'
      });
    }

    trip.status = 'cancelled';
    trip.cancelledBy = req.user._id;
    trip.cancellationReason = reason;
    await trip.save();

    // Update driver status to available if driver cancelled
    if (isDriver) {
      await User.findByIdAndUpdate(req.user._id, { driverStatus: 'available' });
    }

    // Notify the other party
    const notifyUserId = isStudent ? trip.driver : trip.student;
    await Notification.create({
      user: notifyUserId,
      title: 'Trip Cancelled',
      message: `Trip has been cancelled by ${req.user.firstName}`,
      type: 'ride_cancelled',
      relatedTrip: trip._id
    });

    // Emit real-time notification
    if (req.app.get('io')) {
      const io = req.app.get('io');
      // Populate cancelledBy to include user info
      await trip.populate('cancelledBy', 'firstName lastName role');
      // Emit to both the trip room and the other user's personal room
      io.to(`trip_${trip._id}`).emit('trip_cancelled', { trip });
      io.to(notifyUserId.toString()).emit('trip_cancelled', { trip });
      console.log('🚫 Emitting trip_cancelled event - Trip:', trip._id, 'Cancelled by:', req.user.role);
    }

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Rate trip
// @route   PUT /api/trips/:id/rate
// @access  Private
exports.rateTrip = async (req, res) => {
  try {
    const { rating, review } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only rate completed trips'
      });
    }

    const isStudent = trip.student.toString() === req.user._id.toString();
    const isDriver = trip.driver.toString() === req.user._id.toString();

    if (!isStudent && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (isStudent) {
      if (trip.studentRating !== undefined && trip.studentRating !== null) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this trip'
        });
      }
      console.log('💾 Saving student rating:', { tripId: trip._id, rating, review });
      trip.studentRating = rating;
      trip.studentReview = review;

      // Update driver's overall rating
      const driver = await User.findById(trip.driver);
      const newTotalRatings = driver.totalRatings + 1;
      const newRating = ((driver.rating * driver.totalRatings) + rating) / newTotalRatings;
      driver.rating = newRating;
      driver.totalRatings = newTotalRatings;
      await driver.save();
      console.log('✅ Student rating saved successfully');
    } else {
      if (trip.driverRating) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this trip'
        });
      }
      trip.driverRating = rating;
      trip.driverReview = review;

      // Update student's overall rating
      const student = await User.findById(trip.student);
      const newTotalRatings = student.totalRatings + 1;
      const newRating = ((student.rating * student.totalRatings) + rating) / newTotalRatings;
      student.rating = newRating;
      student.totalRatings = newTotalRatings;
      await student.save();
    }

    await trip.save();

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Skip rating for a trip
// @route   PUT /api/trips/:id/skip-rating
// @access  Private (Student)
exports.skipRating = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only skip rating for completed trips'
      });
    }

    const isStudent = trip.student.toString() === req.user._id.toString();

    if (!isStudent) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.studentRating !== undefined && trip.studentRating !== null) {
      return res.status(400).json({
        success: false,
        message: 'Trip already rated'
      });
    }

    console.log('⏭️ Student skipped rating for trip:', trip._id);
    // Set rating to -1 to indicate skipped (avoids validation error with 0)
    trip.studentRating = -1;
    trip.studentReview = 'Rating skipped';
    await trip.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: 'Rating skipped',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get user's trip history
// @route   GET /api/trips/history
// @access  Private
exports.getTripHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = req.user.role === 'student'
      ? { student: req.user._id }
      : { driver: req.user._id };

    const trips = await Trip.find(query)
      .populate('student', 'firstName lastName profilePhoto phoneNumber')
      .populate('driver', 'firstName lastName profilePhoto phoneNumber vehicleMake vehicleModel vehicleColor licensePlate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trip.countDocuments(query);

    res.status(200).json({
      success: true,
      trips,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get active trip
// @route   GET /api/trips/active
// @access  Private
exports.getActiveTrip = async (req, res) => {
  try {
    let query = {};

    if (req.user.role === 'student') {
      query.student = req.user._id;
      // For students, include completed trips that haven't been rated yet
      query.$or = [
        { status: { $in: ['pending', 'fare_proposed', 'accepted', 'driver_on_way', 'driver_arrived', 'in_progress'] } },
        { status: 'completed', studentRating: { $exists: false } }
      ];
    } else {
      // For drivers, include completed trips that haven't been rated yet
      query.driver = req.user._id;
      query.$or = [
        { status: { $in: ['pending', 'fare_proposed', 'accepted', 'driver_on_way', 'driver_arrived', 'in_progress'] } },
        { status: 'completed', driverRating: { $exists: false } }
      ];
    }

    const trip = await Trip.findOne(query)
      .populate('student', 'firstName lastName profilePhoto phoneNumber')
      .populate('driver', 'firstName lastName profilePhoto phoneNumber vehicleMake vehicleModel vehicleColor licensePlate currentLocation rating totalRatings')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Share trip with emergency contact
// @route   PUT /api/trips/:id/share
// @access  Private (Student)
exports.shareTrip = async (req, res) => {
  try {
    const { contacts } = req.body;
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    trip.isShared = true;
    trip.sharedWith = contacts;
    await trip.save();

    res.status(200).json({
      success: true,
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Accept proposed fare (Student)
// @route   PUT /api/trips/:id/accept-fare
// @access  Private (Student)
exports.acceptFare = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('driver student');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.status !== 'fare_proposed') {
      return res.status(400).json({
        success: false,
        message: 'No fare proposal to accept'
      });
    }

    trip.status = 'accepted';
    trip.fareStatus = 'accepted';
    trip.actualFare = trip.proposedFare;
    await trip.save();

    // Emit socket event
    const { io } = require('../server');
    io.to(`trip_${trip._id}`).emit('fare_accepted', { trip });

    res.status(200).json({
      success: true,
      message: 'Fare accepted',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Reject proposed fare (Student or Driver)
// @route   PUT /api/trips/:id/reject-fare
// @access  Private (Student/Driver)
exports.rejectFare = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('driver student');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Allow both student and driver to reject
    const isStudent = trip.student._id.toString() === req.user._id.toString();
    const isDriver = trip.driver._id.toString() === req.user._id.toString();

    if (!isStudent && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Only allow rejection if fare is being negotiated
    if (trip.status !== 'fare_proposed' && trip.fareStatus !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'No fare proposal to reject'
      });
    }

    trip.status = 'cancelled';
    trip.cancelledBy = req.user._id;
    trip.cancellationReason = 'Fare not agreed';
    await trip.save();

    // Update driver status back to available
    await User.findByIdAndUpdate(trip.driver._id, { driverStatus: 'available' });

    // Emit socket event
    if (req.app.get('io')) {
      const io = req.app.get('io');
      io.to(`trip_${trip._id}`).emit('fare_rejected', { trip });
      io.to(`trip_${trip._id}`).emit('trip_cancelled', { trip });
      console.log('🚫 Emitting trip_cancelled event for trip:', trip._id);
    }

    res.status(200).json({
      success: true,
      message: 'Fare rejected, trip cancelled',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Counter offer fare (Student)
// @route   PUT /api/trips/:id/counter-fare
// @access  Private (Student)
exports.counterFare = async (req, res) => {
  try {
    const { counterAmount } = req.body;
    const trip = await Trip.findById(req.params.id).populate('driver student');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.status !== 'fare_proposed') {
      return res.status(400).json({
        success: false,
        message: 'No fare proposal to counter'
      });
    }

    if (!counterAmount || counterAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid counter amount'
      });
    }

    trip.proposedFare = counterAmount;
    trip.fareStatus = 'negotiating';
    trip.fareHistory.push({
      amount: counterAmount,
      proposedBy: 'student',
      timestamp: new Date()
    });
    await trip.save();

    // Emit socket event
    const { io } = require('../server');
    io.to(`trip_${trip._id}`).emit('fare_counter_offered', { trip });

    res.status(200).json({
      success: true,
      message: 'Counter offer sent',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Accept counter offer (Driver)
// @route   PUT /api/trips/:id/accept-counter
// @access  Private (Driver)
exports.acceptCounterOffer = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id).populate('driver student');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.fareStatus !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'No counter offer to accept'
      });
    }

    trip.status = 'accepted';
    trip.fareStatus = 'accepted';
    trip.actualFare = trip.proposedFare;
    await trip.save();

    // Emit socket event
    const { io } = require('../server');
    io.to(`trip_${trip._id}`).emit('counter_accepted', { trip });

    res.status(200).json({
      success: true,
      message: 'Counter offer accepted',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Driver counter offer (Driver makes new counter to student's counter)
// @route   PUT /api/trips/:id/driver-counter
// @access  Private (Driver)
exports.driverCounterOffer = async (req, res) => {
  try {
    const { counterAmount } = req.body;
    const trip = await Trip.findById(req.params.id).populate('driver student');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    if (trip.driver._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (trip.fareStatus !== 'negotiating') {
      return res.status(400).json({
        success: false,
        message: 'No student counter to respond to'
      });
    }

    if (!counterAmount || counterAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid counter amount'
      });
    }

    trip.proposedFare = counterAmount;
    trip.status = 'fare_proposed';
    trip.fareStatus = 'proposed';
    trip.fareHistory.push({
      amount: counterAmount,
      proposedBy: 'driver',
      timestamp: new Date()
    });
    await trip.save();

    // Emit socket event
    const { io } = require('../server');
    io.to(`trip_${trip._id}`).emit('driver_counter_offered', { trip });

    res.status(200).json({
      success: true,
      message: 'Counter offer sent to student',
      trip
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

