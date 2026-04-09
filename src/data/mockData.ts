import type { Client, Vehicle, Technician, Order, Part, Invoice } from "@/types/workshop";

export const mockClients: Client[] = [
  { id: "c1", name: "Carlos Mendoza", phone: "555-0101", email: "carlos@email.com", address: "Av. Principal 123" },
  { id: "c2", name: "María García", phone: "555-0102", email: "maria@email.com", address: "Calle 5 #45" },
  { id: "c3", name: "Roberto Silva", phone: "555-0103", email: "roberto@email.com", address: "Blvd. Norte 890" },
  { id: "c4", name: "Ana Torres", phone: "555-0104", email: "ana@email.com", address: "Calle Sur 22" },
  { id: "c5", name: "Luis Ramírez", phone: "555-0105", email: "luis@email.com", address: "Av. Central 456" },
];

export const mockVehicles: Vehicle[] = [
  { id: "v1", clientId: "c1", plate: "ABC-123", brand: "Toyota", model: "Corolla", year: 2020, color: "Blanco" },
  { id: "v2", clientId: "c2", plate: "DEF-456", brand: "Honda", model: "Civic", year: 2019, color: "Negro" },
  { id: "v3", clientId: "c3", plate: "GHI-789", brand: "Ford", model: "F-150", year: 2021, color: "Rojo" },
  { id: "v4", clientId: "c4", plate: "JKL-012", brand: "Chevrolet", model: "Spark", year: 2022, color: "Azul" },
  { id: "v5", clientId: "c5", plate: "MNO-345", brand: "Nissan", model: "Sentra", year: 2018, color: "Gris" },
  { id: "v6", clientId: "c1", plate: "PQR-678", brand: "Toyota", model: "Hilux", year: 2023, color: "Negro" },
  { id: "v7", clientId: "c3", plate: "STU-901", brand: "Mazda", model: "CX-5", year: 2021, color: "Rojo" },
];

export const mockTechnicians: Technician[] = [
  { id: "t1", name: "Pedro Martínez", specialty: "Motor", avatar: "PM", available: true },
  { id: "t2", name: "Juan López", specialty: "Electricidad", avatar: "JL", available: true },
  { id: "t3", name: "Diego Herrera", specialty: "Suspensión", avatar: "DH", available: false },
  { id: "t4", name: "Andrés Ruiz", specialty: "Transmisión", avatar: "AR", available: true },
];

export const mockOrders: Order[] = [
  {
    id: "o1", vehicleId: "v1", clientId: "c1", technicianId: "t1", status: "en_reparacion",
    faultDescription: "Motor hace ruido al acelerar", diagnosis: "Correa de distribución desgastada",
    photos: [], notes: [{ id: "n1", date: "2024-01-15", text: "Se confirmó desgaste de correa", technicianId: "t1" }],
    usedParts: [{ partId: "p3", name: "Correa de distribución", quantity: 1, unitPrice: 85 }],
    createdAt: "2024-01-14", updatedAt: "2024-01-15",
  },
  {
    id: "o2", vehicleId: "v2", clientId: "c2", technicianId: "t2", status: "en_diagnostico",
    faultDescription: "Luces delanteras no encienden", diagnosis: "",
    photos: [], notes: [],
    usedParts: [],
    createdAt: "2024-01-16", updatedAt: "2024-01-16",
  },
  {
    id: "o3", vehicleId: "v3", clientId: "c3", technicianId: "t1", status: "esperando_repuestos",
    faultDescription: "Frenos hacen ruido", diagnosis: "Pastillas de freno gastadas, discos rayados",
    photos: [], notes: [{ id: "n2", date: "2024-01-14", text: "Pedido de discos enviado", technicianId: "t1" }],
    usedParts: [{ partId: "p1", name: "Pastillas de freno", quantity: 2, unitPrice: 45 }],
    createdAt: "2024-01-13", updatedAt: "2024-01-14",
  },
  {
    id: "o4", vehicleId: "v4", clientId: "c4", technicianId: "t3", status: "ingresado",
    faultDescription: "Aire acondicionado no enfría", diagnosis: "",
    photos: [], notes: [],
    usedParts: [],
    createdAt: "2024-01-17", updatedAt: "2024-01-17",
  },
  {
    id: "o5", vehicleId: "v5", clientId: "c5", technicianId: "t4", status: "listo_entrega",
    faultDescription: "Cambio de aceite y filtros", diagnosis: "Mantenimiento preventivo completado",
    photos: [], notes: [{ id: "n3", date: "2024-01-12", text: "Todo OK, listo", technicianId: "t4" }],
    usedParts: [
      { partId: "p4", name: "Aceite sintético 5W-30", quantity: 4, unitPrice: 12 },
      { partId: "p2", name: "Filtro de aceite", quantity: 1, unitPrice: 15 },
    ],
    createdAt: "2024-01-11", updatedAt: "2024-01-12",
  },
  {
    id: "o6", vehicleId: "v6", clientId: "c1", technicianId: "t2", status: "en_reparacion",
    faultDescription: "Falla en sistema eléctrico", diagnosis: "Alternador defectuoso",
    photos: [], notes: [],
    usedParts: [],
    createdAt: "2024-01-15", updatedAt: "2024-01-16",
  },
];

export const mockParts: Part[] = [
  { id: "p1", code: "FRE-001", name: "Pastillas de freno", category: "Frenos", stock: 24, minStock: 10, price: 45 },
  { id: "p2", code: "FIL-001", name: "Filtro de aceite", category: "Filtros", stock: 3, minStock: 10, price: 15 },
  { id: "p3", code: "MOT-001", name: "Correa de distribución", category: "Motor", stock: 8, minStock: 5, price: 85 },
  { id: "p4", code: "LUB-001", name: "Aceite sintético 5W-30", category: "Lubricantes", stock: 40, minStock: 15, price: 12 },
  { id: "p5", code: "ELE-001", name: "Batería 12V", category: "Eléctrico", stock: 2, minStock: 5, price: 120 },
  { id: "p6", code: "SUS-001", name: "Amortiguador delantero", category: "Suspensión", stock: 6, minStock: 4, price: 95 },
  { id: "p7", code: "FIL-002", name: "Filtro de aire", category: "Filtros", stock: 15, minStock: 8, price: 18 },
  { id: "p8", code: "FRE-002", name: "Disco de freno", category: "Frenos", stock: 1, minStock: 4, price: 65 },
  { id: "p9", code: "MOT-002", name: "Bujías (juego x4)", category: "Motor", stock: 12, minStock: 6, price: 32 },
  { id: "p10", code: "ELE-002", name: "Alternador", category: "Eléctrico", stock: 3, minStock: 3, price: 210 },
];

export const mockInvoices: Invoice[] = [
  {
    id: "inv1", orderId: "o5", clientId: "c5",
    items: [
      { description: "Aceite sintético 5W-30", quantity: 4, unitPrice: 12, total: 48 },
      { description: "Filtro de aceite", quantity: 1, unitPrice: 15, total: 15 },
    ],
    laborCost: 50, subtotal: 113, tax: 18.08, total: 131.08,
    status: "pagada", createdAt: "2024-01-12",
  },
  {
    id: "inv2", orderId: "o1", clientId: "c1",
    items: [
      { description: "Correa de distribución", quantity: 1, unitPrice: 85, total: 85 },
    ],
    laborCost: 120, subtotal: 205, tax: 32.80, total: 237.80,
    status: "pendiente", createdAt: "2024-01-16",
  },
];

export const PART_CATEGORIES = ["Frenos", "Filtros", "Motor", "Lubricantes", "Eléctrico", "Suspensión"];
