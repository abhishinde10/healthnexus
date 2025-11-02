const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: [true, 'Patient is required']
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: [true, 'Provider is required']
  },
  appointmentDateTime: {
    type: Date,
    required: [true, 'Appointment date and time is required']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Duration is required'],
    min: [15, 'Appointment duration must be at least 15 minutes'],
    max: [480, 'Appointment duration cannot exceed 8 hours']
  },
  appointmentType: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup', 'home-visit', 'telemedicine'],
    required: [true, 'Appointment type is required']
  },
  serviceRequested: {
    type: String,
    required: [true, 'Service requested is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'canceled', 'no-show', 'rescheduled'],
    default: 'scheduled'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  reasonForVisit: {
    type: String,
    required: [true, 'Reason for visit is required'],
    trim: true,
    maxlength: [1000, 'Reason for visit cannot exceed 1000 characters']
  },
  symptoms: [{
    symptom: {
      type: String,
      required: true,
      trim: true
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe'],
      required: true
    },
    duration: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true
    }
  }],
  location: {
    type: {
      type: String,
      enum: ['clinic', 'home', 'hospital', 'telemedicine'],
      required: true
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
    coordinates: {
      latitude: Number,
      longitude: Number
    },
    instructions: {
      type: String,
      trim: true
    }
  },
  cost: {
    basePrice: {
      type: Number,
      min: [0, 'Base price cannot be negative'],
      default: 0
    },
    additionalCharges: [{
      description: String,
      amount: Number
    }],
    totalAmount: {
      type: Number,
      min: [0, 'Total amount cannot be negative'],
      default: 0
    },
    insuranceCovered: {
      type: Number,
      min: [0, 'Insurance covered amount cannot be negative'],
      default: 0
    },
    patientPayment: {
      type: Number,
      min: [0, 'Patient payment cannot be negative'],
      default: 0
    }
  },
  consultation: {
    startTime: Date,
    endTime: Date,
    actualDuration: Number, // in minutes
    chiefComplaint: String,
    presentIllness: String,
    physicalExamination: String,
    assessment: String,
    plan: String,
    prescriptions: [{
      medication: {
        type: String,
        required: true
      },
      dosage: {
        type: String,
        required: true
      },
      frequency: {
        type: String,
        required: true
      },
      duration: {
        type: String,
        required: true
      },
      instructions: String
    }],
    followUpRequired: {
      type: Boolean,
      default: false
    },
    followUpDate: Date,
    referrals: [{
      specialistType: String,
      reason: String,
      urgency: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine'
      }
    }],
    labOrdersRequested: [{
      testName: String,
      reason: String,
      urgency: {
        type: String,
        enum: ['routine', 'urgent', 'stat'],
        default: 'routine'
      }
    }],
    vitalSigns: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number
      },
      heartRate: Number,
      temperature: Number, // in Fahrenheit
      respiratoryRate: Number,
      oxygenSaturation: Number,
      weight: Number, // in kg
      height: Number // in cm
    }
  },
  communication: {
    patientNotified: {
      type: Boolean,
      default: false
    },
    providerNotified: {
      type: Boolean,
      default: false
    },
    remindersSent: [{
      type: {
        type: String,
        enum: ['email', 'sms', 'push']
      },
      sentAt: {
        type: Date,
        default: Date.now
      },
      successful: {
        type: Boolean,
        default: false
      }
    }],
    lastCommunication: Date
  },
  ratings: {
    patientRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    },
    providerRating: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      review: String,
      ratedAt: Date
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['web', 'mobile', 'phone', 'walk-in'],
      default: 'web'
    },
    ipAddress: String,
    userAgent: String,
    referredBy: String,
    campaignSource: String
  },
  cancellationDetails: {
    canceledBy: {
      type: String,
      enum: ['patient', 'provider', 'system']
    },
    canceledAt: Date,
    reason: String,
    refundAmount: {
      type: Number,
      default: 0
    },
    refundProcessed: {
      type: Boolean,
      default: false
    }
  },
  rescheduleHistory: [{
    originalDateTime: {
      type: Date,
      required: true
    },
    newDateTime: {
      type: Date,
      required: true
    },
    rescheduledBy: {
      type: String,
      enum: ['patient', 'provider'],
      required: true
    },
    reason: String,
    rescheduledAt: {
      type: Date,
      default: Date.now
    }
  }],
  notes: [{
    author: {
      type: String,
      enum: ['patient', 'provider', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [2000, 'Note content cannot exceed 2000 characters']
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better performance
appointmentSchema.index({ patient: 1, appointmentDateTime: 1 });
appointmentSchema.index({ provider: 1, appointmentDateTime: 1 });
appointmentSchema.index({ appointmentDateTime: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ appointmentType: 1 });
appointmentSchema.index({ priority: 1 });

// Virtual for appointment date only
appointmentSchema.virtual('appointmentDate').get(function() {
  return this.appointmentDateTime.toDateString();
});

// Virtual for appointment time only
appointmentSchema.virtual('appointmentTime').get(function() {
  return this.appointmentDateTime.toLocaleTimeString();
});

// Virtual for duration in hours
appointmentSchema.virtual('durationInHours').get(function() {
  return Math.round((this.duration / 60) * 100) / 100;
});

// Method to check if appointment can be canceled
appointmentSchema.methods.canBeCanceled = function() {
  const now = new Date();
  const appointmentTime = new Date(this.appointmentDateTime);
  const timeDifference = appointmentTime.getTime() - now.getTime();
  const hoursUntilAppointment = timeDifference / (1000 * 3600);
  
  return hoursUntilAppointment >= 24 && ['scheduled', 'confirmed'].includes(this.status);
};

// Method to check if appointment can be rescheduled
appointmentSchema.methods.canBeRescheduled = function() {
  const now = new Date();
  const appointmentTime = new Date(this.appointmentDateTime);
  const timeDifference = appointmentTime.getTime() - now.getTime();
  const hoursUntilAppointment = timeDifference / (1000 * 3600);
  
  return hoursUntilAppointment >= 2 && ['scheduled', 'confirmed'].includes(this.status);
};

// Method to calculate total cost
appointmentSchema.methods.calculateTotalCost = function() {
  let total = this.cost.basePrice;
  
  this.cost.additionalCharges.forEach(charge => {
    total += charge.amount;
  });
  
  this.cost.totalAmount = total;
  this.cost.patientPayment = total - this.cost.insuranceCovered;
  
  return total;
};

// Method to update status with validation
appointmentSchema.methods.updateStatus = function(newStatus, updatedBy = 'system') {
  const validTransitions = {
    'scheduled': ['confirmed', 'canceled', 'rescheduled'],
    'confirmed': ['in-progress', 'canceled', 'no-show', 'rescheduled'],
    'in-progress': ['completed', 'canceled'],
    'completed': [],
    'canceled': [],
    'no-show': [],
    'rescheduled': ['scheduled']
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  
  if (newStatus === 'in-progress') {
    this.consultation.startTime = new Date();
  } else if (newStatus === 'completed') {
    this.consultation.endTime = new Date();
    if (this.consultation.startTime) {
      this.consultation.actualDuration = Math.round(
        (this.consultation.endTime - this.consultation.startTime) / (1000 * 60)
      );
    }
  }
  
  return this.save();
};

// Method to add a note
appointmentSchema.methods.addNote = function(content, author, isPrivate = false) {
  this.notes.push({
    content,
    author,
    isPrivate
  });
  return this.save();
};

// Pre-save middleware to calculate costs
appointmentSchema.pre('save', function(next) {
  if (this.isModified('cost.basePrice') || this.isModified('cost.additionalCharges') || this.isModified('cost.insuranceCovered')) {
    this.calculateTotalCost();
  }
  next();
});

// Pre-populate patient and provider information
appointmentSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'patient',
    populate: {
      path: 'user',
      select: 'firstName lastName email phone'
    }
  }).populate({
    path: 'provider',
    populate: {
      path: 'user',
      select: 'firstName lastName email phone userType'
    }
  });
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);