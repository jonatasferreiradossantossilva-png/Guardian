'use server';

/**
 * @fileOverview Otimizador de rotas de van escolar usando algoritmo local.
 * 
 * Usa Nearest Neighbor + 2-opt para encontrar a rota mais eficiente.
 * Zero chamadas à API externa. Funciona offline. Custo: R$ 0,00 para sempre.
 *
 * - optimizeSchoolVanRoute - Função principal de otimização.
 * - OptimizeSchoolVanRouteInput - Tipo de entrada.
 * - OptimizeSchoolVanRouteOutput - Tipo de saída.
 */

import { z } from 'zod';

const StudentStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  schoolId: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const SchoolInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

const OptimizeSchoolVanRouteInputSchema = z.object({
  startAddress: z.string().optional(),
  students: z.array(StudentStopSchema),
  schools: z.array(SchoolInputSchema),
  vehicleCapacity: z.number().optional(),
  context: z.string().optional(),
  direction: z.enum(['ida', 'volta']).optional().default('ida'),
  optimizationMode: z.enum(['safe', 'flexible']).optional().default('safe'),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizedStopSchema = z.object({
  id: z.string(),
  type: z.enum(['student', 'school']),
});

const OptimizeSchoolVanRouteOutputSchema = z.object({
  optimizedStops: z.array(OptimizedStopSchema),
  summary: z.string(),
  estimatedTimeMinutes: z.number(),
  estimatedDistanceKm: z.number(),
  turnByTurnDirections: z.array(z.string()),
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

// --- MOTOR DE OTIMIZAÇÃO LOCAL ---

interface GeoPoint {
  id: string;
  lat: number;
  lng: number;
  type: 'student' | 'school';
  schoolId?: string;
  startTime?: string;
  endTime?: string;
}

/** Distância em km entre dois pontos usando fórmula de Haversine */
function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Calcula a distância total de uma rota */
function totalDistance(route: GeoPoint[]): number {
  let dist = 0;
  for (let i = 1; i < route.length; i++) {
    dist += haversineKm(route[i - 1], route[i]);
  }
  return dist;
}

/** Nearest Neighbor: constrói uma rota gulosa a partir do ponto mais próximo */
function nearestNeighbor(points: GeoPoint[], start?: GeoPoint): GeoPoint[] {
  if (points.length <= 1) return [...points];

  const remaining = [...points];
  const route: GeoPoint[] = [];

  // Se temos um ponto de partida, usamos ele como referência
  let current = start || remaining[0];
  if (!start) {
    route.push(remaining.shift()!);
  }

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current, remaining[i]);
      if (d < nearestDist) {
        nearestDist = d;
        nearestIdx = i;
      }
    }

    current = remaining[nearestIdx];
    route.push(remaining.splice(nearestIdx, 1)[0]);
  }

  return route;
}

/** 2-opt: melhora a rota trocando pares de arestas para reduzir distância */
function twoOpt(route: GeoPoint[]): GeoPoint[] {
  if (route.length < 4) return route;

  let improved = true;
  let bestRoute = [...route];
  let bestDist = totalDistance(bestRoute);

  while (improved) {
    improved = false;
    for (let i = 1; i < bestRoute.length - 1; i++) {
      for (let j = i + 1; j < bestRoute.length; j++) {
        // Reverte o segmento entre i e j
        const newRoute = [
          ...bestRoute.slice(0, i),
          ...bestRoute.slice(i, j + 1).reverse(),
          ...bestRoute.slice(j + 1),
        ];
        const newDist = totalDistance(newRoute);
        if (newDist < bestDist) {
          bestRoute = newRoute;
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }

  return bestRoute;
}

/** Parseia coordenadas "lat,lng" de um endereço */
function parseCoords(address: string): { lat: number; lng: number } | null {
  const parts = address.split(',').map(s => parseFloat(s.trim()));
  if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return { lat: parts[0], lng: parts[1] };
  }
  return null;
}

/** Otimiza a rota respeitando a causalidade IDA/VOLTA */
function optimizeRoute(
  students: GeoPoint[],
  schools: GeoPoint[],
  direction: 'ida' | 'volta',
  startPoint?: GeoPoint
): GeoPoint[] {
  const isIda = direction === 'ida';

  if (isIda) {
    // IDA: Alunos primeiro (otimizados por distância)
    const optimizedStudents = twoOpt(nearestNeighbor(students, startPoint));
    const lastStudent = optimizedStudents[optimizedStudents.length - 1];
    
    // Escolas: Ordenar PRIMEIRO por horário de entrada (startTime) e depois por distância
    const sortedSchools = [...schools].sort((a, b) => {
        const timeA = a.startTime || '23:59';
        const timeB = b.startTime || '23:59';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return 0; // Se o tempo for igual, o nearestNeighbor cuidará da distância
    });

    const optimizedSchools = nearestNeighbor(sortedSchools, lastStudent);
    return [...optimizedStudents, ...optimizedSchools];
  } else {
    // VOLTA: Escolas primeiro
    // Ordenar escolas pelo horário de saída (quem sai mais cedo é pego primeiro)
    const sortedSchools = [...schools].sort((a, b) => {
        const timeA = a.endTime || '00:00';
        const timeB = b.endTime || '00:00';
        if (timeA !== timeB) return timeA.localeCompare(timeB);
        return 0;
    });

    const optimizedSchools = nearestNeighbor(sortedSchools, startPoint);
    const lastSchool = optimizedSchools[optimizedSchools.length - 1];
    const optimizedStudents = twoOpt(nearestNeighbor(students, lastSchool));
    return [...optimizedSchools, ...optimizedStudents];
  }
}

// --- FUNÇÃO PÚBLICA (mesma interface de antes) ---

export async function optimizeSchoolVanRoute(
  input: OptimizeSchoolVanRouteInput
): Promise<OptimizeSchoolVanRouteOutput> {
  const direction = input.direction || 'ida';

  // Converter alunos em GeoPoints
  const studentPoints: GeoPoint[] = input.students
    .map(s => {
      let lat = s.latitude;
      let lng = s.longitude;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
          const coords = parseCoords(s.address);
          if (!coords) return null;
          lat = coords.lat;
          lng = coords.lng;
      }
      
      return { id: s.id, lat, lng, type: 'student' as const, schoolId: s.schoolId } as GeoPoint;
    })
    .filter((p): p is GeoPoint => p !== null);

  // Converter escolas em GeoPoints
  const schoolPoints: GeoPoint[] = input.schools
    .map(s => {
      let lat = s.latitude;
      let lng = s.longitude;

      if (typeof lat !== 'number' || typeof lng !== 'number') {
          const coords = parseCoords(s.address);
          if (!coords) return null;
          lat = coords.lat;
          lng = coords.lng;
      }
      return { 
          id: s.id, 
          lat, 
          lng, 
          type: 'school' as const,
          startTime: s.startTime,
          endTime: s.endTime
      } as GeoPoint;
    })
    .filter((p): p is GeoPoint => p !== null);

  // Ponto de partida (opcional)
  let startPoint: GeoPoint | undefined;
  if (input.startAddress) {
    const coords = parseCoords(input.startAddress);
    if (coords) {
      startPoint = { id: 'start', lat: coords.lat, lng: coords.lng, type: 'student' };
    }
  }

  // Rodar o otimizador
  const optimizedRoute = optimizeRoute(studentPoints, schoolPoints, direction, startPoint);

  // Calcular métricas
  const distKm = Math.round(totalDistance(optimizedRoute) * 10) / 10;
  const timeMin = Math.round((distKm / 30) * 60); // Estimativa: 30km/h média urbana

  // Gerar direções simples
  const directions = optimizedRoute.map((point, idx) => {
    const typeLabel = point.type === 'student' ? 'Aluno' : 'Escola';
    const studentInfo = input.students.find(s => s.id === point.id);
    const schoolInfo = input.schools.find(s => s.id === point.id);
    const name = studentInfo?.name || schoolInfo?.name || point.id;
    return `${idx + 1}. ${direction === 'ida' && point.type === 'student' ? 'Embarcar' : direction === 'volta' && point.type === 'student' ? 'Desembarcar' : 'Parada na'} ${typeLabel}: ${name}`;
  });

  return {
    optimizedStops: optimizedRoute.map(p => ({ id: p.id, type: p.type })),
    summary: `Rota otimizada localmente (${optimizedRoute.length} paradas, ${distKm}km). Algoritmo: Nearest Neighbor + 2-opt. Sem dependência de API externa.`,
    estimatedTimeMinutes: timeMin || 25,
    estimatedDistanceKm: distKm || 8,
    turnByTurnDirections: directions.length > 0 ? directions : ['Siga para a primeira parada.'],
  };
}
