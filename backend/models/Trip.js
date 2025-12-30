const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  driver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'fare_proposed', 'accepted', 'driver_on_way', 'driver_arrived', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  pickupLocation: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  dropoffLocation: {
    address: String,
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  estimatedFare: {
    type: Number,
    default: 0
  },
  actualFare: {
    type: Number,
    default: 0
  },
  proposedFare: {
    type: Number,
    default: 0
  },
  fareStatus: {
    type: String,
    enum: ['pending', 'proposed', 'accepted', 'negotiating'],
    default: 'pending'
  },
  fareHistory: [{
    amount: Number,
    proposedBy: {
      type: String,
      enum: ['driver', 'student']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'mtn_mobile_money', 'vodafone_cash'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  distance: {
    type: Number, // in kilometers
    default: 0
  },
  duration: {
    type: Number, // in minutes
    default: 0
  },
  startTime: Date,
  endTime: Date,
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  studentRating: {
    type: Number,
    min: 1,
    max: 5
  },
  driverRating: {
    type: Number,
    min: 1,
    max: 5
  },
  studentReview: String,
  driverReview: String,
  isShared: {
    type: Boolean,
    default: false
  },
  sharedWith: [{
    name: String,
    phoneNumber: String
  }]
}, {
  timestamps: true
});

// Indexes for faster queries
tripSchema.index({ student: 1, createdAt: -1 });
tripSchema.index({ driver: 1, createdAt: -1 });
tripSchema.index({ status: 1 });

module.exports = mongoose.model('Trip', tripSchema);
