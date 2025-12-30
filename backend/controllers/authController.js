const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { uploadToCloudinary } = require('../config/cloudinary');

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, phoneNumber, studentId, vehicleType, vehicleModel, licensePlate } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // For students, validate Ashesi email
    if (role === 'student' && !email.endsWith('@ashesi.edu.gh')) {
      return res.status(400).json({
        success: false,
        message: 'Students must use their Ashesi email address'
      });
    }

    // Handle photo uploads if files are provided
    let profilePhotoUrl = null;
    let vehiclePhotoUrl = null;

    if (req.files) {
      // Upload profile photo
      if (req.files.profilePhoto && req.files.profilePhoto[0]) {
        try {
          const profileResult = await uploadToCloudinary(req.files.profilePhoto[0].buffer, 'inaberekuso/profiles');
          profilePhotoUrl = profileResult.secure_url;
        } catch (uploadError) {
          console.error('Profile photo upload error:', uploadError);
        }
      }

      // Upload vehicle photo for drivers/riders
      if (req.files.vehiclePhoto && req.files.vehiclePhoto[0] && (role === 'driver' || role === 'moto_rider')) {
        try {
          const vehicleResult = await uploadToCloudinary(req.files.vehiclePhoto[0].buffer, 'inaberekuso/vehicles');
          vehiclePhotoUrl = vehicleResult.secure_url;
        } catch (uploadError) {
          console.error('Vehicle photo upload error:', uploadError);
        }
      }
    }

    // Create verification token
    const verificationToken = crypto.randomBytes(20).toString('hex');
    const verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    // Create user object
    const userData = {
      email,
      password,
      role,
      firstName,
      lastName,
      phoneNumber,
      studentId: role === 'student' ? studentId : undefined,
      profilePhoto: profilePhotoUrl,
      verificationToken,
      verificationTokenExpire
    };

    // Add vehicle details for drivers/riders
    if (role === 'driver' || role === 'moto_rider') {
      userData.vehicleDetails = {
        type: vehicleType,
        model: vehicleModel,
        licensePlate: licensePlate,
        photo: vehiclePhotoUrl
      };
    }

    // Create user
    const user = await User.create(userData);

    // Send verification email (optional - skip if email not configured)
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_USER !== 'your_email@gmail.com') {
        const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${verificationToken}`;
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: email,
          subject: 'InaBerekuso - Verify Your Email',
          html: `
            <h1>Welcome to InaBerekuso!</h1>
            <p>Hi ${firstName},</p>
            <p>Please click the link below to verify your email address:</p>
            <a href="${verificationUrl}">${verificationUrl}</a>
            <p>This link will expire in 24 hours.</p>
          `
        };
        await transporter.sendMail(mailOptions);
      }
    } catch (emailError) {
      console.log('Email sending skipped or failed:', emailError.message);
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user and include password
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    // Check if user is approved (all non-admin users need approval)
    if (user.role !== 'admin' && !user.isApproved) {
      // Still allow login but send approval status
      const token = generateToken(user._id);
      return res.status(200).json({
        success: true,
        token,
        user: user.getPublicProfile(),
        pendingApproval: true,
        message: 'Your account is pending admin approval. You will be notified once approved.'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phoneNumber', 'emergencyContact'];
    const updates = {};

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      user: user.getPublicProfile()
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during profile update',
      error: error.message
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password');

    // Check current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error during password change',
      error: error.message
    });
  }
};
