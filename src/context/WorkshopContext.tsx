import React, { createContext, useContext, useState, ReactNode } from "react";
import type { Client, Vehicle, Technician, Order, Part, Invoice, OrderStatus } from "@/types/workshop";
import { mockClients, mockVehicles, mockTechnicians, mockOrders, mockParts, mockInvoices } from "@/data/mockData";

interface WorkshopContextType {
  clients: Client[];
  vehicles: Vehicle[];
  technicians: Technician[];
  orders: Order[];
  parts: Part[];
  invoices: Invoice[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  setParts: React.Dispatch<React.SetStateAction<Part[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setVehicles: React.Dispatch<React.SetStateAction<Vehicle[]>>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  getClient: (id: string) => Client | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getTechnician: (id: string) => Technician | undefined;
  getOrder: (id: string) => Order | undefined;
}

const WorkshopContext = createContext<WorkshopContextType | null>(null);

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [technicians] = useState<Technician[]>(mockTechnicians);
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [parts, setParts] = useState<Part[]>(mockParts);
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status, updatedAt: new Date().toISOString().split("T")[0] } : o))
    );
  };

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getVehicle = (id: string) => vehicles.find((v) => v.id === id);
  const getTechnician = (id: string) => technicians.find((t) => t.id === id);
  const getOrder = (id: string) => orders.find((o) => o.id === id);

  return (
    <WorkshopContext.Provider
      value={{
        clients, vehicles, technicians, orders, parts, invoices,
        setOrders, setParts, setInvoices, setClients, setVehicles,
        updateOrderStatus, getClient, getVehicle, getTechnician, getOrder,
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
