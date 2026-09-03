# SPEC-013 — ERP comercial y fiscal

## Objetivo

Dar a la empresa activa un espacio operativo único para gestionar la venta formalizada, su ejecución, facturación y cobro, sin duplicar datos entre CRM, ERP y el módulo fiscal.

El alcance vigente es un ERP comercial y fiscal:

`Cotización → Pedido → Factura → Cuenta por cobrar → Pago`

No representa todavía contabilidad general, compras, inventario cuantitativo ni tesorería.

## Navegación

ERP es la entrada predeterminada después de iniciar sesión. Su navegación contiene:

1. **Resumen:** prioridades e indicadores operativos.
2. **Cotizaciones:** ofertas canónicas y versionadas.
3. **Pedidos:** ejecución de cotizaciones aceptadas.
4. **Facturas:** documentos fiscales y estados reportados por HKA/DGI.
5. **POS:** venta rápida y emisión inmediata.
6. **Clientes:** directorio general y fiscal.
7. **Artículos:** catálogo de productos y servicios.
8. **Cobros:** cuentas por cobrar y registro de pagos.

CRM continúa siendo responsable de prospectos, contactos, oportunidades y seguimiento. Administración mantiene empresa, usuarios, permisos y configuración fiscal.

## Resumen ERP

`GET /api/erp/dashboard` devuelve exclusivamente datos de la empresa activa:

- cotizaciones abiertas, pendientes de aprobación y listas para convertir;
- pedidos totales, confirmados y parcialmente facturados;
- cantidad y saldo de cuentas por cobrar abiertas;
- cantidad e importe de facturas autorizadas durante el mes corriente.

La interfaz presenta además el recorrido Cotizaciones → Pedidos → Facturas → Cobros como accesos operativos, no como un reporte contable.

## Pedidos

Un pedido nace únicamente de `POST /api/quotations/:id/convert` cuando la política es `sales_order`. La operación exige una cotización aceptada e `Idempotency-Key`.

El pedido conserva:

- empresa, cliente y oportunidad;
- cotización y versión de origen;
- número propio `PED-######` reservado por empresa;
- moneda, subtotal, descuento, impuesto y total;
- snapshot del cliente;
- snapshots de SKU, unidad, descripción, cantidad, precio, descuento e impuesto por renglón.

Estados definidos: `draft`, `confirmed`, `partially_invoiced`, `invoiced` y `cancelled`. La implementación vigente crea pedidos en `confirmed` y los cambia a `invoiced` al autorizar su factura. La operación parcial está reservada para una evolución posterior.

API vigente:

- `GET /api/erp/orders`
- `GET /api/erp/orders/:id`
- `GET /api/erp/orders/:id/invoice-draft`

## Facturación desde pedido

1. El usuario selecciona **Facturar** en un pedido confirmado.
2. El servidor recupera el borrador desde la cotización canónica de origen.
3. La interfaz carga cliente, oportunidad y renglones en Nueva factura.
4. El usuario revisa antes de emitir.
5. La validación fiscal recalcula todos los importes.
6. Solo una autorización de HKA cambia el pedido a `invoiced` y crea la cuenta por cobrar.
7. Un rechazo o estado incierto conserva el pedido disponible y no crea saldo.

## Cobros

La pantalla consume las cuentas por cobrar de la empresa activa y permite registrar efectivo, tarjetas, transferencia, cheque u otro medio. El importe no puede superar el saldo. Un pago parcial cambia la cuenta a `partial`; saldo cero cambia a `paid`.

Esta función representa cobranza comercial. No realiza asientos, conciliación bancaria, manejo de caja o tesorería.

## Seguridad e integridad

- Sesión válida, MFA según rol y empresa activa en todas las rutas.
- CSRF en escrituras.
- Lecturas y relaciones filtradas por `company_id`.
- Conversión de cotizaciones e emisión fiscal idempotentes con claves independientes.
- Correlativos comerciales y fiscales transaccionales.
- Snapshots históricos inmutables después de formalizar la oferta.
- Auditoría y eventos outbox para operaciones comerciales relevantes.

## Límites pendientes

- Facturación y entrega parcial de pedidos.
- Cancelación y devolución formal de pedidos.
- Reservas, existencias, almacenes, lotes y movimientos.
- Compras, proveedores y cuentas por pagar.
- Caja, bancos, conciliación y contabilidad general.
- Indicadores configurables, exportación y reportes financieros.
