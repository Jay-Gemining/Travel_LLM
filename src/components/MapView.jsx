import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default icon issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const MapView = ({ activities }) => {
    if (!activities || activities.length === 0) {
        return <div className="h-96 bg-gray-200 flex items-center justify-center text-gray-500">没有可供显示的地图信息。</div>;
    }

    const positions = activities.map(act => [act.lat, act.lon]);
    const center = positions[0] || [30.2741, 120.1551]; // Default to Hangzhou if no activities

    return (
        <MapContainer center={center} zoom={13} scrollWheelZoom={false} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {activities.map((activity, idx) => (
                <Marker key={idx} position={[activity.lat, activity.lon]}>
                    <Popup>
                        <b>{activity.poi_name}</b><br />{activity.description}
                    </Popup>
                </Marker>
            ))}
            <Polyline pathOptions={{ color: 'blue' }} positions={positions} />
        </MapContainer>
    );
};

export default MapView;
