'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { database, firestore } from '@/firebase';
import { ref, onValue, set, serverTimestamp, off } from "firebase/database";
import { collection, addDoc, serverTimestamp as firestoreTimestamp } from "firebase/firestore";

const REALTIME_UPDATE_INTERVAL_MS = 5000; // 5 segundos para tempo real (RTDB - Barato/Grátis)
const HISTORY_LOG_INTERVAL_MS = 60000;   // 1 minuto para histórico (Firestore - Escritura cara)
const MIN_DISTANCE_METERS = 50;         // Só logar histórico se mover > 50m

// Cache de estado fora do hook para persistência entre renderizações paralela
let lastRealtimeTimestamp = 0;
let lastHistoryTimestamp = 0;
let lastCoords = { lat: 0, lng: 0 };

/**
 * Calcula distância entre dois pontos (Haversine)
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metros
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) +
          Math.cos(p1) * Math.cos(p2) *
          Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Hook para lidar com telemetria (rastreamento de GPS) em tempo real e histórico.
 * Focado em CUSTO ZERO utilizando RTDB para live e Firestore filtrado para histórico.
 */
export function useTelemetry() {
  /**
   * Atualiza a localização e salva rastro histórico se necessário.
   */
  const updateLocation = useCallback(async (driverId: string, latitude: number, longitude: number) => {
    const now = Date.now();
    
    // 1. ATUALIZAÇÃO EM TEMPO REAL (RTDB - Sempre que possível)
    if (now - lastRealtimeTimestamp >= REALTIME_UPDATE_INTERVAL_MS) {
        try {
            const locationRef = ref(database, `locations/${driverId}`);
            await set(locationRef, {
                latitude,
                longitude,
                timestamp: serverTimestamp(),
            });
            lastRealtimeTimestamp = now;
        } catch (error) {
            console.error("[Telemetry:RTDB_Error]", error);
        }
    }

    // 2. LOG HISTÓRICO (Firestore - Com Travas de Segurança Anti-Custo)
    const distance = getDistance(lastCoords.lat, lastCoords.lng, latitude, longitude);
    const timeSinceLastLog = now - lastHistoryTimestamp;

    // Só grava no Firestore se:
    // a) Passou mais de 1 minuto E a van se moveu mais de 50 metros
    // b) É o primeiro log da sessão
    if (timeSinceLastLog >= HISTORY_LOG_INTERVAL_MS && distance >= MIN_DISTANCE_METERS) {
        try {
            await addDoc(collection(firestore, 'location_history'), {
                driverId,
                latitude,
                longitude,
                timestamp: firestoreTimestamp(),
                distanceCovered: distance,
            });
            
            lastHistoryTimestamp = now;
            lastCoords = { lat: latitude, lng: longitude };
            console.log(`[Telemetry] Historico logado: ${distance.toFixed(0)}m percorridos.`);
        } catch (error) {
            console.error("[Telemetry:Firestore_History_Error]", error);
        }
    }
  }, []);

  return { updateLocation };
}

/**
 * Monitora a localização de um motorista específico em tempo real.
 */
export function useDriverLocation(driverId: string | null) {
  const [location, setLocation] = useState<{ latitude: number; longitude: number; timestamp: any } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!driverId) {
      setLoading(false);
      return;
    }

    const locationRef = ref(database, `locations/${driverId}`);
    
    const unsubscribe = onValue(locationRef, (snapshot) => {
      const data = snapshot.val();
      setLocation(data);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao monitorar telemetria:', error);
      setLoading(false);
    });

    return () => off(locationRef, 'value', unsubscribe);
  }, [driverId]);

  return { location, loading };
}
