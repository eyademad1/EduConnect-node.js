const Course = require('../models/Course');
const User = require('../models/User');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getCourses = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    
    // Build query
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (category) {
      query.category = category;
    }
    
    // Execute query with pagination
    const courses = await Course.find(query)
      .populate('instructorId', 'name avatar')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const total = await Course.countDocuments(query);
    
    // Format response
    const formattedCourses = courses.map(course => ({
      id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      instructorId: course.instructorId ? course.instructorId._id : null,
      instructor: course.instructorId ? course.instructorId.name : 'Unknown Instructor',
      thumbnailUrl: course.thumbnailUrl,
      lessons: course.lessons.map(lesson => lesson._id),
      rating: course.rating,
      enrolledStudents: course.enrolledStudents,
      duration: course.duration,
      price: course.price,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));
    
    res.json({
      courses: formattedCourses,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    console.error('Get courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Public
exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructorId', 'name avatar');
    
    if (course) {
      // Format response
      const formattedCourse = {
        id: course._id,
        title: course.title,
        description: course.description,
        category: course.category,
        instructorId: course.instructorId ? course.instructorId._id : null,
        instructor: course.instructorId ? course.instructorId.name : 'Unknown Instructor',
        thumbnailUrl: course.thumbnailUrl,
        lessons: course.lessons,
        rating: course.rating,
        enrolledStudents: course.enrolledStudents,
        duration: course.duration,
        price: course.price,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt
      };
      
      res.json(formattedCourse);
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  } catch (error) {
    console.error('Get course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new course
// @route   POST /api/courses
// @access  Private (Teacher only)
exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnailUrl, lessons, duration, price } = req.body;
    
    // Create course
    const course = await Course.create({
      title,
      description,
      category,
      instructorId: req.user._id,
      thumbnailUrl: thumbnailUrl || 'https://placehold.co/600x400?text=Course+Thumbnail',
      lessons: lessons || [],
      duration: duration || '8 weeks',
      price: price || 0
    });
    
    res.status(201).json({
      id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      instructorId: course.instructorId,
      thumbnailUrl: course.thumbnailUrl,
      lessons: course.lessons,
      duration: course.duration,
      price: course.price,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    });
  } catch (error) {
    console.error('Create course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a course
// @route   PUT /api/courses/:id
// @access  Private (Teacher only)
exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the course instructor
    if (!course.instructorId || course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    // Update fields
    const { title, description, category, thumbnailUrl, lessons, duration, price } = req.body;
    
    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.thumbnailUrl = thumbnailUrl || course.thumbnailUrl;
    course.duration = duration || course.duration;
    course.price = price !== undefined ? price : course.price;
    
    // Update lessons if provided
    if (lessons && lessons.length > 0) {
      course.lessons = lessons;
    }
    
    // Save updated course
    const updatedCourse = await course.save();
    
    res.json({
      id: updatedCourse._id,
      title: updatedCourse.title,
      description: updatedCourse.description,
      category: updatedCourse.category,
      instructorId: updatedCourse.instructorId,
      thumbnailUrl: updatedCourse.thumbnailUrl,
      lessons: updatedCourse.lessons,
      duration: updatedCourse.duration,
      price: updatedCourse.price,
      createdAt: updatedCourse.createdAt,
      updatedAt: updatedCourse.updatedAt
    });
  } catch (error) {
    console.error('Update course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a course
// @route   DELETE /api/courses/:id
// @access  Private (Teacher only)
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the course instructor
    if (!course.instructorId || course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this course' });
    }
    
    await Course.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Course removed' });
  } catch (error) {
    console.error('Delete course error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Add a lesson to a course
// @route   POST /api/courses/:id/lessons
// @access  Private (Teacher only)
exports.addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Check if user is the course instructor
    if (!course.instructorId || course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }
    
    const { title, description, videoUrl, duration } = req.body;
    
    // Create new lesson
    const newLesson = {
      title,
      description,
      videoUrl,
      duration: duration || 0,
      order: course.lessons.length + 1
    };
    
    // Add lesson to course
    course.lessons.push(newLesson);
    await course.save();
    
    res.status(201).json({
      message: 'Lesson added successfully',
      lesson: course.lessons[course.lessons.length - 1]
    });
  } catch (error) {
    console.error('Add lesson error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get courses created by a teacher
// @route   GET /api/teachers/:id/courses
// @access  Private (Teacher only)
exports.getTeacherCourses = async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Verify that the requesting user is the teacher or an admin
    if (req.user._id.toString() !== teacherId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to access these courses' });
    }
    
    // Find the teacher
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find courses created by this teacher
    const courses = await Course.find({ instructorId: teacherId })
      .populate('instructorId', 'name avatar');
    
    // Format the courses data
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      category: course.category,
      instructorId: course.instructorId ? course.instructorId._id : null,
      instructor: course.instructorId ? course.instructorId.name : 'Unknown Instructor',
      thumbnailUrl: course.thumbnailUrl,
      lessons: course.lessons.map(lesson => lesson._id),
      rating: course.rating,
      enrolledStudents: course.enrolledStudents,
      duration: course.duration,
      price: course.price,
      createdAt: course.createdAt,
      updatedAt: course.updatedAt
    }));
    
    res.status(200).json({ courses: formattedCourses });
  } catch (error) {
    console.error('Get teacher courses error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};