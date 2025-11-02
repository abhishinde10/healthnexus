const mongoose = require('mongoose');

const providerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  licenseNumber: {
    type: String,
    required: [true, 'License number is required'],
    unique: true,
    trim: true
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    trim: true
  },
  subSpecializations: [{
    type: String,
    trim: true
  }],
  yearsOfExperience: {
    type: Number,
    min: [0, 'Years of experience cannot be negative'],
    max: [70, 'Years of experience cannot exceed 70 years']
  },
  education: [{
    degree: {
      type: String,
      required: true,
      trim: true
    },
    institution: {
      type: String,
      required: true,
      trim: true
    },
    yearGraduated: {
      type: Number,
      required: true
    },
    fieldOfStudy: {
      type: String,
      trim: true
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expirationDate: Date,
    certificationNumber: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  workLocations: [{
    facilityName: {
      type: String,
      required: true,
      trim: true
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'USA'
      }
    },
    phone: {
      type: String,
      match: [/^[+]?[1-9][\d]{10,14}$/, 'Please enter a valid phone number']
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    workingHours: {
      monday: { start: String, end: String, available: Boolean },
      tuesday: { start: String, end: String, available: Boolean },
      wednesday: { start: String, end: String, available: Boolean },
      thursday: { start: String, end: String, available: Boolean },
      friday: { start: String, end: String, available: Boolean },
      saturday: { start: String, end: String, available: Boolean },
      sunday: { start: String, end: String, available: Boolean }
    }
  }],
  availability: {
    isCurrentlyAvailable: {
      type: Boolean,
      default: true
    },
    onCallStatus: {
      type: Boolean,
      default: false
    },
    lastStatusUpdate: {
      type: Date,
      default: Date.now
    },
    unavailabilityPeriods: [{
      startDate: {
        type: Date,
        required: true
      },
      endDate: {
        type: Date,
        required: true
      },
      reason: {
        type: String,
        enum: ['vacation', 'sick-leave', 'training', 'personal', 'other'],
        required: true
      },
      notes: String
    }]
  },
  services: [{
    serviceName: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // in minutes
      required: true,
      min: [15, 'Service duration must be at least 15 minutes']
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative']
    },
    isHomeVisitAvailable: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  ratings: {
    averageRating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    totalReviews: {
      type: Number,
      default: 0
    },
    ratingBreakdown: {
      excellent: { type: Number, default: 0 },
      good: { type: Number, default: 0 },
      average: { type: Number, default: 0 },
      poor: { type: Number, default: 0 },
      terrible: { type: Number, default: 0 }
    }
  },
  statistics: {
    totalAppointments: {
      type: Number,
      default: 0
    },
    completedAppointments: {
      type: Number,
      default: 0
    },
    canceledAppointments: {
      type: Number,
      default: 0
    },
    noShowAppointments: {
      type: Number,
      default: 0
    },
    averageConsultationTime: {
      type: Number, // in minutes
      default: 0
    }
  },
  preferences: {
    appointmentBuffer: {
      type: Number, // minutes between appointments
      default: 10,
      min: [0, 'Appointment buffer cannot be negative']
    },
    maxDailyAppointments: {
      type: Number,
      default: 20,
      min: [1, 'Must allow at least 1 appointment per day']
    },
    autoAcceptAppointments: {
      type: Boolean,
      default: false
    },
    allowEmergencyBookings: {
      type: Boolean,
      default: true
    }
  },
  biography: {
    type: String,
    maxlength: [2000, 'Biography cannot exceed 2000 characters']
  },
  languages: [{
    language: {
      type: String,
      required: true
    },
    proficiency: {
      type: String,
      enum: ['basic', 'intermediate', 'advanced', 'native'],
      default: 'intermediate'
    }
  }],
  isAcceptingNewPatients: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  lastActiveDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better performance
providerSchema.index({ user: 1 });
providerSchema.index({ licenseNumber: 1 });
providerSchema.index({ specialization: 1 });
providerSchema.index({ 'availability.isCurrentlyAvailable': 1 });
providerSchema.index({ 'ratings.averageRating': -1 });
providerSchema.index({ isAcceptingNewPatients: 1 });
providerSchema.index({ verificationStatus: 1 });

// Virtual for completion rate
providerSchema.virtual('completionRate').get(function() {
  if (this.statistics.totalAppointments === 0) return 0;
  return Math.round((this.statistics.completedAppointments / this.statistics.totalAppointments) * 100);
});

// Method to update availability status
providerSchema.methods.updateAvailabilityStatus = function(isAvailable, onCallStatus = false) {
  this.availability.isCurrentlyAvailable = isAvailable;
  this.availability.onCallStatus = onCallStatus;
  this.availability.lastStatusUpdate = new Date();
  return this.save();
};

// Method to add unavailability period
providerSchema.methods.addUnavailabilityPeriod = function(startDate, endDate, reason, notes = '') {
  this.availability.unavailabilityPeriods.push({
    startDate,
    endDate,
    reason,
    notes
  });
  return this.save();
};

// Method to update rating
providerSchema.methods.updateRating = function(newRating) {
  const ratings = this.ratings;
  const totalReviews = ratings.totalReviews;
  const currentAverage = ratings.averageRating;
  
  // Calculate new average
  const newAverage = ((currentAverage * totalReviews) + newRating) / (totalReviews + 1);
  
  this.ratings.averageRating = Math.round(newAverage * 10) / 10;
  this.ratings.totalReviews = totalReviews + 1;
  
  // Update breakdown
  if (newRating >= 4.5) this.ratings.ratingBreakdown.excellent++;
  else if (newRating >= 3.5) this.ratings.ratingBreakdown.good++;
  else if (newRating >= 2.5) this.ratings.ratingBreakdown.average++;
  else if (newRating >= 1.5) this.ratings.ratingBreakdown.poor++;
  else this.ratings.ratingBreakdown.terrible++;
  
  return this.save();
};

// Method to check if provider is available at specific time
providerSchema.methods.isAvailableAt = function(dateTime) {
  const date = new Date(dateTime);
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'lowercase' });
  
  // Check if provider is generally available
  if (!this.availability.isCurrentlyAvailable) return false;
  
  // Check unavailability periods
  const isUnavailable = this.availability.unavailabilityPeriods.some(period => {
    return date >= period.startDate && date <= period.endDate;
  });
  
  if (isUnavailable) return false;
  
  // Check working hours for primary location
  const primaryLocation = this.workLocations.find(loc => loc.isPrimary);
  if (primaryLocation && primaryLocation.workingHours[dayOfWeek]) {
    const workingHours = primaryLocation.workingHours[dayOfWeek];
    if (!workingHours.available) return false;
    
    // Additional time validation could be added here
  }
  
  return true;
};

// Pre-populate user information
providerSchema.pre(/^find/, function(next) {
  this.populate('user', 'firstName lastName email phone profilePicture isActive userType');
  next();
});

module.exports = mongoose.model('Provider', providerSchema);