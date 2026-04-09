
# Sistema de Gestión de Taller Automotriz

## Paleta de Colores
- **Fondo principal:** Gris muy claro (#F8F9FA / #F1F5F9)
- **Tarjetas/Superficies:** Blanco
- **Texto principal:** Gris oscuro (#1E293B)
- **Color de acento (Naranja Industrial):** #EA580C para botones de acción, badges activos, indicadores
- **Color secundario:** Gris medio para bordes y texto secundario
- **Alertas/Peligro:** Rojo para stock bajo, vencimientos
- **Éxito:** Verde para estados completados

## Navegación
- **Sidebar colapsable** con iconos Lucide y etiquetas
- Secciones: Dashboard, Pizarra Kanban, Órdenes, Inventario, Facturación, Clientes, Vista Técnico
- Logo/nombre del taller en la parte superior
- Responsive: en móvil se convierte en menú hamburguesa

## Vistas a Implementar

### 1. Dashboard Principal (`/`)
- 4 tarjetas KPI: Vehículos Hoy, Órdenes Activas, Ventas del Mes, Técnicos Disponibles
- Gráfico de barras de productividad semanal (con Recharts)
- Lista rápida de vehículos recientes ingresados
- Alertas de stock bajo

### 2. Pizarra Kanban (`/kanban`)
- 5 columnas: Ingresado → En Diagnóstico → Esperando Repuestos → En Reparación → Listo para Entrega
- Tarjetas de vehículo con: placa, marca, técnico asignado, tiempo transcurrido
- Drag & drop entre columnas usando @hello-pangea/dnd
- Indicador visual naranja para vehículos con más de 48h sin avance
- Filtros por técnico y marca

### 3. Gestión de Órdenes (`/ordenes`)
- **Lista:** Tabla con buscador por placa/cliente, filtros por estado, paginación
- **Crear/Editar Orden** (`/ordenes/nueva`, `/ordenes/:id`): Formulario con:
  - Datos del vehículo (placa, marca, modelo, año, color)
  - Datos del cliente (nombre, teléfono, email)
  - Descripción de falla reportada
  - Diagnóstico preliminar
  - Asignación de técnico (dropdown)
  - Zona de fotos de peritaje (upload simulado con preview)
  - Estado de la orden (selector)

### 4. Inventario de Repuestos (`/inventario`)
- Tabla interactiva con columnas: Código, Nombre, Categoría, Stock, Precio, Estado
- Badges de alerta rojo para stock bajo (< umbral)
- Buscador y filtros por categoría
- Modal para agregar/editar repuesto
- Indicador visual de stock con barra de progreso

### 5. Facturación Básica (`/facturacion`)
- Lista de facturas con estado (Pendiente, Pagada, Anulada)
- **Crear factura** vinculada a una orden:
  - Piezas registradas por el técnico se listan automáticamente
  - Campo para agregar mano de obra
  - Cálculo automático: subtotal + impuestos = total
  - Botón de "Generar PDF" (simulado, muestra preview)
- Vista detalle de factura

### 6. Directorio de Clientes y Vehículos (`/clientes`)
- Lista de clientes con búsqueda por nombre, placa o teléfono
- Vista detalle del cliente con:
  - Datos de contacto
  - Vehículos registrados
  - Historial de órdenes y visitas
- Formulario para agregar/editar cliente y vehículos

### 7. Vista del Técnico (`/tecnico`) — Mobile First
- Diseño simplificado, optimizado para móvil
- Lista de tareas asignadas al técnico seleccionado
- Cada tarjeta muestra: placa, marca, estado actual, tiempo
- Acciones rápidas: Cambiar estado, Agregar nota, Registrar repuesto usado
- Sin sidebar — navegación simplificada con header

## Datos Mock
- Todos los módulos usan datos mock en archivos separados (`src/data/`)
- Estructuras preparadas para reemplazar con llamadas a API Node.js
- Estado manejado con React state local y Context donde sea necesario

## Estructura de Archivos
```
src/
├── components/
│   ├── layout/ (AppSidebar, Layout)
│   ├── dashboard/ (KPICard, WeeklyChart, RecentVehicles)
│   ├── kanban/ (KanbanBoard, KanbanColumn, VehicleCard)
│   ├── orders/ (OrderList, OrderForm, OrderDetail)
│   ├── inventory/ (InventoryTable, PartModal)
│   ├── billing/ (InvoiceList, InvoiceForm, InvoicePreview)
│   ├── clients/ (ClientList, ClientDetail, VehicleHistory)
│   └── technician/ (TechTaskList, TechTaskCard)
├── data/ (mockData files)
├── pages/ (one per ruta)
└── types/ (interfaces TypeScript)
```
