const Message = require('../models/Message');
const Trip = require('../models/Trip');

// @desc    Get messages for a trip
// @route   GET /api/messages/:tripId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Verify user is part of this trip
    if (trip.student.toString() !== req.user._id.toString() && 
        trip.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these messages'
      });
    }

    const messages = await Message.find({ trip: req.params.tripId })
      .populate('sender', 'firstName lastName profilePhoto')
      .sort({ createdAt: 1 });

    // Mark messages as read for the current user
    await Message.updateMany(
      { trip: req.params.tripId, receiver: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      messages
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

// @desc    Send a message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { tripId, message } = req.body;

    const trip = await Trip.findById(tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Verify user is part of this trip
    if (trip.student.toString() !== req.user._id.toString() && 
        trip.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send messages in this trip'
      });
    }

    // Determine receiver
    const receiver = trip.student.toString() === req.user._id.toString() 
      ? trip.driver 
      : trip.student;

    const newMessage = await Message.create({
      trip: tripId,
      sender: req.user._id,
      receiver: receiver,
      message
    });

    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName profilePhoto');

    // Emit via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.to(`trip_${tripId}`).emit('new_message', {
        message: populatedMessage
      });
    }

    res.status(201).json({
      success: true,
      message: populatedMessage
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

// @desc    Get unread message count
// @route   GET /api/messages/unread/:tripId
// @access  Private
exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({
      trip: req.params.tripId,
      receiver: req.user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      count
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
