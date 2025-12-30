import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiMessageCircle, FiDollarSign, FiX } from 'react-icons/fi';
import { tripService } from '../../services/api.service';

function CounterOfferNotice({ trip, onAcceptCounter }) {
  const [showCounterInput, setShowCounterInput] = useState(false);
  const [driverCounter, setDriverCounter] = useState('');

  const handleAcceptCounter = async () => {
    try {
      const response = await tripService.acceptCounterOffer(trip._id);
      toast.success('Counter offer accepted!');
      onAcceptCounter(response.trip);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to accept counter offer');
    }
  };

  const handleDecline = async () => {
    if (!window.confirm('Are you sure you want to decline and cancel this trip?')) {
      return;
    }
    try {
      const response = await tripService.rejectFare(trip._id);
      toast.info('Trip cancelled - Fare not agreed');
      onAcceptCounter(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel trip');
    }
  };

  const handleDriverCounter = async () => {
    const counterValue = parseFloat(driverCounter);
    if (!driverCounter || driverCounter.trim() === '' || counterValue <= 0 || isNaN(counterValue)) {
      toast.error('Please enter a valid counter offer amount');
      return;
    }

    try {
      const response = await tripService.driverCounterOffer(trip._id, counterValue);
      toast.success('Counter offer sent to student!');
      onAcceptCounter(response.trip);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send counter offer');
    }
  };

  return (
    <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-500 mb-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-500 rounded-full mb-4">
          <FiMessageCircle className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Student Made a Counter Offer
        </h3>
        <p className="text-gray-600">
          {trip.student?.firstName} {trip.student?.lastName} has proposed a different fare
        </p>
      </div>

      {/* Show negotiation history if there are multiple offers */}
      {trip.fareHistory && trip.fareHistory.length > 1 && (
        <div className="bg-white border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-gray-700 mb-2">Negotiation History:</p>
          <div className="space-y-1">
            {trip.fareHistory.map((history, index) => (
              <p key={index} className="text-sm text-gray-600">
                {index + 1}. {history.proposedBy === 'driver' ? '🚗 You' : '👤 Student'}: GH₵ {history.amount?.toFixed(2)}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg p-6 mb-4">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Last Offer</p>
            <p className="text-2xl font-bold text-gray-400 line-through">
              GH₵ {trip.fareHistory?.[trip.fareHistory.length - 2]?.amount?.toFixed(2) || trip.fareHistory?.[0]?.amount?.toFixed(2)}
            </p>
          </div>
          <div className="text-4xl text-gray-400">→</div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-1">Student's Counter</p>
            <p className="text-3xl font-bold text-yellow-600">
              GH₵ {trip.proposedFare?.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {!showCounterInput ? (
        <div className="space-y-3">
          <button
            onClick={handleAcceptCounter}
            className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center font-semibold"
          >
            <FiCheck className="w-5 h-5 mr-2" />
            Accept Counter Offer & Continue
          </button>
          
          <button
            onClick={() => setShowCounterInput(true)}
            className="w-full bg-gray-100 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center font-semibold"
          >
            <FiDollarSign className="w-5 h-5 mr-2" />
            Make Your Own Counter Offer
          </button>

          <button
            onClick={handleDecline}
            className="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center font-semibold"
          >
            <FiX className="w-5 h-5 mr-2" />
            Decline & Cancel Trip
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Counter Offer (GH₵)
            </label>
            <div className="relative">
              <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={driverCounter}
                onChange={(e) => setDriverCounter(e.target.value)}
                placeholder="Enter amount in cedis"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                min="0"
                step="0.5"
                autoFocus
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCounterInput(false)}
              className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
            >
              <FiX className="w-5 h-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleDriverCounter}
              className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center font-semibold"
            >
              <FiCheck className="w-5 h-5 mr-2" />
              Send Counter
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 p-4 bg-yellow-100 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> You can accept the student's offer, make your own counter offer to continue negotiating, or decline to cancel the trip.
        </p>
      </div>
    </div>
  );
}

export default CounterOfferNotice;
