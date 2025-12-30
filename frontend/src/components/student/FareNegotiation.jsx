import { useState } from 'react';
import { FiDollarSign, FiCheck, FiX, FiMessageCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { tripService } from '../../services/api.service';

function FareNegotiation({ trip, onFareAccepted, onFareRejected }) {
  const [showCounter, setShowCounter] = useState(false);
  const [counterAmount, setCounterAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  // Debug logging
  console.log('=== STUDENT FARE NEGOTIATION DEBUG ===');
  console.log('Trip status:', trip.status);
  console.log('Fare status:', trip.fareStatus);
  console.log('Proposed fare:', trip.proposedFare);
  console.log('Fare history:', trip.fareHistory);
  if (trip.fareHistory && trip.fareHistory.length > 0) {
    console.log('Last offer by:', trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy);
  }
  console.log('Show waiting message?', trip.fareStatus === 'negotiating' && trip.fareHistory && trip.fareHistory.length > 0 && trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy === 'student');
  console.log('=========================================');

  const handleAcceptFare = async () => {
    setIsLoading(true);
    try {
      const response = await tripService.acceptFare(trip._id);
      toast.success('Fare accepted! Your driver is on the way.');
      onFareAccepted(response.trip);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept fare');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectFare = async () => {
    if (!window.confirm('Are you sure you want to reject this fare? The trip will be cancelled.')) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await tripService.rejectFare(trip._id);
      toast.info('Fare rejected. Trip cancelled.');
      onFareRejected(response.trip);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject fare');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCounterOffer = async () => {
    if (!counterAmount || counterAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setIsLoading(true);
    try {
      const response = await tripService.counterFare(trip._id, parseFloat(counterAmount));
      toast.success('Counter offer sent! Waiting for driver response.');
      setWaitingForDriver(true);
      onFareAccepted(response.trip);
      setShowCounter(false);
      setCounterAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send counter offer');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-primary">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
          <FiDollarSign className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {trip.fareHistory?.length > 1 ? 'Driver Made a Counter Offer' : 'Fare Proposal from Driver'}
        </h3>
        <p className="text-gray-600">
          {trip.driver?.firstName} {trip.driver?.lastName} has proposed a fare
        </p>
      </div>

      {/* Show negotiation history if there are multiple offers */}
      {trip.fareHistory && trip.fareHistory.length > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Negotiation History:</p>
          <div className="space-y-1">
            {trip.fareHistory.map((history, index) => (
              <p key={index} className="text-sm text-gray-600">
                {index + 1}. {history.proposedBy === 'driver' ? '🚗 Driver' : '👤 You'}: GH₵ {history.amount?.toFixed(2)}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 mb-6 text-center">
        <p className="text-sm text-gray-600 mb-2">Current Proposed Fare</p>
        <p className="text-5xl font-bold text-primary">
          GH₵ {trip.proposedFare?.toFixed(2)}
        </p>
      </div>

      {/* Show waiting message when student sent counter and waiting for driver */}
      {trip.fareStatus === 'negotiating' && trip.fareHistory && trip.fareHistory.length > 0 && trip.fareHistory[trip.fareHistory.length - 1]?.proposedBy === 'student' ? (
        <div className="space-y-4">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
            <div className="animate-pulse">
              <FiMessageCircle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
              <p className="text-lg font-semibold text-gray-800 mb-2">
                Waiting for Driver's Response
              </p>
              <p className="text-sm text-gray-600">
                Your counter offer of GH₵ {trip.proposedFare?.toFixed(2)} has been sent.
                <br />
                The driver will respond shortly.
              </p>
            </div>
          </div>
          {/* Cancel button available even while waiting */}
          <button
            onClick={handleRejectFare}
            disabled={isLoading}
            className="w-full btn-danger flex items-center justify-center py-3"
          >
            <FiX className="w-5 h-5 mr-2" />
            Cancel Trip
          </button>
        </div>
      ) : !showCounter ? (
        <div className="space-y-3">
          <button
            onClick={handleAcceptFare}
            disabled={isLoading}
            className="w-full btn-primary flex items-center justify-center py-3"
          >
            <FiCheck className="w-5 h-5 mr-2" />
            Accept Fare
          </button>
          
          <button
            onClick={() => setShowCounter(true)}
            disabled={isLoading}
            className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
          >
            <FiMessageCircle className="w-5 h-5 mr-2" />
            Make Counter Offer
          </button>
          
          <button
            onClick={handleRejectFare}
            disabled={isLoading}
            className="w-full btn-danger flex items-center justify-center py-3"
          >
            <FiX className="w-5 h-5 mr-2" />
            Reject & Cancel Trip
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Counter Offer (GH₵)
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder="Enter amount in cedis"
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-lg"
                min="0"
                step="0.5"
                autoFocus
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowCounter(false);
                setCounterAmount('');
              }}
              disabled={isLoading}
              className="flex-1 btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleCounterOffer}
              disabled={isLoading}
              className="flex-1 btn-primary"
            >
              Send Counter Offer
            </button>
          </div>
          {/* Reject trip button - always available */}
          <button
            onClick={handleRejectFare}
            disabled={isLoading}
            className="w-full btn-danger flex items-center justify-center py-2"
          >
            <FiX className="w-5 h-5 mr-2" />
            Cancel Trip
          </button>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> If you make a counter offer, the driver can accept or reject it. 
          You can also chat with the driver to negotiate the fare.
        </p>
      </div>
    </div>
  );
}

export default FareNegotiation;
