import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { tripService } from '../../services/api.service';
import { FiCalendar, FiMapPin } from 'react-icons/fi';

function TripHistory() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchTripHistory();
  }, [page]);

  const fetchTripHistory = async () => {
    try {
      const response = await tripService.getTripHistory(page);
      setTrips(response.trips);
      setTotalPages(response.pages);
    } catch (error) {
      toast.error('Failed to fetch trip history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Trip History</h2>

      <div className="space-y-4">
        {trips.map((trip) => (
          <div key={trip._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                  {trip.driver?.profilePhoto ? (
                    <img
                      src={trip.driver.profilePhoto}
                      alt={trip.driver.firstName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold">
                      {trip.driver?.firstName?.[0]}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">
                    {trip.driver?.firstName} {trip.driver?.lastName}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <FiCalendar className="w-4 h-4 mr-1" />
                    {formatDate(trip.createdAt)}
                  </div>
                </div>
              </div>
              {getStatusBadge(trip.status)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-start">
                <FiMapPin className="w-4 h-4 mr-2 mt-1 text-green-500" />
                <div>
                  <p className="font-medium">Pickup</p>
                  <p className="text-gray-600">{trip.pickupLocation.address}</p>
                </div>
              </div>
              <div className="flex items-start">
                <FiMapPin className="w-4 h-4 mr-2 mt-1 text-red-500" />
                <div>
                  <p className="font-medium">Dropoff</p>
                  <p className="text-gray-600">{trip.dropoffLocation.address}</p>
                </div>
              </div>
            </div>

            {trip.actualFare > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-lg font-bold text-primary">
                  GH₵ {trip.actualFare}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {trips.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No trip history</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default TripHistory;
