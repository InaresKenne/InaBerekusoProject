const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');

// @desc    Create a new report
// @route   POST /api/reports
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { reportedUserId, tripId, reason, description } = req.body;

    // Validate required fields
    if (!reason || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide reason and description'
      });
    }

    // Check if user is trying to report themselves
    if (reportedUserId && reportedUserId === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot report yourself'
      });
    }

    // Create report
    const report = await Report.create({
      reporter: req.user._id,
      reportedUser: reportedUserId || null,
      trip: tripId || null,
      reason,
      description
    });

    // Only notify reported user if there is one (not for general incident reports)
    if (reportedUserId) {
      await Notification.create({
        user: reportedUserId,
        title: 'New Report Submitted',
        message: `A report has been filed against you by ${req.user.firstName}`,
        type: 'admin',
        relatedTrip: tripId
      });
    }

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully',
      report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @desc    Get user's reports
// @route   GET /api/reports/my-reports
// @access  Private
router.get('/my-reports', protect, async (req, res) => {
  try {
    const reports = await Report.find({ reporter: req.user._id })
      .populate('reportedUser', 'firstName lastName role')
      .populate('trip')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
