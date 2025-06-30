const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

// Import routes
const userRoutes = require('./routes/userRoutes');
const courseRoutes = require('./routes/courseRoutes');
const quizRoutes = require('./routes/quizRoutes');
const quizAttemptRoutes = require('./routes/quizAttemptRoutes');
const chatRoutes = require('./routes/chatRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const enrollmentRoutes = require('./routes/enrollmentRoutes');

// Create Express app
const app = express();

// Create HTTP server using Express app
const server = http.createServer(app);

// Initialize Socket.IO with the HTTP server
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());

// JSON parsing middleware with error handling
app.use(express.json({ limit: '10mb' }));
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('JSON Parse Error:', err);
    return res.status(400).json({ message: 'Invalid JSON in request body' });
  }
  next();
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from the uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quizAttempts', quizAttemptRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/files', uploadRoutes);
app.use('/api/enrollments', enrollmentRoutes);

// Socket.io for real-time chat
require('./socket')(io);

// Basic route for testing
app.get('/', (req, res) => {
  res.send('E-Learning API is running');
});

// Debug route to test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working correctly' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// Start server
const PORT = process.env.PORT || 5001;

// Use server.listen for proper Socket.IO integration
server.listen(PORT, '0.0.0.0', (err) => {
  if (err) {
    console.error('Error starting server:', err);
    return;
  }
  console.log(`Server running on port ${PORT}`);
  console.log(`Server URL: http://localhost:${PORT}`);
  console.log(`API Users endpoint: http://localhost:${PORT}/api/users`);
  console.log(`Socket.IO running on the same port (${PORT})`);
});