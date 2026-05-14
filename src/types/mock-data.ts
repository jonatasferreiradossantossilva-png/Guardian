
export type Shift = 'Manhã' | 'Tarde' | 'Integral';
export type StudentStatus = 'aguardando' | 'a_bordo' | 'desembarcado' | 'ausente_ida' | 'ausente_volta' | 'ausente_dia_todo' | 'aguardando_aprovacao' | 'pendente_alocacao';
export type JourneyStatus = 'pendente' | 'em_rota' | 'concluida';
export type TripRequestStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'aguardando_aprovacao_pai';
export type TripRequestType = 'ida' | 'volta' | 'ida_e_volta';

export interface Student {
  [key: string]: any;
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  latitude: number;
  longitude: number;
  schoolId: string;
  parentId: string;
  active: boolean;
  street: string;
  number: string;
  city: string;
  state: string;
  monthlyFee: number;
  preferredPaymentDay?: number;
  serie?: string;
  turma?: string;
  medicalConditions?: string[];
  medicalNote?: string;
  serviceModality?: 'completo' | 'so_ida' | 'so_volta' | 'avulso';
  photoUrl?: string;
  temporaryMovesCount?: number;
}

export interface SchoolData {
  [key: string]: any;
  id: string;
  name: string;
  cnpj?: string;
  active: boolean;
  latitude: number;
  longitude: number;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  startTime?: string; // Horário de entrada (ex: "07:00")
  endTime?: string;   // Horário de saída (ex: "12:00")
}

export interface Driver {
  [key: string]: any;
  id: string;
  userId: string;
  name: string;
  status: 'em_rota' | 'pausa' | 'inativo';
  vehicleId: string;
  active: boolean;
  latitude: number;
  longitude: number;
}

export interface Vehicle {
  [key: string]: any;
  id: string;
  model: string;
  licensePlate: string;
  capacity: number;
  active: boolean;
  currentOdometer: number;
  lastMaintenanceOdometer: number;
  maintenanceInterval: number;
}

export interface Route {
  [key: string]: any;
  id: string;
  name: string;
  driverId: string;
  monitorId: string;
  shift: Shift;
  studentIds: string[];
  lastOptimizedAt: string;
  lastResetDate: string;
  journeyStatus?: JourneyStatus;
  activeShift?: Shift;
  activeDirection?: 'ida' | 'volta';
  startedBy?: string;
  polyline?: string;
  actualDriverId?: string;
  actualMonitorId?: string;
  baseStudentIds?: string[];
}

export interface User {
  [key: string]: any;
  id: string;
  name: string;
  email: string;
  cpf?: string;
  pin?: string;
  profile: 'gestor' | 'motorista' | 'pai' | 'monitor';
  active: boolean;
}

export interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  target: 'all' | 'drivers' | 'parents';
  createdAt: string;
}

export interface Parent {
  [key: string]: any;
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  active: boolean;
}

export interface Monitor {
  [key: string]: any;
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  active: boolean;
}

export interface TripRequest {
  [key: string]: any;
  id: string;
  studentId: string;
  schoolId: string;
  parentUserId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  type: TripRequestType;
  shift: 'manha' | 'tarde';
  status: TripRequestStatus;
  reason?: string;
  createdAt: string;
  amount?: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'emergency' | 'success';
  read: boolean;
  createdAt: string;
  metadata?: any;
}

export interface RouteManifest {
  id: string;
  routeId: string;
  date: string;
  shift: Shift;
  direction: 'ida' | 'volta';
  studentIds: string[];
  updatedAt: string;
}

export interface MockDB {
  config: any[];
  telemetry: any[];
  company_profile: any[];
  users: User[];
  schools: SchoolData[];
  school_knowledge_base: any[];
  parents: Parent[];
  students: Student[];
  drivers: Driver[];
  monitors: Monitor[];
  vehicles: Vehicle[];
  routes: Route[];
  route_manifests: RouteManifest[];
  locations: Record<string, LocationUpdate>;
  invoices: any[];
  expenses: any[];
  trip_history: any[];
  trip_requests: TripRequest[];
  pending_registrations: any[];
  messages: any[];
  announcements: Announcement[];
  incidents: any[];
  contract_templates: any[];
  contracts: any[];
  authorized_pickups: any[];
  predefined_messages: any[];
  notifications: Notification[];
}
