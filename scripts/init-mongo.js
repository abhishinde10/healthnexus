// MongoDB initialization script for HealthNexus
print('🏥 Starting HealthNexus database initialization...');

// Switch to the healthnexus database
db = db.getSiblingDB('healthnexus');

// Create collections with initial documents to establish schema
print('📋 Creating collections...');

// Create users collection with admin user
db.users.insertOne({
  _id: ObjectId(),
  firstName: "System",
  lastName: "Admin",
  email: "admin@healthnexus.com",
  password: "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsyq5/6Pe", // password: admin123
  role: "admin",
  isActive: true,
  isEmailVerified: true,
  profile: {
    phone: "+1234567890",
    dateOfBirth: new Date("1990-01-01"),
    gender: "other",
    address: {
      street: "123 Healthcare St",
      city: "Health City",
      state: "HC",
      zipCode: "12345",
      country: "Healthcare Land"
    }
  },
  preferences: {
    notifications: {
      email: true,
      sms: true,
      push: true
    },
    language: "en",
    timezone: "UTC"
  },
  metadata: {
    lastLogin: new Date(),
    loginCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
});

// Create services collection with sample services
db.services.insertMany([
  {
    _id: ObjectId(),
    title: "General Consultation",
    description: "Comprehensive medical consultation with certified doctors",
    category: "consultation",
    price: 99,
    originalPrice: 149,
    discount: 34,
    duration: { value: 30, unit: "minutes" },
    tags: ["General Medicine", "Online", "24/7"],
    isPopular: true,
    isActive: true,
    images: [
      {
        url: "/assets/images/consultation.jpg",
        alt: "General Consultation",
        isPrimary: true
      }
    ],
    rating: {
      average: 4.8,
      count: 1250
    },
    availability: {
      schedule: "24/7",
      nextAvailable: new Date()
    },
    providers: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    _id: ObjectId(),
    title: "Home Nursing Care",
    description: "Professional nursing care in the comfort of your home",
    category: "nursing",
    price: 199,
    originalPrice: 299,
    discount: 33,
    duration: { value: 2, unit: "hours" },
    tags: ["Home Visit", "Skilled Nurses", "Post-Op Care"],
    isPopular: true,
    isActive: true,
    images: [
      {
        url: "/assets/images/nursing.jpg",
        alt: "Home Nursing Care",
        isPrimary: true
      }
    ],
    rating: {
      average: 4.9,
      count: 856
    },
    availability: {
      schedule: "6 AM - 10 PM",
      nextAvailable: new Date()
    },
    providers: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    _id: ObjectId(),
    title: "Lab Tests at Home",
    description: "Convenient home sample collection with accurate results",
    category: "laboratory",
    price: 79,
    originalPrice: 129,
    discount: 39,
    duration: { value: 15, unit: "minutes" },
    tags: ["Home Collection", "Quick Results", "Certified Lab"],
    isPopular: false,
    isActive: true,
    images: [
      {
        url: "/assets/images/lab-test.jpg",
        alt: "Lab Tests at Home",
        isPrimary: true
      }
    ],
    rating: {
      average: 4.7,
      count: 2100
    },
    availability: {
      schedule: "7 AM - 7 PM",
      nextAvailable: new Date()
    },
    providers: [],
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
]);

// Create reviews collection (empty initially)
db.reviews.createIndex({ service: 1, user: 1 }, { unique: true });
db.reviews.createIndex({ service: 1, rating: -1 });
db.reviews.createIndex({ createdAt: -1 });

// Create appointments collection (empty initially)
db.appointments.createIndex({ user: 1, scheduledDate: -1 });
db.appointments.createIndex({ provider: 1, scheduledDate: 1 });
db.appointments.createIndex({ service: 1, status: 1 });

// Create indexes for better performance
print('🔍 Creating database indexes...');

// User indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1, isActive: 1 });
db.users.createIndex({ "profile.phone": 1 }, { sparse: true });

// Service indexes
db.services.createIndex({ category: 1, isActive: 1 });
db.services.createIndex({ isPopular: 1, isActive: 1 });
db.services.createIndex({ price: 1, isActive: 1 });
db.services.createIndex({ "rating.average": -1, isActive: 1 });
db.services.createIndex({ 
  title: "text", 
  description: "text", 
  tags: "text" 
}, {
  weights: { title: 10, description: 5, tags: 3 },
  name: "service_text_search"
});

// Create database statistics
print('📊 Database initialization completed successfully!');

// Display collection counts
print('Collections created:');
print('- Users: ' + db.users.countDocuments());
print('- Services: ' + db.services.countDocuments());
print('- Reviews: ' + db.reviews.countDocuments());
print('- Appointments: ' + db.appointments.countDocuments());

print('🎉 HealthNexus database is ready for use!');