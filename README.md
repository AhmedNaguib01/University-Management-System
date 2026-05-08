# EduVerse - University Management System

A comprehensive full-stack university management system built with the MERN stack (MongoDB, Express.js, React, Node.js). EduVerse provides a modern platform for managing courses, facilitating communication between students and instructors, and tracking academic engagement.

## 🌟 Features

### 👤 User Management
- **Authentication & Authorization**
  - User registration and login with JWT authentication
  - Role-based access control (Student/Instructor)
  - Password reset via email with secure token generation
  - Session management with 24-hour token expiration
  
- **User Profiles**
  - Customizable profile with avatar/profile picture
  - View enrolled courses (students) or teaching courses (instructors)
  - User level/year information
  - Profile viewing for other users

### 📚 Course Management
- **Course Operations**
  - Create, update, and delete courses (instructors only)
  - Course enrollment and unenrollment
  - Course capacity management with enrollment limits
  - Multiple instructors per course support
  - Course details including credit hours, description, and capacity
  - Support for special characters in course IDs (e.g., CSE342:1)

- **Course Content**
  - File upload and management (PDF, Word, Images)
  - File size limit: 10MB per file
  - Download course materials
  - Drag-and-drop file upload support
  - File deletion (instructors only)

### 💬 Social & Communication Features
- **Posts & Discussions**
  - Create posts within courses (instructors)
  - Three post types:
    - **Discussion**: General course discussions
    - **Announcement**: Important course announcements with optional deadlines
    - **Question**: Q&A posts for student queries
  - Rich text content with image attachments
  - Post filtering by type and course

- **Engagement**
  - Comment on posts with real-time updates
  - Five reaction types: Like, Love, Laugh, Shocked, Sad
  - View post details with full comment threads
  - Relative timestamps (e.g., "2 hours ago")

- **Direct Messaging**
  - One-on-one chat between users
  - Message attachments support
  - Reply to specific messages
  - Real-time chat updates
  - Last message preview in chat list

### 📊 Analytics & Reporting (Instructors Only)
- **Report 1: Top Contributors Leaderboard**
  - Ranks instructors by engagement score
  - Weighted scoring: Posts (3x), Comments (2x), Reactions (1x)
  - Includes engagement received on their posts
  - Top 5 contributors display

- **Report 2: Course Engagement Analytics**
  - Total posts, comments, and reactions per course
  - Average engagement metrics
  - Course-by-course breakdown
  - Identifies most active courses

- **Report 3: Reaction Distribution Analysis**
  - Breakdown of reaction types across all posts
  - Percentage distribution of each reaction type
  - Visual insights into community sentiment

- **Report 4: Instructor Course Performance**
  - Individual instructor performance metrics
  - Courses taught and student enrollment numbers
  - Engagement statistics per instructor
  - Performance comparison across instructors

### 🎨 User Interface
- **Modern Design**
  - Clean, responsive interface built with React
  - Dark mode support
  - Radix UI components for accessibility
  - Lucide React icons
  - Toast notifications for user feedback
  - Loading states and error handling

- **Navigation**
  - Intuitive navbar with quick access to all features
  - Protected routes for authenticated users
  - Breadcrumb navigation
  - Back navigation support

## 🛠️ Technology Stack

### Frontend
- **React 19.2.0** - UI library
- **React Router DOM 7.9.6** - Client-side routing
- **Axios 1.13.2** - HTTP client
- **TanStack React Query 5.90.11** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Sonner** - Toast notifications
- **Class Variance Authority** - CSS utility management

### Backend
- **Node.js** - Runtime environment
- **Express 5.1.0** - Web framework
- **MongoDB 7.2.0** - Database
- **Mongoose 9.6.1** - ODM for MongoDB
- **JWT (jsonwebtoken 9.0.2)** - Authentication
- **Bcrypt 6.0.0** - Password hashing
- **Multer 2.0.2** - File upload handling
- **Nodemailer 7.0.11** - Email service
- **CORS** - Cross-origin resource sharing
- **Crypto** - Token generation for password reset

## 📁 Project Structure

```
University-Management-System/
├── client/                      # Frontend React application
│   ├── public/                  # Static assets
│   │   ├── eduverse-logo.svg
│   │   ├── favicon.ico
│   │   └── service-worker.js
│   └── src/
│       ├── api/                 # API client functions
│       │   ├── auth.js
│       │   ├── chats.js
│       │   ├── client.js
│       │   ├── comments.js
│       │   ├── courses.js
│       │   ├── files.js
│       │   ├── messages.js
│       │   ├── posts.js
│       │   ├── reactions.js
│       │   ├── session.js
│       │   └── users.js
│       ├── components/          # Reusable components
│       │   ├── common/
│       │   │   ├── EmptyState.jsx
│       │   │   └── LoadingSpinner.jsx
│       │   ├── ui/              # UI component library
│       │   │   ├── button.jsx
│       │   │   ├── display.jsx
│       │   │   ├── feedback.jsx
│       │   │   ├── form-elements.jsx
│       │   │   └── overlay.jsx
│       │   └── Navbar.jsx
│       ├── pages/               # Page components
│       │   ├── Auth.jsx
│       │   ├── Chats.jsx
│       │   ├── CourseDetails.jsx
│       │   ├── Courses.jsx
│       │   ├── ForgotPassword.jsx
│       │   ├── Home.jsx
│       │   ├── InstructorReport.jsx
│       │   ├── InstructorReport2.jsx
│       │   ├── InstructorReport3.jsx
│       │   ├── InstructorReport4.jsx
│       │   ├── PostDetail.jsx
│       │   ├── Profile.jsx
│       │   └── ResetPassword.jsx
│       ├── hooks/               # Custom React hooks
│       │   ├── index.js
│       │   └── useDarkMode.js
│       ├── lib/                 # Utility functions
│       │   └── utils.js
│       ├── styles/              # CSS stylesheets
│       ├── constants/           # App constants
│       ├── App.js
│       └── index.js
│
└── server/                      # Backend Node.js application
    ├── database/
    │   └── connection.js        # MongoDB connection
    ├── models/                  # Mongoose schemas
    │   ├── Chat.js
    │   ├── Comment.js
    │   ├── Course.js
    │   ├── File.js
    │   ├── Message.js
    │   ├── Post.js
    │   ├── Reaction.js
    │   └── User.js
    ├── routes/                  # API routes
    │   ├── chats.js
    │   ├── comments.js
    │   ├── courses.js
    │   ├── files.js
    │   ├── messages.js
    │   ├── posts.js
    │   ├── reactions.js
    │   └── users.js
    ├── services/                # Business logic
    │   ├── auth.js
    │   ├── chat.js
    │   ├── comment.js
    │   ├── course.js
    │   ├── email.js
    │   ├── file.js
    │   ├── message.js
    │   ├── post.js
    │   ├── reaction.js
    │   ├── report.js
    │   └── user.js
    ├── middleware/
    │   └── auth.js              # JWT authentication middleware
    ├── dummy-data/              # Seed data and aggregation pipelines
    │   ├── aggregation-pipelines.js
    │   ├── seed.js
    │   └── ...
    ├── .env                     # Environment variables
    └── server.js                # Entry point
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/University-Management-System.git
   cd University-Management-System
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**

   Create a `.env` file in the `server` directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/eduverse
   JWT_SECRET=your_jwt_secret_key_here
   
   # Email configuration (for password reset)
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=noreply@eduverse.com
   
   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

   Create a `.env` file in the `client` directory:
   ```env
   REACT_APP_API_URL=http://localhost:8000/api
   ```

5. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud database
   ```

6. **Seed the database (optional)**
   ```bash
   cd server
   node dummy-data/seed.js
   ```

7. **Start the development servers**

   Terminal 1 - Backend:
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 - Frontend:
   ```bash
   cd client
   npm start
   ```

8. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api
   - Health check: http://localhost:8000/api/health

## 📝 API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user
- `POST /api/users/forgot-password` - Request password reset
- `POST /api/users/reset-password` - Reset password with token

### Users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `GET /api/users` - Get all users (with filters)

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (instructor only)
- `PUT /api/courses/:id` - Update course (instructor only)
- `DELETE /api/courses/:id` - Delete course (instructor only)
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/unenroll` - Unenroll from course
- `GET /api/courses/enrolled?userId=:id` - Get enrolled courses

### Posts
- `GET /api/posts` - Get all posts (with filters)
- `GET /api/posts/:id` - Get post by ID
- `POST /api/posts` - Create post (instructor only)
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `GET /api/comments?postId=:id` - Get comments for post
- `POST /api/comments` - Create comment
- `DELETE /api/comments/:id` - Delete comment

### Reactions
- `GET /api/reactions?postId=:id` - Get reactions for post
- `POST /api/reactions` - Add/update reaction
- `DELETE /api/reactions/:id` - Remove reaction

### Chats & Messages
- `GET /api/chats` - Get user's chats
- `GET /api/chats/:id` - Get chat by ID
- `POST /api/chats` - Create or get chat
- `GET /api/messages?chatId=:id` - Get messages for chat
- `POST /api/messages` - Send message

### Files
- `POST /api/files` - Upload file
- `GET /api/files/:id` - Download file
- `GET /api/files/course/:courseId` - Get course files
- `DELETE /api/files/:id` - Delete file

### Reports (Instructor only)
- `GET /api/users/report` - Top contributors leaderboard
- `GET /api/users/report2` - Course engagement analytics
- `GET /api/users/report3` - Reaction distribution analysis
- `GET /api/users/report4` - Instructor performance report

## 🔐 Security Features

- **Password Security**: Bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Protected Routes**: Role-based access control
- **Password Reset**: Secure token generation with expiration
- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Controlled cross-origin access
- **File Upload Limits**: 10MB maximum file size
- **SQL Injection Prevention**: MongoDB parameterized queries

## 🎯 User Roles

### Student
- Enroll in courses
- View course materials and files
- Comment on posts
- React to posts
- Send direct messages
- View own profile and other users' profiles

### Instructor
- All student permissions
- Create and manage courses
- Upload course materials
- Create posts (discussions, announcements, questions)
- Delete course files
- Access analytics and reports
- View engagement metrics

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name - Initial work

## 🙏 Acknowledgments

- Built with React and Node.js
- UI components from Radix UI
- Icons from Lucide React
- Inspired by modern learning management systems

## 📞 Support

For support, email support@eduverse.com or open an issue in the repository.

---

**EduVerse** - Empowering education through technology 🎓
