const express = require('express');
const router = express.Router();
const { 
  uploadFile, 
  getFilesByCourse, 
  getTeacherReceivedFiles, 
  deleteFile 
} = require('../controllers/uploadController');
const { protect, authorize } = require('../middleware/auth');

// File upload routes
router.post('/upload', protect, uploadFile);

// Get files by course ID
router.get('/course/:courseId/files', protect, getFilesByCourse);

// Get files received by teacher
router.get('/teacher/:teacherId/received', protect, authorize('teacher'), getTeacherReceivedFiles);

// Delete file
router.delete('/:fileId', protect, deleteFile);

module.exports = router;