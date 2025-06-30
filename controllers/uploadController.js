const multer = require('multer');
const path = require('path');
const fs = require('fs');
const UploadedFile = require('../models/UploadedFile');
const Course = require('../models/Course');
const User = require('../models/User');

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// File filter to only allow certain file types
const fileFilter = (req, file, cb) => {
  // Accept images, videos, PDFs, and documents
  const allowedFileTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'video/mp4', 'video/mpeg', 'video/quicktime',
    'application/pdf',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  if (allowedFileTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, videos, PDFs, and documents are allowed.'), false);
  }
};

// Set up multer upload
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max file size
  }
});

// @desc    Upload a file
// @route   POST /api/upload
// @access  Private
exports.uploadFile = (req, res) => {
  // Use multer upload middleware
  const uploadMiddleware = upload.single('file');
  
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ message: `Multer error: ${err.message}` });
      }
      // Other errors
      return res.status(400).json({ message: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    try {
      // Validate required fields
      const { courseId, userId, role, name } = req.body;
      
      if (!courseId || !userId || !role || !name) {
        // Remove the uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Missing required fields' });
      }

      // Verify course exists
      const course = await Course.findById(courseId);
      if (!course) {
        // Remove the uploaded file if course doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'Course not found' });
      }

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        // Remove the uploaded file if user doesn't exist
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Return file information
      const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      
      // Create new uploaded file record
      const uploadedFile = new UploadedFile({
        courseId,
        uploadedBy: {
          id: userId,
          name,
          role
        },
        fileUrl,
        originalName: req.file.originalname
      });

      await uploadedFile.save();
      
      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: uploadedFile._id,
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          url: fileUrl,
          courseId,
          uploadedBy: {
            id: userId,
            name,
            role
          },
          timestamp: uploadedFile.timestamp
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      // Remove the uploaded file if database operation fails
      fs.unlinkSync(req.file.path);
      return res.status(500).json({ message: 'Server error during file upload', error: error.message });
    }
  });
};

// @desc    Get files by course ID
// @route   GET /api/files/course/:courseId/files
// @access  Private
exports.getFilesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    // Find all files for this course
    const files = await UploadedFile.find({ courseId }).sort({ timestamp: -1 });
    
    res.status(200).json({
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Error fetching course files:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get files uploaded by students for a teacher
// @route   GET /api/files/teacher/:teacherId/received
// @access  Private (Teacher only)
exports.getTeacherReceivedFiles = async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Verify teacher exists
    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ message: 'Teacher not found' });
    }
    
    // Find all files uploaded by students
    const files = await UploadedFile.find({
      'uploadedBy.role': 'student'
    }).populate('courseId', 'title').sort({ timestamp: -1 });
    
    res.status(200).json({
      count: files.length,
      files
    });
  } catch (error) {
    console.error('Error fetching teacher received files:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a file
// @route   DELETE /api/files/:fileId
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find the file
    const file = await UploadedFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Extract filename from URL
    const fileUrl = file.fileUrl;
    const filename = fileUrl.substring(fileUrl.lastIndexOf('/') + 1);
    const filePath = path.join(__dirname, '../uploads', filename);
    
    // Delete file from filesystem if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Delete file record from database
    await UploadedFile.findByIdAndDelete(fileId);
    
    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};