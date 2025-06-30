const mongoose = require('mongoose');

const UploadedFileSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'Course ID is required']
  },
  uploadedBy: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    name: {
      type: String,
      required: [true, 'User name is required']
    },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: [true, 'User role is required']
    }
  },
  fileUrl: {
    type: String,
    required: [true, 'File URL is required']
  },
  originalName: {
    type: String,
    required: [true, 'Original file name is required']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UploadedFile', UploadedFileSchema);