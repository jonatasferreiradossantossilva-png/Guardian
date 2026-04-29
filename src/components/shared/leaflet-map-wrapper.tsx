'use client';

import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';

// Fix for default marker icons in Next.js
let Icon: any;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  Icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
}

function LocationMarker({ position, setPosition }: { position: [number, number], setPosition: (p: [number, number]) => void }) {
  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  return position ? <Marker position={position} icon={Icon} /> : null;
}

interface MapProps {
    center: [number, number];
    onPositionChange: (pos: [number, number]) => void;
}

export default function LeafletMapWrapper({ center, onPositionChange }: MapProps) {
    return (
        <MapContainer 
            center={center} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
        >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <LocationMarker position={center} setPosition={onPositionChange} />
        </MapContainer>
    );
}
