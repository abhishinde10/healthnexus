# HealthNexus Backend API

Smart Healthcare Connection Platform Backend - RESTful API for connecting patients, nurses, and doctors with AI-powered triage and real-time healthcare services.

## 🏥 Features

- **Role-based Authentication**: Secure JWT-based authentication for patients, nurses, and doctors
- **Patient Management**: Comprehensive patient profiles with medical history, allergies, medications
- **Provider Management**: Healthcare provider profiles with specializations, availability, and ratings
- **Appointment System**: Full-featured appointment booking, scheduling, and management
- **Medical Records**: Secure medical record management with HIPAA compliance considerations
- **Real-time Communication**: Support for real-time updates and notifications
- **Security**: Rate limiting, helmet security headers, input validation, and error handling
- **Healthcare Compliance**: Built with healthcare industry standards in mind

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthnexus-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration.

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api/v1
```

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login user | Public |
| POST | `/auth/logout` | Logout user | Private |
| GET | `/auth/me` | Get current user | Private |
| POST | `/auth/forgot-password` | Request password reset | Public |
| PATCH | `/auth/reset-password/:token` | Reset password | Public |
| PATCH | `/auth/update-password` | Update password | Private |
| POST | `/auth/refresh-token` | Refresh access token | Public |
| PATCH | `/auth/verify-email/:token` | Verify email address | Public |

### Patient Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/patients/profile` | Get patient profile | Patient |
| PUT | `/patients/profile` | Update patient profile | Patient |
| GET | `/patients/medical-history` | Get medical history | Patient |
| POST | `/patients/medical-history` | Add medical history | Patient |
| GET | `/patients/appointments` | Get patient appointments | Patient |
| POST | `/patients/symptom-triage` | Submit symptom triage | Patient |

### Provider Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/providers` | Get all providers | All authenticated |
| GET | `/providers/profile` | Get provider profile | Provider |
| PUT | `/providers/profile` | Update provider profile | Provider |
| GET | `/providers/available` | Get available providers | Patient |
| PUT | `/providers/availability` | Update availability | Provider |
| GET | `/providers/schedule` | Get provider schedule | Provider |
| GET | `/providers/stats` | Get provider statistics | Provider |

### Appointment Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/appointments` | Get appointments | All authenticated |
| POST | `/appointments` | Create appointment | Patient |
| GET | `/appointments/:id` | Get appointment by ID | Related users |
| PUT | `/appointments/:id` | Update appointment | Related users |
| DELETE | `/appointments/:id` | Cancel appointment | Related users |
| POST | `/appointments/:id/reschedule` | Reschedule appointment | Related users |
| PUT | `/appointments/:id/complete` | Complete appointment | Provider |
| POST | `/appointments/:id/rate` | Rate appointment | Related users |

### Health Check

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/health` | API health status | Public |

## 🗄️ Database Models

### User Model
- Basic user information (name, email, password)
- Role-based access (patient, nurse, doctor)
- Authentication tokens and verification

### Patient Model
- Personal information (DOB, gender, contact details)
- Medical history (conditions, allergies, medications, surgeries)
- Emergency contact information
- Insurance details

### Provider Model
- Professional information (license, specialization, experience)
- Education and certifications
- Availability and working hours
- Services offered and ratings

### Appointment Model
- Appointment details (date, time, type, status)
- Patient and provider references
- Location and cost information
- Consultation notes and prescriptions
- Rating and feedback system

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Rate Limiting**: Prevent abuse and brute force attacks
- **Input Validation**: Comprehensive input validation using express-validator
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: bcryptjs for secure password storage
- **CORS Configuration**: Proper CORS setup for frontend integration

## 🛠️ Development

### Project Structure
```
src/
├── config/          # Database and app configuration
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── services/        # Business logic services
└── utils/           # Utility functions

tests/               # Test files
uploads/             # File upload directory
```

### Available Scripts

```bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Environment Variables

Key environment variables (see `.env.example` for full list):

- `PORT`: Server port (default: 3001)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `FRONTEND_URL`: Frontend URL for CORS
- `NODE_ENV`: Environment (development/production)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- auth.test.js
```

## 📝 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## 🚀 Deployment

### Production Checklist

1. Set `NODE_ENV=production`
2. Use secure JWT secrets
3. Configure proper MongoDB connection
4. Set up SSL/TLS
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure backup strategy

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Email: support@healthnexus.com
- Documentation: [API Docs](http://localhost:3001/api)

## 🔄 Changelog

### Version 1.0.0
- Initial release
- User authentication and authorization
- Patient and provider management
- Appointment system
- Medical records management
- Security implementation