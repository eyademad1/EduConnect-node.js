const express = require('express');
const router = express.Router();
const { getQuizzesByCourse, getQuizById, createQuiz, updateQuiz, deleteQuiz, submitQuiz, getStudentSubmissions, getCourseSubmissions } = require('../controllers/quizController');
const { protect, authorize } = require('../middleware/auth');

// Protected routes
router.get('/course/:courseId', protect, getQuizzesByCourse);
router.get('/:id', protect, getQuizById);

// Teacher only routes
router.post('/', protect, authorize('teacher'), createQuiz);
router.put('/:id', protect, authorize('teacher'), updateQuiz);
router.delete('/:id', protect, authorize('teacher'), deleteQuiz);

// Student only routes
router.post('/:id/submit', protect, authorize('student'), submitQuiz);
router.get('/submissions/student', protect, authorize('student'), getStudentSubmissions);

// Teacher only routes for submissions
router.get('/submissions/course/:courseId', protect, authorize('teacher'), getCourseSubmissions);

module.exports = router;