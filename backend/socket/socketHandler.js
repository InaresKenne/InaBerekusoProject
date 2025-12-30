const Message = require('../models/Message');
const User = require('../models/User');

// Socket.IO connection handler
const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins their personal room
    socket.on('join', (userId) => {
      socket.join(userId);
      console.log(`User ${userId} joined their room`);
    });

    // Join trip room for real-time updates
    socket.on('join_trip', (tripId) => {
      socket.join(`trip_${tripId}`);
      console.log(`Socket ${socket.id} joined trip ${tripId}`);
    });

    // Leave trip room
    socket.on('leave_trip', (tripId) => {
      socket.leave(`trip_${tripId}`);
      console.log(`Socket ${socket.id} left trip ${tripId}`);
    });

    // Send message in trip - DEPRECATED: Use API endpoint POST /api/messages instead
    // This listener is disabled to prevent duplicate message creation
    socket.on('send_message', async (data) => {
      console.warn('send_message socket event is deprecated - use POST /api/messages endpoint');
      socket.emit('error', { message: 'Please use API endpoint to send messages' });
    });

    // Mark message as read
    socket.on('mark_read', async (messageId) => {
      try {
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Driver location update
    socket.on('update_location', async (data) => {
      try {
        const { driverId, latitude, longitude, tripId } = data;

        await User.findByIdAndUpdate(driverId, {
          currentLocation: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        });

        // Emit location update to trip room
        if (tripId) {
          io.to(`trip_${tripId}`).emit('location_updated', {
            driverId,
            location: { latitude, longitude }
          });
        }

        // Also emit to general driver location channel
        io.emit('driver_location_updated', {
          driverId,
          location: { latitude, longitude }
        });
      } catch (error) {
        console.error('Error updating location:', error);
      }
    });

    // Typing indicator
    socket.on('typing', (data) => {
      const { tripId, userId } = data;
      socket.to(`trip_${tripId}`).emit('user_typing', { userId });
    });

    socket.on('stop_typing', (data) => {
      const { tripId, userId } = data;
      socket.to(`trip_${tripId}`).emit('user_stop_typing', { userId });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};

module.exports = socketHandler;
