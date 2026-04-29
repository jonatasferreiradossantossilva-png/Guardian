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
        if (map && bounds && bounds.isValid()) {
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
    editableMarker?: { latitude: number, longitude: number } | null;
    onPositionChange?: (lat: number, lng: number) => void;
}

export default function LeafletMapInner({ center, zoom, stops, driverLocation, routePolyline, recenterTrigger, editableMarker, onPositionChange }: LeafletMapInnerProps) {
    const bounds = useMemo(() => {
        const b = L.latLngBounds([]);
        if (driverLocation) b.extend([driverLocation.latitude, driverLocation.longitude]);
        if (editableMarker) b.extend([editableMarker.latitude, editableMarker.longitude]);
        stops.forEach(s => {
            if (s.data?.latitude && s.data?.longitude) {
                b.extend([s.data.latitude, s.data.longitude]);
            }
        });
        return b;
    }, [stops, driverLocation, editableMarker]);

    const polylinePath = useMemo(() => {
        if (!routePolyline) return null;
        try {
            // Suporte para string JSON ou objeto direto
            const geometry = typeof routePolyline === 'string' ? JSON.parse(routePolyline) : routePolyline;
            if (geometry.type === 'LineString') {
                return geometry.coordinates.map((c: number[]) => [c[1], c[0]]); // [lat, lng]
            }
        } catch (e) {
            console.error("Invalid Polyline data", e);
        }
        return null;
    }, [routePolyline]);

    const draggableEventHandlers = useMemo(() => ({
        dragend(e: any) {
            const marker = e.target;
            if (marker != null && onPositionChange) {
                const { lat, lng } = marker.getLatLng();
                onPositionChange(lat, lng);
            }
        },
    }), [onPositionChange]);

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

            {editableMarker && (
                <Marker 
                    position={[editableMarker.latitude, editableMarker.longitude]} 
                    draggable={true}
                    eventHandlers={draggableEventHandlers}
                    icon={createCustomIcon(<MapPin size={24} />, '#ef4444')}
                >
                </Marker>
            )}

            {stops.map(stop => {
                const item = stop.data;
                if (!item?.latitude) return null;
                
                const isStudent = stop.type === 'student';
                const hasAlert = isStudent && (item.medicalConditions?.length || item.medicalNote);
                
                // Ícone Customizado para Estudante (Foto ou Inicial)
                let customIcon;
                if (isStudent) {
                    const initials = (item.name || '?')[0].toUpperCase();
                    customIcon = L.divIcon({
                        html: renderToStaticMarkup(
                            <div className="relative group">
                                <div style={{ 
                                    width: '40px', 
                                    height: '40px', 
                                    borderRadius: '50%', 
                                    border: '3px solid white',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                    overflow: 'hidden',
                                    backgroundColor: '#3b82f6',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative'
                                }}>
                                    {item.photoUrl ? (
                                        <img src={item.photoUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <span style={{ color: 'white', fontWeight: '900', fontSize: '18px' }}>{initials}</span>
                                    )}
                                    {hasAlert && (
                                        <div style={{ position: 'absolute', top: -4, right: -4, backgroundColor: '#dc2626', borderRadius: '50%', padding: '2px', border: '2px solid white' }}>
                                            <HeartPulse size={10} color="white" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '4px' }}>
                                    <span style={{ backgroundColor: 'white', color: 'black', fontSize: '8px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', whiteSpace: 'nowrap', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                        {item.name.split(' ')[0]}
                                    </span>
                                </div>
                            </div>
                        ),
                        className: 'student-map-icon',
                        iconSize: [40, 40],
                        iconAnchor: [20, 20],
                    });
                } else {
                    customIcon = createCustomIcon(<School size={18} />, '#dc2626');
                }
                
                return (
                    <Marker 
                        key={stop.id} 
                        position={[item.latitude, item.longitude]} 
                        icon={customIcon}
                    />
                );
            })}
        </MapContainer>
    );
}
