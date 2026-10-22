/**
 * @fileOverview Controladores Funcionais de Ação do Guardian.
 * Executa as MESMAS funções e cascatas de efeitos que os botões,
 * formulários e fluxos de tela executam nos componentes React,
 * garantindo testes 100% funcionais no sistema inteiro sem depender de navegadores pesados.
 */

import { MockDB, Student, SchoolData, Driver, Vehicle, Route, StudentStatus, Shift } from '../../../src/types/mock-data';
import { initialMockData } from '../../../src/lib/mock-data';
import { unmask } from '../../../src/lib/masks';

export interface ActionResult<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  toasts?: Array<{ title: string; description?: string; variant?: 'default' | 'destructive' }>;
  redirectUrl?: string;
}

// ─────────────────────────────────────────────────────────────
// 1. CONTROLADOR DE AUTENTICAÇÃO E LOGIN (LoginForm Actions)
// ─────────────────────────────────────────────────────────────
export class AuthController {
  private db: MockDB;
  private session: Record<string, string> = {};

  constructor(db: MockDB) {
    this.db = db;
  }

  public getSessionItem(key: string): string | null {
    return this.session[key] || null;
  }

  public logout(): void {
    this.session = {};
  }

  /**
   * Simula a submissão exata do formulário de Login (login-form.tsx)
   */
  public submitLogin(identifier: string, pinOrPass: string, selectedProfile: string): ActionResult {
    const input = (identifier || '').trim();
    if (!input) {
      return { success: false, message: 'Digite seu CPF ou E-mail.' };
    }
    if (!pinOrPass || pinOrPass.length < 4) {
      return { success: false, message: 'A senha/PIN deve ter pelo menos 4 caracteres.' };
    }

    const isEmail = input.includes('@');
    const cleanId = isEmail ? input.toLowerCase() : unmask(input);

    const user = this.db.users.find((u) => {
      const matchId = isEmail
        ? u.email?.toLowerCase() === cleanId
        : unmask(u.cpf || '') === cleanId;
      const matchPass = u.pin === pinOrPass || u.password === pinOrPass;
      const matchProfile = u.profile === selectedProfile;
      return matchId && matchPass && matchProfile;
    });

    if (!user) {
      return {
        success: false,
        message: 'Credenciais inválidas ou perfil incorreto.',
        toasts: [{ title: 'Erro de acesso', description: 'Credenciais inválidas ou perfil incorreto.', variant: 'destructive' }]
      };
    }

    if (user.active === false) {
      return {
        success: false,
        message: 'Conta de usuário desativada. Contate o administrador.',
        toasts: [{ title: 'Conta Suspensa', description: 'Acesso desativado pelo gestor.', variant: 'destructive' }]
      };
    }

    // Gravação da sessão
    this.session['mockUserId'] = user.id;

    // Roteamento específico por perfil
    let redirectUrl = '/dashboard';
    switch (user.profile) {
      case 'motorista':
        redirectUrl = '/driver/route-plan';
        break;
      case 'pai':
        redirectUrl = '/parent/tracking';
        break;
      case 'monitor':
        redirectUrl = '/monitor';
        break;
      case 'gestor':
      default:
        redirectUrl = '/dashboard';
        break;
    }

    return {
      success: true,
      data: user,
      redirectUrl,
      toasts: [{ title: `Bem-vindo(a), ${user.name}!`, description: `Redirecionando para o painel de ${user.profile}.` }]
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 2. CONTROLADOR DE OPERAÇÃO DO MOTORISTA (Driver Actions)
// ─────────────────────────────────────────────────────────────
export class DriverActionController {
  private db: MockDB;
  private routeId: string;
  private selectedShift: Shift;
  private selectedDirection: 'ida' | 'volta';
  private session: Record<string, string> = {};

  constructor(db: MockDB, routeId: string, shift: Shift = 'Manhã', direction: 'ida' | 'volta' = 'ida') {
    this.db = db;
    this.routeId = routeId;
    this.selectedShift = shift;
    this.selectedDirection = direction;
  }

  public getRoute(): Route | undefined {
    return this.db.routes.find(r => r.id === this.routeId);
  }

  public getDriver(): Driver | undefined {
    const route = this.getRoute();
    if (!route) return undefined;
    return this.db.drivers.find(d => d.id === route.driverId);
  }

  public getVehicle(): Vehicle | undefined {
    const route = this.getRoute();
    if (!route) return undefined;
    return this.db.vehicles.find(v => v.id === route.vehicleId);
  }

  /**
   * Retorna os alunos da rota atual
   */
  public getRouteStudents(): Student[] {
    const route = this.getRoute();
    if (!route) return [];
    return this.db.students.filter(s => route.studentIds.includes(s.id) && s.active !== false);
  }

  /**
   * Calcula a sequência exata de paradas ordenadas (orderedStops)
   */
  public getOrderedStops(): Array<{ id: string; type: 'student' | 'school'; data: any }> {
    const students = this.getRouteStudents().filter(s => {
      const modality = s.serviceModality || 'completo';
      if (this.selectedDirection === 'ida' && modality === 'so_volta') return false;
      if (this.selectedDirection === 'volta' && modality === 'so_ida') return false;
      if (s.shift !== 'Integral' && s.shift !== this.selectedShift) return false;

      const isAbsentIda = s.status === 'ausente_ida' || s.status === 'ausente_dia_todo';
      const isAbsentVolta = s.status === 'ausente_volta' || s.status === 'ausente_dia_todo';
      if (this.selectedDirection === 'ida' && isAbsentIda) return false;
      if (this.selectedDirection === 'volta' && isAbsentVolta) return false;

      return true;
    });

    const studentStops = students.map(s => ({ id: s.id, type: 'student' as const, data: s }));
    const neededSchoolIds = new Set(students.map(s => s.schoolId).filter(Boolean));
    const schoolStops = this.db.schools
      .filter(sch => neededSchoolIds.has(sch.id))
      .map(sch => ({ id: sch.id, type: 'school' as const, data: sch }));

    if (this.selectedDirection === 'ida') {
      return [...studentStops, ...schoolStops];
    } else {
      return [...schoolStops, ...studentStops];
    }
  }

  /**
   * Calcula a Parada Ativa atual (activeStop)
   */
  public getActiveStop(): { stop: any; stopNumber: number; totalStops: number } | null {
    const stops = this.getOrderedStops();
    const totalStops = stops.length;
    if (totalStops === 0) return null;

    const nextIndex = stops.findIndex(s => {
      if (this.selectedDirection === 'ida') {
        if (s.type === 'student') return s.data.status === 'aguardando';
        return stops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'a_bordo');
      } else {
        if (s.type === 'school') return stops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'aguardando');
        if (s.type === 'student') return s.data.status === 'a_bordo';
        return false;
      }
    });

    if (nextIndex === -1) return null;
    return { stop: stops[nextIndex], stopNumber: nextIndex + 1, totalStops };
  }

  /**
   * Retorna os alunos já a bordo da van
   */
  public getBoardedStudents(): Student[] {
    return this.getRouteStudents().filter(s => s.status === 'a_bordo');
  }

  /**
   * Executa a ação do botão "INICIAR OPERAÇÃO"
   */
  public clickStartRoute(): ActionResult {
    const route = this.getRoute();
    const driver = this.getDriver();
    if (!route || !driver) {
      return { success: false, message: 'Rota ou motorista não encontrado.' };
    }

    // 1. Resetar alunos que não estejam com falta justificada
    const students = this.getRouteStudents();
    students.forEach(s => {
      const isAbsent = s.status.startsWith('ausente_');
      if (!isAbsent) {
        s.status = 'aguardando';
      }
    });

    // 2. Atualizar rota e motorista para 'em_rota'
    route.journeyStatus = 'em_rota';
    route.activeShift = this.selectedShift;
    route.activeDirection = this.selectedDirection;
    driver.status = 'em_rota';

    // 3. Gravar na sessão
    this.session['activeRouteId'] = route.id;
    this.session['activeShift'] = this.selectedShift;
    this.session['activeDirection'] = this.selectedDirection;

    return {
      success: true,
      toasts: [{ title: 'Viagem Iniciada!' }],
      data: { route, driver, activeStop: this.getActiveStop() }
    };
  }

  /**
   * Executa a ação do botão "EMBARCOU" para um aluno com validação defensiva
   */
  public clickEmbarcou(studentId: string): ActionResult {
    const route = this.getRoute();
    if (!route || route.journeyStatus !== 'em_rota') {
      return { success: false, message: 'A viagem precisa ser iniciada antes de registrar embarques.' };
    }

    const student = this.db.students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Aluno não encontrado.' };
    }

    if (student.status === 'a_bordo') {
      return { success: false, message: `O aluno ${student.name} já consta como a bordo.` };
    }

    if (student.status === 'desembarcado') {
      return { success: false, message: `O aluno ${student.name} já realizou desembarque nesta viagem.` };
    }

    if (student.status.startsWith('ausente_')) {
      return { success: false, message: `Não é possível embarcar: ${student.name} possui aviso de ausência ativo.` };
    }

    // Atualização otimista imediata do status
    student.status = 'a_bordo';
    student.boardedAt = new Date().toISOString();

    const firstName = student.name.split(' ')[0];
    const newActive = this.getActiveStop();

    return {
      success: true,
      data: {
        boardedStudent: student,
        boardedCount: this.getBoardedStudents().length,
        nextActiveStop: newActive
      },
      toasts: [{
        title: 'Embarque Confirmado!',
        description: `✅ ${firstName} embarcou com segurança na van.`
      }]
    };
  }

  /**
   * Executa a ação do botão "DESEMBARCOU" para um aluno
   */
  public clickDesembarcou(studentId: string): ActionResult {
    const route = this.getRoute();
    if (!route || route.journeyStatus !== 'em_rota') {
      return { success: false, message: 'A rota não está em andamento.' };
    }

    const student = this.db.students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Aluno não encontrado.' };
    }

    if (student.status !== 'a_bordo') {
      return {
        success: false,
        message: `Aluno ${student.name} não pode desembarcar pois ainda não embarcou (status: ${student.status}).`
      };
    }

    student.status = 'desembarcado';
    student.disembarkedAt = new Date().toISOString();
    const firstName = student.name.split(' ')[0];

    return {
      success: true,
      data: {
        disembarkedStudent: student,
        remainingBoardedCount: this.getBoardedStudents().length,
        nextActiveStop: this.getActiveStop()
      },
      toasts: [{
        title: 'Desembarque Confirmado!',
        description: `🏠 ${firstName} desembarcou com segurança.`
      }]
    };
  }

  /**
   * Executa a ação do botão "AUSENTE"
   */
  public clickAusente(studentId: string): ActionResult {
    const student = this.db.students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Aluno não encontrado.' };
    }

    const absenceStatus = this.selectedDirection === 'ida' ? 'ausente_ida' : 'ausente_volta';
    student.status = absenceStatus as StudentStatus;

    return {
      success: true,
      data: { nextActiveStop: this.getActiveStop() },
      toasts: [{
        title: 'Ausência Registrada',
        description: `⚠️ ${student.name.split(' ')[0]} registrado como ausente hoje.`,
        variant: 'destructive'
      }]
    };
  }

  /**
   * Executa a ação do botão "REINICIAR / ENCERRAR VIAGEM"
   * Implementa a trava de segurança contra esquecimento de crianças (Child Left Behind Protection)
   */
  public clickEndRoute(enforceEmptyVan: boolean = true): ActionResult {
    const route = this.getRoute();
    const driver = this.getDriver();
    if (!route) {
      return { success: false, message: 'Rota não encontrada.' };
    }

    // Trava de segurança: impede finalização se houver crianças esquecidas na van
    const boarded = this.getBoardedStudents();
    if (enforceEmptyVan && boarded.length > 0) {
      return {
        success: false,
        message: `BLOQUEIO DE SEGURANÇA: Há ${boarded.length} criança(s) ainda a bordo (${boarded.map(s => s.name).join(', ')}). Desembarque todos antes de finalizar!`
      };
    }

    route.journeyStatus = 'pendente';
    if (driver) {
      driver.status = 'inativo';
    }

    this.session = {};

    return {
      success: true,
      toasts: [{
        title: 'Operação Finalizada',
        description: 'O itinerário foi concluído com sucesso e segurança.'
      }]
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 3. CONTROLADOR CRUD DE GESTÃO (Management Forms Actions)
// ─────────────────────────────────────────────────────────────
export class CrudActionController {
  private db: MockDB;

  constructor(db: MockDB) {
    this.db = db;
  }

  // --- CRUD DE ALUNO ---
  public submitCreateStudent(data: Partial<Student>): ActionResult<Student> {
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: 'Nome do aluno deve ter no mínimo 3 caracteres.' };
    }
    if (!data.schoolId) {
      return { success: false, message: 'Escola é obrigatória.' };
    }
    if (!data.parentId) {
      return { success: false, message: 'Responsável é obrigatório.' };
    }

    const schoolExists = this.db.schools.some(s => s.id === data.schoolId);
    if (!schoolExists) {
      return { success: false, message: 'Escola vinculada não existe na base.' };
    }

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim(),
      schoolId: data.schoolId,
      parentId: data.parentId,
      shift: data.shift || 'Manhã',
      status: 'aguardando',
      street: data.street || 'Rua Principal',
      number: data.number || '100',
      city: data.city || 'Carapicuíba',
      state: data.state || 'SP',
      latitude: data.latitude ?? -23.5505,
      longitude: data.longitude ?? -46.6333,
      serviceModality: data.serviceModality || 'completo',
      monthlyFee: data.monthlyFee ?? 450,
      active: true,
      ...data
    };

    // Atualização otimista
    this.db.students.push(newStudent);

    return {
      success: true,
      data: newStudent,
      toasts: [{ title: 'Aluno cadastrado!', description: `${newStudent.name} foi adicionado à base.` }]
    };
  }

  public submitUpdateStudent(studentId: string, updates: Partial<Student>): ActionResult<Student> {
    const student = this.db.students.find(s => s.id === studentId);
    if (!student) {
      return { success: false, message: 'Aluno não encontrado para atualização.' };
    }

    Object.assign(student, updates);

    return {
      success: true,
      data: student,
      toasts: [{ title: 'Aluno atualizado!', description: `Dados de ${student.name} foram salvos com sucesso.` }]
    };
  }

  public submitDeleteStudent(studentId: string): ActionResult {
    const index = this.db.students.findIndex(s => s.id === studentId);
    if (index === -1) {
      return { success: false, message: 'Aluno não encontrado para exclusão.' };
    }

    const studentName = this.db.students[index].name;
    this.db.students.splice(index, 1);

    // Cascata de integridade referencial: remove de todas as rotas
    this.db.routes.forEach(r => {
      r.studentIds = r.studentIds.filter(id => id !== studentId);
    });

    return {
      success: true,
      toasts: [{ title: 'Aluno excluído!', description: `${studentName} foi removido com sucesso.` }]
    };
  }

  // --- CRUD DE ROTA ---
  public submitCreateRoute(data: Partial<Route>): ActionResult<Route> {
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: 'Nome da rota deve ter pelo menos 3 caracteres.' };
    }
    if (!data.driverId) {
      return { success: false, message: 'Motorista deve ser vinculado à rota.' };
    }

    const driverExists = this.db.drivers.some(d => d.id === data.driverId);
    if (!driverExists) {
      return { success: false, message: 'Motorista selecionado não existe na base.' };
    }

    const newRoute: Route = {
      id: `route-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: data.name.trim(),
      driverId: data.driverId,
      monitorId: data.monitorId || 'mon-1',
      vehicleId: data.vehicleId || 'veh-1',
      studentIds: data.studentIds || [],
      shift: data.shift || 'Manhã',
      journeyStatus: 'pendente',
      activeShift: 'Manhã',
      activeDirection: 'ida',
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: new Date().toISOString(),
      ...data
    };

    this.db.routes.push(newRoute);

    return {
      success: true,
      data: newRoute,
      toasts: [{ title: 'Rota criada com sucesso!', description: `Rota ${newRoute.name} pronta para operação.` }]
    };
  }

  /**
   * Aloca aluno na rota respeitando rigorosamente a capacidade da van (Trava anti-superlotação)
   */
  public submitAssignStudentToRoute(routeId: string, studentId: string): ActionResult {
    const route = this.db.routes.find(r => r.id === routeId);
    if (!route) return { success: false, message: 'Rota não encontrada.' };

    const student = this.db.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Aluno não encontrado.' };

    if (route.studentIds.includes(studentId)) {
      return { success: false, message: 'Aluno já está vinculado a esta rota.' };
    }

    const driver = this.db.drivers.find(d => d.id === route.driverId);
    const vehicle = this.db.vehicles.find(v => v.id === route.vehicleId) ||
                    this.db.vehicles.find(v => v.id === driver?.vehicleId) ||
                    this.db.vehicles[0];
    if (vehicle && route.studentIds.length >= vehicle.capacity) {
      return {
        success: false,
        message: `CAPACIDADE EXCEDIDA: A van ${vehicle.model} (${vehicle.licensePlate}) atingiu a capacidade máxima regulamentar de ${vehicle.capacity} passageiros.`
      };
    }

    route.studentIds.push(studentId);

    return {
      success: true,
      data: { route, student },
      toasts: [{ title: 'Aluno alocado na van!', description: `${student.name} agora faz parte do itinerário.` }]
    };
  }

  // --- CRUD DE VEÍCULO ---
  public submitCreateVehicle(data: Partial<Vehicle>): ActionResult<Vehicle> {
    if (!data.licensePlate || data.licensePlate.trim().length < 7) {
      return { success: false, message: 'Placa do veículo inválida.' };
    }
    if (!data.capacity || data.capacity <= 0) {
      return { success: false, message: 'Capacidade de passageiros deve ser superior a zero.' };
    }

    const newVehicle: Vehicle = {
      id: `veh-${Date.now()}`,
      model: data.model || 'Van Escolar Padrão',
      licensePlate: data.licensePlate.trim().toUpperCase(),
      capacity: data.capacity,
      active: true,
      currentOdometer: data.currentOdometer || 0,
      lastMaintenanceOdometer: data.lastMaintenanceOdometer || 0,
      maintenanceInterval: data.maintenanceInterval || 10000,
      ...data
    };

    this.db.vehicles.push(newVehicle);

    return {
      success: true,
      data: newVehicle,
      toasts: [{ title: 'Veículo cadastrado!', description: `Placa ${newVehicle.licensePlate} pronta para uso.` }]
    };
  }

  // --- CRUD DE MOTORISTA ---
  public submitCreateDriver(data: Partial<Driver> & { cnh?: string; cnhCategory?: string }): ActionResult<Driver> {
    if (!data.name || data.name.trim().length < 3) {
      return { success: false, message: 'Nome do motorista deve ter no mínimo 3 caracteres.' };
    }
    if (data.cnhCategory && !['D', 'E'].includes(data.cnhCategory.toUpperCase())) {
      return { success: false, message: 'Transporte escolar exige CNH categoria D ou E (Detran/Contran).' };
    }

    const newDriver: Driver = {
      id: `drv-${Date.now()}`,
      userId: data.userId || `user-${Date.now()}`,
      name: data.name.trim(),
      vehicleId: data.vehicleId || 'veh-1',
      status: 'inativo',
      active: true,
      latitude: data.latitude ?? -23.5505,
      longitude: data.longitude ?? -46.6333,
      ...data
    };

    this.db.drivers.push(newDriver);

    return {
      success: true,
      data: newDriver,
      toasts: [{ title: 'Motorista cadastrado!', description: `${newDriver.name} pronto para ser designado.` }]
    };
  }
}

// ─────────────────────────────────────────────────────────────
// 4. CONTROLADOR DE MONITOR E PAI (Monitor & Parent Actions)
// ─────────────────────────────────────────────────────────────
export class MonitorActionController {
  private db: MockDB;

  constructor(db: MockDB) {
    this.db = db;
  }

  /**
   * Ação do botão "EMBARQUE COLETIVO" na escola
   */
  public clickEmbarqueColetivo(schoolId: string, studentIds: string[]): ActionResult {
    const affected = this.db.students.filter(s => studentIds.includes(s.id) && s.schoolId === schoolId);
    if (affected.length === 0) {
      return { success: false, message: 'Nenhum aluno encontrado para embarque coletivo nesta escola.' };
    }

    affected.forEach(s => {
      s.status = 'a_bordo';
      s.boardedAt = new Date().toISOString();
    });

    return {
      success: true,
      data: { count: affected.length, students: affected },
      toasts: [{
        title: 'Embarque Coletivo Concluído!',
        description: `${affected.length} alunos embarcados com sucesso na van.`
      }]
    };
  }

  /**
   * Ação da trava de varredura (inspeção do último banco)
   */
  public confirmSafetySweep(routeId: string): ActionResult {
    const route = this.db.routes.find(r => r.id === routeId);
    if (!route) return { success: false, message: 'Rota não encontrada.' };

    (route as any).safetySweepConfirmedAt = new Date().toISOString();

    return {
      success: true,
      toasts: [{
        title: 'Varredura Confirmada',
        description: 'Inspeção do veículo registrada com sucesso.'
      }]
    };
  }

  /**
   * Registro de ocorrência / incidente durante o transporte
   */
  public submitIncidentReport(routeId: string, severity: 'baixa' | 'media' | 'alta', description: string, studentId?: string): ActionResult {
    if (!description || description.trim().length < 5) {
      return { success: false, message: 'Descrição do incidente deve ter no mínimo 5 caracteres.' };
    }

    const incident = {
      id: `inc-${Date.now()}`,
      routeId,
      studentId,
      severity,
      description: description.trim(),
      timestamp: new Date().toISOString()
    };

    if (!Array.isArray((this.db as any).incident_logs)) {
      (this.db as any).incident_logs = [];
    }
    (this.db as any).incident_logs.push(incident);

    return {
      success: true,
      data: incident,
      toasts: [{
        title: 'Incidente Registrado',
        description: `Ocorrência classificada como ${severity.toUpperCase()} gravada no sistema.`,
        variant: severity === 'alta' ? 'destructive' : 'default'
      }]
    };
  }
}

export class ParentActionController {
  private db: MockDB;

  constructor(db: MockDB) {
    this.db = db;
  }

  /**
   * Ação do botão "Avisar Ausência"
   */
  public submitAbsenceNotification(studentId: string, type: 'ida' | 'volta' | 'dia_todo', reason?: string): ActionResult {
    const student = this.db.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Aluno não encontrado.' };

    const statusMap = {
      ida: 'ausente_ida',
      volta: 'ausente_volta',
      dia_todo: 'ausente_dia_todo'
    };

    student.status = statusMap[type] as StudentStatus;
    (student as any).absenceReason = reason || 'Motivo informado pelo responsável via app';
    (student as any).absenceReportedAt = new Date().toISOString();

    return {
      success: true,
      data: student,
      toasts: [{
        title: 'Ausência Comunicada!',
        description: 'A van foi informada e o itinerário recalculado sem paradas desnecessárias.'
      }]
    };
  }

  /**
   * Autorização de terceiro para retirada do aluno
   */
  public submitAuthorizedPickupPerson(studentId: string, personName: string, cpf: string, phone: string): ActionResult {
    const student = this.db.students.find(s => s.id === studentId);
    if (!student) return { success: false, message: 'Aluno não encontrado.' };

    if (!personName || personName.trim().length < 3) {
      return { success: false, message: 'Nome completo da pessoa autorizada é obrigatório.' };
    }
    if (!cpf || unmask(cpf).length !== 11) {
      return { success: false, message: 'CPF válido com 11 dígitos é obrigatório.' };
    }

    const authorized = {
      id: `auth-pers-${Date.now()}`,
      name: personName.trim(),
      cpf: unmask(cpf),
      phone: unmask(phone || ''),
      authorizedAt: new Date().toISOString()
    };

    if (!Array.isArray((student as any).authorizedPickups)) {
      (student as any).authorizedPickups = [];
    }
    (student as any).authorizedPickups.push(authorized);

    return {
      success: true,
      data: authorized,
      toasts: [{
        title: 'Pessoa Autorizada!',
        description: `${authorized.name} pode retirar o aluno com segurança.`
      }]
    };
  }

  /**
   * Pagamento de mensalidade via Pix
   */
  public payInvoicePix(invoiceId: string): ActionResult {
    const invoice = (this.db as any).invoices?.find((i: any) => i.id === invoiceId);
    if (!invoice) return { success: false, message: 'Fatura não encontrada.' };

    invoice.status = 'paga';
    invoice.paidAt = new Date().toISOString();
    invoice.paymentMethod = 'pix';

    return {
      success: true,
      data: invoice,
      toasts: [{
        title: 'Pagamento Concluído!',
        description: 'Recibo emitido e status financeiro atualizado instantaneamente.'
      }]
    };
  }
}
