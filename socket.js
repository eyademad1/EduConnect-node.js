const ChatMessage = require('./models/Chat');
const User = require('./models/User');

module.exports = (io) => {
  // Track active users
  const activeUsers = {};

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Handle user joining a course chat room
    socket.on('joinCourse', ({ userId, courseId }) => {
      console.log(`User ${userId} joined course chat ${courseId}`);
      
      // Add user to course room
      socket.join(`course-${courseId}`);
      
      // Track active user
      activeUsers[socket.id] = { userId, courseId };
      
      // Notify others that user has joined
      socket.to(`course-${courseId}`).emit('userJoined', { userId });
    });

    // Handle new message
    socket.on('sendMessage', async ({ senderId, courseId, content }) => {
      try {
        // Create new message in database
        const message = await ChatMessage.create({
          senderId,
          courseId,
          content,
          timestamp: new Date()
        });

        // Get sender information
        const sender = await User.findById(senderId).select('name avatar');

        // Broadcast message to all users in the course room
        io.to(`course-${courseId}`).emit('newMessage', {
          id: message._id,
          senderId,
          courseId,
          content,
          timestamp: message.timestamp,
          sender: {
            name: sender.name,
            avatar: sender.avatar
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle user leaving
    socket.on('leaveCourse', ({ courseId }) => {
      if (courseId) {
        socket.leave(`course-${courseId}`);
        console.log(`User left course chat ${courseId}`);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      const userData = activeUsers[socket.id];
      if (userData) {
        console.log(`User ${userData.userId} disconnected from course ${userData.courseId}`);
        socket.to(`course-${userData.courseId}`).emit('userLeft', { userId: userData.userId });
        delete activeUsers[socket.id];
      }
      console.log('Client disconnected:', socket.id);
    });
  });
};