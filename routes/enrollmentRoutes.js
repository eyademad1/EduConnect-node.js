const express = require('express');
const router = express.Router();
const { 
  createEnrollment, 
  getEnrollmentStatus, 
  getTeacherEnrollments, 
  deleteEnrollment,
  updateEnrollmentStatus
} = require('../controllers/enrollmentController');
const { protect, authorize } = require('../middleware/auth');

// Student only routes
router.post('/', protect, authorize('student'), createEnrollment);
router.get('/status', protect, authorize('student'), getEnrollmentStatus);

// Teacher only routes
router.get('/teachers/:id/enrollments', protect, authorize('teacher', 'admin'), getTeacherEnrollments);
router.delete('/:id', protect, authorize('teacher', 'admin'), deleteEnrollment);

// Update enrollment status (approve/reject)
router.put('/:id/status', protect, authorize('teacher', 'admin'), updateEnrollmentStatus);

module.exports = router;