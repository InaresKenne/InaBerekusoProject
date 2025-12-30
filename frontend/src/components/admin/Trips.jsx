import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api.service';
import { FiMapPin, FiStar, FiUser, FiCalendar, FiDollarSign } from 'react-icons/fi';

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchTrips();
  }, [filter]);

  const fetchTrips = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter !== 'all') params.status = filter;
      
      const response = await adminService.getAllTrips(params);
      setTrips(response.trips);
    } catch (error) {
      toast.error('Failed to fetch trips');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      fare_proposed: 'bg-blue-100 text-blue-800',
      accepted: 'bg-green-100 text-green-800',
      driver_on_way: 'bg-indigo-100 text-indigo-800',
      driver_arrived: 'bg-purple-100 text-purple-800',
      in_progress: 'bg-teal-100 text-teal-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderStars = (rating) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FiStar
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating})</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trip Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg ${filter === 'completed' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg ${filter === 'in_progress' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-4 py-2 rounded-lg ${filter === 'cancelled' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Route
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fare
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiCalendar className="w-4 h-4 mr-2" />
                        {formatDate(trip.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FiUser className="h-4 w-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {trip.student?.firstName} {trip.student?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{trip.student?.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <FiUser className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {trip.driver?.firstName} {trip.driver?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {trip.driver?.vehicleMake} {trip.driver?.vehicleModel}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start">
                          <FiMapPin className="w-3 h-3 mr-1 mt-1 text-green-500 flex-shrink-0" />
                          <span className="truncate">{trip.pickupLocation?.address}</span>
                        </div>
                        <div className="flex items-start">
                          <FiMapPin className="w-3 h-3 mr-1 mt-1 text-red-500 flex-shrink-0" />
                          <span className="truncate">{trip.dropoffLocation?.address}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <FiDollarSign className="w-4 h-4 mr-1" />
                        <span className="font-semibold">GH₵ {trip.actualFare || trip.proposedFare || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(trip.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {trip.status === 'completed' ? (
                          <>
                            <div className="text-xs text-gray-500">Student:</div>
                            {renderStars(trip.studentRating)}
                            {trip.studentReview && (
                              <div className="text-xs text-gray-600 italic mt-1 max-w-xs truncate">
                                "{trip.studentReview}"
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Trip not completed</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedTrip(trip);
                          setShowDetailsModal(true);
                        }}
                        className="text-primary hover:text-primary-dark"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {trips.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No trips found</p>
            </div>
          )}
        </div>
      )}

      {/* Trip Details Modal */}
      {showDetailsModal && selectedTrip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Trip Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Info */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">Trip Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <div className="mt-1">{getStatusBadge(selectedTrip.status)}</div>
                    </div>
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <p className="font-medium mt-1">{formatDate(selectedTrip.createdAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fare:</span>
                      <p className="font-semibold text-lg mt-1">GH₵ {selectedTrip.actualFare || selectedTrip.proposedFare || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Distance:</span>
                      <p className="font-medium mt-1">{selectedTrip.distance ? `${selectedTrip.distance.toFixed(2)} km` : 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Student Info */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">Student</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedTrip.student?.firstName} {selectedTrip.student?.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.student?.email}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.student?.phoneNumber}</p>
                  </div>
                </div>

                {/* Driver Info */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">Driver</h4>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedTrip.driver?.firstName} {selectedTrip.driver?.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.driver?.email}</p>
                    <p className="text-sm text-gray-600">{selectedTrip.driver?.phoneNumber}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      {selectedTrip.driver?.vehicleMake} {selectedTrip.driver?.vehicleModel}
                    </p>
                    <div className="mt-2">
                      <span className="text-sm text-gray-500">Overall Rating: </span>
                      {renderStars(selectedTrip.driver?.rating)}
                      <span className="text-xs text-gray-500 ml-2">
                        ({selectedTrip.driver?.totalRatings || 0} ratings)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Locations */}
                <div>
                  <h4 className="font-semibold text-lg mb-3">Route</h4>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <FiMapPin className="w-5 h-5 text-green-500 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Pickup</p>
                        <p className="font-medium">{selectedTrip.pickupLocation?.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <FiMapPin className="w-5 h-5 text-red-500 mr-3 mt-1" />
                      <div>
                        <p className="text-sm text-gray-500">Dropoff</p>
                        <p className="font-medium">{selectedTrip.dropoffLocation?.address}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Rating Section */}
                {selectedTrip.status === 'completed' && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3">Trip Rating</h4>
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <div className="mb-3">
                        <p className="text-sm text-gray-600 mb-2">Student's Rating:</p>
                        {renderStars(selectedTrip.studentRating)}
                        {selectedTrip.studentReview && (
                          <p className="text-sm text-gray-700 mt-2 italic">"{selectedTrip.studentReview}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
