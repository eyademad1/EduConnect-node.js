const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Please provide a message'],
    trim: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Virtual for sender information
ChatMessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true
});

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);