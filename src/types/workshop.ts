export type OrderStatus =
  | "ingresado"
  | "en_diagnostico"
  | "esperando_repuestos"
  | "en_reparacion"
  | "listo_entrega";

export type InvoiceStatus = "pendiente" | "pagada" | "anulada";

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface Vehicle {
  id: string;
  clientId: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
}

export interface Technician {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  available: boolean;
}

export interface OrderNote {
  id: string;
  date: string;
  text: string;
  technicianId: string;
}

export interface UsedPart {
  partId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  vehicleId: string;
  clientId: string;
  technicianId: string;
  status: OrderStatus;
  faultDescription: string;
  diagnosis: string;
  photos: string[];
  notes: OrderNote[];
  usedParts: UsedPart[];
  createdAt: string;
  updatedAt: string;
}

export interface Part {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  price: number;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  orderId: string;
  clientId: string;
  items: InvoiceItem[];
  laborCost: number;
  subtotal: number;
  tax: number;
  total: number;
  status: InvoiceStatus;
  createdAt: string;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  ingresado: "Ingresado",
  en_diagnostico: "En Diagnóstico",
  esperando_repuestos: "Esperando Repuestos",
  en_reparacion: "En Reparación",
  listo_entrega: "Listo para Entrega",
};

export const STATUS_COLUMNS: OrderStatus[] = [
  "ingresado",
  "en_diagnostico",
  "esperando_repuestos",
  "en_reparacion",
  "listo_entrega",
];

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  anulada: "Anulada",
};
