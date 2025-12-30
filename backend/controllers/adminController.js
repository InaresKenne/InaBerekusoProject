const User = require('../models/User');
const Trip = require('../models/Trip');
const Report = require('../models/Report');
const Notification = require('../models/Notification');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
  try {
    const { role, isApproved, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (role) query.role = role;
    if (isApproved !== undefined) query.isApproved = isApproved === 'true';

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
      page: parseInt(page),
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

// @desc    Approve/reject driver application
// @route   PUT /api/admin/users/:id/approve
// @access  Private (Admin)
exports.approveUser = async (req, res) => {
  try {
    const { isApproved, rejectionReason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isApproved = isApproved;
    
    if (isApproved) {
      user.approvedBy = req.user._id;
      user.approvedAt = new Date();
      user.rejectionReason = undefined;
    } else {
      user.rejectionReason = rejectionReason || 'Application rejected by admin';
    }
    
    await user.save();

    // Create notification
    await Notification.create({
      user: user._id,
      title: isApproved ? 'Account Approved ✅' : 'Account Rejected ❌',
      message: isApproved
        ? 'Your account has been approved. You can now start accepting rides.'
        : `Your account application has been rejected. ${rejectionReason || 'Please contact support for more information.'}`,
      type: 'admin'
    });
    
    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(user._id.toString()).emit('account_status_updated', {
        isApproved,
        message: isApproved ? 'Account approved' : 'Account rejected'
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

// @desc    Deactivate/activate user account
// @route   PUT /api/admin/users/:id/toggle-active
// @access  Private (Admin)
exports.toggleUserActive = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

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

// @desc    Get platform statistics
// @route   GET /api/admin/statistics
// @access  Private (Admin)
exports.getStatistics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalDrivers = await User.countDocuments({ role: { $in: ['driver', 'moto_rider'] } });
    const pendingApprovals = await User.countDocuments({ 
      role: { $in: ['driver', 'moto_rider'] },
      isApproved: false
    });

    const totalTrips = await Trip.countDocuments();
    const completedTrips = await Trip.countDocuments({ status: 'completed' });
    const activeTrips = await Trip.countDocuments({ 
      status: { $in: ['accepted', 'driver_on_way', 'driver_arrived', 'in_progress'] }
    });
    const cancelledTrips = await Trip.countDocuments({ status: 'cancelled' });

    const activeDrivers = await User.countDocuments({
      role: { $in: ['driver', 'moto_rider'] },
      driverStatus: 'available'
    });

    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Calculate total earnings
    const earningsAgg = await Trip.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$actualFare' } } }
    ]);
    const totalEarnings = earningsAgg.length > 0 ? earningsAgg[0].total : 0;

    // Get recent trips
    const recentTrips = await Trip.find()
      .populate('student', 'firstName lastName')
      .populate('driver', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      statistics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          drivers: totalDrivers,
          pendingApprovals,
          activeDrivers
        },
        trips: {
          total: totalTrips,
          completed: completedTrips,
          active: activeTrips,
          cancelled: cancelledTrips
        },
        earnings: {
          total: totalEarnings
        },
        reports: {
          pending: pendingReports
        }
      },
      recentTrips
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

// @desc    Get all reports
// @route   GET /api/admin/reports
// @access  Private (Admin)
exports.getReports = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status) query.status = status;

    const reports = await Report.find(query)
      .populate('reporter', 'firstName lastName email')
      .populate('reportedUser', 'firstName lastName email role')
      .populate('trip')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Report.countDocuments(query);

    res.status(200).json({
      success: true,
      reports,
      page: parseInt(page),
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

// @desc    Update report status
// @route   PUT /api/admin/reports/:id
// @access  Private (Admin)
exports.updateReport = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    report.status = status;
    report.adminNotes = adminNotes;
    
    if (status === 'resolved' || status === 'dismissed') {
      report.resolvedBy = req.user._id;
      report.resolvedAt = new Date();
    }

    await report.save();

    res.status(200).json({
      success: true,
      report
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

// @desc    Send announcement to all users
// @route   POST /api/admin/announcements
// @access  Private (Admin)
exports.sendAnnouncement = async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;

    let query = {};
    if (targetRole && targetRole !== 'all') {
      query.role = targetRole;
    }

    const users = await User.find(query).select('_id');
    const userIds = users.map(user => user._id);

    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user: userId,
      title,
      message,
      type: 'admin'
    }));

    await Notification.insertMany(notifications);

    // Emit via Socket.IO
    if (req.app.get('io')) {
      req.app.get('io').emit('announcement', { title, message });
    }

    res.status(200).json({
      success: true,
      message: `Announcement sent to ${userIds.length} users`
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
// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow deleting admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin accounts'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
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

// @desc    Block/unblock user
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
exports.blockUser = async (req, res) => {
  try {
    const { isBlocked } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Don't allow blocking admins
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot block admin accounts'
      });
    }

    user.isActive = !isBlocked;
    await user.save();

    // Create notification
    await Notification.create({
      user: user._id,
      title: isBlocked ? 'Account Blocked' : 'Account Unblocked',
      message: isBlocked
        ? 'Your account has been blocked by an administrator.'
        : 'Your account has been unblocked. You can now access the platform.',
      type: 'admin'
    });

    res.status(200).json({
      success: true,
      message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
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

// @desc    Get all trips with ratings
// @route   GET /api/admin/trips
// @access  Private (Admin)
exports.getAllTrips = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status) {
      query.status = status;
    }

    const trips = await Trip.find(query)
      .populate('student', 'firstName lastName email phoneNumber')
      .populate('driver', 'firstName lastName email phoneNumber vehicleMake vehicleModel rating totalRatings')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalTrips = await Trip.countDocuments(query);

    res.status(200).json({
      success: true,
      trips,
      totalTrips,
      totalPages: Math.ceil(totalTrips / limit),
      currentPage: page
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

// @desc    Get all earnings summary
// @route   GET /api/admin/earnings
// @access  Private (Admin)
exports.getAllEarnings = async (req, res) => {
  try {
    const drivers = await User.find({ 
      role: { $in: ['driver', 'moto_rider'] } 
    }).select('firstName lastName email earnings vehicleMake vehicleModel');

    const totalEarnings = drivers.reduce((sum, driver) => sum + driver.earnings.total, 0);

    res.status(200).json({
      success: true,
      drivers,
      totalEarnings
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