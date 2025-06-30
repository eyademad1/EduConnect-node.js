const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Course = require('./models/Course');
const Quiz = require('./models/Quiz');
const ChatMessage = require('./models/Chat');

// MongoDB Connection
mongoose.connect('mongodb+srv://finalproject:graduation@cluster0.xcbretq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB Connected for seeding'))
.catch(err => console.log('MongoDB Connection Error:', err));

// Sample data
const users = [
  {
    name: 'Teacher Demo',
    email: 'teacher@example.com',
    password: 'password123',
    role: 'teacher',
    avatar: 'https://ui-avatars.com/api/?name=Teacher+Demo&background=random'
  },
  {
    name: 'Student Demo',
    email: 'student@example.com',
    password: 'password123',
    role: 'student',
    avatar: 'https://ui-avatars.com/api/?name=Student+Demo&background=random'
  }
];

const courses = [
  {
    title: 'Introduction to Programming',
    description: 'Learn the basics of programming with this introductory course.',
    category: 'Programming',
    thumbnailUrl: 'https://placehold.co/600x400?text=Programming+Course',
    lessons: [
      {
        title: 'Getting Started with Programming',
        description: 'An introduction to programming concepts.',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 10,
        order: 1
      },
      {
        title: 'Variables and Data Types',
        description: 'Learn about variables and data types in programming.',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 15,
        order: 2
      }
    ],
    duration: '4 weeks',
    price: 0
  },
  {
    title: 'Web Development Fundamentals',
    description: 'Master the basics of web development with HTML, CSS, and JavaScript.',
    category: 'Programming',
    thumbnailUrl: 'https://placehold.co/600x400?text=Web+Development',
    lessons: [
      {
        title: 'HTML Basics',
        description: 'Learn the fundamentals of HTML.',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 20,
        order: 1
      },
      {
        title: 'CSS Styling',
        description: 'Learn how to style web pages with CSS.',
        videoUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        duration: 25,
        order: 2
      }
    ],
    duration: '6 weeks',
    price: 29.99
  }
];

const quizzes = [
  {
    title: 'Programming Basics Quiz',
    questions: [
      {
        question: 'What is a variable?',
        options: [
          'A container for storing data values',
          'A type of function',
          'A programming language',
          'A hardware component'
        ],
        correctAnswerIndex: 0
      },
      {
        question: 'Which of the following is not a data type?',
        options: [
          'String',
          'Boolean',
          'Float',
          'Database'
        ],
        correctAnswerIndex: 3
      }
    ],
    timeLimit: 15
  },
  {
    title: 'HTML Fundamentals Quiz',
    questions: [
      {
        question: 'What does HTML stand for?',
        options: [
          'Hyper Text Markup Language',
          'High Tech Modern Language',
          'Hyper Transfer Markup Language',
          'Home Tool Markup Language'
        ],
        correctAnswerIndex: 0
      },
      {
        question: 'Which tag is used to create a hyperlink?',
        options: [
          '<link>',
          '<a>',
          '<href>',
          '<url>'
        ],
        correctAnswerIndex: 1
      }
    ],
    timeLimit: 10
  }
];

// Seed function
async function seedDatabase() {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Quiz.deleteMany({});
    await ChatMessage.deleteMany({});
    
    console.log('Previous data cleared');
    
    // Create users
    const createdUsers = [];
    for (const user of users) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      const newUser = await User.create({
        ...user,
        password: hashedPassword
      });
      
      createdUsers.push(newUser);
    }
    
    console.log(`${createdUsers.length} users created`);
    
    // Create courses with teacher as instructor
    const teacherId = createdUsers.find(user => user.role === 'teacher')._id;
    const createdCourses = [];
    
    for (const course of courses) {
      const newCourse = await Course.create({
        ...course,
        instructorId: teacherId
      });
      
      createdCourses.push(newCourse);
    }
    
    console.log(`${createdCourses.length} courses created`);
    
    // Create quizzes
    const createdQuizzes = [];
    
    for (let i = 0; i < quizzes.length; i++) {
      const newQuiz = await Quiz.create({
        ...quizzes[i],
        courseId: createdCourses[i]._id
      });
      
      createdQuizzes.push(newQuiz);
    }
    
    console.log(`${createdQuizzes.length} quizzes created`);
    
    // Enroll student in first course
    const student = createdUsers.find(user => user.role === 'student');
    student.enrolledCourses.push(createdCourses[0]._id);
    await student.save();
    
    console.log('Student enrolled in course');
    
    // Create sample chat messages
    const chatMessage = await ChatMessage.create({
      senderId: student._id,
      courseId: createdCourses[0]._id,
      content: 'Hello! I have a question about the first lesson.',
      timestamp: new Date()
    });
    
    console.log('Sample chat message created');
    
    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase();