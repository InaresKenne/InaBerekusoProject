import { FiUser, FiMapPin, FiNavigation, FiCheckCircle, FiMessageCircle, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { useRef } from 'react';
import { tripService } from '../../services/api.service';
import TripMap from '../TripMap';
import TripChat from '../TripChat';
import CounterOfferNotice from './CounterOfferNotice';

function ActiveTripDriver({ trip, onUpdateStatus, onConfirmArrival, onAcceptTrip, driverLocation, onUpdate }) {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // Debug logging
  console.log('=== DRIVER ACTIVE TRIP DEBUG ===');
  console.log('🎨 ActiveTripDriver RENDER #' + renderCount.current);
  console.log('Trip ID:', trip._id);
  console.log('Trip status:', trip.status);
  console.log('Fare status:', trip.fareStatus);
  console.log('Proposed fare:', trip.proposedFare);
  console.log('Fare history:', trip.fareHistory);
  console.log('Props changed?', {
    tripId: trip._id,
    onUpdateStatus: typeof onUpdateStatus,
    onConfirmArrival: typeof onConfirmArrival,
    onAcceptTrip: typeof onAcceptTrip,
    driverLocation: driverLocation,
    onUpdate: typeof onUpdate
  });
  if (trip.fareHistory && trip.fareHistory.length > 0) {
    console.log('Last offer by:', trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy);
  }
  console.log('Show CounterOfferNotice?', trip.fareStatus === 'negotiating' && trip.fareHistory && trip.fareHistory.length > 0 && trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy === 'student');
  console.log('=====================================');
  
  const getNextAction = () => {
    const statusFlow = {
      fare_proposed: { label: 'Waiting for Student', status: null, disabled: true },
      accepted: { label: 'On My Way', status: 'driver_on_way' },
      driver_on_way: { label: 'Arrived at Pickup', status: 'driver_arrived', isConfirm: true },
      driver_arrived: { label: 'Start Trip', status: 'in_progress' },
      arrived: { label: 'Start Trip', status: 'in_progress' },
      in_progress: { label: 'Complete Trip', status: 'completed' }
    };
    return statusFlow[trip.status];
  };

  const nextAction = getNextAction();

  const handleAction = () => {
    console.log('🎬 handleAction called for status:', nextAction.status);
    if (nextAction.isAccept) {
      onAcceptTrip(trip._id);
    } else if (nextAction.isConfirm) {
      onConfirmArrival();
    } else {
      onUpdateStatus(nextAction.status);
    }
  };

  const studentLocation = trip.student?.location?.coordinates ? {
    lat: trip.student.location.coordinates[1],
    lng: trip.student.location.coordinates[0]
  } : (trip.pickupLocation?.coordinates ? {
    lat: trip.pickupLocation.coordinates[1],
    lng: trip.pickupLocation.coordinates[0]
  } : null);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Counter Offer Notice - Show only after student has made a counter offer */}
      {trip.fareStatus === 'negotiating' && trip.fareHistory && trip.fareHistory.length > 0 && trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy === 'student' && (
        <CounterOfferNotice trip={trip} onAcceptCounter={onUpdate} />
      )}

      <div className="card">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Active Trip</h2>

        {/* Live Map */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">Navigation</h3>
          <TripMap
            driverLocation={driverLocation}
            studentLocation={studentLocation}
            pickupLocation={trip.pickupLocation?.coordinates ? {
              lat: trip.pickupLocation.coordinates[1],
              lng: trip.pickupLocation.coordinates[0]
            } : null}
            dropoffLocation={trip.dropoffLocation?.coordinates ? {
              lat: trip.dropoffLocation.coordinates[1],
              lng: trip.dropoffLocation.coordinates[0]
            } : null}
            center={driverLocation || studentLocation}
          />
        </div>

        {/* Student Info */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-lg mb-4">Student Information</h3>
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
              {trip.student?.profilePhoto ? (
                <img
                  src={trip.student.profilePhoto}
                  alt={trip.student.firstName}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <FiUser className="w-8 h-8 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-lg">
                {trip.student?.firstName} {trip.student?.lastName}
              </p>
              <p className="text-gray-600">{trip.student?.phoneNumber}</p>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="space-y-4 mb-6">
          <div className="flex items-start">
            <FiMapPin className="w-5 h-5 mr-3 mt-1 text-green-500" />
            <div>
              <p className="font-medium">Pickup Location</p>
              <p className="text-gray-600">{trip.pickupLocation.address}</p>
            </div>
          </div>

          <div className="flex items-start">
            <FiMapPin className="w-5 h-5 mr-3 mt-1 text-red-500" />
            <div>
              <p className="font-medium">Dropoff Location</p>
              <p className="text-gray-600">{trip.dropoffLocation.address}</p>
            </div>
          </div>

          {trip.proposedFare > 0 && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-1">
                {trip.status === 'fare_proposed' ? 'Your Proposed Fare' : 'Agreed Fare'}
              </p>
              <p className="text-2xl font-bold text-primary">
                GH₵ {trip.proposedFare}
              </p>
            </div>
          )}
        </div>

        {/* Waiting Message */}
        {trip.status === 'fare_proposed' && trip.fareStatus === 'proposed' && (
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="animate-pulse text-center">
                <FiMessageCircle className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <p className="text-blue-800">
                  {trip.fareHistory && trip.fareHistory.length > 1 ? (
                    <>
                      ⏳ Waiting for student's response to your counter offer of <strong>GH₵ {trip.proposedFare}</strong>
                    </>
                  ) : (
                    <>
                      ⏳ Waiting for student to accept your proposed fare of <strong>GH₵ {trip.proposedFare}</strong>
                    </>
                  )}
                </p>
              </div>
            </div>
            {/* Cancel button available even while waiting */}
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to cancel this trip?')) {
                  try {
                    await tripService.rejectFare(trip._id);
                    toast.info('Trip cancelled');
                    onUpdate(null);
                  } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to cancel trip');
                  }
                }
              }}
              className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center font-semibold"
            >
              <FiX className="w-5 h-5 mr-2" />
              Cancel Trip
            </button>
          </div>
        )}

        {/* Actions */}
        {nextAction && !nextAction.disabled && (
          <button
            onClick={handleAction}
            className="w-full btn-primary flex items-center justify-center"
          >
            {nextAction.isConfirm ? (
              <FiCheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <FiNavigation className="w-5 h-5 mr-2" />
            )}
            {nextAction.label}
          </button>
        )}
      </div>

      {/* Trip Chat */}
      {trip.status !== 'completed' && trip.status !== 'cancelled' && (
        <TripChat 
          tripId={trip._id} 
          otherUser={trip.student} 
        />
      )}
    </div>
  );
}

export default ActiveTripDriver;
