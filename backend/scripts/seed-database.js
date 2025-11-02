require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Patient = require('../src/models/Patient');
const Provider = require('../src/models/Provider');
const Service = require('../src/models/Service');
const Appointment = require('../src/models/Appointment');
const Review = require('../src/models/Review');

// Sample data
const sampleUsers = [
  // Patients
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    userType: 'patient',
    phone: '+11234567890',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    password: 'password123',
    userType: 'patient',
    phone: '+11234567891',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@example.com',
    password: 'password123',
    userType: 'patient',
    phone: '+11234567892',
    isActive: true,
    isVerified: true
  },
  // Doctors
  {
    firstName: 'Dr. Sarah',
    lastName: 'Wilson',
    email: 'dr.sarah.wilson@healthnexus.com',
    password: 'password123',
    userType: 'doctor',
    phone: '+11234567893',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Dr. Robert',
    lastName: 'Brown',
    email: 'dr.robert.brown@healthnexus.com',
    password: 'password123',
    userType: 'doctor',
    phone: '+11234567894',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Dr. Emily',
    lastName: 'Davis',
    email: 'dr.emily.davis@healthnexus.com',
    password: 'password123',
    userType: 'doctor',
    phone: '+11234567895',
    isActive: true,
    isVerified: true
  },
  // Nurses
  {
    firstName: 'Nurse Linda',
    lastName: 'Martinez',
    email: 'nurse.linda.martinez@healthnexus.com',
    password: 'password123',
    userType: 'nurse',
    phone: '+11234567896',
    isActive: true,
    isVerified: true
  },
  {
    firstName: 'Nurse Tom',
    lastName: 'Anderson',
    email: 'nurse.tom.anderson@healthnexus.com',
    password: 'password123',
    userType: 'nurse',
    phone: '+11234567897',
    isActive: true,
    isVerified: true
  }
];

const samplePatientProfiles = [
  {
    dateOfBirth: new Date('1990-05-15'),
    gender: 'male',
    bloodType: 'O+',
    height: 175,
    weight: 70,
    emergencyContact: {
      name: 'Mary Doe',
      relationship: 'wife',
      phone: '+11234567898',
      email: 'mary.doe@example.com'
    },
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    },
    medicalHistory: {
      allergies: [
        { allergen: 'Peanuts', severity: 'moderate', reaction: 'Rash and swelling' }
      ]
    }
  },
  {
    dateOfBirth: new Date('1985-08-22'),
    gender: 'female',
    bloodType: 'A+',
    height: 165,
    weight: 58,
    emergencyContact: {
      name: 'Bob Smith',
      relationship: 'husband',
      phone: '+11234567899',
      email: 'bob.smith@example.com'
    },
    address: {
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      country: 'USA'
    },
    medicalHistory: {
      chronicConditions: [
        { condition: 'Hypertension', diagnosedDate: new Date('2020-01-15'), status: 'managed' }
      ],
      medications: [
        {
          name: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          startDate: new Date('2020-01-20'),
          prescribedBy: 'Dr. Johnson',
          isActive: true
        }
      ]
    }
  },
  {
    dateOfBirth: new Date('1978-12-10'),
    gender: 'male',
    bloodType: 'B+',
    height: 180,
    weight: 85,
    emergencyContact: {
      name: 'Lisa Johnson',
      relationship: 'sister',
      phone: '+11234567900',
      email: 'lisa.johnson@example.com'
    },
    address: {
      street: '789 Pine Rd',
      city: 'Chicago',
      state: 'IL',
      zipCode: '60601',
      country: 'USA'
    }
  }
];

const sampleProviderProfiles = [
  // Doctors
  {
    licenseNumber: 'MD123456',
    specialization: 'Internal Medicine',
    subSpecializations: ['Cardiology', 'Diabetes Management'],
    yearsOfExperience: 15,
    education: [
      {
        degree: 'MD',
        institution: 'Harvard Medical School',
        yearGraduated: 2009,
        fieldOfStudy: 'Medicine'
      }
    ],
    certifications: [
      {
        name: 'Board Certified Internal Medicine',
        issuingOrganization: 'American Board of Internal Medicine',
        issueDate: new Date('2012-01-01'),
        certificationNumber: 'ABIM-123456',
        isActive: true
      }
    ],
    workLocations: [
      {
        facilityName: 'HealthNexus Medical Center',
        address: {
          street: '100 Medical Plaza',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        phone: '+11234567901',
        isPrimary: true,
        workingHours: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '15:00', available: true },
          saturday: { start: '10:00', end: '14:00', available: true },
          sunday: { start: '', end: '', available: false }
        }
      }
    ],
    services: [
      {
        serviceName: 'General Consultation',
        description: 'Comprehensive health assessment and treatment planning',
        duration: 30,
        price: 150,
        isActive: true
      },
      {
        serviceName: 'Cardiac Screening',
        description: 'Heart health evaluation and risk assessment',
        duration: 45,
        price: 200,
        isActive: true
      }
    ],
    biography: 'Dr. Sarah Wilson is a board-certified internal medicine physician with over 15 years of experience. She specializes in preventive care and chronic disease management.',
    languages: [
      { language: 'English', proficiency: 'native' },
      { language: 'Spanish', proficiency: 'advanced' }
    ],
    ratings: {
      averageRating: 4.8,
      totalReviews: 127,
      ratingBreakdown: {
        excellent: 105,
        good: 18,
        average: 3,
        poor: 1,
        terrible: 0
      }
    },
    statistics: {
      totalAppointments: 1250,
      completedAppointments: 1200,
      canceledAppointments: 30,
      noShowAppointments: 20,
      averageConsultationTime: 25
    },
    verificationStatus: 'verified'
  },
  {
    licenseNumber: 'MD789012',
    specialization: 'Pediatrics',
    subSpecializations: ['Child Development', 'Immunizations'],
    yearsOfExperience: 12,
    education: [
      {
        degree: 'MD',
        institution: 'Johns Hopkins School of Medicine',
        yearGraduated: 2012,
        fieldOfStudy: 'Medicine'
      }
    ],
    workLocations: [
      {
        facilityName: 'Children\'s Health Clinic',
        address: {
          street: '200 Pediatric Way',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        phone: '+11234567902',
        isPrimary: true,
        workingHours: {
          monday: { start: '08:00', end: '16:00', available: true },
          tuesday: { start: '08:00', end: '16:00', available: true },
          wednesday: { start: '08:00', end: '16:00', available: true },
          thursday: { start: '08:00', end: '16:00', available: true },
          friday: { start: '08:00', end: '14:00', available: true },
          saturday: { start: '', end: '', available: false },
          sunday: { start: '', end: '', available: false }
        }
      }
    ],
    services: [
      {
        serviceName: 'Pediatric Consultation',
        description: 'Complete health check-up for children',
        duration: 30,
        price: 120,
        isActive: true
      }
    ],
    biography: 'Dr. Robert Brown is a pediatrician dedicated to providing comprehensive care for children from infancy through adolescence.',
    languages: [
      { language: 'English', proficiency: 'native' }
    ],
    verificationStatus: 'verified'
  },
  {
    licenseNumber: 'MD345678',
    specialization: 'Dermatology',
    subSpecializations: ['Cosmetic Dermatology', 'Skin Cancer Screening'],
    yearsOfExperience: 8,
    education: [
      {
        degree: 'MD',
        institution: 'Stanford University School of Medicine',
        yearGraduated: 2016,
        fieldOfStudy: 'Medicine'
      }
    ],
    workLocations: [
      {
        facilityName: 'Skin Health Center',
        address: {
          street: '300 Derma Street',
          city: 'Chicago',
          state: 'IL',
          zipCode: '60601',
          country: 'USA'
        },
        phone: '+11234567903',
        isPrimary: true,
        workingHours: {
          monday: { start: '09:00', end: '18:00', available: true },
          tuesday: { start: '09:00', end: '18:00', available: true },
          wednesday: { start: '09:00', end: '18:00', available: true },
          thursday: { start: '09:00', end: '18:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '', end: '', available: false },
          sunday: { start: '', end: '', available: false }
        }
      }
    ],
    services: [
      {
        serviceName: 'Skin Consultation',
        description: 'Comprehensive skin examination and treatment',
        duration: 30,
        price: 180,
        isActive: true
      }
    ],
    biography: 'Dr. Emily Davis specializes in medical and cosmetic dermatology with a focus on skin health and aesthetic treatments.',
    languages: [
      { language: 'English', proficiency: 'native' },
      { language: 'French', proficiency: 'intermediate' }
    ],
    verificationStatus: 'verified'
  },
  // Nurses
  {
    licenseNumber: 'RN567890',
    specialization: 'Emergency Nursing',
    subSpecializations: ['Trauma Care', 'Critical Care'],
    yearsOfExperience: 10,
    education: [
      {
        degree: 'BSN',
        institution: 'University of Pennsylvania School of Nursing',
        yearGraduated: 2014,
        fieldOfStudy: 'Nursing'
      }
    ],
    certifications: [
      {
        name: 'Certified Emergency Nurse',
        issuingOrganization: 'Board of Certification for Emergency Nursing',
        issueDate: new Date('2016-01-01'),
        certificationNumber: 'CEN-567890',
        isActive: true
      }
    ],
    workLocations: [
      {
        facilityName: 'Emergency Care Unit',
        address: {
          street: '400 Hospital Drive',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        phone: '+11234567904',
        isPrimary: true,
        workingHours: {
          monday: { start: '07:00', end: '19:00', available: true },
          tuesday: { start: '07:00', end: '19:00', available: true },
          wednesday: { start: '07:00', end: '19:00', available: true },
          thursday: { start: '07:00', end: '19:00', available: true },
          friday: { start: '07:00', end: '19:00', available: true },
          saturday: { start: '08:00', end: '16:00', available: true },
          sunday: { start: '08:00', end: '16:00', available: true }
        }
      }
    ],
    services: [
      {
        serviceName: 'Nursing Assessment',
        description: 'Comprehensive health assessment and care planning',
        duration: 30,
        price: 80,
        isActive: true
      }
    ],
    biography: 'Nurse Linda Martinez is an experienced emergency nurse specializing in trauma and critical care.',
    languages: [
      { language: 'English', proficiency: 'native' },
      { language: 'Spanish', proficiency: 'native' }
    ],
    verificationStatus: 'verified'
  },
  {
    licenseNumber: 'RN234567',
    specialization: 'Family Nursing',
    subSpecializations: ['Preventive Care', 'Health Education'],
    yearsOfExperience: 7,
    education: [
      {
        degree: 'BSN',
        institution: 'UCLA School of Nursing',
        yearGraduated: 2017,
        fieldOfStudy: 'Nursing'
      }
    ],
    workLocations: [
      {
        facilityName: 'Family Health Clinic',
        address: {
          street: '500 Wellness Blvd',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90001',
          country: 'USA'
        },
        phone: '+11234567905',
        isPrimary: true,
        workingHours: {
          monday: { start: '08:00', end: '16:00', available: true },
          tuesday: { start: '08:00', end: '16:00', available: true },
          wednesday: { start: '08:00', end: '16:00', available: true },
          thursday: { start: '08:00', end: '16:00', available: true },
          friday: { start: '08:00', end: '16:00', available: true },
          saturday: { start: '', end: '', available: false },
          sunday: { start: '', end: '', available: false }
        }
      }
    ],
    services: [
      {
        serviceName: 'Health Screening',
        description: 'Routine health checks and preventive care',
        duration: 45,
        price: 90,
        isActive: true
      }
    ],
    biography: 'Nurse Tom Anderson focuses on family health and preventive care, helping patients maintain optimal health.',
    languages: [
      { language: 'English', proficiency: 'native' }
    ],
    verificationStatus: 'verified'
  }
];

const sampleServices = [
  {
    title: 'General Health Checkup',
    slug: 'general-health-checkup',
    description: 'Comprehensive health examination including vital signs, basic tests, and health assessment',
    category: 'consultation',
    price: 120,
    duration: { value: 30, unit: 'minutes' },
    tags: ['health', 'checkup', 'general', 'examination'],
    isActive: true,
    isPopular: true,
    rating: { average: 4.8, count: 250 }
  },
  {
    title: 'Pediatric Consultation',
    slug: 'pediatric-consultation',
    description: 'Specialized healthcare services for children including growth monitoring and immunizations',
    category: 'consultation',
    subcategory: 'pediatrics',
    price: 100,
    duration: { value: 30, unit: 'minutes' },
    tags: ['pediatrics', 'children', 'immunization', 'growth'],
    isActive: true,
    isPopular: true,
    rating: { average: 4.9, count: 180 }
  },
  {
    title: 'Dermatology Consultation',
    slug: 'dermatology-consultation',
    description: 'Skin health examination and treatment for various dermatological conditions',
    category: 'consultation',
    subcategory: 'dermatology',
    price: 180,
    duration: { value: 45, unit: 'minutes' },
    tags: ['dermatology', 'skin', 'acne', 'consultation'],
    isActive: true,
    rating: { average: 4.7, count: 95 }
  },
  {
    title: 'Cardiac Screening',
    slug: 'cardiac-screening',
    description: 'Comprehensive heart health evaluation including ECG and risk assessment',
    category: 'laboratory',
    subcategory: 'cardiology',
    price: 200,
    duration: { value: 60, unit: 'minutes' },
    tags: ['cardiology', 'heart', 'ECG', 'screening'],
    isActive: true,
    isPopular: true,
    rating: { average: 4.8, count: 140 }
  },
  {
    title: 'Mental Health Counseling',
    slug: 'mental-health-counseling',
    description: 'Professional counseling and therapy for mental health and emotional wellbeing',
    category: 'mental-health',
    price: 150,
    duration: { value: 50, unit: 'minutes' },
    tags: ['mental health', 'therapy', 'counseling', 'wellbeing'],
    isActive: true,
    rating: { average: 4.9, count: 75 }
  },
  {
    title: 'Home Nursing Care',
    slug: 'home-nursing-care',
    description: 'Professional nursing services provided at the comfort of your home',
    category: 'nursing',
    price: 80,
    duration: { value: 60, unit: 'minutes' },
    tags: ['nursing', 'home care', 'elderly', 'assistance'],
    isActive: true,
    isPopular: true,
    rating: { average: 4.8, count: 320 }
  }
];

// Connect to database and seed data
const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Provider.deleteMany({});
    await Service.deleteMany({});
    await Appointment.deleteMany({});
    await Review.deleteMany({});

    console.log('Creating users...');
    const createdUsers = await User.insertMany(sampleUsers);
    
    console.log('Creating patient profiles...');
    const patientUsers = createdUsers.filter(user => user.userType === 'patient');
    for (let i = 0; i < patientUsers.length; i++) {
      await Patient.create({
        user: patientUsers[i]._id,
        ...samplePatientProfiles[i]
      });
    }

    console.log('Creating provider profiles...');
    const providerUsers = createdUsers.filter(user => ['doctor', 'nurse'].includes(user.userType));
    for (let i = 0; i < providerUsers.length; i++) {
      await Provider.create({
        user: providerUsers[i]._id,
        ...sampleProviderProfiles[i]
      });
    }

    console.log('Creating services...');
    await Service.insertMany(sampleServices);

    console.log('Creating sample appointments...');
    const patients = await Patient.find().populate('user');
    const providers = await Provider.find().populate('user');
    
    if (patients.length > 0 && providers.length > 0) {
      const sampleAppointments = [
        {
          patient: patients[0]._id,
          provider: providers[0]._id,
          appointmentDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
          duration: 30,
          appointmentType: 'routine-checkup',
          serviceRequested: 'General Health Checkup',
          status: 'scheduled',
          reasonForVisit: 'Patient requested routine health examination for annual checkup',
          location: {
            type: 'clinic',
            address: {
              street: '100 Medical Plaza',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
              country: 'USA'
            }
          },
          cost: {
            basePrice: 120,
            totalAmount: 120,
            patientPayment: 120
          },
          notes: [{
            author: 'patient',
            content: 'Patient requested routine health examination'
          }]
        },
        {
          patient: patients[1]._id,
          provider: providers[1]._id,
          appointmentDateTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          duration: 30,
          appointmentType: 'follow-up',
          serviceRequested: 'Follow-up Consultation',
          status: 'scheduled',
          reasonForVisit: 'Follow-up visit for hypertension management and medication review',
          location: {
            type: 'clinic',
            address: {
              street: '200 Pediatric Way',
              city: 'Los Angeles',
              state: 'CA',
              zipCode: '90001',
              country: 'USA'
            }
          },
          cost: {
            basePrice: 100,
            totalAmount: 100,
            patientPayment: 100
          },
          notes: [{
            author: 'provider',
            content: 'Follow-up for hypertension management'
          }]
        }
      ];

      await Appointment.insertMany(sampleAppointments);
    }

    console.log('Creating sample reviews...');
    const services = await Service.find();
    if (services.length > 0 && patientUsers.length > 0) {
      const sampleReviews = [
        {
          user: patientUsers[0]._id,
          service: services[0]._id,
          rating: 5,
          title: 'Outstanding Healthcare Service',
          comment: 'Excellent service! The doctor was very thorough and professional.',
          isVerified: true,
          isApproved: true
        },
        {
          user: patientUsers[1]._id,
          service: services[1]._id,
          rating: 4,
          title: 'Great Pediatric Care',
          comment: 'Great experience with pediatric care. Doctor was very good with children.',
          isVerified: true,
          isApproved: true
        }
      ];

      await Review.insertMany(sampleReviews);
    }

    console.log('✅ Database seeded successfully!');
    console.log(`Created:`);
    console.log(`- ${createdUsers.length} users`);
    console.log(`- ${patientUsers.length} patient profiles`);
    console.log(`- ${providerUsers.length} provider profiles`);
    console.log(`- ${sampleServices.length} services`);
    
    console.log('\n🔐 Test Login Credentials:');
    console.log('Patient: john.doe@example.com / password123');
    console.log('Doctor: dr.sarah.wilson@healthnexus.com / password123');
    console.log('Nurse: nurse.linda.martinez@healthnexus.com / password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run seeding script
if (require.main === module) {
  seedDatabase();
}

module.exports = seedDatabase;