const User = require('../models/User');
const Course = require('../models/Course');

// @desc    Create a new enrollment
// @route   POST /api/enrollments
// @access  Private (Student only)
exports.createEnrollment = async (req, res) => {
  try {
    console.log('Enrollment request body:', req.body);
    console.log('Request headers:', req.headers);
    console.log('Decoded ID from token:', req.user._id);
    console.log('Sent ID in request body:', req.body.studentId);
    
    // Check if the request body is empty or not properly parsed
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: 'Empty request body or invalid JSON format' });
    }
    
    const { courseId } = req.body;
    // Use the authenticated user's ID from the JWT token instead of the studentId from the request body
    const studentId = req.user._id;
    
    // Validate request body
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check if student exists - this should always be true since we're using the authenticated user
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Role check is handled by the authorize middleware in the route
    // We can skip the role check here
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Check if an enrollment already exists
    const existingEnrollment = await Enrollment.findOne({
      studentId,
      courseId
    });
    
    if (existingEnrollment) {
      return res.status(400).json({ 
        message: `Already have an enrollment with status: ${existingEnrollment.status}` 
      });
    }
    
    // Create a new enrollment with 'pending' status
    const enrollment = new Enrollment({
      studentId,
      courseId,
      status: 'pending'
    });
    
    await enrollment.save();
    
    res.status(201).json({ message: 'Enrollment request submitted successfully', enrollment });
  } catch (error) {
    console.error('Enrollment error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check enrollment status for a student in a course
// @route   GET /api/enrollments/status
// @access  Private (Student only)
exports.getEnrollmentStatus = async (req, res) => {
  try {
    const { courseId } = req.query;
    const studentId = req.user._id;
    
    // Validate request parameters
    if (!courseId) {
      return res.status(400).json({ message: 'Course ID is required' });
    }
    
    // Check if student exists
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Check if an enrollment exists and get its status
    const enrollment = await Enrollment.findOne({
      studentId,
      courseId
    });
    
    if (enrollment) {
      return res.status(200).json({ status: enrollment.status });
    } else {
      // For backward compatibility, also check the old enrollment method
      const isEnrolled = student.enrolledCourses.includes(courseId);
      if (isEnrolled) {
        // Create a new enrollment record with 'accepted' status for existing enrollments
        const newEnrollment = new Enrollment({
          studentId,
          courseId,
          status: 'accepted'
        });
        await newEnrollment.save();
        return res.status(200).json({ status: 'accepted' });
      }
      return res.status(200).json({ status: 'not_enrolled' });
    }
  } catch (error) {
    console.error('Get enrollment status error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get enrollments for a teacher
// @route   GET /api/teachers/:id/enrollments
// @access  Private (Teacher only)
exports.getTeacherEnrollments = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Verify that the requesting user is the teacher or an admin
    if (req.user._id.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access these enrollments' });
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find courses created by this teacher
    const courses = await Course.find({ instructorId: teacherId });
    const courseIds = courses.map(course => course._id);
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Find all enrollments for courses taught by this teacher
    const enrollmentRecords = await Enrollment.find({
      courseId: { $in: courseIds }
    }).populate('studentId', 'name email');
    
    // Format the enrollment data
    const enrollments = [];
    for (const enrollment of enrollmentRecords) {
      const course = courses.find(c => c._id.toString() === enrollment.courseId.toString());
      const student = enrollment.studentId;
      
      if (student && course) {
        enrollments.push({
          _id: `${student._id}_${enrollment.courseId}`, // Create a unique ID for the enrollment
          courseId: {
            _id: enrollment.courseId,
            title: course.title || 'Unknown Course'
          },
          studentId: {
            _id: student._id,
            firstName: student.name.split(' ')[0] || '',
            lastName: student.name.split(' ').slice(1).join(' ') || '',
            email: student.email
          },
          status: enrollment.status,
          createdAt: enrollment.createdAt
        });
      }
    }
    
    // For backward compatibility, also check the old enrollment method
    const students = await User.find({ 
      enrolledCourses: { $in: courseIds },
      role: 'student'
    });
    
    for (const student of students) {
      for (const courseId of student.enrolledCourses) {
        // Only include enrollments for courses taught by this teacher
        if (courseIds.some(id => id.toString() === courseId.toString())) {
          // Check if this enrollment is already in the list
          const existingEnrollment = enrollments.find(e => 
            e.studentId._id.toString() === student._id.toString() && 
            e.courseId._id.toString() === courseId.toString()
          );
          
          if (!existingEnrollment) {
            const course = courses.find(c => c._id.toString() === courseId.toString());
            
            // Create a new enrollment record with 'accepted' status for existing enrollments
            const newEnrollment = new Enrollment({
              studentId: student._id,
              courseId,
              status: 'accepted'
            });
            await newEnrollment.save();
            
            enrollments.push({
              _id: `${student._id}_${courseId}`,
              courseId: {
                _id: courseId,
                title: course ? course.title : 'Unknown Course'
              },
              studentId: {
                _id: student._id,
                firstName: student.name.split(' ')[0] || '',
                lastName: student.name.split(' ').slice(1).join(' ') || '',
                email: student.email
              },
              status: 'accepted',
              createdAt: newEnrollment.createdAt
            });
          }
        }
      }
    }
    
    res.status(200).json({ enrollments });
  } catch (error) {
    console.error('Get teacher enrollments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get enrollments for a specific course
// @route   GET /api/courses/:id/enrollments
// @access  Private (Teacher only)
exports.getCourseEnrollments = async (req, res) => {
  try {
    const courseId = req.params.id;
    const status = req.query.status; // Optional status filter
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify that the requesting user is the teacher of this course or an admin
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to access these enrollments' });
    }
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Build the query
    const query = { courseId };
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      query.status = status;
    }
    
    // Find all enrollments for this course
    const enrollmentRecords = await Enrollment.find(query)
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    
    // Format the enrollment data
    const enrollments = [];
    for (const enrollment of enrollmentRecords) {
      const student = enrollment.studentId;
      
      if (student) {
        enrollments.push({
          _id: `${student._id}_${courseId}`, // Create a unique ID for the enrollment
          courseId: {
            _id: courseId,
            title: course.title
          },
          studentId: {
            _id: student._id,
            firstName: student.name.split(' ')[0] || '',
            lastName: student.name.split(' ').slice(1).join(' ') || '',
            email: student.email
          },
          status: enrollment.status,
          createdAt: enrollment.createdAt
        });
      }
    }
    
    // For backward compatibility, also check the old enrollment method
    if (!status || status === 'accepted') {
      const students = await User.find({ 
        enrolledCourses: courseId,
        role: 'student'
      });
      
      for (const student of students) {
        // Check if this enrollment is already in the list
        const existingEnrollment = enrollments.find(e => 
          e.studentId._id.toString() === student._id.toString()
        );
        
        if (!existingEnrollment) {
          // Create a new enrollment record with 'accepted' status for existing enrollments
          const newEnrollment = new Enrollment({
            studentId: student._id,
            courseId,
            status: 'accepted'
          });
          await newEnrollment.save();
          
          enrollments.push({
            _id: `${student._id}_${courseId}`,
            courseId: {
              _id: courseId,
              title: course.title
            },
            studentId: {
              _id: student._id,
              firstName: student.name.split(' ')[0] || '',
              lastName: student.name.split(' ').slice(1).join(' ') || '',
              email: student.email
            },
            status: 'accepted',
            createdAt: newEnrollment.createdAt
          });
        }
      }
    }
    
    res.status(200).json({ enrollments });
  } catch (error) {
    console.error('Get course enrollments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete an enrollment
// @route   DELETE /api/enrollments/:id
// @access  Private (Teacher or Admin only)
exports.deleteEnrollment = async (req, res) => {
  try {
    // Parse the composite ID (studentId_courseId)
    const [studentId, courseId] = req.params.id.split('_');
    
    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'Invalid enrollment ID format' });
    }
    
    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify that the requesting user is the teacher of this course or an admin
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this enrollment' });
    }
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Delete the enrollment record if it exists
    await Enrollment.findOneAndDelete({ studentId, courseId });
    
    // Also remove the course from the student's enrolledCourses array (for backward compatibility)
    student.enrolledCourses = student.enrolledCourses.filter(
      id => id.toString() !== courseId
    );
    
    await student.save();
    
    res.status(200).json({ message: 'Enrollment deleted successfully' });
  } catch (error) {
    console.error('Error deleting enrollment:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update enrollment status (approve/reject)
// @route   PUT /api/enrollments/:id/status
// @access  Private (Teacher or Admin only)
exports.updateEnrollmentStatus = async (req, res) => {
  try {
    // Parse the composite ID (studentId_courseId)
    const [studentId, courseId] = req.params.id.split('_');
    
    if (!studentId || !courseId) {
      return res.status(400).json({ message: 'Invalid enrollment ID format' });
    }
    
    // Validate the status
    const { status } = req.body;
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
    }
    
    // Find the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify that the requesting user is the teacher of this course or an admin
    if (req.user.role !== 'admin' && course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this enrollment' });
    }
    
    // Find the student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    // Import the Enrollment model
    const Enrollment = require('../models/Enrollment');
    
    // Find the enrollment
    const enrollment = await Enrollment.findOne({ studentId, courseId });
    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' });
    }
    
    // Update the enrollment status
    enrollment.status = status;
    await enrollment.save();
    
    // If the enrollment is accepted, add the course to the student's enrolledCourses array if not already there
    if (status === 'accepted' && !student.enrolledCourses.includes(courseId)) {
      student.enrolledCourses.push(courseId);
      await student.save();
    }
    
    // If the enrollment is rejected, remove the course from the student's enrolledCourses array
    if (status === 'rejected') {
      student.enrolledCourses = student.enrolledCourses.filter(
        id => id.toString() !== courseId
      );
      await student.save();
    }
    
    res.status(200).json({ 
      message: `Enrollment ${status === 'accepted' ? 'approved' : 'rejected'} successfully`,
      enrollment: {
        _id: `${studentId}_${courseId}`,
        status: enrollment.status
      }
    });
  } catch (error) {
    console.error('Error updating enrollment status:', error);
    res.status(500).json({ message: 'Server error' });
  }
};