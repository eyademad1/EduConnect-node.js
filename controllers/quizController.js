const Quiz = require('../models/Quiz');
const Course = require('../models/Course');
const QuizSubmission = require('../models/QuizSubmission');

// @desc    Get quizzes for a course
// @route   GET /api/quizzes/course/:courseId
// @access  Private
exports.getQuizzesByCourse = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ courseId: req.params.courseId });
    
    // Format response to match frontend expectations
    const formattedQuizzes = quizzes.map(quiz => ({
      id: quiz._id,
      title: quiz.title,
      courseId: quiz.courseId,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        // Only include correct answer for teachers
        correctAnswerIndex: req.user.role === 'teacher' ? q.correctAnswerIndex : undefined
      })),
      timeLimit: quiz.timeLimit,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    }));
    
    res.json(formattedQuizzes);
  } catch (error) {
    console.error('Get quizzes error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get student quiz submissions
// @route   GET /api/quizzes/submissions/student
// @access  Private (Student only)
exports.getStudentSubmissions = async (req, res) => {
  try {
    const submissions = await QuizSubmission.find({ studentId: req.user._id })
      .populate('quizId', 'title')
      .populate('courseId', 'title')
      .sort({ completedAt: -1 });
    
    // Track the latest submission for each quiz
    const latestSubmissions = new Map();
    
    submissions.forEach(sub => {
      const key = `${sub.quizId._id}`;
      if (!latestSubmissions.has(key)) {
        latestSubmissions.set(key, sub._id.toString());
      }
    });
    
    const formattedSubmissions = submissions.map(sub => {
      const key = `${sub.quizId._id}`;
      const isLatest = latestSubmissions.get(key) === sub._id.toString();
      
      return {
        id: sub._id,
        quizId: sub.quizId._id,
        quizTitle: sub.quizId.title,
        courseId: sub.courseId._id,
        courseTitle: sub.courseId.title,
        score: sub.score,
        completedAt: sub.completedAt,
        isLatestAttempt: isLatest,
        attemptNumber: null // Will be calculated in the next step
      };
    });
    
    // Calculate attempt numbers for each quiz
    const attemptCounts = new Map();
    
    // Sort by completedAt in ascending order to count attempts chronologically
    formattedSubmissions.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
    
    formattedSubmissions.forEach(sub => {
      const key = `${sub.quizId}`;
      const currentCount = attemptCounts.get(key) || 0;
      const newCount = currentCount + 1;
      attemptCounts.set(key, newCount);
      sub.attemptNumber = newCount;
    });
    
    // Sort back by completedAt in descending order
    formattedSubmissions.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Get student submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get course quiz submissions (for teacher)
// @route   GET /api/quizzes/submissions/course/:courseId
// @access  Private (Teacher only)
exports.getCourseSubmissions = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify course exists and user is instructor
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    if (course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view these submissions' });
    }
    
    const submissions = await QuizSubmission.find({ courseId })
      .populate('quizId', 'title')
      .populate('studentId', 'name email')
      .sort({ completedAt: -1 });
    
    // Track the latest submission for each student-quiz pair
    const latestSubmissions = new Map();
    
    submissions.forEach(sub => {
      const key = `${sub.studentId._id}-${sub.quizId._id}`;
      if (!latestSubmissions.has(key)) {
        latestSubmissions.set(key, sub._id.toString());
      }
    });
    
    const formattedSubmissions = submissions.map(sub => {
      const key = `${sub.studentId._id}-${sub.quizId._id}`;
      const isLatest = latestSubmissions.get(key) === sub._id.toString();
      
      return {
        id: sub._id,
        quizId: sub.quizId._id,
        quizTitle: sub.quizId.title,
        studentId: sub.studentId._id,
        studentName: sub.studentId.name,
        studentEmail: sub.studentId.email,
        score: sub.score,
        completedAt: sub.completedAt,
        isLatestAttempt: isLatest,
        attemptNumber: null // Will be calculated in the next step
      };
    });
    
    // Calculate attempt numbers for each student-quiz pair
    const attemptCounts = new Map();
    
    // Sort by completedAt in ascending order to count attempts chronologically
    formattedSubmissions.sort((a, b) => 
      new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    );
    
    formattedSubmissions.forEach(sub => {
      const key = `${sub.studentId}-${sub.quizId}`;
      const currentCount = attemptCounts.get(key) || 0;
      const newCount = currentCount + 1;
      attemptCounts.set(key, newCount);
      sub.attemptNumber = newCount;
    });
    
    // Sort back by completedAt in descending order
    formattedSubmissions.sort((a, b) => 
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
    );
    
    res.json(formattedSubmissions);
  } catch (error) {
    console.error('Get course submissions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Private
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Format response to match frontend expectations
    const formattedQuiz = {
      id: quiz._id,
      title: quiz.title,
      courseId: quiz.courseId,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options,
        // Only include correct answer for teachers
        correctAnswerIndex: req.user.role === 'teacher' ? q.correctAnswerIndex : undefined
      })),
      timeLimit: quiz.timeLimit,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    };
    
    res.json(formattedQuiz);
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Private (Teacher only)
exports.createQuiz = async (req, res) => {
  try {
    const { title, courseId, questions, timeLimit } = req.body;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify user is the course instructor
    if (course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to create quiz for this course' });
    }
    
    // Create quiz
    const quiz = await Quiz.create({
      title,
      courseId,
      questions,
      timeLimit: timeLimit || 30
    });
    
    res.status(201).json({
      id: quiz._id,
      title: quiz.title,
      courseId: quiz.courseId,
      questions: quiz.questions,
      timeLimit: quiz.timeLimit,
      createdAt: quiz.createdAt,
      updatedAt: quiz.updatedAt
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update a quiz
// @route   PUT /api/quizzes/:id
// @access  Private (Teacher only)
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Verify course exists
    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify user is the course instructor
    if (course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this quiz' });
    }
    
    // Update fields
    const { title, questions, timeLimit } = req.body;
    
    quiz.title = title || quiz.title;
    quiz.questions = questions || quiz.questions;
    quiz.timeLimit = timeLimit || quiz.timeLimit;
    
    // Save updated quiz
    const updatedQuiz = await quiz.save();
    
    res.json({
      id: updatedQuiz._id,
      title: updatedQuiz.title,
      courseId: updatedQuiz.courseId,
      questions: updatedQuiz.questions,
      timeLimit: updatedQuiz.timeLimit,
      createdAt: updatedQuiz.createdAt,
      updatedAt: updatedQuiz.updatedAt
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Private (Teacher only)
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    // Verify course exists
    const course = await Course.findById(quiz.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Verify user is the course instructor
    if (course.instructorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this quiz' });
    }
    
    await Quiz.deleteOne({ _id: quiz._id });
    
    res.json({ message: 'Quiz removed' });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Submit quiz answers
// @route   POST /api/quizzes/:id/submit
// @access  Private (Student only)
exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    
    const { answers } = req.body;
    
    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Please provide answers array' });
    }
    
    // Calculate score
    let correctAnswers = 0;
    const formattedAnswers = [];
    
    quiz.questions.forEach((question, index) => {
      const selectedAnswer = answers[index];
      formattedAnswers.push({
        questionIndex: index,
        selectedOptionIndex: selectedAnswer
      });
      
      if (selectedAnswer === question.correctAnswerIndex) {
        correctAnswers++;
      }
    });
    
    const score = (correctAnswers / quiz.questions.length) * 100;
    
    // Create a new submission entry in the database
    await QuizSubmission.create({
      quizId: quiz._id,
      studentId: req.user._id,
      courseId: quiz.courseId,
      answers: formattedAnswers,
      score,
      completedAt: new Date()
    });
    
    res.json({
      score,
      correctAnswers,
      totalQuestions: quiz.questions.length
    });
  } catch (error) {
    console.error('Submit quiz error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};