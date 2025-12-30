import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { tripService } from '../../services/api.service';
import socketService from '../../services/socket.service';
import TripMap from '../TripMap';
import TripChat from '../TripChat';
import FareNegotiation from './FareNegotiation';
import RateDriver from './RateDriver';
import { FiUser, FiPhone, FiMapPin, FiNavigation, FiX } from 'react-icons/fi';

function ActiveTrip({ trip, onUpdate, onRatingComplete }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [driverLocation, setDriverLocation] = useState(null);

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'Waiting for driver to accept...',
      fare_proposed: 'Driver has proposed a fare',
      accepted: 'Driver accepted your request',
      driver_on_way: 'Driver is on the way',
      driver_arrived: 'Driver has arrived',
      in_progress: 'Trip in progress',
      completed: 'Trip completed'
    };
    return statusMap[status] || status;
  };

  // Debug: Log trip status (after function is defined)
  console.log('🎯 ActiveTrip - Current trip status:', trip.status);
  console.log('🎯 ActiveTrip - Status text:', getStatusText(trip.status));

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'bg-yellow-500',
      fare_proposed: 'bg-purple-500',
      accepted: 'bg-blue-500',
      driver_on_way: 'bg-indigo-500',
      driver_arrived: 'bg-green-500',
      in_progress: 'bg-blue-600',
      completed: 'bg-gray-500'
    };
    return colorMap[status] || 'bg-gray-500';
  };

  const handleCancel = async () => {
    try {
      await tripService.cancelTrip(trip._id, cancelReason);
      setShowCancelModal(false);
      toast.success('Trip cancelled');
      onUpdate();
    } catch (error) {
      toast.error('Failed to cancel trip');
    }
  };

  // Listen for driver location updates
  useEffect(() => {
    const handleLocationUpdate = (data) => {
      if (data.tripId === trip._id) {
        setDriverLocation({
          lat: data.latitude,
          lng: data.longitude
        });
      }
    };

    socketService.onLocationUpdate(handleLocationUpdate);

    return () => {
      // Cleanup if needed
    };
  }, [trip._id]);

  // Debug logging for rating form visibility
  console.log('🎯 ActiveTrip render - trip.status:', trip.status);
  console.log('🎯 ActiveTrip render - trip.studentRating:', trip.studentRating);
  console.log('🎯 Should show rating form?', trip.status === 'completed' && !trip.studentRating);

  // Only show RateDriver if the trip is completed (by the driver) and not yet rated by the student
  const showRating = trip.status === 'completed' && !trip.studentRating;

  return (
    <div className="max-w-4xl mx-auto">
      {showRating && (
        <div className="mb-6">
          <RateDriver trip={trip} onRated={onRatingComplete || onUpdate} />
        </div>
      )}

      {/* Fare Negotiation */}
      {(trip.status === 'fare_proposed' || trip.fareStatus === 'proposed' || trip.fareStatus === 'negotiating') && (
        <div className="mb-6">
          <FareNegotiation 
            trip={trip} 
            onFareAccepted={onUpdate}
            onFareRejected={onUpdate}
          />
        </div>
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Active Trip</h2>
          <span className={`${getStatusColor(trip.status)} text-white px-4 py-2 rounded-full text-sm font-semibold`}>
            {getStatusText(trip.status)}
          </span>
        </div>

        {/* Live Map */}
        {trip.status !== 'completed' && trip.status !== 'fare_proposed' && (
          <div className="mb-6">
            <h3 className="font-semibold text-lg mb-3">Live Tracking</h3>
            <TripMap
              driverLocation={driverLocation}
              pickupLocation={trip.pickupLocation?.coordinates ? {
                lat: trip.pickupLocation.coordinates[1],
                lng: trip.pickupLocation.coordinates[0]
              } : null}
              dropoffLocation={trip.dropoffLocation?.coordinates ? {
                lat: trip.dropoffLocation.coordinates[1],
                lng: trip.dropoffLocation.coordinates[0]
              } : null}
              center={driverLocation || (trip.pickupLocation?.coordinates ? {
                lat: trip.pickupLocation.coordinates[1],
                lng: trip.pickupLocation.coordinates[0]
              } : null)}
            />
          </div>
        )}

        {/* Driver Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Driver Information</h3>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
              {trip.driver?.profilePhoto ? (
                <img
                  src={trip.driver.profilePhoto}
                  alt={trip.driver.firstName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <FiUser className="w-8 h-8 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {trip.driver?.firstName} {trip.driver?.lastName}
              </p>
              <div className="flex items-center text-gray-600">
                <FiPhone className="w-4 h-4 mr-2" />
                {trip.driver?.phoneNumber}
              </div>
            </div>
          </div>

          {trip.driver?.vehicleMake && (
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center">
                <FiNavigation className="w-4 h-4 mr-2" />
                {trip.driver.vehicleMake} {trip.driver.vehicleModel} - {trip.driver.vehicleColor}
              </div>
              <div className="font-mono bg-white px-3 py-1 rounded inline-block">
                {trip.driver.licensePlate}
              </div>
            </div>
          )}
        </div>

        {/* Trip Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiMapPin className="inline w-4 h-4 mr-1" />
              Pickup Location
            </label>
            <p className="text-gray-900">{trip.pickupLocation.address}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FiMapPin className="inline w-4 h-4 mr-1" />
              Dropoff Location
            </label>
            <p className="text-gray-900">{trip.dropoffLocation.address}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          {!['completed', 'cancelled'].includes(trip.status) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="flex-1 btn-danger"
            >
              Cancel Trip
            </button>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6">Cancel Trip</h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="input-field"
                rows="4"
                placeholder="Please provide a reason..."
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 btn-outline"
              >
                Keep Trip
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 btn-danger"
              >
                Cancel Trip
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Trip Chat */}
      {trip.status !== 'completed' && trip.status !== 'cancelled' && (
        <TripChat 
          tripId={trip._id} 
          otherUser={trip.driver} 
        />
      )}
    </div>
  );
}

export default ActiveTrip;
