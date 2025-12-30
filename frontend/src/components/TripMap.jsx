import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color, label) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: white;
      ">${label}</div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15]
  });
};

const driverIcon = createCustomIcon('#2563eb', '🚗');
const studentIcon = createCustomIcon('#10b981', '👤');
const pickupIcon = createCustomIcon('#22c55e', 'P');
const dropoffIcon = createCustomIcon('#ef4444', 'D');

// Component to handle map bounds and center updates
function MapController({ driverLocation, studentLocation, pickupLocation, dropoffLocation, center }) {
  const map = useMap();

  useEffect(() => {
    const locations = [];
    
    if (driverLocation) locations.push([driverLocation.lat, driverLocation.lng]);
    if (studentLocation) locations.push([studentLocation.lat, studentLocation.lng]);
    if (pickupLocation) locations.push([pickupLocation.lat, pickupLocation.lng]);
    if (dropoffLocation) locations.push([dropoffLocation.lat, dropoffLocation.lng]);

    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (center) {
      map.setView([center.lat, center.lng], 15);
    }
  }, [map, driverLocation, studentLocation, pickupLocation, dropoffLocation, center]);

  // Pan to driver location when it updates
  useEffect(() => {
    if (driverLocation) {
      map.panTo([driverLocation.lat, driverLocation.lng], { animate: true, duration: 1 });
    }
  }, [map, driverLocation]);

  return null;
}

function TripMap({ 
  center, 
  driverLocation, 
  studentLocation, 
  pickupLocation, 
  dropoffLocation,
  zoom = 15 
}) {
  // Calculate initial center
  const initialCenter = useMemo(() => {
    if (center) return [center.lat, center.lng];
    if (driverLocation) return [driverLocation.lat, driverLocation.lng];
    if (pickupLocation) return [pickupLocation.lat, pickupLocation.lng];
    if (studentLocation) return [studentLocation.lat, studentLocation.lng];
    return [5.7574, -0.2206]; // Default: Ashesi University
  }, [center, driverLocation, pickupLocation, studentLocation]);

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <MapContainer
        center={initialCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        {/* OpenStreetMap tiles - free, no API key needed */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map controller for bounds and animations */}
        <MapController 
          driverLocation={driverLocation}
          studentLocation={studentLocation}
          pickupLocation={pickupLocation}
          dropoffLocation={dropoffLocation}
          center={center}
        />

        {/* Driver Marker */}
        {driverLocation && (
          <Marker 
            position={[driverLocation.lat, driverLocation.lng]} 
            icon={driverIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-gray-800">🚗 Driver Location</p>
                <p className="text-xs text-gray-600">
                  {driverLocation.lat.toFixed(5)}, {driverLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Student Marker */}
        {studentLocation && (
          <Marker 
            position={[studentLocation.lat, studentLocation.lng]} 
            icon={studentIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-gray-800">👤 Student Location</p>
                <p className="text-xs text-gray-600">
                  {studentLocation.lat.toFixed(5)}, {studentLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Marker */}
        {pickupLocation && (
          <Marker 
            position={[pickupLocation.lat, pickupLocation.lng]} 
            icon={pickupIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-green-700">🟢 Pickup Location</p>
                <p className="text-xs text-gray-600">
                  {pickupLocation.lat.toFixed(5)}, {pickupLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoffLocation && (
          <Marker 
            position={[dropoffLocation.lat, dropoffLocation.lng]} 
            icon={dropoffIcon}
          >
            <Popup>
              <div className="text-center">
                <p className="font-semibold text-red-700">🔴 Dropoff Location</p>
                <p className="text-xs text-gray-600">
                  {dropoffLocation.lat.toFixed(5)}, {dropoffLocation.lng.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

export default TripMap;
