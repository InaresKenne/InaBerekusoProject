const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  approveUser,
  toggleUserActive,
  getStatistics,
  getReports,
  updateReport,
  sendAnnouncement,
  deleteUser,
  blockUser,
  getAllEarnings,
  getAllTrips
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes require admin authorization
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.put('/users/:id/approve', approveUser);
router.put('/users/:id/toggle-active', toggleUserActive);
router.delete('/users/:id', deleteUser);
router.put('/users/:id/block', blockUser);
router.get('/statistics', getStatistics);
router.get('/trips', getAllTrips);
router.get('/earnings', getAllEarnings);
router.get('/reports', getReports);
router.put('/reports/:id', updateReport);
router.post('/announcements', sendAnnouncement);

module.exports = router;
