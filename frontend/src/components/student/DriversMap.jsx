import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiMapPin, FiNavigation } from 'react-icons/fi';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different markers
const studentIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const driverIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function DriversMap({ drivers, userLocation, onDriverSelect }) {
  const [mapCenter, setMapCenter] = useState([5.6037, -0.1870]); // Default: Accra, Ghana
  const [zoom, setZoom] = useState(13);

  useEffect(() => {
    if (userLocation) {
      setMapCenter([userLocation.latitude, userLocation.longitude]);
      setZoom(14);
    }
  }, [userLocation]);

  const handleRequestRide = (driver) => {
    if (onDriverSelect) {
      onDriverSelect(driver);
    }
  };

  return (
    <div className="relative">
      {/* Map Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>You</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Available Drivers ({drivers.length})</span>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-200" style={{ height: '500px' }}>
        <MapContainer
          center={mapCenter}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          {/* Map Tiles from OpenStreetMap */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Student Location Marker */}
          {userLocation && (
            <>
              <Marker
                position={[userLocation.latitude, userLocation.longitude]}
                icon={studentIcon}
              >
                <Popup>
                  <div className="text-center">
                    <FiMapPin className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <p className="font-semibold text-gray-800">Your Location</p>
                    <p className="text-xs text-gray-600">
                      {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Circle showing search radius (2km) */}
              <Circle
                center={[userLocation.latitude, userLocation.longitude]}
                radius={2000}
                pathOptions={{
                  color: '#3b82f6',
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  weight: 2
                }}
              />
            </>
          )}

          {/* Driver Markers */}
          {drivers.map((driver) => (
            driver.location && driver.location.coordinates && (
              <Marker
                key={driver._id}
                position={[driver.location.coordinates[1], driver.location.coordinates[0]]}
                icon={driverIcon}
              >
                <Popup>
                  <div className="min-w-[200px]">
                    <div className="flex items-center gap-3 mb-2">
                      <img
                        src={driver.profilePicture || '/default-avatar.png'}
                        alt={driver.firstName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {driver.firstName} {driver.lastName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <span>⭐ {driver.rating?.toFixed(1) || 'New'}</span>
                          <span>•</span>
                          <span>{driver.vehicleType}</span>
                        </div>
                      </div>
                    </div>

                    {driver.vehicleDetails && (
                      <div className="text-xs text-gray-600 mb-2">
                        <p>{driver.vehicleDetails.make} {driver.vehicleDetails.model}</p>
                        <p className="font-mono">{driver.vehicleDetails.plateNumber}</p>
                      </div>
                    )}

                    {driver.distance && (
                      <p className="text-sm text-gray-700 mb-2">
                        <FiNavigation className="inline w-3 h-3 mr-1" />
                        {driver.distance.toFixed(1)} km away
                      </p>
                    )}

                    <button
                      onClick={() => handleRequestRide(driver)}
                      className="btn-primary w-full text-sm py-2"
                    >
                      Request Ride
                    </button>
                  </div>
                </Popup>
              </Marker>
            )
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <div className="flex items-center gap-2">
          <FiMapPin className="w-4 h-4" />
          <span className="font-medium">
            {drivers.length === 0
              ? 'No drivers available nearby'
              : `${drivers.length} driver${drivers.length > 1 ? 's' : ''} available within 2km`}
          </span>
        </div>
        {userLocation && (
          <p className="text-xs text-blue-700 mt-1">
            Click on a green marker to see driver details and request a ride
          </p>
        )}
      </div>
    </div>
  );
}

export default DriversMap;
