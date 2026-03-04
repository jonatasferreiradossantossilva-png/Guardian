'use client';

import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { Bus, School, MapPin, HeartPulse } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper to create custom icons from Lucide
const createCustomIcon = (icon: React.ReactNode, color: string) => {
    return L.divIcon({
        html: renderToStaticMarkup(
            <div style={{ color: color, backgroundColor: 'white', borderRadius: '50%', padding: '4px', border: `2px solid ${color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                {icon}
            </div>
        ),
        className: 'custom-leaflet-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });
};

function MapController({ bounds, trigger }: { bounds: L.LatLngBounds | null, trigger: number }) {
    const map = useMap();
    useEffect(() => {
        if (map && bounds && !bounds.isEmpty()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds, trigger]);
    return null;
}

interface LeafletMapInnerProps {
    center: { lat: number, lng: number };
    zoom: number;
    stops: any[];
    driverLocation?: { latitude: number, longitude: number } | null;
    routePolyline?: string;
    recenterTrigger: number;
}

export default function LeafletMapInner({ center, zoom, stops, driverLocation, routePolyline, recenterTrigger }: LeafletMapInnerProps) {
    const bounds = useMemo(() => {
        const b = L.latLngBounds([]);
        if (driverLocation) b.extend([driverLocation.latitude, driverLocation.longitude]);
        stops.forEach(s => {
            if (s.data?.latitude && s.data?.longitude) {
                b.extend([s.data.latitude, s.data.longitude]);
            }
        });
        return b;
    }, [stops, driverLocation]);

    const polylinePath = useMemo(() => {
        if (!routePolyline) return null;
        try {
            const geometry = JSON.parse(routePolyline);
            if (geometry.type === 'LineString') {
                return geometry.coordinates.map((c: number[]) => [c[1], c[0]]); // [lat, lng]
            }
        } catch (e) {
            console.error("Invalid Polyline JSON", e);
        }
        return null;
    }, [routePolyline]);

    return (
        <MapContainer center={[center.lat, center.lng]} zoom={zoom} scrollWheelZoom={true} className="h-full w-full">
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapController bounds={bounds} trigger={recenterTrigger} />
            
            {polylinePath && <Polyline positions={polylinePath} color="#2ab0c1" weight={5} opacity={0.7} />}

            {driverLocation && (
                <Marker 
                    position={[driverLocation.latitude, driverLocation.longitude]} 
                    icon={createCustomIcon(<Bus size={20} />, '#2ab0c1')}
                />
            )}

            {stops.map(stop => {
                const item = stop.data;
                if (!item?.latitude) return null;
                
                const isStudent = stop.type === 'student';
                const hasAlert = isStudent && (item.medicalConditions?.length || item.medicalNote);
                
                return (
                    <Marker 
                        key={stop.id} 
                        position={[item.latitude, item.longitude]} 
                        icon={createCustomIcon(
                            isStudent ? (hasAlert ? <HeartPulse size={18} /> : <MapPin size={18} />) : <School size={18} />, 
                            isStudent ? (hasAlert ? '#dc2626' : '#3b82f6') : '#dc2626'
                        )}
                    />
                );
            })}
        </MapContainer>
    );
}
