const mongoose = require('mongoose');

const QuizSubmissionSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  answers: [
    {
      questionIndex: Number,
      selectedOptionIndex: Number
    }
  ],
  score: {
    type: Number,
    required: true
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
});

// We want to allow multiple submissions from the same student for the same quiz
// No unique index needed

module.exports = mongoose.model('QuizSubmission', QuizSubmissionSchema);