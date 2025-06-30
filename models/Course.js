const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a lesson title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a lesson description']
  },
  videoUrl: {
    type: String,
    required: [true, 'Please provide a video URL']
  },
  duration: {
    type: Number,
    default: 0
  },
  order: {
    type: Number,
    required: true
  }
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a course title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a course description']
  },
  category: {
    type: String,
    required: [true, 'Please provide a category'],
    enum: ['Programming', 'Design', 'Business', 'Marketing', 'Science', 'Mathematics', 'Language', 'Other', 'Math', 'History', 'Art', 'Literature', 'Photography', 'Health', 'Technology', 'Engineering', 'Physics', 'Chemistry', 'Biology', 'Psychology', 'Economics', 'Finance', 'Languages']
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnailUrl: {
    type: String,
    default: 'https://placehold.co/600x400?text=Course+Thumbnail'
  },
  lessons: [LessonSchema],
  rating: {
    type: Number,
    default: 0
  },
  enrolledStudents: {
    type: Number,
    default: 0
  },
  duration: {
    type: String,
    default: '0 weeks'
  },
  price: {
    type: Number,
    default: 0
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

// Virtual for instructor name
CourseSchema.virtual('instructor', {
  ref: 'User',
  localField: 'instructorId',
  foreignField: '_id',
  justOne: true
});

// Middleware to update the updatedAt field
CourseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', CourseSchema);