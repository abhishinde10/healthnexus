# HealthNexus - Smart Healthcare Connection Platform

A modern, full-stack healthcare application with Urban Clap-inspired UI design that connects patients, nurses, and doctors through AI-powered triage and real-time healthcare services.

## 🚀 Features

- **Modern UI Design**: Urban Clap-inspired interface with attractive gradients and animations
- **AI-Powered Triage**: Intelligent symptom assessment and priority recommendations
- **Real-time Provider Availability**: Instant booking system with live provider status
- **Secure Medical Records**: Healthcare-grade encryption and HIPAA compliance
- **Multi-user Support**: Patients, Healthcare Providers, and Administrators
- **Mobile Responsive**: Works seamlessly on all devices

## 🏗️ Project Structure

```
healthnexus/
├── backend/                 # Node.js Express API
│   ├── src/
│   │   ├── config/         # Database and app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Custom middleware
│   │   ├── models/         # MongoDB models
│   │   ├── routes/         # API routes
│   │   └── utils/          # Utility functions
│   ├── uploads/            # File uploads
│   ├── .env.example        # Environment variables template
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── public/
│   │   └── assets/         # Images and static assets
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Redux store
│   │   └── utils/          # Utility functions
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   └── package.json        # Frontend dependencies
├── package.json            # Root package.json
├── README.md               # Project documentation
└── .env.example            # Environment variables template
```

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Socket.io** - Real-time communication
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Frontend
- **React 19** - UI framework
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling framework
- **Axios** - HTTP client
- **Urban Clap-inspired Design** - Modern UI/UX

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- MongoDB (local or cloud)

### Installation

1. **Clone or navigate to the project:**
   ```bash
   cd C:\Users\shind\Desktop\healthnexus
   ```

2. **Install root dependencies and setup project:**
   ```bash
   npm run setup
   ```

3. **Set up environment variables:**
   
   **Backend (.env in backend folder):**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your configuration:
   ```
   NODE_ENV=development
   PORT=3001
   MONGODB_URI=mongodb://localhost:27017/healthnexus
   JWT_SECRET=your_jwt_secret_key_here
   FRONTEND_URL=http://localhost:3000
   ```

   **Frontend (.env in frontend folder):**
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Edit `frontend/.env`:
   ```
   REACT_APP_API_URL=http://localhost:3001/api/v1
   REACT_APP_SOCKET_URL=http://localhost:3001
   ```

4. **Start the application:**
   ```bash
   npm run dev
   ```

This will start both backend (port 3001) and frontend (port 3000) simultaneously.

### Individual Commands

- **Start both frontend and backend:**
  ```bash
  npm start
  # or
  npm run dev
  ```

- **Start only backend:**
  ```bash
  npm run server
  ```

- **Start only frontend:**
  ```bash
  npm run client
  ```

- **Build frontend for production:**
  ```bash
  npm run build
  ```

- **Run tests:**
  ```bash
  npm test
  ```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/me` - Get current user

### Patients
- `GET /api/v1/patients/profile` - Get patient profile
- `PUT /api/v1/patients/profile` - Update patient profile
- `POST /api/v1/patients/triage` - Submit symptoms for triage

### Providers
- `GET /api/v1/providers` - Get available providers
- `GET /api/v1/providers/:id` - Get provider details
- `PUT /api/v1/providers/availability` - Update availability

### Appointments
- `GET /api/v1/appointments` - Get user appointments
- `POST /api/v1/appointments` - Book new appointment
- `PUT /api/v1/appointments/:id` - Update appointment
- `DELETE /api/v1/appointments/:id` - Cancel appointment

## 🎨 UI Features

### Urban Clap-Inspired Design
- **Modern Color Palette**: Purple/violet primary theme with gradient effects
- **Service Cards**: Rating system, pricing, and professional imagery
- **Trust Indicators**: Verified professionals, customer reviews, ratings
- **Smooth Animations**: Hover effects, transitions, and micro-interactions
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Key Components
- **Navigation**: Sticky header with search functionality
- **Hero Section**: Healthcare-themed illustrations and CTAs
- **Service Cards**: Urban Clap-style service listings
- **Dashboard**: Modern stats cards and quick actions
- **Testimonials**: Customer reviews with real avatars

## 🔧 Development

### Backend Development
```bash
cd backend
npm run dev    # Starts with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm start      # Starts with hot-reload
```

### Environment Configuration

**Backend Environment Variables:**
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend Environment Variables:**
- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_SOCKET_URL` - Socket.io server URL

## 📱 Usage

1. **Patient Registration**: Sign up as a patient to access healthcare services
2. **Symptom Triage**: Use AI-powered assessment for health concerns
3. **Book Appointments**: Schedule with available healthcare providers
4. **Medical Records**: Access and manage your health history
5. **Real-time Updates**: Receive notifications and updates

## 🔒 Security Features

- JWT-based authentication
- Password encryption with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization

## 🚦 Testing

- **Backend**: Jest and Supertest for API testing
- **Frontend**: React Testing Library for component testing

## 📦 Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set `NODE_ENV=production` in backend
2. Configure production MongoDB URI
3. Update CORS settings for production domain
4. Set up SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Backend Developer** - API and database architecture
- **Frontend Developer** - UI/UX and React components
- **DevOps Engineer** - Deployment and infrastructure
- **Healthcare Consultant** - Domain expertise and compliance

## 📞 Support

For support and questions:
- Email: support@healthnexus.com
- Documentation: [docs.healthnexus.com](https://docs.healthnexus.com)
- Issues: [GitHub Issues](https://github.com/your-username/healthnexus/issues)

---

**Made with ❤️ for better healthcare accessibility**