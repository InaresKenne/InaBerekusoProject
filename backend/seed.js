require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});

    console.log('Creating seed data...');

    // Create Admin
    const admin = await User.create({
      email: 'admin@inaberekuso.com',
      password: 'admin123',
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phoneNumber: '+233501234567',
      isEmailVerified: true,
      isApproved: true,
      isActive: true
    });
    console.log('✅ Admin created:', admin.email);

    // Create Students
    const student1 = await User.create({
      email: 'john.doe@ashesi.edu.gh',
      password: 'password123',
      role: 'student',
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+233501234568',
      studentId: '12345678',
      isEmailVerified: true,
      isApproved: true,
      isActive: true
    });
    console.log('✅ Student created:', student1.email);

    const student2 = await User.create({
      email: 'jane.smith@ashesi.edu.gh',
      password: 'password123',
      role: 'student',
      firstName: 'Jane',
      lastName: 'Smith',
      phoneNumber: '+233501234569',
      studentId: '87654321',
      isEmailVerified: true,
      isApproved: true,
      isActive: true
    });
    console.log('✅ Student created:', student2.email);

    // Create Drivers
    const driver1 = await User.create({
      email: 'kwame.driver@example.com',
      password: 'password123',
      role: 'driver',
      firstName: 'Kwame',
      lastName: 'Mensah',
      phoneNumber: '+233501234570',
      vehicleType: 'car',
      vehicleMake: 'Toyota',
      vehicleModel: 'Corolla',
      vehicleColor: 'Black',
      licensePlate: 'GR-1234-21',
      isEmailVerified: true,
      isApproved: true,
      isActive: true,
      driverStatus: 'available',
      currentLocation: {
        type: 'Point',
        coordinates: [-0.1870, 5.7507] // Approximate Berekuso coordinates
      }
    });
    console.log('✅ Driver created:', driver1.email);

    const driver2 = await User.create({
      email: 'kofi.driver@example.com',
      password: 'password123',
      role: 'driver',
      firstName: 'Kofi',
      lastName: 'Asante',
      phoneNumber: '+233501234571',
      vehicleType: 'car',
      vehicleMake: 'Honda',
      vehicleModel: 'Civic',
      vehicleColor: 'White',
      licensePlate: 'GR-5678-21',
      isEmailVerified: true,
      isApproved: true,
      isActive: true,
      driverStatus: 'available',
      currentLocation: {
        type: 'Point',
        coordinates: [-0.1880, 5.7517]
      }
    });
    console.log('✅ Driver created:', driver2.email);

    // Create Moto Riders
    const motoRider1 = await User.create({
      email: 'yaw.okada@example.com',
      password: 'password123',
      role: 'moto_rider',
      firstName: 'Yaw',
      lastName: 'Boateng',
      phoneNumber: '+233501234572',
      vehicleType: 'motorcycle',
      vehicleMake: 'Suzuki',
      vehicleModel: 'GS125',
      vehicleColor: 'Red',
      licensePlate: 'M-9876-21',
      isEmailVerified: true,
      isApproved: true,
      isActive: true,
      driverStatus: 'available',
      currentLocation: {
        type: 'Point',
        coordinates: [-0.1860, 5.7497]
      }
    });
    console.log('✅ Moto Rider created:', motoRider1.email);

    // Create Pending Driver (not approved yet)
    const pendingDriver = await User.create({
      email: 'pending.driver@example.com',
      password: 'password123',
      role: 'driver',
      firstName: 'Pending',
      lastName: 'Driver',
      phoneNumber: '+233501234573',
      vehicleType: 'car',
      vehicleMake: 'Nissan',
      vehicleModel: 'Sentra',
      vehicleColor: 'Blue',
      licensePlate: 'GR-1111-21',
      isEmailVerified: true,
      isApproved: false,
      isActive: true
    });
    console.log('✅ Pending Driver created:', pendingDriver.email);

    console.log('\n🎉 Seed data created successfully!');
    console.log('\n📝 Test Accounts:');
    console.log('-------------------');
    console.log('Admin:');
    console.log('  Email: admin@inaberekuso.com');
    console.log('  Password: admin123');
    console.log('\nStudent 1:');
    console.log('  Email: john.doe@ashesi.edu.gh');
    console.log('  Password: password123');
    console.log('\nStudent 2:');
    console.log('  Email: jane.smith@ashesi.edu.gh');
    console.log('  Password: password123');
    console.log('\nDriver 1:');
    console.log('  Email: kwame.driver@example.com');
    console.log('  Password: password123');
    console.log('\nDriver 2:');
    console.log('  Email: kofi.driver@example.com');
    console.log('  Password: password123');
    console.log('\nMoto Rider:');
    console.log('  Email: yaw.okada@example.com');
    console.log('  Password: password123');
    console.log('\nPending Driver (needs approval):');
    console.log('  Email: pending.driver@example.com');
    console.log('  Password: password123');
    console.log('-------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
