const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Please provide a question']
  },
  options: {
    type: [String],
    required: [true, 'Please provide options'],
    validate: {
      validator: function(v) {
        return v.length >= 2; // At least 2 options
      },
      message: 'A question must have at least 2 options'
    }
  },
  correctAnswerIndex: {
    type: Number,
    required: [true, 'Please provide the correct answer index']
  }
});

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a quiz title'],
    trim: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  questions: {
    type: [QuestionSchema],
    required: [true, 'Please provide at least one question'],
    validate: {
      validator: function(v) {
        return v.length > 0;
      },
      message: 'A quiz must have at least one question'
    }
  },
  timeLimit: {
    type: Number, // in minutes
    default: 30
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field
QuizSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Quiz', QuizSchema);