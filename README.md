# InaBerekuso - Campus Transportation Platform

A comprehensive web application connecting Ashesi University students with local drivers and motorcycle (okada) riders in Berekuso. The platform facilitates real-time communication, location tracking, and ride booking.

## 🚀 Features

### For Students
- Browse available drivers with real-time status indicators
- Request rides with pickup and dropoff locations
- Real-time location tracking during trips
- In-app chat with drivers
- Rate and review drivers
- Trip history and receipts
- Emergency contact sharing
- Favorite drivers

### For Drivers/Moto Riders
- Availability status management (Available/Busy/Offline)
- Receive and accept ride requests
- Live GPS location tracking
- Update trip status in real-time
- View earnings dashboard (daily/weekly/total)
- Trip history
- Profile and vehicle management

### For Admins
- Comprehensive dashboard with platform statistics
- User management and approval system
- Driver verification and document review
- Dispute resolution
- Reports management
- Send platform-wide announcements

## 🏗️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for real-time communication
- **JWT** for authentication
- **Cloudinary** for image storage
- **Nodemailer** for email verification
- **Bcrypt** for password hashing

### Frontend
- **React 18** with Vite
- **React Router** for navigation
- **Zustand** for state management
- **Tailwind CSS** for styling
- **Socket.IO Client** for real-time features
- **Axios** for API requests
- **React Icons** for UI icons
- **React Toastify** for notifications

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn
- Git

## 🔧 Installation & Setup

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd InaBerekuso
\`\`\`

### 2. Backend Setup

\`\`\`bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configurations
# Important: Update the following values:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (a secure random string)
# - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
# - EMAIL_USER, EMAIL_PASSWORD (for email verification)
\`\`\`

### 3. Frontend Setup

\`\`\`bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env file with your configurations
# Update VITE_GOOGLE_MAPS_API_KEY with your Google Maps API key
\`\`\`

### 4. Database Configuration

Make sure MongoDB is running on your system:

\`\`\`bash
# On macOS with Homebrew
brew services start mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
# MongoDB should start automatically as a service
\`\`\`

## 🚀 Running the Application

### Development Mode

**Terminal 1 - Backend:**
\`\`\`bash
cd backend
npm run dev
# Server runs on http://localhost:5000
\`\`\`

**Terminal 2 - Frontend:**
\`\`\`bash
cd frontend
npm run dev
# App runs on http://localhost:3000
\`\`\`

### Production Build

**Backend:**
\`\`\`bash
cd backend
npm start
\`\`\`

**Frontend:**
\`\`\`bash
cd frontend
npm run build
npm run preview
\`\`\`

## 📁 Project Structure

\`\`\`
InaBerekuso/
├── backend/
│   ├── config/
│   │   ├── cloudinary.js      # Cloudinary configuration
│   │   └── database.js        # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Authentication logic
│   │   ├── driverController.js # Driver management
│   │   ├── tripController.js   # Trip management
│   │   └── adminController.js  # Admin operations
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   └── errorHandler.js    # Error handling
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Trip.js            # Trip model
│   │   ├── Message.js         # Message model
│   │   ├── Notification.js    # Notification model
│   │   └── Report.js          # Report model
│   ├── routes/
│   │   ├── authRoutes.js      # Auth endpoints
│   │   ├── driverRoutes.js    # Driver endpoints
│   │   ├── tripRoutes.js      # Trip endpoints
│   │   └── adminRoutes.js     # Admin endpoints
│   ├── socket/
│   │   └── socketHandler.js   # Socket.IO logic
│   ├── .env.example
│   ├── package.json
│   └── server.js              # Entry point
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── admin/         # Admin components
    │   │   ├── driver/        # Driver components
    │   │   ├── student/       # Student components
    │   │   ├── Navbar.jsx
    │   │   ├── PrivateRoute.jsx
    │   │   └── Profile.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   ├── StudentDashboard.jsx
    │   │   ├── DriverDashboard.jsx
    │   │   └── AdminDashboard.jsx
    │   ├── services/
    │   │   ├── api.service.js  # API calls
    │   │   └── socket.service.js # Socket.IO client
    │   ├── store/
    │   │   └── authStore.js    # Zustand store
    │   ├── utils/
    │   │   └── api.js          # Axios instance
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── .env.example
    ├── index.html
    ├── package.json
    ├── postcss.config.js
    ├── tailwind.config.js
    └── vite.config.js
\`\`\`

## 🔐 Environment Variables

### Backend (.env)

\`\`\`env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/inaberekuso
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRE=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM=noreply@inaberekuso.com
FRONTEND_URL=http://localhost:3000
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
\`\`\`

### Frontend (.env)

\`\`\`env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
\`\`\`

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify-email/:token` - Verify email
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Drivers
- `GET /api/drivers/available` - Get available drivers
- `GET /api/drivers/:id` - Get driver details
- `PUT /api/drivers/status` - Update driver status
- `PUT /api/drivers/location` - Update driver location
- `POST /api/drivers/vehicle-photo` - Upload vehicle photo
- `POST /api/drivers/profile-photo` - Upload profile photo
- `PUT /api/drivers/vehicle` - Update vehicle details
- `GET /api/drivers/earnings/details` - Get earnings
- `GET /api/drivers/trips/history` - Get trip history

### Trips
- `POST /api/trips` - Create trip request
- `PUT /api/trips/:id/accept` - Accept trip
- `PUT /api/trips/:id/status` - Update trip status
- `PUT /api/trips/:id/cancel` - Cancel trip
- `PUT /api/trips/:id/rate` - Rate trip
- `GET /api/trips/history` - Get trip history
- `GET /api/trips/active` - Get active trip
- `PUT /api/trips/:id/share` - Share trip

### Admin
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/approve` - Approve/reject user
- `PUT /api/admin/users/:id/toggle-active` - Toggle user status
- `GET /api/admin/statistics` - Get platform statistics
- `GET /api/admin/reports` - Get reports
- `PUT /api/admin/reports/:id` - Update report
- `POST /api/admin/announcements` - Send announcement

## 🔄 Real-time Events (Socket.IO)

### Client → Server
- `join` - Join personal room
- `join_trip` - Join trip room
- `send_message` - Send chat message
- `update_location` - Update driver location
- `typing` - Typing indicator

### Server → Client
- `trip_request` - New ride request (to driver)
- `trip_accepted` - Ride accepted (to student)
- `trip_status_updated` - Trip status change
- `trip_cancelled` - Trip cancelled
- `new_message` - New chat message
- `location_updated` - Location update
- `driver_status_changed` - Driver status change
- `announcement` - Platform announcement

## 🗄️ Database Schema

### User Collection
- Authentication (email, password, role)
- Personal info (firstName, lastName, phoneNumber)
- Profile photo
- Driver-specific (vehicle details, status, location, earnings)
- Student-specific (studentId, favoriteDrivers, emergencyContact)
- Rating and verification status

### Trip Collection
- Student and driver references
- Status tracking
- Pickup and dropoff locations
- Fare details
- Payment information
- Ratings and reviews
- Trip sharing

### Message Collection
- Trip reference
- Sender and receiver
- Message content and type
- Read status

### Notification Collection
- User reference
- Notification details
- Type and related entities
- Read status

### Report Collection
- Reporter and reported user
- Trip reference
- Reason and description
- Status and admin notes

## 🎨 User Interface

### Color Scheme
- **Primary**: Blue (#1E40AF) - Main brand color
- **Secondary**: Green (#10B981) - Success actions
- **Danger**: Red (#EF4444) - Warnings/cancellations
- **Warning**: Yellow (#F59E0B) - Pending states

### Status Indicators
- **Available**: Green badge
- **Busy**: Red badge
- **Offline**: Gray badge

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting on API endpoints
- Helmet.js for HTTP headers security
- Input validation and sanitization
- CORS configuration
- Email verification for students

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for:
- Mobile devices (320px+)
- Tablets (768px+)
- Desktops (1024px+)

## 🧪 Testing

### Create Test Accounts

**Admin Account:**
\`\`\`bash
# Create directly in MongoDB or via registration
Role: admin
Email: admin@inaberekuso.com
\`\`\`

**Student Account:**
\`\`\`bash
Email: student@ashesi.edu.gh
Role: student
\`\`\`

**Driver Account:**
\`\`\`bash
Email: driver@example.com
Role: driver
# Needs admin approval before going live
\`\`\`

## 🚧 Known Limitations & Future Enhancements

### Current Limitations
- Google Maps integration requires API key configuration
- Email verification requires SMTP setup
- Admin interface has basic features (can be expanded)

### Planned Features
- [ ] Fare calculation based on distance
- [ ] Multiple payment integration (MTN/Vodafone Mobile Money)
- [ ] Scheduled rides
- [ ] Ride-sharing for multiple students
- [ ] In-app navigation
- [ ] Push notifications
- [ ] Driver earnings reports/exports
- [ ] Advanced analytics dashboard
- [ ] SMS notifications
- [ ] Driver background check integration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Support

For support and questions:
- Create an issue in the repository
- Contact: support@inaberekuso.com

## 🙏 Acknowledgments

- Ashesi University for the inspiration
- Berekuso community drivers and riders
- All contributors and testers

---

**Built with ❤️ for the Ashesi University community**
