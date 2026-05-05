export const business = {
  name: 'Restaurante El Bohío',
  rnc: '131-78945-2',
  owner: 'Carlos Marcano',
  address: 'Av. Tiradentes #45, Santo Domingo',
  phone: '809-555-0142'
}

export const stats = {
  balance: 284500,
  ingresos: 95200,
  gastos: 42800,
  facturasEmitidas: 47
}

export const monthlyChart = [
  { mes: 'Nov', ingresos: 62400, gastos: 31200 },
  { mes: 'Dic', ingresos: 78900, gastos: 38400 },
  { mes: 'Ene', ingresos: 71200, gastos: 35600 },
  { mes: 'Feb', ingresos: 84300, gastos: 41800 },
  { mes: 'Mar', ingresos: 89700, gastos: 39200 },
  { mes: 'Abr', ingresos: 95200, gastos: 42800 }
]

export const recentTransactions = [
  { id: 't1', fecha: '2026-04-30', concepto: 'Cena corporativa Banreservas', tipo: 'ingreso', monto: 18500, categoria: 'Ventas' },
  { id: 't2', fecha: '2026-04-29', concepto: 'Compra de mariscos', tipo: 'gasto', monto: 6200, categoria: 'Inventario' },
  { id: 't3', fecha: '2026-04-28', concepto: 'Almuerzo grupo Claro', tipo: 'ingreso', monto: 9450, categoria: 'Ventas' },
  { id: 't4', fecha: '2026-04-27', concepto: 'Pago electricidad EDESUR', tipo: 'gasto', monto: 4800, categoria: 'Servicios' },
  { id: 't5', fecha: '2026-04-26', concepto: 'Delivery fin de semana', tipo: 'ingreso', monto: 12300, categoria: 'Ventas' }
]

export const facturas = [
  { id: 'B0100000045', cliente: 'Banco Popular Dominicano', rnc: '101-01058-3', servicio: 'Catering ejecutivo', cantidad: 1, precio: 24500, itbis: 4410, total: 28910, fecha: '2026-04-30', estado: 'aprobada' },
  { id: 'B0100000044', cliente: 'María Fernández', rnc: '', servicio: 'Reserva cumpleaños', cantidad: 1, precio: 8500, itbis: 1530, total: 10030, fecha: '2026-04-29', estado: 'aprobada' },
  { id: 'B0100000043', cliente: 'Claro Dominicana', rnc: '101-01092-5', servicio: 'Almuerzo corporativo', cantidad: 25, precio: 850, itbis: 3825, total: 25075, fecha: '2026-04-28', estado: 'pendiente' },
  { id: 'B0100000042', cliente: 'José Antonio Reyes', rnc: '', servicio: 'Cena familiar', cantidad: 1, precio: 4200, itbis: 756, total: 4956, fecha: '2026-04-27', estado: 'aprobada' },
  { id: 'B0100000041', cliente: 'Constructora Arias', rnc: '130-45821-1', servicio: 'Reunión de junta', cantidad: 8, precio: 1200, itbis: 1728, total: 11328, fecha: '2026-04-26', estado: 'rechazada' },
  { id: 'B0100000040', cliente: 'Hotel Catalonia', rnc: '101-78421-9', servicio: 'Servicio de catering', cantidad: 1, precio: 32000, itbis: 5760, total: 37760, fecha: '2026-04-25', estado: 'aprobada' },
  { id: 'B0100000039', cliente: 'Patricia Henríquez', rnc: '', servicio: 'Boda íntima', cantidad: 1, precio: 18900, itbis: 3402, total: 22302, fecha: '2026-04-23', estado: 'pendiente' },
  { id: 'B0100000038', cliente: 'Seguros Universal', rnc: '101-01234-7', servicio: 'Almuerzo ejecutivo', cantidad: 12, precio: 950, itbis: 2052, total: 13452, fecha: '2026-04-22', estado: 'aprobada' },
  { id: 'B0100000037', cliente: 'Luis Manuel Peña', rnc: '', servicio: 'Reserva fin de semana', cantidad: 1, precio: 5600, itbis: 1008, total: 6608, fecha: '2026-04-20', estado: 'aprobada' },
  { id: 'B0100000036', cliente: 'Asociación Médica', rnc: '430-15879-4', servicio: 'Evento networking', cantidad: 40, precio: 750, itbis: 5400, total: 35400, fecha: '2026-04-18', estado: 'aprobada' }
]

export const transacciones = [
  { id: 1, fecha: '2026-04-30', concepto: 'Cena corporativa Banreservas', tipo: 'ingreso', categoria: 'Ventas', monto: 18500 },
  { id: 2, fecha: '2026-04-29', concepto: 'Compra de mariscos', tipo: 'gasto', categoria: 'Inventario', monto: 6200 },
  { id: 3, fecha: '2026-04-28', concepto: 'Almuerzo grupo Claro', tipo: 'ingreso', categoria: 'Ventas', monto: 9450 },
  { id: 4, fecha: '2026-04-27', concepto: 'Pago electricidad EDESUR', tipo: 'gasto', categoria: 'Servicios', monto: 4800 },
  { id: 5, fecha: '2026-04-26', concepto: 'Delivery fin de semana', tipo: 'ingreso', categoria: 'Ventas', monto: 12300 },
  { id: 6, fecha: '2026-04-25', concepto: 'Catering Hotel Catalonia', tipo: 'ingreso', categoria: 'Ventas', monto: 37760 },
  { id: 7, fecha: '2026-04-24', concepto: 'Salarios quincena', tipo: 'gasto', categoria: 'Nómina', monto: 18500 },
  { id: 8, fecha: '2026-04-23', concepto: 'Compra vegetales Bonao', tipo: 'gasto', categoria: 'Inventario', monto: 3400 },
  { id: 9, fecha: '2026-04-22', concepto: 'Almuerzo Seguros Universal', tipo: 'ingreso', categoria: 'Ventas', monto: 13452 },
  { id: 10, fecha: '2026-04-21', concepto: 'Combustible delivery', tipo: 'gasto', categoria: 'Transporte', monto: 1800 },
  { id: 11, fecha: '2026-04-20', concepto: 'Reserva fin de semana', tipo: 'ingreso', categoria: 'Ventas', monto: 6608 },
  { id: 12, fecha: '2026-04-19', concepto: 'Mantenimiento aire acondicionado', tipo: 'gasto', categoria: 'Mantenimiento', monto: 2900 },
  { id: 13, fecha: '2026-04-18', concepto: 'Evento Asociación Médica', tipo: 'ingreso', categoria: 'Ventas', monto: 35400 },
  { id: 14, fecha: '2026-04-17', concepto: 'Internet y teléfono Altice', tipo: 'gasto', categoria: 'Servicios', monto: 3200 },
  { id: 15, fecha: '2026-04-16', concepto: 'Cena privada familiar', tipo: 'ingreso', categoria: 'Ventas', monto: 7800 }
]

export const clientes = [
  { id: 'c1', nombre: 'Banco Popular Dominicano', rnc: '101-01058-3', telefono: '809-544-5000', email: 'eventos@popularenlinea.com', tipo: 'corporativo' },
  { id: 'c2', nombre: 'Claro Dominicana', rnc: '101-01092-5', telefono: '809-220-1111', email: 'corporativo@claro.com.do', tipo: 'corporativo' },
  { id: 'c3', nombre: 'Hotel Catalonia', rnc: '101-78421-9', telefono: '809-412-0000', email: 'banquetes@cataloniahotels.com', tipo: 'corporativo' },
  { id: 'c4', nombre: 'Constructora Arias', rnc: '130-45821-1', telefono: '809-565-7700', email: 'admin@arias.com.do', tipo: 'corporativo' },
  { id: 'c5', nombre: 'Seguros Universal', rnc: '101-01234-7', telefono: '809-544-7000', email: 'eventos@universal.com.do', tipo: 'corporativo' },
  { id: 'c6', nombre: 'Asociación Médica', rnc: '430-15879-4', telefono: '809-682-3030', email: 'contacto@amd.org.do', tipo: 'corporativo' },
  { id: 'c7', nombre: 'María Fernández', rnc: '', telefono: '829-234-5678', email: 'maria.fernandez@gmail.com', tipo: 'particular' },
  { id: 'c8', nombre: 'José Antonio Reyes', rnc: '', telefono: '849-987-6543', email: 'jareyes@hotmail.com', tipo: 'particular' }
]
