const express = require('express');
const router = express.Router();
const { 
  recordPayment, 
  getStudentPayments, 
  getCoursePayments 
} = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

// Record payment - accessible to students
router.post('/', protect, authorize('student'), recordPayment);

// Get student payments - accessible to the student or admin
router.get('/student/:studentId', protect, getStudentPayments);

// Get course payments - accessible to the teacher or admin
router.get('/course/:courseId', protect, authorize('teacher', 'admin'), getCoursePayments);

module.exports = router;