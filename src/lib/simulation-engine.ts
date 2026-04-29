
/**
 * @fileOverview Motor de simulação de movimento para o modo Mock (Case Carapicuíba).
 * Contém trajetórias de teste sincronizadas para a demonstração épica.
 */

export interface GpsPoint {
  lat: number;
  lng: number;
  label?: string;
  eventType?: 'pickup' | 'dropoff' | 'arrival' | 'departure' | 'proximity';
  studentId?: string;
}

// CENÁRIO A: MANHÃ (IDA) - Coleta de alunos e entrega no Amos Meucci
export const TRACK_MORNING_IDA: GpsPoint[] = [
  { lat: -23.5220, lng: -46.8320, label: "Garagem - Início da Rota Manhã" },
  { lat: -23.5255, lng: -46.8350 },
  // Valentina
  { lat: -23.5273, lng: -46.8421, label: "Próximo à Valentina", eventType: 'proximity', studentId: 'student-0' },
  { lat: -23.5273, lng: -46.8421, label: "Embarque Valentina", eventType: 'pickup', studentId: 'student-0' },
  // Jonatas
  { lat: -23.5242, lng: -46.8485, label: "Embarque Jonatas", eventType: 'pickup', studentId: 'student-1' },
  // Thais
  { lat: -23.5281, lng: -46.8449, label: "Embarque Thais", eventType: 'pickup', studentId: 'student-2' },
  // Cláudia
  { lat: -23.5225, lng: -46.8502, label: "Embarque Cláudia", eventType: 'pickup', studentId: 'student-3' },
  // Jéssica
  { lat: -23.5208, lng: -46.8467, label: "Embarque Jéssica", eventType: 'pickup', studentId: 'student-4' },
  // Chegada Amos Meucci
  { lat: -23.5255421, lng: -46.845942, label: "Chegada Escola Amos Meucci", eventType: 'arrival' },
  { lat: -23.5255421, lng: -46.845942, label: "Desembarque Geral (Manhã)", eventType: 'dropoff' }
];

// CENÁRIO B: TARDE (VOLTA) - Retirada no Maria Leme e entrega nas casas
export const TRACK_AFTERNOON_VOLTA: GpsPoint[] = [
  { lat: -23.5218706, lng: -46.8384214, label: "Início Rota Tarde - Maria Leme", eventType: 'arrival' },
  { lat: -23.5218706, lng: -46.8384214, label: "Embarque Geral (Tarde)", eventType: 'pickup' },
  // Pedro
  { lat: -23.5264, lng: -46.8398, label: "Entrega Pedro", eventType: 'dropoff', studentId: 'student-5' },
  // Leandro
  { lat: -23.5292, lng: -46.8415, label: "Entrega Leandro", eventType: 'dropoff', studentId: 'student-6' },
  // Tamires
  { lat: -23.5251, lng: -46.8372, label: "Entrega Tamires", eventType: 'dropoff', studentId: 'student-7' },
  // Laura
  { lat: -23.5239, lng: -46.8491, label: "Entrega Laura", eventType: 'dropoff', studentId: 'student-8' },
  // João Pedro
  { lat: -23.5212, lng: -46.8434, label: "Entrega João Pedro", eventType: 'dropoff', studentId: 'student-9' },
  { lat: -23.5250, lng: -46.8450, label: "Finalização de Rota Tarde" }
];

export function getPointFromTrack(track: GpsPoint[], progress: number): GpsPoint {
  const index = Math.floor(progress * (track.length - 1));
  const nextIndex = Math.min(index + 1, track.length - 1);
  const segmentProgress = (progress * (track.length - 1)) - index;

  const current = track[index];
  const next = track[nextIndex];

  return {
    lat: current.lat + (next.lat - current.lat) * segmentProgress,
    lng: current.lng + (next.lng - current.lng) * segmentProgress,
    label: current.label,
    eventType: current.eventType,
    studentId: current.studentId
  };
}

// Compatibilidade Retroativa (Alias)
export const SIMULATION_ROUTE_TRACK = TRACK_MORNING_IDA;
export const getRoutePointAt = (progress: number) => getPointFromTrack(TRACK_MORNING_IDA, progress);
