import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket.service';
import { driverService, tripService } from '../services/api.service';
import StatusToggle from '../components/driver/StatusToggle';
import TripRequests from '../components/driver/TripRequests';
import ActiveTripDriver from '../components/driver/ActiveTripDriver';
import Earnings from '../components/driver/Earnings';
import TripHistory from '../components/driver/TripHistory';
import ReportIncident from '../components/driver/ReportIncident';
import Profile from '../components/Profile';
import Notifications from '../components/Notifications';
import Navbar from '../components/Navbar';

function DriverDashboard() {
  // All hooks must be at the top
  const { user, updateUser } = useAuthStore();
  const [activeTrip, setActiveTrip] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [locationTracking, setLocationTracking] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const isFetchingActiveTrip = useRef(false);
  const renderCount = useRef(0);

  // Debug: Track renders
  renderCount.current += 1;
  console.log(`🔄 DriverDashboard RENDER #${renderCount.current}`);
  console.log('   - activeTrip:', activeTrip?._id, 'status:', activeTrip?.status);
  console.log('   - user._id:', user._id);

  // Fetch active trip
  const fetchActiveTrip = useCallback(async () => {
    console.log('📞 fetchActiveTrip called, isFetching:', isFetchingActiveTrip.current);
    if (isFetchingActiveTrip.current) return;
    isFetchingActiveTrip.current = true;
    
    try {
      const response = await tripService.getActiveTrip();
      console.log('✅ fetchActiveTrip response:', response.trip?._id);
      setActiveTrip(response.trip);
      if (response.trip) {
        socketService.joinTrip(response.trip._id);
      }
    } catch (error) {
      console.error('❌ No active trip');
    } finally {
      isFetchingActiveTrip.current = false;
    }
  }, []);

  // Handle incoming trip request
  const handleTripRequest = useCallback((data) => {
    console.log('📨 handleTripRequest called');
    setPendingRequests(prev => [...prev, data.trip]);
    toast.info('New ride request received!');
  }, []);

  // Location tracking
  const startLocationTracking = useCallback(() => {
    console.log('📍 startLocationTracking called, locationTracking:', locationTracking);
    if (navigator.geolocation && !locationTracking) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Update local state
          setCurrentLocation({ lat: latitude, lng: longitude });
          
          // Send to server
          socketService.updateLocation(
            user._id,
            latitude,
            longitude,
            activeTrip?._id
          );
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            console.log('Location access denied by user');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
      setLocationTracking(watchId);
    }
  }, [locationTracking, user._id, activeTrip?._id]);

  const stopLocationTracking = useCallback(() => {
    console.log('🛑 stopLocationTracking called');
    if (locationTracking) {
      navigator.geolocation.clearWatch(locationTracking);
      setLocationTracking(null);
    }
  }, [locationTracking]);

  // Handle status change
  const handleStatusChange = async (newStatus) => {
    try {
      await driverService.updateStatus(newStatus);
      updateUser({ ...user, driverStatus: newStatus });
      toast.success(`Status updated to ${newStatus}`);
      
      // Start or stop location tracking based on status
      if (newStatus === 'offline') {
        stopLocationTracking();
      } else {
        startLocationTracking();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  // Handle accept trip
  const handleAcceptTrip = async (tripId, proposedFare) => {
    try {
      if (!proposedFare || proposedFare <= 0) {
        toast.error('Please provide a valid fare amount');
        return;
      }
      const response = await tripService.acceptTrip(tripId, proposedFare);
      setActiveTrip(response.trip);
      setPendingRequests(prev => prev.filter(t => t._id !== tripId));
      socketService.joinTrip(tripId);
      toast.success('Fare proposed! Waiting for student confirmation.');
    } catch (error) {
      console.error('Accept trip error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to accept ride';
      
      // Remove the trip from pending if it was cancelled or no longer valid
      if (error.response?.status === 400 || error.response?.status === 404) {
        setPendingRequests(prev => prev.filter(t => t._id !== tripId));
        toast.error(errorMessage + ' - Trip removed from list');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  // Handle reject trip
  const handleRejectTrip = async (tripId) => {
    try {
      await tripService.cancelTrip(tripId, 'Driver declined the ride request');
      setPendingRequests(prev => prev.filter(t => t._id !== tripId));
      toast.info('Ride request declined');
    } catch (error) {
      toast.error('Failed to decline ride request');
      console.error('Error declining trip:', error);
    }
  };

  // Handle update trip status
  const handleUpdateTripStatus = async (status) => {
    try {
      await tripService.updateTripStatus(activeTrip._id, status);
      
      if (status === 'completed') {
        toast.success('Trip completed successfully!');
        // Immediately clear the active trip so driver can accept new requests
        setActiveTrip(null);
      } else {
        setActiveTrip(prev => ({ ...prev, status }));
        toast.success('Trip status updated');
      }
    } catch (error) {
      toast.error('Failed to update trip status');
    }
  };

  // Handle confirm arrival
  const handleConfirmArrival = async () => {
    try {
      const response = await tripService.confirmTrip(activeTrip._id);
      setActiveTrip(response.trip);
      toast.success('Arrival confirmed! Student has been notified.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to confirm arrival');
    }
  };

  // Main useEffect for socket connections and listeners
  useEffect(() => {
    console.log('🎯 DriverDashboard useEffect RUNNING');
    console.log('   - Dependencies: user._id =', user._id);
    
    // Connect to socket
    socketService.connect(user._id);

    // Fetch active trip once
    fetchActiveTrip();

    // Listen for trip requests
    socketService.onTripRequest(handleTripRequest);

    // Listen for fare negotiation events
    // Student counter offer (when student counters driver's offer)
    socketService.socket?.off('fare_counter_offered');
    socketService.socket?.on('fare_counter_offered', (data) => {
      console.log('💰 Student counter offer received:', data);
      setActiveTrip(data.trip);
      toast.info('Student made a counter offer!');
      fetchActiveTrip();
    });

    // Driver counter offer (when driver counters)
    socketService.socket?.off('driver_counter_offered');
    socketService.socket?.on('driver_counter_offered', (data) => {
      console.log('💰 Driver made counter offer:', data);
      setActiveTrip(data.trip);
      fetchActiveTrip();
    });

    // Listen for student accepting fare
    socketService.socket?.off('fare_accepted');
    socketService.socket?.on('fare_accepted', (data) => {
      console.log('✅ Student accepted fare:', data);
      setActiveTrip(data.trip);
      toast.success('Student accepted your fare! Trip confirmed.');
      fetchActiveTrip();
    });
    
    // Listen for counter accepted
    socketService.socket?.off('counter_accepted');
    socketService.socket?.on('counter_accepted', (data) => {
      console.log('✅ Counter offer accepted:', data);
      setActiveTrip(data.trip);
      toast.success('Counter offer accepted! Trip confirmed.');
      fetchActiveTrip();
    });

    // Listen for trip cancellations
    socketService.socket?.on('trip_cancelled', (data) => {
      console.log('🚫 Trip cancelled event received:', data);
      const cancelledByStudent = data.trip?.cancelledBy?.role === 'student';
      const message = cancelledByStudent 
        ? 'Student cancelled the ride request.'
        : 'Trip cancelled.';
      if (cancelledByStudent) {
        toast.error(message);
      } else {
        toast.info(message);
      }
      setPendingRequests(prev => prev.filter(t => t._id !== data.trip._id));
      setActiveTrip(null);
      fetchActiveTrip();
    });

    // Listen for trip completion from student side
    socketService.socket?.on('trip_status_updated', (data) => {
      console.log('🔔 Trip status updated (driver):', data);
      if (data.status === 'completed') {
        // Clear active trip immediately when completed
        setActiveTrip(null);
        toast.success('Trip completed! Ready for new requests.');
      }
    });

    // Start location tracking if driver is available or on a trip
    if (user.driverStatus !== 'offline') {
      startLocationTracking();
    }

    // Cleanup function
    return () => {
      stopLocationTracking();
      socketService.socket?.off('fare_counter_offered');
      socketService.socket?.off('driver_counter_offered');
      socketService.socket?.off('fare_accepted');
      socketService.socket?.off('counter_accepted');
      socketService.socket?.off('trip_cancelled');
      socketService.socket?.off('trip_status_updated');
    };
  }, [user._id, user.driverStatus, fetchActiveTrip, handleTripRequest, startLocationTracking, stopLocationTracking]);

  // Check if user is approved
  if (!user.isApproved) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Account Pending Approval
          </h2>
          <p className="text-gray-600">
            Your account is currently under review. You will be notified once an admin approves your application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6">
        {/* Pending Approval Banner */}
        {!user.isApproved && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-lg shadow-md">
            <div className="flex items-center">
              <svg className="w-6 h-6 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-bold">Account Pending Approval</p>
                <p className="text-sm">Your account is currently under review by an administrator. You will be able to accept trips once approved.</p>
              </div>
            </div>
          </div>
        )}
        
        <StatusToggle
          currentStatus={user.driverStatus}
          onStatusChange={handleStatusChange}
        />

        <Routes>
          <Route
            path="/"
            element={
              <>
                {/* Show TripRequests if no active trip OR if trip is still pending */}
                {!activeTrip || activeTrip.status === 'pending' ? (
                  <TripRequests
                    requests={activeTrip && activeTrip.status === 'pending' ? [activeTrip, ...pendingRequests.filter(req => req.status === 'pending')] : pendingRequests.filter(req => req.status === 'pending')}
                    onAccept={handleAcceptTrip}
                    onReject={handleRejectTrip}
                  />
                ) : (
                  <ActiveTripDriver
                    trip={activeTrip}
                    onUpdateStatus={handleUpdateTripStatus}
                    onConfirmArrival={handleConfirmArrival}
                    onAcceptTrip={handleAcceptTrip}
                    driverLocation={currentLocation}
                    onUpdate={fetchActiveTrip}
                  />
                )}
              </>
            }
          />
          <Route path="/earnings" element={<Earnings />} />
          <Route path="/history" element={<TripHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

export default DriverDashboard;