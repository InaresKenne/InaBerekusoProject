import { useState } from 'react';
import { FiUser, FiMapPin, FiCheck, FiX, FiDollarSign } from 'react-icons/fi';

function TripRequests({ requests, onAccept, onReject }) {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [proposedFare, setProposedFare] = useState('');

  const handleAcceptClick = (tripId) => {
    setSelectedTrip(tripId);
    setProposedFare('');
  };

  const handleConfirmAccept = (tripId) => {
    const fareValue = parseFloat(proposedFare);
    if (!proposedFare || proposedFare.trim() === '' || fareValue <= 0 || isNaN(fareValue)) {
      alert('Please enter a valid fare amount (must be greater than 0)');
      return;
    }
    onAccept(tripId, fareValue);
    setSelectedTrip(null);
    setProposedFare('');
  };

  const handleCancelAccept = () => {
    setSelectedTrip(null);
    setProposedFare('');
  };

  if (requests.length === 0) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-600 text-lg">No pending ride requests</p>
        <p className="text-gray-500 mt-2">Make sure your status is set to "Available"</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Ride Requests</h2>
      
      <div className="space-y-4">
        {requests.map((request) => (
          <div key={request._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  {request.student?.profilePhoto ? (
                    <img
                      src={request.student.profilePhoto}
                      alt={request.student.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-6 h-6 text-gray-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-lg">
                    {request.student?.firstName} {request.student?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{request.student?.phoneNumber}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-start">
                <FiMapPin className="w-5 h-5 mr-2 mt-1 text-green-500" />
                <div>
                  <p className="font-medium">Pickup Location</p>
                  <p className="text-gray-600">{request.pickupLocation.address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiMapPin className="w-5 h-5 mr-2 mt-1 text-red-500" />
                <div>
                  <p className="font-medium">Dropoff Location</p>
                  <p className="text-gray-600">{request.dropoffLocation.address}</p>
                </div>
              </div>
            </div>

            {/* Fare Input Section - Shows after Accept is clicked */}
            {selectedTrip === request._id && (
              <div className="mb-4 p-4 bg-blue-50 border-2 border-primary rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💰 Enter Your Proposed Fare (GH₵)
                </label>
                <div className="relative">
                  <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="number"
                    value={proposedFare}
                    onChange={(e) => setProposedFare(e.target.value)}
                    placeholder="e.g., 25 cedis"
                    className="w-full pl-10 pr-4 py-3 border-2 border-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg font-semibold"
                    min="0"
                    step="0.5"
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  💡 The student will be able to accept, negotiate, or decline your fare
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              {selectedTrip === request._id ? (
                <>
                  <button
                    onClick={handleCancelAccept}
                    className="flex-1 btn-outline flex items-center justify-center"
                  >
                    <FiX className="w-5 h-5 mr-2" />
                    Cancel
                  </button>
                  <button
                    onClick={() => handleConfirmAccept(request._id)}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    <FiCheck className="w-5 h-5 mr-2" />
                    Send Offer
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onReject(request._id)}
                    className="flex-1 btn-outline flex items-center justify-center"
                  >
                    <FiX className="w-5 h-5 mr-2" />
                    Decline
                  </button>
                  <button
                    onClick={() => handleAcceptClick(request._id)}
                    className="flex-1 btn-primary flex items-center justify-center"
                  >
                    <FiCheck className="w-5 h-5 mr-2" />
                    Accept & Propose Fare
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TripRequests;
