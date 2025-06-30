const mongoose = require('mongoose');

const QuizAttemptSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  answers: [
    {
      questionIndex: Number,
      selectedOptionIndex: Number
    }
  ],
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

// Create an index to improve query performance
QuizAttemptSchema.index({ quizId: 1, studentId: 1, submittedAt: -1 });

module.exports = mongoose.model('QuizAttempt', QuizAttemptSchema);