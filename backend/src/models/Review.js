const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  service: {
    type: mongoose.Schema.ObjectId,
    ref: 'Service',
    required: true
  },
  appointment: {
    type: mongoose.Schema.ObjectId,
    ref: 'Appointment'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isApproved: {
    type: Boolean,
    default: true
  },
  helpfulCount: {
    type: Number,
    default: 0
  },
  reportCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better performance
reviewSchema.index({ service: 1, rating: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ createdAt: -1 });

// Prevent duplicate reviews from same user for same service
reviewSchema.index({ user: 1, service: 1 }, { unique: true });

// Populate user details when querying
reviewSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName avatar'
  });
  next();
});

// Update service rating after saving review
reviewSchema.post('save', async function() {
  const Service = mongoose.model('Service');
  const service = await Service.findById(this.service);
  if (service) {
    await service.updateRating();
  }
});

// Update service rating after removing review
reviewSchema.post('remove', async function() {
  const Service = mongoose.model('Service');
  const service = await Service.findById(this.service);
  if (service) {
    await service.updateRating();
  }
});

module.exports = mongoose.model('Review', reviewSchema);