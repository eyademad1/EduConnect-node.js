const express = require('express');
const router = express.Router();
const { getChatMessages, sendMessage, deleteMessage } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Protected routes
router.get('/:courseId', protect, getChatMessages);
router.post('/', protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;