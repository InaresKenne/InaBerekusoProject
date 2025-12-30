import { useState, useEffect, useCallback, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import socketService from '../services/socket.service';
import { driverService, tripService } from '../services/api.service';
import DriverList from '../components/student/DriverList';
import ActiveTrip from '../components/student/ActiveTrip';
import TripHistory from '../components/student/TripHistory';
import ReportIncident from '../components/student/ReportIncident';
import Profile from '../components/Profile';
import Notifications from '../components/Notifications';
import Navbar from '../components/Navbar';

function StudentDashboard() {
  const { user } = useAuthStore();
  const [drivers, setDrivers] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const isFetchingDrivers = useRef(false);
  const isFetchingActiveTrip = useRef(false);

  const fetchDrivers = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingDrivers.current) {
      console.log('⏭️  Already fetching drivers, skipping...');
      return;
    }
    
    console.log('🚗 Starting to fetch drivers...');
    isFetchingDrivers.current = true;
    
    try {
      // Get user's location if available
      if (navigator.geolocation) {
        console.log('📍 Requesting geolocation...');
        
        // Add timeout to geolocation request
        const locationPromise = new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            console.log('⏰ Geolocation timeout, fetching without location');
            reject(new Error('Geolocation timeout'));
          }, 5000); // 5 second timeout

          navigator.geolocation.getCurrentPosition(
            (position) => {
              clearTimeout(timeoutId);
              resolve(position);
            },
            (error) => {
              clearTimeout(timeoutId);
              reject(error);
            },
            { timeout: 5000, enableHighAccuracy: false }
          );
        });

        try {
          const position = await locationPromise;
          const { latitude, longitude } = position.coords;
          console.log('📍 Got location:', { latitude, longitude });
          const response = await driverService.getAvailableDrivers({ latitude, longitude });
          console.log('✅ Drivers response:', response);
          if (response.drivers && Array.isArray(response.drivers)) {
            setDrivers(response.drivers);
            console.log('✅ Set drivers:', response.drivers.length, 'drivers found');
          } else {
            console.error('❌ Invalid drivers data:', response.drivers);
            setDrivers([]);
          }
        } catch (geoError) {
          // If geolocation fails or times out, fetch all drivers
          console.log('⚠️  Geolocation failed, fetching all drivers:', geoError.message);
          const response = await driverService.getAvailableDrivers();
          console.log('✅ Drivers response (no location):', response);
          if (response.drivers && Array.isArray(response.drivers)) {
            setDrivers(response.drivers);
            console.log('✅ Set drivers:', response.drivers.length, 'drivers found');
          } else {
            setDrivers([]);
          }
        }
      } else {
        console.log('⚠️  Geolocation not available, fetching all drivers');
        const response = await driverService.getAvailableDrivers();
        console.log('✅ Drivers response (no geolocation):', response);
        if (response.drivers && Array.isArray(response.drivers)) {
          setDrivers(response.drivers);
          console.log('✅ Set drivers:', response.drivers.length, 'drivers found');
        } else {
          setDrivers([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching drivers:', error);
      toast.error('Failed to fetch drivers');
      setDrivers([]);
    } finally {
      console.log('🏁 Finished fetching drivers, resetting flag');
      isFetchingDrivers.current = false;
    }
  }, []);

  useEffect(() => {
    // Connect to socket
    socketService.connect(user._id);

    // Fetch initial data
    const initializeData = async () => {
      await fetchDrivers();
      await fetchActiveTrip();
      setLoading(false); // Ensure loading is set to false after both fetches
    };
    
    initializeData();

    // Listen for real-time updates
    socketService.onTripAccepted(handleTripAccepted);
    socketService.onTripStatusUpdated(handleTripStatusUpdate);
    socketService.onTripCancelled(handleTripCancelled);
    socketService.onDriverStatusChanged(handleDriverStatusChange);

    // Listen for fare negotiation events
    if (socketService.socket) {
      socketService.socket.off('fare_counter_offered');
      socketService.socket.on('fare_counter_offered', (data) => {
        console.log('fare_counter_offered event received:', data);
        setActiveTrip(data.trip);
        toast.info('A new fare negotiation is in progress!');
        fetchActiveTrip();
      });
      socketService.socket.off('counter_accepted');
      socketService.socket.on('counter_accepted', (data) => {
        console.log('counter_accepted event received:', data);
        setActiveTrip(data.trip);
        toast.success('Your fare negotiation was accepted!');
        fetchActiveTrip();
      });
    }

    return () => {
      socketService.offEvent('trip_accepted');
      socketService.offEvent('trip_status_updated');
      socketService.offEvent('trip_cancelled');
      socketService.offEvent('driver_status_changed');
      if (socketService.socket) {
        socketService.socket.off('fare_counter_offered');
        socketService.socket.off('counter_accepted');
      }
    };
  }, [user._id]); // fetchDrivers removed - it's stable with useCallback([])

  const fetchActiveTrip = useCallback(async () => {
    if (isFetchingActiveTrip.current) {
      console.log('⏭️  Already fetching active trip, skipping...');
      return;
    }
    
    isFetchingActiveTrip.current = true;
    try {
      console.log('📞 Fetching active trip...');
      const response = await tripService.getActiveTrip();
      console.log('✅ Active trip response:', response);
      console.log('   - Trip ID:', response.trip?._id);
      console.log('   - Trip status:', response.trip?.status);
      console.log('   - Fare status:', response.trip?.fareStatus);
      
      // Keep completed trips visible so student can rate
      if (response.trip) {
        const trip = response.trip;
        
        console.log('📊 Trip data received:');
        console.log('   - Trip ID:', trip._id);
        console.log('   - Status:', trip.status);
        console.log('   - studentRating:', trip.studentRating);
        console.log('   - Full trip object:', trip);
        
        // Only hide if completed AND already rated
        const isCompletedAndRated = trip.status === 'completed' && trip.studentRating;
        
        console.log('   - isCompletedAndRated:', isCompletedAndRated);
        console.log('   - Will show trip:', !isCompletedAndRated);
        
        if (isCompletedAndRated) {
          console.log('⏭️ Trip is completed and rated, clearing active trip');
          setActiveTrip(null);
        } else {
          console.log('✅ Setting active trip (will show rating form if completed)');
          setActiveTrip(trip);
          console.log('🔗 Trip found, joining trip room:', trip._id);
          socketService.joinTrip(trip._id);
        }
      } else {
        console.log('❌ No active trip found');
        setActiveTrip(null);
      }
    } catch (error) {
      console.error('❌ Error fetching active trip:', error);
      setActiveTrip(null);
    } finally {
      isFetchingActiveTrip.current = false;
    }
  }, []);

  const handleTripAccepted = (data) => {
    setActiveTrip(data.trip);
    socketService.joinTrip(data.trip._id);
    toast.success('Your ride request has been accepted!');
  };

  const handleTripStatusUpdate = (data) => {
    console.log('🔔 Trip status update received:', data);
    
    // Fetch the complete trip data to ensure everything is in sync
    fetchActiveTrip();
    
    const statusMessages = {
      'driver_on_way': 'Driver is on the way!',
      'driver_arrived': 'Driver has arrived at pickup location!',
      'in_progress': 'Trip started',
      'completed': 'Trip completed! Please rate your driver.'
    };
    
    if (statusMessages[data.status]) {
      toast.info(statusMessages[data.status]);
    }

    // Don't auto-clear completed trip - let student rate first
    // Rating component will handle cleanup after submission
  };

  const handleTripCancelled = (data) => {
    console.log('🚫 Trip cancelled event received:', data);
    setActiveTrip(null);
    
    // Show appropriate message based on who cancelled
    const cancelledByDriver = data.trip?.cancelledBy?.role === 'driver' || data.trip?.cancelledBy?.role === 'moto_rider';
    const message = cancelledByDriver 
      ? 'Driver declined your ride request. Please request another ride.'
      : 'Trip cancelled successfully.';
    
    if (cancelledByDriver) {
      toast.error(message);
    } else {
      toast.info(message);
    }
    
    fetchDrivers();
  };

  const handleDriverStatusChange = (data) => {
    setDrivers(prev =>
      prev.map(driver =>
        driver._id === data.driverId
          ? { ...driver, driverStatus: data.status }
          : driver
      )
    );
  };

  const handleRequestRide = useCallback(async ({ driverId, pickupLocation, dropoffLocation }) => {
    try {
      const response = await tripService.createTrip({
        driverId,
        pickupLocation,
        dropoffLocation
      });
      setActiveTrip(response.trip);
      toast.success('Ride request sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to request ride');
    }
  }, []);

  const handleRatingComplete = useCallback(() => {
    // After rating, clear active trip and refresh drivers. Rating UI will not show again for this trip.
    setActiveTrip(null);
    fetchDrivers();
  }, [fetchDrivers]);
  
  console.log('🎨 StudentDashboard render - activeTrip:', activeTrip?._id, 'status:', activeTrip?.status);
  console.log('   - Will show ActiveTrip component:', !!activeTrip);
  
  // Only show ActiveTrip if there is a valid active trip (not completed and rated and not cancelled)
  // Hide the trip UI if the trip is cancelled
  const shouldShowActiveTrip = !!activeTrip &&
    activeTrip.status !== 'cancelled' &&
    ((activeTrip.status !== 'completed') || (activeTrip.status === 'completed' && !activeTrip.studentRating));

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
                <p className="text-sm">Your account is currently under review by an administrator. You will be able to request rides once approved.</p>
              </div>
            </div>
          </div>
        )}
        <Routes>
          <Route
            path="/"
            element={
              shouldShowActiveTrip ? (
                <ActiveTrip 
                  trip={activeTrip} 
                  onUpdate={fetchActiveTrip}
                  onRatingComplete={handleRatingComplete}
                />
              ) : (
                <DriverList
                  drivers={drivers}
                  loading={loading}
                  onRequestRide={handleRequestRide}
                />
              )
            }
          />
          <Route path="/history" element={<TripHistory />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/report" element={<ReportIncident />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </div>
  );
}

export default StudentDashboard;
