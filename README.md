# Factura Electrónica

Aplicación web para administrar clientes y artículos, y emitir facturas electrónicas de Panamá mediante The Factory HKA. Usa Node.js 20, Express 5, MySQL y frontend HTML/CSS/JavaScript sin framework, siguiendo el enfoque técnico de `psicoeducandonos` y un flujo de desarrollo guiado por especificaciones.

## Funcionalidad actual

### Acceso y seguridad

- Sesiones persistidas en MySQL, cookies `HttpOnly`, CSRF, bloqueo temporal y auditoría.
- MFA/TOTP obligatorio para superusuarios y administradores de empresa; las operaciones sensibles exigen MFA reciente.
- Invitaciones mediante enlace de un solo uso con vigencia de 48 horas.
- Recuperación de contraseña mediante enlace de 30 minutos enviado por Resend. Al completarla se revocan las sesiones anteriores.
- Usuarios y membresías se suspenden sin borrado destructivo; también se pueden revocar todas sus sesiones.

### Empresas, usuarios y permisos

- Aislamiento por tenant, empresa activa y membresía; los datos se filtran en el servidor.
- Selector para cambiar entre las empresas asignadas a la cuenta.
- Superusuario global creado exclusivamente con `npm run create-admin`.
- Administradores limitados a sus empresas asignadas, con posibilidad de administrar varias mediante membresías independientes.
- Gestión desde el panel de operadores y contadores: invitación, edición, suspensión y revocación de sesiones.
- Solo el superusuario crea empresas o asigna, modifica y suspende administradores de empresa.

| Nivel | Alcance vigente |
| --- | --- |
| Superusuario | Gobierno global, creación de empresas y administradores |
| Administrador de empresa | Configuración y usuarios no administrativos de las empresas asignadas |
| Contador | Operación fiscal y maestros de la empresa activa |
| Operador | POS, facturación y maestros permitidos por las rutas operativas |

Contador y operador comparten por ahora las rutas operativas; todavía no existe una matriz granular por acción.

### Clientes y artículos

- Ficha de cliente con datos generales, datos fiscales condicionales y campos personalizados configurables.
- Importación desde Zoho Invoice con vista previa, validación y detección de duplicados.
- Productos y servicios con precio, unidad, SKU, CPBS, ITBMS y disponibilidad individual en POS.
- Importación desde Zoho Inventory conservando `goods` como producto y `service` como servicio.
- Selección de artículos existentes o creación rápida y persistente desde la factura.

### Facturación electrónica

- Factura interna mediante The Factory HKA para consumidor final, contribuyente, Gobierno y extranjero.
- ITBMS exento, 7%, 10% y 15%, con desglose visual de base e impuesto antes de emitir.
- Totales recalculados por el servidor, secuencia transaccional e idempotencia por empresa.
- Correlativos configurables por sucursal, punto de facturación y tipo documental; el próximo número puede ajustarse al migrar desde otro PAC.
- Asignación opcional de sucursal y punto por usuario. Sin asignación se conservan los valores generales de HKA.
- Consulta y reconciliación de documentos con estado incierto.
- Historial de las 50 emisiones más recientes, estado, CUFE y enlace QR cuando estén disponibles.

### Punto de venta

- Catálogo habilitado con búsqueda y filtros de productos o servicios.
- Carrito táctil con cantidades, total por línea, ITBMS, subtotal y total general.
- Consumidor final o cliente guardado; pagos en efectivo, tarjetas, transferencia y cheque.
- En efectivo solicita monto recibido, calcula el cambio e impide cobrar si no cubre el total.
- Confirmación antes de limpiar y conservación del carrito ante errores o resultados inciertos.
- Diseño por columnas en escritorio y flujo vertical en dispositivos móviles.

El monto recibido y el cambio son transitorios: todavía no se persisten como movimiento de caja ni modifican el valor fiscal de la factura.

## Inicio local

Requisitos: Node.js 20 o superior y MySQL 8 compatible.

1. Copia `.env.example` como `.env` y reemplaza todos los valores de ejemplo.
2. Crea la base indicada por `DB_NAME` y concede permisos mínimos al usuario de aplicación.
3. Ejecuta `npm install`.
4. Ejecuta `npm run db:init`; es idempotente, crea la empresa inicial y migra instalaciones existentes. Realiza un respaldo antes de aplicarlo sobre datos reales.
5. Define `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`, y ejecuta `npm run create-admin`. Este es el único flujo que concede `is_superuser`; ejecútalo también una vez después de migrar una instalación existente.
6. Ejecuta `npm run dev` y abre `http://localhost:3000`.

Genera claves diferentes para sesión, MFA y configuración:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`MFA_ENCRYPTION_KEY` y `CONFIG_MASTER_KEY` deben tener 64 caracteres hexadecimales y nunca ser iguales. Perderlas impide descifrar los secretos asociados.

## Configuración y emisión HKA

El administrador configura ambiente, sucursal, punto fiscal y credenciales desde Configuración. Demo y producción requieren usuario y contraseña de servicios web propios del ambiente para autenticar la comunicación API. El frontend puede reemplazar credenciales, pero nunca recuperarlas. Las variables `HKA_*` son un fallback de transición; la configuración cifrada en base de datos tiene prioridad.

La emisión actual cubre factura interna (`tipoDocumento=01`, `tipoEmision=01`) con ITBMS de 0%, 7%, 10% y 15%. Admite consumidor final, contribuyente, Gobierno y extranjero. Los consecutivos reservados nunca se reutilizan. Ante estado `uncertain`, usa Consultar estado antes de intentar otra emisión.

Mantén el PAC en `demo` mientras se realizan pruebas técnicas; sus documentos no tienen validez fiscal. Cambia a `production` únicamente después de que el PAC habilite al emisor y se validen datos, sucursal, punto fiscal, TLS, respaldo, observabilidad y reversión. Toda emisión en producción es fiscalmente válida.

## Importaciones Zoho

Las importaciones requieren administrador, archivo `.xlsx` o `.csv` de hasta 5 MB y confirmación posterior a la vista previa.

- Clientes: hoja `Customer`; duplicados por ID Zoho, correo o RUC. Un registro con RUC/DV pero ubicación incompleta se importa provisionalmente como consumidor final.
- Artículos: hoja `Item`; `goods` se conserva como producto y `service` como servicio. Duplicados por Item ID o SKU. Los precios negativos se rechazan porque los descuentos fiscales deben modelarse explícitamente.

## Verificación

```powershell
npm run check
npm test
npm audit --omit=dev
```

Consulta [docs/INDEX.md](docs/INDEX.md) para el mapa documental y la arquitectura vigente.

## Límites funcionales actuales

No están implementados todavía notas de crédito o débito, anulaciones, contingencia, descuentos fiscales, retenciones, ISC/OTI, inventario cuantitativo, turnos y arqueo de caja, pagos mixtos, ventas suspendidas, operación offline, impresión de ticket, descarga CAFE/XML ni reportes contables. La producción depende además de la homologación y autorización del PAC/DGI.

## Operación de producción

`npm run ops:check` valida configuración de producción, conexión, administrador activo, idempotencia fiscal, configuración HKA por empresa y ausencia de facturas inciertas. Las sondas están disponibles en `/api/health/live` y `/api/health/ready`; las métricas Prometheus protegidas, en `/internal/metrics`.

Los procedimientos de despliegue, reversión, respaldo, restauración, observabilidad y homologación están enlazados desde `docs/INDEX.md`. La existencia de estos controles no sustituye la prueba de restauración ni la aprobación oficial HKA/DGI.
