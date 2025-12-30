import api from '../utils/api';

export const authService = {
  // Register new user
  register: async (userData) => {
    const headers = userData instanceof FormData 
      ? { 'Content-Type': 'multipart/form-data' } 
      : {};
    const response = await api.post('/auth/register', userData, { headers });
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Update profile
  updateProfile: async (data) => {
    const response = await api.put('/auth/profile', data);
    return response.data;
  },

  // Change password
  changePassword: async (data) => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.get(`/auth/verify-email/${token}`);
    return response.data;
  }
};

export const driverService = {
  // Get available drivers
  getAvailableDrivers: async (location) => {
    const response = await api.get('/drivers/available', { params: location });
    return response.data;
  },

  // Get driver details
  getDriverDetails: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },

  // Update driver status
  updateStatus: async (status) => {
    const response = await api.put('/drivers/status', { status });
    return response.data;
  },

  // Update location
  updateLocation: async (location) => {
    const response = await api.put('/drivers/location', location);
    return response.data;
  },

  // Upload vehicle photo
  uploadVehiclePhoto: async (formData) => {
    const response = await api.post('/drivers/vehicle-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Upload profile photo
  uploadProfilePhoto: async (file) => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await api.post('/drivers/profile-photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Update vehicle details
  updateVehicleDetails: async (data) => {
    const response = await api.put('/drivers/vehicle', data);
    return response.data;
  },

  // Get earnings
  getEarnings: async () => {
    const response = await api.get('/drivers/earnings/details');
    return response.data;
  },

  // Get driver trips
  getDriverTrips: async (page = 1) => {
    const response = await api.get('/drivers/trips/history', { params: { page } });
    return response.data;
  }
};

export const tripService = {
  // Create trip
  createTrip: async (tripData) => {
    const response = await api.post('/trips', tripData);
    return response.data;
  },

  // Accept trip
  acceptTrip: async (tripId, proposedFare) => {
    const response = await api.put(`/trips/${tripId}/accept`, { proposedFare });
    return response.data;
  },

  // Accept proposed fare (Student)
  acceptFare: async (tripId) => {
    const response = await api.put(`/trips/${tripId}/accept-fare`);
    return response.data;
  },

  // Reject proposed fare (Student)
  rejectFare: async (tripId) => {
    const response = await api.put(`/trips/${tripId}/reject-fare`);
    return response.data;
  },

  // Counter offer fare (Student)
  counterFare: async (tripId, counterAmount) => {
    const response = await api.put(`/trips/${tripId}/counter-fare`, { counterAmount });
    return response.data;
  },

  // Accept counter offer (Driver)
  acceptCounterOffer: async (tripId) => {
    const response = await api.put(`/trips/${tripId}/accept-counter`);
    return response.data;
  },

  // Driver counter offer (Driver makes new counter)
  driverCounterOffer: async (tripId, counterAmount) => {
    const response = await api.put(`/trips/${tripId}/driver-counter`, { counterAmount });
    return response.data;
  },

  // Rate completed trip (Student)
  rateTrip: async (tripId, rating, review) => {
    const response = await api.put(`/trips/${tripId}/rate`, { rating, review });
    return response.data;
  },

  skipRating: async (tripId) => {
    const response = await api.put(`/trips/${tripId}/skip-rating`);
    return response.data;
  },

  // Confirm arrival at pickup
  confirmTrip: async (tripId) => {
    const response = await api.put(`/trips/${tripId}/confirm`);
    return response.data;
  },

  // Update trip status
  updateTripStatus: async (tripId, status) => {
    const response = await api.put(`/trips/${tripId}/status`, { status });
    return response.data;
  },

  // Cancel trip
  cancelTrip: async (tripId, reason) => {
    const response = await api.put(`/trips/${tripId}/cancel`, { reason });
    return response.data;
  },

  // Rate trip
  rateTrip: async (tripId, rating, review) => {
    const response = await api.put(`/trips/${tripId}/rate`, { rating, review });
    return response.data;
  },

  // Get trip history
  getTripHistory: async (page = 1) => {
    const response = await api.get('/trips/history', { params: { page } });
    return response.data;
  },

  // Get active trip
  getActiveTrip: async () => {
    const response = await api.get('/trips/active');
    return response.data;
  },

  // Share trip
  shareTrip: async (tripId, contacts) => {
    const response = await api.put(`/trips/${tripId}/share`, { contacts });
    return response.data;
  }
};

export const adminService = {
  // Get all users
  getAllUsers: async (filters = {}) => {
    const response = await api.get('/admin/users', { params: filters });
    return response.data;
  },

  // Approve user
  approveUser: async (userId, isApproved, rejectionReason = '') => {
    const response = await api.put(`/admin/users/${userId}/approve`, { 
      isApproved,
      rejectionReason 
    });
    return response.data;
  },

  // Toggle user active status
  toggleUserActive: async (userId) => {
    const response = await api.put(`/admin/users/${userId}/toggle-active`);
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/admin/statistics');
    return response.data;
  },

  // Get reports
  getReports: async (filters = {}) => {
    const response = await api.get('/admin/reports', { params: filters });
    return response.data;
  },

  // Update report
  updateReport: async (reportId, data) => {
    const response = await api.put(`/admin/reports/${reportId}`, data);
    return response.data;
  },

  // Send announcement
  sendAnnouncement: async (data) => {
    const response = await api.post('/admin/announcements', data);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Block/unblock user
  blockUser: async (userId, isBlocked) => {
    const response = await api.put(`/admin/users/${userId}/block`, { isBlocked });
    return response.data;
  },

  // Get all earnings
  getAllEarnings: async () => {
    const response = await api.get('/admin/earnings');
    return response.data;
  },

  // Get all trips
  getAllTrips: async (filters = {}) => {
    const response = await api.get('/admin/trips', { params: filters });
    return response.data;
  }
};

// Report Service
export const reportService = {
  // Create a report
  createReport: async (data) => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  // Get user's reports
  getMyReports: async () => {
    const response = await api.get('/reports/my-reports');
    return response.data;
  }
};

// Notification Service
export const notificationService = {
  // Get user's notifications
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  }
};
