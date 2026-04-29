import { Student, SchoolData, Parent, User, Vehicle, Driver, Route } from '@/types/mock-data';

export const CARAPICUIBA_SCHOOLS: SchoolData[] = [
  {
    id: 'school-meucci',
    name: 'EE Prof. Amos Meucci',
    active: true,
    latitude: -23.5255421,
    longitude: -46.845942,
    street: 'Rua General Marcondes Salgado',
    number: '310',
    neighborhood: 'Vila Menck',
    city: 'Carapicuíba',
    state: 'SP',
    zipCode: '06390-100',
    startTime: '07:00',
    endTime: '12:00'
  },
  {
    id: 'school-leme',
    name: 'EE Prof. Maria de Oliveira Leme',
    active: true,
    latitude: -23.5218706,
    longitude: -46.8384214,
    street: 'Rua Diadema',
    number: '45',
    neighborhood: 'Centro',
    city: 'Carapicuíba',
    state: 'SP',
    zipCode: '06310-090',
    startTime: '13:00',
    endTime: '18:00'
  }
];

export const CARAPICUIBA_STUDENTS_DATA = [
  // Escola Amos Meucci (Manhã - Ida)
  { name: 'Valentina Bernardi', lat: -23.5273, lng: -46.8421, schoolId: 'school-meucci', shift: 'Manhã' },
  { name: 'Jonatas Ferreira', lat: -23.5242, lng: -46.8485, schoolId: 'school-meucci', shift: 'Manhã' },
  { name: 'Thais Da Silva Bernardi', lat: -23.5281, lng: -46.8449, schoolId: 'school-meucci', shift: 'Manhã' },
  { name: 'Claudia Ferreira', lat: -23.5225, lng: -46.8502, schoolId: 'school-meucci', shift: 'Manhã' },
  { name: 'Jessica Ferreira', lat: -23.5208, lng: -46.8467, schoolId: 'school-meucci', shift: 'Manhã' },
  
  // Escola Maria Leme (Tarde - Volta)
  { name: 'Pedro Enrico', lat: -23.5264, lng: -46.8398, schoolId: 'school-leme', shift: 'Tarde' },
  { name: 'Leandro Gonçalves', lat: -23.5292, lng: -46.8415, schoolId: 'school-leme', shift: 'Tarde' },
  { name: 'Tamires Bernardi', lat: -23.5251, lng: -46.8372, schoolId: 'school-leme', shift: 'Tarde' },
  { name: 'Laura Gonçalves', lat: -23.5239, lng: -46.8491, schoolId: 'school-leme', shift: 'Tarde' },
  { name: 'João Pedro', lat: -23.5212, lng: -46.8434, schoolId: 'school-leme', shift: 'Tarde' },
];

export function generateCarapicuibaSeed(gestorUserId: string) {
  const parentId = `parent-carapicuiba`;
  
  const parent: Parent = {
    id: parentId,
    userId: gestorUserId,
    name: 'Responsável Carapicuíba',
    email: 'parent@carapicuiba.com',
    phone: '(11) 98888-7777',
    active: true
  };

  const students: Student[] = CARAPICUIBA_STUDENTS_DATA.map((s, idx) => ({
    id: `student-${idx}`,
    name: s.name,
    status: 'aguardando',
    shift: s.shift as any,
    latitude: s.lat,
    longitude: s.lng,
    schoolId: s.schoolId,
    parentId: parentId,
    active: true,
    street: 'Rua de Teste',
    number: String(100 + idx),
    city: 'Carapicuíba',
    state: 'SP',
    monthlyFee: 450,
    preferredPaymentDay: 10,
    serie: `${Math.floor(Math.random() * 9) + 1}º Ano`,
    turma: String.fromCharCode(65 + Math.floor(Math.random() * 3))
  }));

  const vehicle: Vehicle = {
    id: 'van-carapicuiba',
    model: 'Mercedes Sprinter - Guardian Edition',
    licensePlate: 'GDN-2025',
    capacity: 20,
    active: true,
    currentOdometer: 52400,
    lastMaintenanceOdometer: 50000,
    maintenanceInterval: 10000
  };

  const driver: Driver = {
    id: 'driver-carapicuiba',
    userId: gestorUserId,
    name: 'Motorista Demonstração',
    status: 'inativo',
    vehicleId: 'van-carapicuiba',
    active: true,
    latitude: -23.5250,
    longitude: -46.8450
  };

  const route: Route = {
    id: 'route-carapicuiba',
    name: 'Itinerário Carapicuíba 10-2',
    driverId: 'driver-carapicuiba',
    monitorId: 'monitor-carapicuiba',
    shift: 'Manhã',
    studentIds: students.map(s => s.id),
    lastOptimizedAt: new Date().toISOString(),
    lastResetDate: new Date().toISOString(),
    journeyStatus: 'pendente'
  };

  return {
    parent,
    students,
    schools: CARAPICUIBA_SCHOOLS,
    vehicle,
    driver,
    route
  };
}
