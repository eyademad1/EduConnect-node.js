const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');
const User = require('../models/User');

// @desc    Create a new quiz attempt
// @route   POST /api/quizAttempts
// @access  Private (Student only)
exports.createQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    if (!quizId || !answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Please provide quizId and answers array' });
    }
    
    // Find the quiz to calculate score
    const quiz = await Quiz.findById(quizId);
    
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
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
    
    // Create a new quiz attempt
    const quizAttempt = await QuizAttempt.create({
      quizId: quiz._id,
      studentId: req.user._id,
      score,
      total: quiz.questions.length,
      answers: formattedAnswers,
      submittedAt: new Date()
    });
    
    res.status(201).json({
      id: quizAttempt._id,
      quizId: quizAttempt.quizId,
      studentId: quizAttempt.studentId,
      score,
      total: quiz.questions.length,
      correctAnswers,
      submittedAt: quizAttempt.submittedAt
    });
  } catch (error) {
    console.error('Error creating quiz attempt:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get quiz attempts (filtered by quizId and/or studentId)
// @route   GET /api/quizAttempts
// @access  Private
exports.getQuizAttempts = async (req, res) => {
  try {
    const { quizId, studentId } = req.query;
    const filter = {};
    
    // Apply filters if provided
    if (quizId) filter.quizId = quizId;
    
    // For students, only allow them to see their own attempts
    if (req.user.role === 'student') {
      filter.studentId = req.user._id;
    } 
    // For teachers, allow filtering by studentId if provided
    else if (req.user.role === 'teacher' && studentId) {
      filter.studentId = studentId;
    }
    
    // Get attempts sorted by submittedAt in descending order (newest first)
    const attempts = await QuizAttempt.find(filter)
      .sort({ submittedAt: -1 })
      .populate('quizId', 'title courseId')
      .populate('studentId', 'name email');
    
    // Format the response
    const formattedAttempts = await Promise.all(attempts.map(async (attempt, index) => {
      // For each unique quizId-studentId pair, calculate attempt number
      const previousAttempts = await QuizAttempt.countDocuments({
        quizId: attempt.quizId._id,
        studentId: attempt.studentId._id,
        submittedAt: { $gt: attempt.submittedAt }
      });
      
      const attemptNumber = previousAttempts + 1;
      const isLatestAttempt = previousAttempts === 0;
      
      return {
        id: attempt._id,
        quizId: attempt.quizId._id,
        quizTitle: attempt.quizId.title,
        courseId: attempt.quizId.courseId,
        studentId: attempt.studentId._id,
        studentName: attempt.studentId.name,
        studentEmail: attempt.studentId.email,
        score: attempt.score,
        total: attempt.total,
        answers: attempt.answers,
        submittedAt: attempt.submittedAt,
        attemptNumber,
        isLatestAttempt
      };
    }));
    
    res.json(formattedAttempts);
  } catch (error) {
    console.error('Error getting quiz attempts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};