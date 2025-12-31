import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(userId) {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        auth: {
          token: localStorage.getItem('token')
        }
      });

      this.socket.on('connect', () => {
        console.log('Socket connected');
        if (userId) {
          this.socket.emit('join', userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      this.socket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinTrip(tripId) {
    if (this.socket) {
      this.socket.emit('join_trip', tripId);
    }
  }

  leaveTrip(tripId) {
    if (this.socket) {
      this.socket.emit('leave_trip', tripId);
    }
  }

  sendMessage(tripId, senderId, receiverId, message) {
    if (this.socket) {
      this.socket.emit('send_message', {
        tripId,
        senderId,
        receiverId,
        message
      });
    }
  }

  updateLocation(driverId, latitude, longitude, tripId) {
    if (this.socket) {
      this.socket.emit('update_location', {
        driverId,
        latitude,
        longitude,
        tripId
      });
    }
  }

  // ✅ FIXED: Remove existing listeners before adding new ones
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new_message');
      this.socket.on('new_message', callback);
    }
  }

  onLocationUpdate(callback) {
    if (this.socket) {
      this.socket.off('location_updated');
      this.socket.on('location_updated', callback);
    }
  }

  onTripRequest(callback) {
    if (this.socket) {
      this.socket.off('trip_request');
      this.socket.on('trip_request', callback);
    }
  }

  onTripAccepted(callback) {
    if (this.socket) {
      this.socket.off('trip_accepted');
      this.socket.on('trip_accepted', callback);
    }
  }

  onTripStatusUpdated(callback) {
    if (this.socket) {
      this.socket.off('trip_status_updated');
      this.socket.on('trip_status_updated', callback);
    }
  }

  onTripCancelled(callback) {
    if (this.socket) {
      this.socket.off('trip_cancelled');
      this.socket.on('trip_cancelled', callback);
    }
  }

  onDriverStatusChanged(callback) {
    if (this.socket) {
      this.socket.off('driver_status_changed');
      this.socket.on('driver_status_changed', callback);
    }
  }

  offEvent(eventName) {
    if (this.socket) {
      this.socket.off(eventName);
    }
  }
}

export default new SocketService();