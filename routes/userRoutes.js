const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, updateUserProfile, enrollCourse, getUsers } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getUsers);
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);

// Student only routes
router.post('/enroll/:courseId', protect, authorize('student'), enrollCourse);

module.exports = router;