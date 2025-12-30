import { useState } from 'react';
import { FiStar, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { tripService } from '../../services/api.service';
import ReportUser from '../ReportUser';

function RateDriver({ trip, onRated }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📝 Submitting rating:', { tripId: trip._id, rating, review });
      const response = await tripService.rateTrip(trip._id, rating, review);
      console.log('✅ Rating submitted successfully:', response);
      toast.success('Thank you for your feedback!');
      
      // Wait a moment for the backend to save, then clear the active trip
      setTimeout(() => {
        console.log('🔄 Calling onRated callback to clear trip');
        if (onRated) {
          onRated();
        }
      }, 500);
    } catch (error) {
      console.error('❌ Rating submission error:', error);
      console.error('❌ Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to submit rating';
      toast.error(errorMsg);
      
      // If already rated, just close the form
      if (errorMsg.includes('already rated')) {
        setTimeout(() => {
          if (onRated) {
            onRated();
          }
        }, 1000);
      } else {
        setIsSubmitting(false);
      }
    }
  };

  const handleSkip = async () => {
    console.log('⏭️ Skipping rating');
    try {
      await tripService.skipRating(trip._id);
      console.log('✅ Rating skipped successfully');
      if (onRated) {
        onRated();
      }
    } catch (error) {
      console.error('❌ Error skipping rating:', error);
      // Even if skip fails, still close the form
      if (onRated) {
        onRated();
      }
    }
  };

  return (
    <div className="card bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          Rate Your Trip
        </h3>
        <p className="text-gray-600">
          How was your experience with {trip.driver?.firstName} {trip.driver?.lastName}?
        </p>
      </div>

      {/* Star Rating */}
      <div className="flex justify-center space-x-2 mb-6">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <FiStar
              className={`w-12 h-12 ${
                star <= (hoverRating || rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Rating Text */}
      {rating > 0 && (
        <p className="text-center text-lg font-semibold text-gray-700 mb-4">
          {rating === 1 && '😞 Poor'}
          {rating === 2 && '😕 Fair'}
          {rating === 3 && '😊 Good'}
          {rating === 4 && '😄 Very Good'}
          {rating === 5 && '🤩 Excellent!'}
        </p>
      )}

      {/* Comment */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="Tell us about your experience..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
          rows="3"
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full bg-yellow-500 text-white px-6 py-3 rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Rating'}
      </button>

      {/* Skip Button */}
      <button
        onClick={handleSkip}
        disabled={isSubmitting}
        className="w-full mt-3 text-gray-600 hover:text-gray-800 transition-colors text-sm"
      >
        Skip for now
      </button>

      {/* Report Button */}
      <button
        onClick={() => setShowReportModal(true)}
        disabled={isSubmitting}
        className="w-full mt-2 flex items-center justify-center gap-2 text-red-600 hover:text-red-800 transition-colors text-sm font-medium"
      >
        <FiAlertTriangle className="w-4 h-4" />
        Report an Issue
      </button>

      {/* Report Modal */}
      {showReportModal && (
        <ReportUser
          reportedUser={trip.driver}
          tripId={trip._id}
          onClose={() => setShowReportModal(false)}
          onReportSubmitted={() => {
            setShowReportModal(false);
          }}
        />
      )}
    </div>
  );
}

export default RateDriver;
