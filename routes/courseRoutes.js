const express = require('express');
const router = express.Router();
const { getCourses, getCourseById, createCourse, updateCourse, deleteCourse, addLesson, getTeacherCourses } = require('../controllers/courseController');
const { getCourseEnrollments } = require('../controllers/enrollmentController');
const { getChatMessages, sendMessage } = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getCourses);
router.get('/:id', getCourseById);

// Teacher only routes
router.post('/', protect, authorize('teacher'), createCourse);
router.put('/:id', protect, authorize('teacher'), updateCourse);
router.delete('/:id', protect, authorize('teacher'), deleteCourse);
router.post('/:id/lessons', protect, authorize('teacher'), addLesson);

// Course enrollments route
router.get('/:id/enrollments', protect, authorize('teacher', 'admin'), getCourseEnrollments);

// Remove the previous teacher courses route and add a new one
// This will be accessible at /api/courses/teacher-courses/:id
router.get('/teacher-courses/:id', protect, authorize('teacher', 'admin'), getTeacherCourses);

// Course chat routes
router.get('/:courseId/chat', protect, getChatMessages);
router.post('/:courseId/chat', protect, sendMessage);

module.exports = router;