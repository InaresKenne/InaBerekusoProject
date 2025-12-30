const User = require('../models/User');
const Trip = require('../models/Trip');
const { cloudinary, uploadToCloudinary } = require('../config/cloudinary');

// @desc    Update driver/rider status
// @route   PUT /api/drivers/status
// @access  Private (Driver/Moto Rider)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['available', 'busy', 'offline'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { driverStatus: status },
      { new: true }
    );

    // Emit status change via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('driver_status_changed', {
        driverId: user._id,
        status: user.driverStatus
      });
    }

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
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

// @desc    Update driver location
// @route   PUT /api/drivers/location
// @access  Private (Driver/Moto Rider)
exports.updateLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        currentLocation: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      },
      { new: true }
    );

    // Emit location update via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('driver_location_updated', {
        driverId: user._id,
        location: { latitude, longitude }
      });
    }

    res.status(200).json({
      success: true,
      location: { latitude, longitude }
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

// @desc    Upload vehicle photo
// @route   POST /api/drivers/vehicle-photo
// @access  Private (Driver/Moto Rider)
exports.uploadVehiclePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'inaberekuso/vehicles');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { vehiclePhoto: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      vehiclePhoto: user.vehiclePhoto
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

// @desc    Upload profile photo
// @route   POST /api/drivers/profile-photo
// @access  Private
exports.uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'inaberekuso/profiles');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePhoto: result.secure_url },
      { new: true }
    );

    res.status(200).json({
      success: true,
      profilePhoto: user.profilePhoto
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

// @desc    Update vehicle details
// @route   PUT /api/drivers/vehicle
// @access  Private (Driver/Moto Rider)
exports.updateVehicleDetails = async (req, res) => {
  try {
    const { vehicleMake, vehicleModel, vehicleColor, licensePlate } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        vehicleMake,
        vehicleModel,
        vehicleColor,
        licensePlate
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
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

// @desc    Get all available drivers
// @route   GET /api/drivers/available
// @access  Private (Student)
exports.getAvailableDrivers = async (req, res) => {
  try {
    const { latitude, longitude, maxDistance = 10 } = req.query;

    let query = {
      role: { $in: ['driver', 'moto_rider'] },
      isApproved: true,
      isActive: true,
      driverStatus: { $in: ['available', 'busy'] }
    };

    // If location is provided, find nearby drivers
    if (latitude && longitude) {
      query.currentLocation = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      };
    }

    const drivers = await User.find(query)
      .select('-password -verificationToken -resetPasswordToken');

    res.status(200).json({
      success: true,
      count: drivers.length,
      drivers
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

// @desc    Get driver details
// @route   GET /api/drivers/:id
// @access  Private
exports.getDriverDetails = async (req, res) => {
  try {
    const driver = await User.findById(req.params.id)
      .select('-password -verificationToken -resetPasswordToken');

    if (!driver || !['driver', 'moto_rider'].includes(driver.role)) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Get driver's trip statistics
    const completedTrips = await Trip.countDocuments({
      driver: driver._id,
      status: 'completed'
    });

    res.status(200).json({
      success: true,
      driver: {
        ...driver.toObject(),
        completedTrips
      }
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

// @desc    Get driver earnings
// @route   GET /api/drivers/earnings
// @access  Private (Driver/Moto Rider)
exports.getEarnings = async (req, res) => {
  try {
    const driver = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      earnings: driver.earnings
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

// @desc    Get driver trip history
// @route   GET /api/drivers/trips
// @access  Private (Driver/Moto Rider)
exports.getDriverTrips = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const trips = await Trip.find({ driver: req.user._id })
      .populate('student', 'firstName lastName profilePhoto phoneNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trip.countDocuments({ driver: req.user._id });

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
