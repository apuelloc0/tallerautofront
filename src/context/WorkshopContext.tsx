import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import type { Client, Vehicle, Technician, Order, Part, Invoice, OrderStatus } from "@/types/workshop";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/api";

interface WorkshopContextType {
  clients: Client[];
  vehicles: Vehicle[];
  technicians: Technician[];
  workshop: any | null;
  orders: Order[];
  users: any[];
  parts: Part[];
  refreshData: () => Promise<void>;
  invoices: Invoice[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addPart: (part: Omit<Part, "id">) => Promise<Part>;
  updatePart: (id: string, part: Partial<Part>) => Promise<Part>;
  updateWorkshopProfile: (data: any) => Promise<void>;
  updateOrder: (id: string, orderData: any) => Promise<Order>;
  addClient: (client: Omit<Client, "id">) => Promise<Client>;
  createInvoice: (orderId: string, laborCost: number) => Promise<Invoice>;
  downloadInvoicePDF: (invoiceId: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, "id">) => Promise<Vehicle>;
  createOrder: (order: any) => Promise<Order>;
  addPartToOrder: (orderId: string, partId: string, quantity: number) => Promise<void>;
  removePartFromOrder: (orderId: string, itemId: string, partId: string, quantity: number) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserStatus: (userId: string, active: boolean, extraData?: any) => Promise<void>;
  getClient: (id: string) => Client | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getTechnician: (id: string) => Technician | undefined;
  getOrder: (id: string) => Order | undefined;
}

const WorkshopContext = createContext<WorkshopContextType | null>(null);

/** Funciones de utilidad movidas al principio para evitar ReferenceErrors */

function mapStatusToDB(status: string): string {
  const map: Record<string, string> = {
    en_diagnostico: "DIAGNOSTICO",
    esperando_repuestos: "ESPERA_REPUESTOS",
    listo_entrega: "LISTO",
  };
  return map[status] || status.toUpperCase();
}

function mapStatusFromDB(status: string): OrderStatus {
  const s = status?.toUpperCase();
  if (s === "DIAGNOSTICO") return "en_diagnostico" as OrderStatus;
  if (s === "ESPERA_REPUESTOS") return "esperando_repuestos" as OrderStatus;
  if (s === "LISTO") return "listo_entrega" as OrderStatus;
  return (status?.toLowerCase() || "ingresado") as OrderStatus;
}

function normalizeOrder(item: any): Order {
  // Función auxiliar para convertir UTC string a YYYY-MM-DD local
  const toLocalISO = (iso?: string) => iso ? new Date(iso).toLocaleDateString('en-CA') : undefined;

  return {
    ...item,
    status: mapStatusFromDB(item.status),
    clientId: item.client_id,
    vehicleId: item.vehicle_id,
    technicianId: item.technician_id,
    technicianName: item.technician?.full_name || "Sin asignar",
    faultDescription: item.fault_description,
    createdAt: toLocalISO(item.created_at),
    updatedAt: toLocalISO(item.updated_at),
    notes: item.notes || [], // Garantizamos que notes sea siempre un array
    usedParts: (item.order_items || []).map((p: any) => ({
      id: p.id,
      name: p.description,
      quantity: p.quantity,
      unitPrice: Number(p.price),
      partId: p.part_id // Necesario para el "undo"
    }))
  };
}

function normalizeInvoice(item: any): Invoice {
  const partsTotal = item.service_orders?.order_items?.reduce((acc: number, i: any) => acc + (Number(i.price) * i.quantity), 0) || 0;
  return {
    ...item,
    status: item.status?.toLowerCase() || "pendiente",
    orderId: item.order_id,
    clientId: item.client_id,
    subtotal: Number(item.subtotal_usd),
    tax: Number(item.tax_usd),
    total: Number(item.total_usd),
    laborCost: Number(item.subtotal_usd) - partsTotal,
    createdAt: item.created_at ? new Date(item.created_at).toLocaleDateString('en-CA') : undefined,
    items: (item.service_orders?.order_items || []).map((p: any) => ({
      description: p.description,
      quantity: p.quantity,
      unitPrice: Number(p.price),
      total: p.quantity * Number(p.price)
    }))
  };
}

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [workshop, setWorkshop] = useState<any | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const { isAuthenticated } = useAuth(); // Importamos el estado de autenticación

  const loadInitialData = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;

      const endpoints = ["/clients", "/vehicles", "/service-orders", "/inventory", "/billing", "/users", "/auth/me"];
      const results = await Promise.allSettled(
        endpoints.map(endpoint => api.get(endpoint))
      );

      const getRaw = (idx: number) => results[idx].status === "fulfilled" ? (results[idx] as any).value.data.data : [];

      setClients(getRaw(0).map((c: any) => ({ ...c, name: c.full_name || `${c.first_name} ${c.last_name}`.trim() })));
      setVehicles(getRaw(1).map((v: any) => ({ ...v, clientId: v.client_id })));
      setOrders(getRaw(2).map(normalizeOrder));
      
      const allUsers = getRaw(5).map((u: any) => ({ 
        ...u, 
        active: u.active === true || u.active === 'TRUE' || u.active === 'true' 
      }));
      setUsers(allUsers);
      
      setParts(getRaw(3).map((p: any) => ({ ...p, minStock: p.min_stock, price: p.price_usd || p.price || 0 })));
      setInvoices(getRaw(4).map(normalizeInvoice));

      // Cargamos los datos del taller desde la info del usuario logueado (que trae el join de workshops)
      if (results[6].status === "fulfilled") {
        const userData = (results[6] as any).value.data.user;
        if (userData) {
          setWorkshop({
            id: userData.workshop_id,
            name: userData.workshop_name,
            address: userData.address,
            phone: userData.phone,
            tax_rate: userData.tax_rate
          });
        }
      }

      setTechnicians(allUsers
        .filter((u: any) => u.active === true && u.role?.toUpperCase().includes("TECNICO"))
        .map((u: any) => ({ id: u.id, name: u.full_name, specialty: "General" })));
    } catch (error) {
      console.error("Error loading workshop data:", error);
    }
  };

  // Cargar datos reales al montar la aplicación
  useEffect(() => {
    loadInitialData();

    let interval: any;

    const startPolling = () => {
      if (isAuthenticated && !document.hidden && !interval) {
        interval = setInterval(loadInitialData, 60000); // 1 minuto (60000ms)
      }
    };

    const stopPolling = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else {
        // Al volver a la pestaña, refrescamos datos inmediatamente y reiniciamos el reloj
        loadInitialData();
        startPolling();
      }
    };

    if (isAuthenticated) {
      startPolling();
      document.addEventListener("visibilitychange", handleVisibilityChange);
    }

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isAuthenticated]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const { data } = await api.patch(`/service-orders/${orderId}`, { 
        status: mapStatusToDB(status)
      });
      

      // Ahora normalizeOrder se encarga de todo usando la respuesta completa del backend
      const updatedOrder = normalizeOrder(data.data);

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      );
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  };

  const addPart = async (partData: Omit<Part, "id">) => {
    const { data } = await api.post("/inventory", partData);
    const newPart = {
      ...data.data,
      minStock: data.data.min_stock ?? data.data.minStock ?? 5,
      price: data.data.price_usd ?? data.data.price ?? 0
    };
    setParts((prev) => [...prev, newPart]);
    return newPart;
  };

  const updatePart = async (id: string, partData: Partial<Part>) => {
    const { data } = await api.patch(`/inventory/${id}`, partData);
    const updatedPart = {
      ...data.data,
      minStock: data.data.min_stock ?? data.data.minStock ?? 5,
      price: data.data.price_usd ?? data.data.price ?? 0
    };
    setParts((prev) => prev.map((p) => (p.id === id ? updatedPart : p)));
    return updatedPart;
  };

  const addPartToOrder = async (orderId: string, partId: string, quantity: number) => {
    try {
      // Llamamos al endpoint del backend para registrar el ítem en la orden
      // Este endpoint también debería descontar del stock en la DB
      const { data } = await api.post(`/service-orders/${orderId}/items`, {
        part_id: partId,
        quantity
      });
      
      // Actualizamos el estado local con la orden refrescada que viene del server
      const updatedOrder = normalizeOrder(data.data);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

      // SINCRONIZACIÓN INMEDIATA: Descontamos el stock localmente 
      // para que el Dashboard y la página de Inventario reflejen el cambio sin esperar al polling.
      setParts(prev => prev.map(p => 
        p.id === partId ? { ...p, stock: p.stock - quantity } : p
      ));

    } catch (error) {
      console.error("Error adding part to order:", error);
      throw error;
    }
  };

  const removePartFromOrder = async (orderId: string, itemId: string, partId: string, quantity: number) => {
    try {
      const { data } = await api.delete(`/service-orders/${orderId}/items/${itemId}`);
      
      // Actualizamos orden
      const updatedOrder = normalizeOrder(data.data);
      setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));

      // Restauramos stock localmente
      setParts(prev => prev.map(p => 
        p.id === partId ? { ...p, stock: p.stock + quantity } : p
      ));
    } catch (error) {
      console.error("Error removing part:", error);
      throw error;
    }
  };

  const updateWorkshopProfile = async (profileData: any) => {
    try {
      if (!workshop?.id) return;
      const { data } = await api.patch(`/invitations/workshops/${workshop.id}`, profileData);
      setWorkshop(data.data);
      // Actualizamos el nombre en el AuthContext si cambió
    } catch (error) {
      console.error("Error updating workshop profile:", error);
      throw error;
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      await api.delete(`/users/${userId}`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };

  const updateUserStatus = async (userId: string, active: boolean, extraData?: any) => {
    try {
      const payload = { active, ...extraData };
      // Sincronizamos con el backend usando PATCH
      await api.patch(`/users/${userId}`, payload);
      
      setUsers(prev => {
        const next = prev.map(u => u.id === userId ? { ...u, ...payload } : u);
        
        // Sincronizamos inmediatamente la lista de técnicos disponibles para el Kanban y asignaciones
        setTechnicians(next
          .filter((u: any) => u.active === true && u.role?.toUpperCase().includes("TECNICO"))
          .map((u: any) => ({ id: u.id, name: u.full_name, specialty: "General" })));
          
        return next;
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      throw error;
    }
  };

  const createInvoice = async (orderId: string, laborCost: number) => {
    const order = getOrder(orderId);
    const { data } = await api.post("/billing", { order_id: orderId, labor_cost: laborCost });
    
    // Mapeamos los items de la orden al formato de items de factura para la UI
    const invoiceItems = (order?.usedParts || []).map(p => ({
      description: p.name,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      total: p.quantity * p.unitPrice
    }));

    const newInv = {
      ...data.data,
      status: data.data.status?.toLowerCase() || "pendiente",
      orderId: data.data.order_id,
      clientId: data.data.client_id,
      items: invoiceItems,
      laborCost: laborCost, // Mantenemos el valor enviado para la UI actual
      subtotal: data.data.subtotal_usd || data.data.subtotal,
      tax: data.data.tax_usd || data.data.tax,
      total: data.data.total_usd || data.data.total,
      createdAt: data.data.created_at?.split('T')[0]
    };
    setInvoices((prev) => [...prev, newInv]);
    return newInv;
  };

  const downloadInvoicePDF = async (invoiceId: string) => {
    const response = await api.get(`/billing/${invoiceId}/pdf`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `factura-${invoiceId.slice(0, 8)}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const updateOrder = async (id: string, orderData: any) => {
    const payload = {
      technician_id: orderData.technician_id || orderData.technicianId || null,
      fault_description: orderData.fault_description || orderData.faultDescription,
      diagnosis: orderData.diagnosis,
      status: mapStatusToDB(orderData.status),
      fuel_level: orderData.fuel_level || orderData.fuelLevel,
      reception_checklist: orderData.reception_checklist || orderData.receptionChecklist
    };
    const { data } = await api.patch(`/service-orders/${id}`, payload);
    const updatedOrder = normalizeOrder(data.data);
    setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)));
    return updatedOrder;
  };

  const addClient = async (clientData: Omit<Client, "id">) => {
    try {
      // Priorizamos first_name/last_name si vienen del formulario, sino dividimos 'name'
      const c = clientData as any;
      const firstName = c.first_name || (c.name || "").split(" ")[0];
      const lastName = c.last_name || (c.name || "").split(" ").slice(1).join(" ") || " ";

      const payload = {
        first_name: firstName,
        last_name: lastName,
        phone: clientData.phone,
        email: clientData.email,
        address: clientData.address
      };
      
      const { data } = await api.post("/clients", payload);
      
      const newClient = { 
        ...data.data, 
        name: data.data.full_name || `${data.data.first_name} ${data.data.last_name}`.trim()
      };
      setClients((prev) => [...prev, newClient]);
      return newClient;
    } catch (error: any) {
      console.error("Error en addClient:", error.response?.data || error.message);
      throw error;
    }
  };

  const addVehicle = async (vehicleData: Omit<Vehicle, "id">) => {
    const payload = {
      plate: vehicleData.plate,
      brand: vehicleData.brand,
      model: vehicleData.model,
      year: vehicleData.year,
      color: vehicleData.color,
      client_id: vehicleData.clientId // Mapeo a snake_case para la DB
    };
    const { data } = await api.post("/vehicles", payload);
    const newVehicle = { ...data.data, clientId: data.data.client_id };
    setVehicles((prev) => [...prev, newVehicle]);
    return newVehicle;
  };

  const createOrder = async (orderData: any) => {
    const payload = {
      client_id: orderData.client_id || orderData.clientId,
      vehicle_id: orderData.vehicle_id || orderData.vehicleId,
      technician_id: orderData.technician_id || orderData.technicianId || null,
      fault_description: orderData.fault_description || orderData.faultDescription,
      diagnosis: orderData.diagnosis,
      status: mapStatusToDB(orderData.status || "ingresado"),
      fuel_level: orderData.fuel_level || orderData.fuelLevel,
      reception_checklist: orderData.reception_checklist || orderData.receptionChecklist
    };
    // Cambiamos path a '/service-orders' según rutas del backend
    const { data } = await api.post("/service-orders", payload);
    const newOrder = normalizeOrder(data.data);
    setOrders((prev) => [...prev, newOrder]);
    return newOrder;
  };

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getTechnician = (id: string) => technicians.find((t) => t.id === id);
  const getOrder = (id: string) => orders.find((o) => o.id === id);

  return (
    <WorkshopContext.Provider
      value={{
        clients, vehicles, technicians, workshop, orders, users, parts, invoices, refreshData: loadInitialData,
        setOrders, setParts, setInvoices, setClients, setVehicles, setTechnicians,
        updateOrderStatus, addPart, updatePart, updateWorkshopProfile, updateOrder, addClient, createInvoice, downloadInvoicePDF, addVehicle, createOrder, addPartToOrder, removePartFromOrder, updateUserStatus, deleteUser,
        getClient, getVehicle, getTechnician, getOrder,
      }}
    >
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop() {
  const ctx = useContext(WorkshopContext);
  if (!ctx) throw new Error("useWorkshop must be used within WorkshopProvider");
  return ctx;
}
