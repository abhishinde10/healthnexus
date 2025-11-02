const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Service = require('../models/Service');
const Review = require('../models/Review');
const cacheService = require('../utils/cache');

// @desc    Get all available services
// @route   GET /api/v1/services
// @access  Public
const getServices = asyncHandler(async (req, res, next) => {
  try {
    const {
      category,
      search,
      minPrice,
      maxPrice,
      rating,
      popular,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check cache first (unless bypassed)
    if (!req.query.bypassCache) {
      const cacheKey = cacheService.generateKey('services', 'list', {
        category, search, minPrice, maxPrice, rating, popular, page, limit, sortBy, sortOrder
      });
      
      const cachedServices = await cacheService.get(cacheKey);
      if (cachedServices) {
        return res.status(200).json({
          ...cachedServices,
          cached: true
        });
      }
    }

    // Build query
    let query = Service.find({ isActive: true });

    // Apply filters
    if (category) {
      query = query.where('category').equals(category);
    }

    if (search) {
      query = query.where({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    if (minPrice || maxPrice) {
      const priceFilter = {};
      if (minPrice) priceFilter.$gte = parseInt(minPrice);
      if (maxPrice) priceFilter.$lte = parseInt(maxPrice);
      query = query.where('price', priceFilter);
    }

    if (rating) {
      query = query.where('rating.average').gte(parseFloat(rating));
    }

    if (popular === 'true') {
      query = query.where('isPopular').equals(true);
    }

    // Count total documents
    const total = await Service.countDocuments(query.getQuery());

    // Apply sorting
    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;
    query = query.sort(sortOption);

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query = query.skip(skip).limit(parseInt(limit));

    // Populate related data
    query = query.populate('providers', 'firstName lastName rating specializations');

    // Execute query
    const services = await query;

    // If no services found in database, return fallback data
    if (services.length === 0 && page === 1) {
      const fallbackServices = await createFallbackServices();
      return res.status(200).json({
        success: true,
        count: fallbackServices.length,
        total: fallbackServices.length,
        totalPages: 1,
        currentPage: 1,
        data: fallbackServices
      });
    }

    const responseData = {
      success: true,
      count: services.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: services
    };

    // Cache the response for 5 minutes (unless bypassed)
    if (!req.query.bypassCache) {
      const cacheKey = cacheService.generateKey('services', 'list', {
        category, search, minPrice, maxPrice, rating, popular, page, limit, sortBy, sortOrder
      });
      await cacheService.set(cacheKey, responseData, 300);
    }

    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching services:', error);
    next(new ErrorResponse('Error fetching services', 500));
  }
});

// Helper function to create fallback services if database is empty
const createFallbackServices = async () => {
  const fallbackData = [
    {
      title: "Doctor Consultation",
      description: "Connect with certified doctors for expert medical advice and consultation.",
      category: "consultation",
      price: 299,
      originalPrice: 499,
      discount: 40,
      duration: { value: 30, unit: 'minutes' },
      tags: ["General Medicine", "Online", "24/7"],
      isPopular: true,
      images: [{ url: "/assets/images/service-consultation.svg", alt: "Doctor Consultation", isPrimary: true }],
      rating: { average: 4.8, count: 1250 },
      availability: { schedule: "24/7" }
    },
    {
      title: "Home Nursing Care",
      description: "Professional nursing care in the comfort of your home with trained nurses.",
      category: "nursing",
      price: 599,
      originalPrice: 799,
      discount: 25,
      duration: { value: 2, unit: 'hours' },
      tags: ["Home Visit", "Skilled Nurses", "24/7"],
      images: [{ url: "/assets/images/service-nursing.svg", alt: "Home Nursing Care", isPrimary: true }],
      rating: { average: 4.9, count: 856 },
      availability: { schedule: "6 AM - 10 PM" }
    },
    {
      title: "Lab Tests at Home",
      description: "Convenient home sample collection with accurate lab test results.",
      category: "laboratory",
      price: 199,
      originalPrice: 299,
      discount: 33,
      duration: { value: 15, unit: 'minutes' },
      tags: ["Home Collection", "Quick Results", "Certified Lab"],
      images: [{ url: "/assets/images/service-lab.svg", alt: "Lab Tests at Home", isPrimary: true }],
      rating: { average: 4.7, count: 2100 },
      availability: { schedule: "7 AM - 7 PM" }
    }
  ];

  try {
    const services = await Service.insertMany(fallbackData);
    return services;
  } catch (error) {
    console.error('Error creating fallback services:', error);
    return fallbackData; // Return raw data if database insertion fails
  }
};

// @desc    Get single service
// @route   GET /api/v1/services/:id
// @access  Public
const getService = asyncHandler(async (req, res, next) => {
  const services = [
    {
      id: 1,
      title: "Doctor Consultation",
      description: "Connect with certified doctors for expert medical advice and consultation. Our platform connects you with board-certified physicians who can provide comprehensive medical consultations from the comfort of your home.",
      longDescription: "Get expert medical advice from certified doctors through our secure platform. Our consultation service includes symptom assessment, diagnosis, treatment recommendations, prescription management, and follow-up care. All our doctors are board-certified and have extensive experience in their respective fields.",
      image: "/assets/images/service-consultation.svg",
      gallery: [
        "/assets/images/consultation-1.jpg",
        "/assets/images/consultation-2.jpg",
        "/assets/images/consultation-3.jpg"
      ],
      rating: 4.8,
      reviewCount: 1250,
      price: 299,
      originalPrice: 499,
      discount: 40,
      tags: ["General Medicine", "Online", "24/7"],
      isPopular: true,
      category: "consultation",
      duration: "30 minutes",
      availability: "24/7",
      features: [
        "Video/Audio consultation",
        "Digital prescription",
        "Medical record access",
        "Follow-up included",
        "Insurance accepted"
      ],
      faqs: [
        {
          question: "How does online consultation work?",
          answer: "You can book a consultation slot, join a secure video call with the doctor, discuss your symptoms, and receive digital prescriptions if needed."
        },
        {
          question: "Are the doctors certified?",
          answer: "Yes, all our doctors are board-certified and licensed to practice medicine in their respective specializations."
        }
      ]
    }
    // Add more detailed services as needed
  ];

  const serviceId = parseInt(req.params.id);
  const service = services.find(s => s.id === serviceId);

  if (!service) {
    return next(new ErrorResponse('Service not found', 404));
  }

  res.status(200).json({
    success: true,
    data: service
  });
});

// @desc    Get service categories
// @route   GET /api/v1/services/categories
// @access  Public
const getCategories = asyncHandler(async (req, res, next) => {
  const categories = [
    {
      id: 1,
      name: "Consultation",
      slug: "consultation",
      description: "Online and offline doctor consultations",
      icon: "🩺",
      serviceCount: 15
    },
    {
      id: 2,
      name: "Home Nursing",
      slug: "nursing",
      description: "Professional nursing care at home",
      icon: "👩‍⚕️",
      serviceCount: 8
    },
    {
      id: 3,
      name: "Laboratory",
      slug: "laboratory",
      description: "Home sample collection and lab tests",
      icon: "🧪",
      serviceCount: 25
    },
    {
      id: 4,
      name: "Physiotherapy",
      slug: "physiotherapy",
      description: "Physical therapy and rehabilitation",
      icon: "🏃‍♂️",
      serviceCount: 6
    },
    {
      id: 5,
      name: "Mental Health",
      slug: "mental-health",
      description: "Counseling and mental health support",
      icon: "🧠",
      serviceCount: 12
    },
    {
      id: 6,
      name: "Vaccination",
      slug: "vaccination",
      description: "Immunization and vaccination services",
      icon: "💉",
      serviceCount: 10
    }
  ];

  res.status(200).json({
    success: true,
    count: categories.length,
    data: categories
  });
});

// @desc    Book a service
// @route   POST /api/v1/services/:id/book
// @access  Private
const bookService = asyncHandler(async (req, res, next) => {
  const { 
    appointmentDate, 
    appointmentTime, 
    address, 
    notes, 
    preferredProvider,
    paymentIntentId
  } = req.body;

  const serviceNumericId = parseInt(req.params.id);

  // Verify Stripe PaymentIntent if provided
  let paymentVerified = false;
  if (paymentIntentId && process.env.STRIPE_SECRET_KEY) {
    try {
      const Stripe = require('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
      paymentVerified = ['succeeded', 'requires_capture'].includes(pi.status);
    } catch (e) {
      paymentVerified = false;
    }
  }

  // In real app: create Appointment/Order models. For now return a mocked booking.
  const booking = {
    id: Date.now(),
    serviceId: serviceNumericId,
    userId: req.user.id,
    appointmentDate,
    appointmentTime,
    address,
    notes,
    preferredProvider,
    paymentIntentId: paymentIntentId || null,
    status: paymentVerified ? 'confirmed' : 'pending',
    bookingReference: `HN${Date.now().toString().slice(-6)}`,
    createdAt: new Date()
  };

  return res.status(201).json({
    success: true,
    message: paymentVerified ? 'Service booked successfully' : 'Service booking pending payment',
    data: booking
  });
});

module.exports = {
  getServices,
  getService,
  getCategories,
  bookService
};