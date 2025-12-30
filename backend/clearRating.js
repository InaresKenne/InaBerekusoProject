const mongoose = require('mongoose');
require('dotenv').config();

const Trip = require('./models/Trip');

async function clearRating() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Find the trip that needs rating cleared
    const trip = await Trip.findOne({ status: 'completed' }).sort({ completedAt: -1 });
    
    if (trip) {
      console.log('Found trip:', trip._id);
      console.log('Current studentRating:', trip.studentRating);
      
      trip.studentRating = undefined;
      trip.studentReview = undefined;
      await trip.save();
      
      console.log('✅ Rating cleared! You can now test the rating feature again.');
    } else {
      console.log('No completed trips found');
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

clearRating();
