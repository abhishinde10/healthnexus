const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    required: [true, 'Gender is required']
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'],
    default: 'unknown'
  },
  height: {
    type: Number, // in cm
    min: [30, 'Height must be at least 30 cm'],
    max: [300, 'Height cannot exceed 300 cm']
  },
  weight: {
    type: Number, // in kg
    min: [1, 'Weight must be at least 1 kg'],
    max: [1000, 'Weight cannot exceed 1000 kg']
  },
  emergencyContact: {
    name: {
      type: String,
      required: [true, 'Emergency contact name is required'],
      trim: true
    },
    relationship: {
      type: String,
      required: [true, 'Emergency contact relationship is required'],
      trim: true
    },
    phone: {
      type: String,
      required: [true, 'Emergency contact phone is required'],
      match: [/^[+]?[1-9][\d]{10,14}$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    }
  },
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      trim: true,
      default: 'USA'
    }
  },
  insurance: {
    provider: {
      type: String,
      trim: true
    },
    policyNumber: {
      type: String,
      trim: true
    },
    groupNumber: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  medicalHistory: {
    chronicConditions: [{
      condition: {
        type: String,
        required: true,
        trim: true
      },
      diagnosedDate: Date,
      status: {
        type: String,
        enum: ['active', 'resolved', 'managed'],
        default: 'active'
      }
    }],
    allergies: [{
      allergen: {
        type: String,
        required: true,
        trim: true
      },
      severity: {
        type: String,
        enum: ['mild', 'moderate', 'severe'],
        required: true
      },
      reaction: {
        type: String,
        trim: true
      }
    }],
    medications: [{
      name: {
        type: String,
        required: true,
        trim: true
      },
      dosage: {
        type: String,
        required: true,
        trim: true
      },
      frequency: {
        type: String,
        required: true,
        trim: true
      },
      startDate: {
        type: Date,
        required: true
      },
      endDate: Date,
      prescribedBy: {
        type: String,
        trim: true
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    surgeries: [{
      procedure: {
        type: String,
        required: true,
        trim: true
      },
      date: {
        type: Date,
        required: true
      },
      surgeon: {
        type: String,
        trim: true
      },
      hospital: {
        type: String,
        trim: true
      },
      complications: {
        type: String,
        trim: true
      }
    }],
    familyHistory: [{
      relation: {
        type: String,
        required: true,
        trim: true
      },
      condition: {
        type: String,
        required: true,
        trim: true
      },
      ageOfOnset: Number
    }]
  },
  preferences: {
    preferredLanguage: {
      type: String,
      default: 'English'
    },
    communicationMethod: {
      type: String,
      enum: ['email', 'phone', 'sms', 'app'],
      default: 'email'
    },
    appointmentReminders: {
      type: Boolean,
      default: true
    },
    marketingEmails: {
      type: Boolean,
      default: false
    }
  },
  lastVisit: {
    type: Date,
    default: null
  },
  nextAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better performance
patientSchema.index({ user: 1 });
patientSchema.index({ 'emergencyContact.phone': 1 });
patientSchema.index({ 'insurance.policyNumber': 1 });
patientSchema.index({ lastVisit: -1 });

// Virtual for age
patientSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
});

// Virtual for BMI
patientSchema.virtual('bmi').get(function() {
  if (!this.weight || !this.height) return null;
  const heightInMeters = this.height / 100;
  return Math.round((this.weight / (heightInMeters * heightInMeters)) * 100) / 100;
});

// Method to get active medications
patientSchema.methods.getActiveMedications = function() {
  return this.medicalHistory.medications.filter(med => med.isActive);
};

// Method to get active chronic conditions
patientSchema.methods.getActiveConditions = function() {
  return this.medicalHistory.chronicConditions.filter(condition => condition.status === 'active');
};

// Pre-populate user information
patientSchema.pre(/^find/, function(next) {
  this.populate('user', 'firstName lastName email phone profilePicture isActive');
  next();
});

module.exports = mongoose.model('Patient', patientSchema);