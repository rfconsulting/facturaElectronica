# Plataforma de facturación electrónica y gestión comercial

Aplicación web multiempresa para emitir facturas electrónicas de Panamá mediante The Factory HKA, realizar ventas rápidas, administrar clientes y artículos, y dar seguimiento al proceso comercial desde un CRM integrado.

El área **ERP** cubre el ciclo operativo de venta desde la cotización hasta el cobro. Es un ERP comercial y fiscal, no un ERP administrativo universal: todavía no incorpora compras, proveedores, inventario por existencias, contabilidad general, tesorería, planilla ni recursos humanos.

## Alcance actual

| Área | Funciones disponibles |
| --- | --- |
| ERP comercial y fiscal | Tablero operativo, cotizaciones versionadas, pedidos, facturas, POS, clientes, artículos y cobros |
| CRM | Prospectos, contactos, oportunidades, pipeline, actividades, tareas y origen comercial de cotizaciones |
| Administración | Empresas, usuarios, membresías, integración HKA, correlativos y asignaciones fiscales |

Todos los datos operativos y comerciales están aislados por empresa activa en el servidor. Un usuario con acceso a varias empresas puede cambiar de empresa desde el encabezado.

## Funciones implementadas

### Facturación electrónica

- Emisión de factura interna de Panamá (`tipoDocumento=01`, `tipoEmision=01`) a través de The Factory HKA.
- Receptores de tipo contribuyente, consumidor final, Gobierno y extranjero.
- Líneas manuales, selección de artículos existentes y creación rápida de artículos desde la factura.
- ITBMS exento, 7 %, 10 % y 15 %, con totales recalculados y validados en el servidor.
- Formas de pago admitidas por la validación fiscal y envío del total facturado al PAC.
- Correlativos transaccionales por empresa, sucursal, punto de facturación y tipo documental.
- Idempotencia por empresa para evitar la duplicación accidental de una emisión.
- Consulta de las 50 emisiones más recientes, su estado, CUFE y enlace QR cuando HKA los proporciona.
- Reconsulta de documentos con resultado incierto.
- Registro automático de una actividad en el CRM cuando una factura autorizada está vinculada a un cliente.

### Punto de venta

- Catálogo de productos y servicios activos, con búsqueda y filtros.
- Carrito con cantidades, subtotal, ITBMS y total.
- Venta a consumidor final o a un cliente guardado.
- Pago en efectivo, tarjeta de crédito, tarjeta de débito, transferencia o depósito y cheque.
- En efectivo, validación del monto recibido y cálculo visual del cambio.
- Conservación del carrito cuando ocurre un error o el resultado de la emisión es incierto.
- Interfaz adaptable a escritorio y dispositivos móviles, con tema claro y oscuro.

El monto recibido y el cambio solo existen en la interfaz: no se guardan como movimiento de caja ni alteran el importe fiscal enviado.

### Clientes

- Alta, consulta y edición de clientes sin eliminación destructiva.
- Datos generales, fiscales, ubicación, contactos, notas y tratamiento para clientes extranjeros.
- Campos personalizados configurables por empresa.
- Búsqueda y filtrado por estado.
- Importación con vista previa desde archivos `.xlsx` o `.csv` de Zoho Invoice.
- Lectura del CSV legado sin encabezados, separado por punto y coma, usado para migraciones desde The Factory HKA.
- Detección de duplicados dentro del archivo y contra la empresa activa mediante código, correo o RUC normalizado.

La importación de clientes está disponible para administradores y omite registros duplicados o inválidos. Si un registro local conserva información fiscal incompleta, debe completarse antes de facturarlo como contribuyente.

### Artículos

- Alta, consulta y edición de productos y servicios.
- Nombre, descripción, SKU, unidad, precio de venta, moneda, ITBMS, código CPBS, utilidad y estado.
- Búsqueda y filtros por producto o servicio.
- Uso directo en facturas y en el catálogo del POS.
- Importación administrativa desde `.xlsx` o `.csv` de Zoho Inventory.
- Conservación de `goods` como producto y `service` como servicio, con detección de duplicados por ID de Zoho o SKU.

No se administran existencias, almacenes, lotes, movimientos, costos ni reposición; el catálogo no equivale a un módulo de inventario.

### CRM

- Resumen con prospectos activos, oportunidades abiertas, valor del pipeline, ventas ganadas del mes y seguimientos pendientes.
- Prospectos con nombre, empresa, contacto, origen, responsable, estado y próxima acción.
- Conversión de prospectos a cliente y, opcionalmente, a oportunidad; reutiliza un cliente cuando encuentra el mismo correo.
- Oportunidades con responsable, monto, probabilidad, cierre esperado, próxima acción y etapas desde diagnóstico hasta ganada o perdida.
- Pipeline visual tipo kanban y cambio de etapa desde la interfaz.
- Tareas comerciales con responsable, prioridad, vencimiento y estados pendiente, completada o cancelada.
- Actividades manuales de tipo nota, llamada, correo o reunión, además de eventos de factura.
- Cotizaciones con encabezado, cliente, contacto, oportunidad, múltiples renglones, artículos o entradas manuales, ITBMS de 0 %, 7 %, 10 % o 15 %, correlativo por empresa e historial de estados.
- Edición protegida para borradores, transiciones controladas, duplicación, búsqueda y consulta detallada.
- Contactos separados del cliente fiscal, con cargo, correo, teléfono, contacto principal y decisor.
- Conversión guiada para seleccionar o crear el cliente, crear su contacto principal y definir una oportunidad completa.

### ERP comercial y fiscal

- Cotizaciones con snapshots, descuentos, aprobación, historial, revisiones y conversión idempotente a pedido o borrador fiscal.
- Tablero ERP con prioridades, ventas mensuales, pedidos por facturar y saldos pendientes; vistas operativas de cotizaciones, pedidos y cobros.
- Preparación de factura sin recapturar cliente ni renglones; la autorización enlaza factura, cuenta por cobrar y oportunidad.
- Cuenta por cobrar automática para facturas comerciales, pagos parciales o totales y cierre de la oportunidad al saldarla.

### Automatización e integración comercial

- API de reporte comercial por responsable.
- Reglas de automatización administrables mediante API para crear tareas ante eventos comerciales.
- Bandeja transaccional (`integration_outbox`) para que futuros conectores consuman eventos del CRM.

El CRM expone resumen, prospectos, contactos, oportunidades, pipeline, actividades, tareas, cotizaciones y cobros. El ERP expone Resumen, Cotizaciones, Pedidos, Facturas, POS, Clientes, Artículos y Cobros. El reporte por responsable y la administración de automatizaciones existen en la API, pero todavía no tienen una pantalla dedicada. La bandeja de eventos no envía datos por sí sola: no hay conectores activos de correo, calendario, WhatsApp ni CRM externos.

### Empresas, usuarios y permisos

- Sesiones persistidas en MySQL, cookies `HttpOnly`, protección CSRF, límites de intentos y auditoría.
- MFA/TOTP obligatorio para superusuarios y administradores; las acciones sensibles requieren una verificación MFA reciente.
- Invitaciones mediante enlace de un solo uso con vigencia de 48 horas.
- Recuperación de contraseña por correo mediante Resend, con enlace de 30 minutos y revocación de sesiones anteriores.
- Suspensión de accesos y revocación de sesiones sin borrar usuarios ni trazabilidad.
- Cambio entre las empresas asignadas a una misma cuenta.
- Creación del superusuario únicamente mediante `npm run create-admin`.

| Rol | Alcance actual |
| --- | --- |
| Superusuario | Gobierno global, creación de empresas y administración de administradores |
| Administrador | Configuración fiscal y gestión de usuarios de sus empresas asignadas |
| Contador | Rutas operativas de la empresa activa |
| Operador | Rutas operativas de la empresa activa |

Contador y operador comparten la operación comercial ordinaria. El Contador puede aprobar cotizaciones y registrar cobros; el Operador no. La matriz verificable está en [docs/MATRIZ-ACCESO.md](docs/MATRIZ-ACCESO.md).

### Configuración y operación

- Configuración cifrada de ambiente, credenciales, sucursal y punto de facturación de HKA por empresa.
- Prueba de las credenciales guardadas sin devolverlas al navegador.
- Ajuste del próximo correlativo y asignación opcional de sucursal y punto de facturación por usuario.
- Sondas de vida y disponibilidad en `/api/health/live` y `/api/health/ready`.
- Métricas Prometheus protegidas por token en `/internal/metrics`.
- Comprobación previa a producción mediante `npm run ops:check`.
- Scripts y procedimientos documentados para respaldo, restauración, despliegue, reversión y observabilidad.

## Fuera del alcance actual

- Notas de crédito o débito, anulaciones, contingencia, descuentos fiscales, retenciones, ISC u OTI.
- Descarga de CAFE/XML e impresión de comprobantes o tickets.
- Cierre, apertura, turnos o arqueo de caja; pagos mixtos y ventas suspendidas.
- Operación sin conexión.
- Inventario cuantitativo, almacenes, compras, proveedores y órdenes de compra.
- Contabilidad general, cuentas por pagar, conciliación bancaria, tesorería, activos, presupuesto, planilla y recursos humanos.
- Emisión fiscal sin revisión humana: una cotización aceptada prepara el borrador, que debe revisarse y emitirse.
- Envío real de eventos del CRM a correo, calendario, formularios, WhatsApp u otros sistemas.
- Reportes contables, estados financieros o analítica empresarial completa.

La emisión en producción también depende de la homologación y autorización de The Factory HKA y la DGI. El ambiente `demo` no genera documentos con validez fiscal.

## Tecnología y arquitectura

- Node.js 20 o superior, Express 5 y MySQL 8 compatible.
- Frontend HTML, CSS y JavaScript sin framework.
- Monolito modular: `src/app.js` construye la aplicación y `src/server.js` administra el proceso HTTP.
- Los módulos de facturación y clientes ya separan rutas, controladores, casos de uso e infraestructura; otros módulos permanecen en rutas y servicios convencionales.

Consulta [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) para la arquitectura y [docs/INDEX.md](docs/INDEX.md) para el mapa documental.

## Instalación local

1. Copia `.env.example` como `.env` y sustituye todos los valores de ejemplo.
2. Crea la base indicada por `DB_NAME` y concede al usuario de la aplicación los permisos necesarios sobre ella.
3. Ejecuta `npm install`.
4. Ejecuta `npm run db:init`. El proceso es idempotente, crea la empresa inicial y aplica las migraciones incluidas. Realiza un respaldo antes de ejecutarlo sobre datos existentes.
5. Define `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`, y ejecuta `npm run create-admin`.
6. Ejecuta `npm run dev` y abre `http://localhost:3000`.

Genera valores independientes para los secretos de sesión y las claves de cifrado:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`MFA_ENCRYPTION_KEY` y `CONFIG_MASTER_KEY` deben contener 64 caracteres hexadecimales, ser diferentes entre sí y conservarse de forma segura. Perder estas claves impide descifrar los secretos asociados.

## Configuración de The Factory HKA

El administrador configura desde la aplicación el ambiente, las credenciales de servicios web, la sucursal y el punto de facturación. La configuración cifrada en la base de datos tiene prioridad sobre las variables `HKA_*`, que funcionan como valores iniciales o de transición.

Mantén el PAC en `demo` durante las pruebas. Cambia a `production` solo cuando el emisor esté habilitado y se hayan validado credenciales, datos fiscales, sucursal, punto de facturación, TLS, respaldos, restauración y observabilidad. Los correlativos reservados localmente no se reutilizan; ante un estado `uncertain`, consulta el documento antes de intentar una nueva emisión.

## Verificación

```powershell
npm run check
npm test
npm audit --omit=dev
```

Los procedimientos de producción están enlazados desde [docs/INDEX.md](docs/INDEX.md). Estos controles técnicos no sustituyen las pruebas de restauración ni la aprobación oficial de HKA/DGI.
