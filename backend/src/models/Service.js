const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Service title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'Service description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  longDescription: {
    type: String,
    maxlength: [2000, 'Long description cannot be more than 2000 characters']
  },
  category: {
    type: String,
    required: true,
    enum: ['consultation', 'nursing', 'laboratory', 'physiotherapy', 'mental-health', 'vaccination', 'emergency']
  },
  subcategory: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Service price is required'],
    min: [0, 'Price cannot be negative']
  },
  originalPrice: {
    type: Number,
    min: [0, 'Original price cannot be negative']
  },
  discount: {
    type: Number,
    min: [0, 'Discount cannot be negative'],
    max: [100, 'Discount cannot be more than 100%']
  },
  duration: {
    value: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'minutes'
    }
  },
  images: [{
    url: String,
    alt: String,
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  features: [String],
  tags: [String],
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Review'
  }],
  isPopular: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  availability: {
    schedule: {
      type: String,
      default: '24/7'
    },
    timeSlots: [{
      start: String,
      end: String,
      days: [String]
    }]
  },
  providers: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  requirements: {
    age: {
      min: Number,
      max: Number
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'any'],
      default: 'any'
    },
    preparation: [String]
  },
  location: {
    type: {
      type: String,
      enum: ['home', 'clinic', 'online', 'any'],
      default: 'any'
    },
    areas: [String]
  },
  faqs: [{
    question: String,
    answer: String
  }],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  stats: {
    bookings: {
      type: Number,
      default: 0
    },
    completedBookings: {
      type: Number,
      default: 0
    },
    cancellations: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for calculated discount price
serviceSchema.virtual('discountedPrice').get(function() {
  if (this.originalPrice && this.discount) {
    return this.originalPrice * (1 - this.discount / 100);
  }
  return this.price;
});

// Virtual for savings amount
serviceSchema.virtual('savings').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return this.originalPrice - this.price;
  }
  return 0;
});

// Indexes
serviceSchema.index({ category: 1 });
serviceSchema.index({ isActive: 1 });
serviceSchema.index({ isPopular: 1 });
serviceSchema.index({ price: 1 });
serviceSchema.index({ 'rating.average': -1 });
serviceSchema.index({ createdAt: -1 });
serviceSchema.index({ slug: 1 });

// Text search index
serviceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Pre-save middleware to generate slug
serviceSchema.pre('save', function(next) {
  if (!this.slug || this.isModified('title')) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Pre-save middleware to calculate discount
serviceSchema.pre('save', function(next) {
  if (this.originalPrice && this.discount) {
    this.price = this.originalPrice * (1 - this.discount / 100);
  }
  next();
});

// Method to update rating
serviceSchema.methods.updateRating = async function() {
  const Review = mongoose.model('Review');
  const ratings = await Review.aggregate([
    { $match: { service: this._id } },
    { $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (ratings.length > 0) {
    this.rating.average = Math.round(ratings[0].averageRating * 10) / 10;
    this.rating.count = ratings[0].totalReviews;
  } else {
    this.rating.average = 0;
    this.rating.count = 0;
  }

  await this.save();
};

// Static method to get popular services
serviceSchema.statics.getPopularServices = function(limit = 10) {
  return this.find({ isActive: true, isPopular: true })
    .sort({ 'rating.average': -1, 'stats.bookings': -1 })
    .limit(limit);
};

// Static method to search services
serviceSchema.statics.searchServices = function(query, filters = {}) {
  const searchQuery = { isActive: true };

  if (query) {
    searchQuery.$text = { $search: query };
  }

  if (filters.category) {
    searchQuery.category = filters.category;
  }

  if (filters.minPrice || filters.maxPrice) {
    searchQuery.price = {};
    if (filters.minPrice) searchQuery.price.$gte = filters.minPrice;
    if (filters.maxPrice) searchQuery.price.$lte = filters.maxPrice;
  }

  if (filters.rating) {
    searchQuery['rating.average'] = { $gte: filters.rating };
  }

  return this.find(searchQuery).sort({ score: { $meta: 'textScore' } });
};

module.exports = mongoose.model('Service', serviceSchema);