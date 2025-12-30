const express = require('express');
const router = express.Router();
const {
  getMessages,
  sendMessage,
  getUnreadCount
} = require('../controllers/messageController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:tripId', getMessages);
router.post('/', sendMessage);
router.get('/unread/:tripId', getUnreadCount);

module.exports = router;
