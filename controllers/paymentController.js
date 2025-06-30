const Payment = require('../models/Payment');
const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Record a new payment
// @route   POST /api/payments
// @access  Private (Student only)
exports.recordPayment = async (req, res) => {
  try {
    const { studentId, courseId, amount, paymentDate, status } = req.body;
    
    // Validate required fields
    if (!studentId || !courseId || !amount) {
      return res.status(400).json({ message: 'Please provide studentId, courseId, and amount' });
    }
    
    // Verify student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Create payment record
    const payment = await Payment.create({
      studentId,
      courseId,
      amount,
      paymentDate: paymentDate || new Date(),
      status: status || 'success'
    });
    
    res.status(201).json({ message: 'Payment recorded successfully', payment });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get payments by student
// @route   GET /api/payments/student/:studentId
// @access  Private (Student or Admin)
exports.getStudentPayments = async (req, res) => {
  try {
    const studentId = req.params.studentId;
    
    const payments = await Payment.find({ studentId })
      .populate('courseId', 'title thumbnail price')
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching student payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get payments by course
// @route   GET /api/payments/course/:courseId
// @access  Private (Teacher or Admin)
exports.getCoursePayments = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    const payments = await Payment.find({ courseId })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json(payments);
  } catch (error) {
    console.error('Error fetching course payments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};