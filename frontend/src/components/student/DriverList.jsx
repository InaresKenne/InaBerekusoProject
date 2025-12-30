import { useState, useEffect } from 'react';
import { FiUser, FiPhone, FiMail, FiMapPin, FiStar, FiMap, FiList } from 'react-icons/fi';
import DriversMap from './DriversMap';

function DriverList({ drivers, loading, onRequestRide }) {
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'
  const [userLocation, setUserLocation] = useState(null);

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return <span className="status-available">Available</span>;
      case 'busy':
        return <span className="status-busy">Busy</span>;
      default:
        return <span className="status-offline">Offline</span>;
    }
  };

  // Do NOT show any rating UI or RateDriver here. Only show driver rating as info.

  const handleRequestClick = (driver) => {
    setSelectedDriver(driver);
    setShowRequestModal(true);
  };

  const handleSubmitRequest = () => {
    if (!pickupLocation || !dropoffLocation) {
      alert('Please fill in both pickup and dropoff locations');
      return;
    }

    onRequestRide({
      driverId: selectedDriver._id,
      pickupLocation: { address: pickupLocation, coordinates: [0, 0] },
      dropoffLocation: { address: dropoffLocation, coordinates: [0, 0] }
    });
    setShowRequestModal(false);
    setPickupLocation('');
    setDropoffLocation('');
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Available Drivers</h2>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'list'
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiList className="w-4 h-4" />
            <span className="text-sm font-medium">List</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              viewMode === 'map'
                ? 'bg-white shadow-sm text-primary'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <FiMap className="w-4 h-4" />
            <span className="text-sm font-medium">Map</span>
          </button>
        </div>
      </div>

      {/* Map View */}
      {viewMode === 'map' && (
        <DriversMap
          drivers={drivers}
          userLocation={userLocation}
          onDriverSelect={handleRequestClick}
        />
      )}
      
      {/* List View */}
      {viewMode === 'list' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div key={driver._id} className="card hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                  {driver.profilePhoto ? (
                    <img
                      src={driver.profilePhoto}
                      alt={driver.firstName}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <FiUser className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {driver.firstName} {driver.lastName}
                  </h3>
                  <div className="flex items-center text-yellow-500">
                    <FiStar className="w-4 h-4 fill-current" />
                    <span className="ml-1 text-sm">{driver.rating.toFixed(1)}</span>
                    <span className="text-gray-500 text-sm ml-1">
                      ({driver.totalRatings})
                    </span>
                  </div>
                </div>
              </div>
              {getStatusBadge(driver.driverStatus)}
            </div>

            {/* Vehicle Photo */}
            {driver.vehiclePhoto && (
              <div className="mb-4 bg-gray-100 rounded-lg p-2">
                <img
                  src={driver.vehiclePhoto}
                  alt={`${driver.vehicleMake} ${driver.vehicleModel}`}
                  className="w-full h-40 object-contain rounded-lg"
                />
              </div>
            )}

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center">
                <FiPhone className="w-4 h-4 mr-2" />
                {driver.phoneNumber}
              </div>
              {driver.vehicleMake && (
                <div className="flex items-center">
                  <FiMapPin className="w-4 h-4 mr-2" />
                  {driver.vehicleMake} {driver.vehicleModel} - {driver.vehicleColor}
                </div>
              )}
              {driver.licensePlate && (
                <div className="text-sm font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                  {driver.licensePlate}
                </div>
              )}
            </div>

            {driver.driverStatus === 'available' && (
              <button
                onClick={() => handleRequestClick(driver)}
                className="w-full btn-primary"
              >
                Request Ride
              </button>
            )}
          </div>
        ))}
        </div>
      )}

      {viewMode === 'list' && drivers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No drivers available at the moment</p>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold mb-6">Request Ride</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pickup Location
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  className="input-field"
                  placeholder="Enter pickup location"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dropoff Location
                </label>
                <input
                  type="text"
                  value={dropoffLocation}
                  onChange={(e) => setDropoffLocation(e.target.value)}
                  className="input-field"
                  placeholder="Enter destination"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 btn-outline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitRequest}
                  className="flex-1 btn-primary"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverList;
