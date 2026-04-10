export type UserRole = "admin" | "recepcionista" | "tecnico";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  recepcionista: "Recepcionista",
  tecnico: "Técnico",
};

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Acceso total: reportes, configuración, usuarios, facturación, KPIs",
  recepcionista: "Registrar vehículos, crear órdenes, asignar técnicos, generar facturas",
  tecnico: "Ver vehículos asignados, registrar piezas, actualizar estado, agregar notas",
};

// Routes each role can access
export const ROLE_ROUTES: Record<UserRole, string[]> = {
  admin: ["/", "/kanban", "/ordenes", "/inventario", "/facturacion", "/clientes", "/tecnico", "/configuracion"],
  recepcionista: ["/", "/kanban", "/ordenes", "/inventario", "/facturacion", "/clientes"],
  tecnico: ["/tecnico"],
};
