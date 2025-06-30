const express = require('express');
const router = express.Router();
const { createQuizAttempt, getQuizAttempts } = require('../controllers/quizAttemptController');
const { protect, authorize } = require('../middleware/auth');

// Create a new quiz attempt
router.post('/', protect, authorize('student'), createQuizAttempt);

// Get quiz attempts (filtered by quizId and/or studentId)
router.get('/', protect, getQuizAttempts);

module.exports = router;