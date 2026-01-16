// @ts-nocheck
// This file contains mock data for the presentation mode.

export const initialMockData = {
    schools: [
        { id: "school-1", name: "Escola Primária do Saber", address: "Rua das Flores, 123, São Paulo, SP", cnpj: "12.345.678/0001-99", latitude: -23.5505, longitude: -46.6333 },
        { id: "school-2", name: "Colégio Vanguarda", address: "Av. Principal, 789, São Paulo, SP", cnpj: "98.765.432/0001-11", latitude: -23.5613, longitude: -46.6565 },
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", cpf: "111.222.333-44", rg: "12.345.678-9", address: "Rua das Acácias, 10, São Paulo, SP" },
        { id: "parent-2", userId: "user-pai-2", name: "João Costa", email: "joao.costa@email.com", phone: "11912345678", cpf: "444.555.666-77", rg: "98.765.432-1", address: "Avenida das Oliveiras, 20, São Paulo, SP" },
    ],
    vehicles: [
        { id: "vehicle-1", model: "Mercedes-Benz Sprinter", licensePlate: "BRA2E19", capacity: 15, active: true },
        { id: "vehicle-2", model: "Renault Master", licensePlate: "ABC1D23", capacity: 12, active: false },
    ],
    drivers: [
        { id: "driver-1", userId: "user-motorista-1", name: "Carlos Silva", status: "em_rota", vehicleId: "vehicle-1", cpf: "123.456.789-00", rg: "11.222.333-4", address: "Rua dos Motoristas, 1, São Paulo, SP" },
        { id: "driver-2", userId: "user-motorista-2", name: "Mariana Costa", status: "inativo", vehicleId: "vehicle-2", cpf: "098.765.432-11", rg: "55.666.777-8", address: "Rua das Condutoras, 2, São Paulo, SP" },
        { id: "driver-3", userId: "user-motorista-3", name: "Roberto Almeida", status: "pausa", vehicleId: "", cpf: "111.222.333-44", rg: "99.888.777-6", address: "Avenida dos Transportes, 3, São Paulo, SP" },
    ],
    students: [
        { id: "student-1", name: "Lucas Pereira", schoolId: "school-1", parentId: "parent-1", routeId: "route-1", shift: "Manhã", status: "a_bordo", address: "Rua A, 10", latitude: -23.545, longitude: -46.638 },
        { id: "student-2", name: "Beatriz Costa", schoolId: "school-2", parentId: "parent-2", routeId: "route-1", shift: "Manhã", status: "aguardando", address: "Rua B, 20", latitude: -23.555, longitude: -46.640 },
        { id: "student-3", name: "Fernando Lima", schoolId: "school-1", parentId: "parent-1", routeId: "route-2", shift: "Tarde", status: "desembarcado", address: "Rua C, 30", latitude: -23.560, longitude: -46.630 },
        { id: "student-4", name: "Sofia Martins", schoolId: "school-2", parentId: "parent-2", routeId: "route-2", shift: "Tarde", status: "ausente", address: "Rua D, 40", latitude: -23.565, longitude: -46.650 },
    ],
    routes: [
        { id: "route-1", name: "Rota Matinal - Zona Sul", driverId: "driver-1", assistantId: "user-aux-1", studentIds: ["student-1", "student-2"], active: true, shift: "manha" },
        { id: "route-2", name: "Rota Vespertina - Centro", driverId: "driver-2", assistantId: "user-aux-2", studentIds: ["student-3", "student-4"], active: true, shift: "tarde" },
    ],
    locations: {
      "driver-1": { latitude: -23.55052, longitude: -46.633308, timestamp: new Date().toISOString() },
      "driver-2": { latitude: -23.58, longitude: -46.68, timestamp: new Date().toISOString() },
    },
    invoices: [
        {id: "inv-001", studentId: "student-1", amount: 350.00, dueDate: "2024-08-10T00:00:00Z", status: "pending" },
        {id: "inv-002", studentId: "student-2", amount: 380.00, dueDate: "2024-08-10T00:00:00Z", status: "pending" },
        {id: "inv-003", studentId: "student-3", amount: 350.00, dueDate: "2024-07-10T00:00:00Z", status: "paid" },
    ]
};
