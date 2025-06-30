const ChatMessage = require('../models/Chat');
const Course = require('../models/Course');

// @desc    Get chat messages for a course
// @route   GET /api/chats/:courseId
// @access  Private
exports.getChatMessages = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Get messages for the course
    const messages = await ChatMessage.find({ courseId })
      .populate('senderId', 'name avatar role')
      .sort({ timestamp: -1 })
      .limit(50); // Limit to last 50 messages
    
    // Format response
    const formattedMessages = messages.map(message => ({
      id: message._id,
      senderId: message.senderId._id,
      courseId: message.courseId,
      content: message.content,
      timestamp: message.timestamp,
      sender: {
        name: message.senderId.name,
        avatar: message.senderId.avatar,
        role: message.senderId.role
      }
    }));
    
    res.json(formattedMessages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a chat message
// @route   DELETE /api/chats/:messageId
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const messageId = req.params.messageId;
    
    // Find the message
    const message = await ChatMessage.findById(messageId);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Check if user is authorized to delete the message
    // Allow if user is the sender or a teacher
    if (message.senderId.toString() !== req.user._id.toString() && req.user.role !== 'teacher') {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    // Delete the message
    await message.remove();
    
    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a chat message
// @route   POST /api/chats
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { courseId, content } = req.body;
    
    if (!courseId || !content) {
      return res.status(400).json({ message: 'Course ID and content are required' });
    }
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Create message
    const message = await ChatMessage.create({
      senderId: req.user._id,
      courseId,
      content,
      timestamp: new Date()
    });
    
    // Populate sender info
    await message.populate('senderId', 'name avatar role');
    
    // Format response
    const formattedMessage = {
      id: message._id,
      senderId: message.senderId._id,
      courseId: message.courseId,
      content: message.content,
      timestamp: message.timestamp,
      sender: {
        name: message.senderId.name,
        avatar: message.senderId.avatar,
        role: message.senderId.role
      }
    };
    
    res.status(201).json(formattedMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};