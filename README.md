# E-Learning Backend API

This is the backend API for the E-Learning Flutter application. It provides endpoints for user authentication, course management, quiz functionality, file uploads, and real-time chat.

## Technologies Used

- Node.js
- Express.js
- MongoDB Atlas
- Socket.io for real-time chat
- JWT for authentication
- Multer for file uploads

## Setup Instructions

1. Install dependencies:
   ```
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```
   
   For development with auto-restart:
   ```
   npm run dev
   ```

3. The server will run on port 5000 and listen on all network interfaces (0.0.0.0).

## API Endpoints

### Authentication
- POST /api/users/register - Register a new user
- POST /api/users/login - Login a user

### Courses
- GET /api/courses - Get all courses
- GET /api/courses/:id - Get a specific course
- POST /api/courses - Create a new course (teacher only)
- PUT /api/courses/:id - Update a course (teacher only)
- DELETE /api/courses/:id - Delete a course (teacher only)

### Quizzes
- GET /api/quizzes/:courseId - Get quizzes for a course
- POST /api/quizzes - Create a new quiz (teacher only)
- PUT /api/quizzes/:id - Update a quiz (teacher only)
- POST /api/quizzes/:id/submit - Submit quiz answers (student only)

### Chat
- GET /api/chats/:courseId - Get chat messages for a course
- POST /api/chats - Send a new chat message

### File Upload
- POST /api/upload - Upload a file

## Real-time Features

The backend uses Socket.io for real-time chat functionality. When a user sends a message, it's broadcast to all users in the same course chat room.#   E d u C o n n e c t - n o d e . j s  
 g i t  
 i n i t  
 g i t  
 a d d  
 .  
 g i t  
 c o m m i t  
 - m  
 f i r s t   c o m m i t  
 g i t  
 b r a n c h  
 - M  
 m a i n  
 g i t  
 r e m o t e  
 a d d  
 o r i g i n  
 h t t p s : / / g i t h u b . c o m / e y a d e m a d 1 / E d u C o n n e c t - n o d e . j s . g i t  
 g i t  
 p u s h  
 - u  
 o r i g i n  
 m a i n  
 #   E d u C o n n e c t - n o d e . j s  
 