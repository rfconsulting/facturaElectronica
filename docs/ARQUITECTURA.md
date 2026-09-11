# Arquitectura vigente

## Vista general

```text
Navegador HTML/CSS/JS
        | sesión HttpOnly + CSRF
        v
Express 5
  |-- autenticación, MFA y empresa activa
  |-- clientes fiscales y contactos
  |-- CRM y automatizaciones
  |-- cotizaciones canónicas y pedidos ERP
  |-- facturación, POS y cuentas por cobrar
  |-- configuración e importadores
        |----> MySQL 8
        +----> The Factory HKA
```

El frontend no es fuente de verdad. Express valida identidad, pertenencia empresarial, transiciones comerciales e importes fiscales. MySQL conserva sesiones, usuarios, auditoría, secretos cifrados, maestros, relaciones comerciales, secuencias, documentos fiscales y saldos.

## Fronteras del dominio

- **Identidad y acceso:** `users`, `tenants`, `companies`, `company_memberships` y sesiones.
- **Maestros:** `clients`, `client_contacts`, campos personalizados y `articles`.
- **CRM:** `crm_leads`, `crm_opportunities`, `crm_activities`, `crm_tasks` y reglas.
- **Cotizaciones:** oferta canónica, snapshots, versiones, aprobación y conversión. Conserva temporalmente tablas `crm_quotes` por compatibilidad.
- **ERP:** pedidos y renglones congelados originados desde cotizaciones aceptadas.
- **Fiscal:** `invoice_sequences`, asignaciones y `electronic_invoices`.
- **Cobranza:** `accounts_receivable` y `receivable_payments`.
- **Integración:** configuración HKA e `integration_outbox`.

`clients` representa al receptor fiscal o cuenta empresarial. `client_contacts` representa personas vinculadas al cliente. Un prospecto conserva a la persona antes de calificarla; la conversión crea o selecciona el cliente y crea su contacto estructurado.

## Aislamiento multiempresa

- `tenants` agrupa empresas bajo una frontera comercial.
- `companies` es la frontera obligatoria de datos operativos y configuración.
- `company_memberships` asigna rol y estado por empresa.
- `requireAuth` revalida usuario, membresía, empresa y tenant en cada petición.
- Maestros, CRM, facturas, cotizaciones, pedidos, cuentas por cobrar, pagos, configuración y eventos incluyen `company_id`.
- Toda lectura o escritura por identificador combina el ID con la empresa activa.
- Los tokens HKA se almacenan en cachés separadas por empresa.

`npm run db:init` crea las tablas nuevas y migra instalaciones anteriores. Las etapas antiguas de oportunidad se traducen al pipeline vigente. Se requiere respaldo verificado antes de aplicarlo sobre datos reales.

## Flujo comercial

```text
Prospecto
  | conversión transaccional
  v
Cliente fiscal ---- Contacto principal
  |                     |
  +------ Oportunidad --+
              |
     Cotización versionada
              | aceptada y conversión idempotente
              v
       Pedido confirmado ---------+
       | oportunidad ganada        | política directa
              +----> Borrador de factura
              | emisión autorizada por HKA
              v
      Cuenta por cobrar
              | pagos parciales/totales
              v
      Cuenta pagada
```

Invariantes principales:

- `converted` no se asigna desde la edición general del prospecto.
- La conversión bloquea el prospecto y crea sus relaciones en una transacción.
- Las coincidencias ayudan al usuario a reutilizar un cliente; no convierten silenciosamente.
- Una oportunidad avanzada exige relación, responsable, monto, cierre esperado y próxima acción.
- `quote_sent` exige una cotización enviada, vista, aceptada o convertida.
- `payment_pending` fue retirado como etapa comercial: una deuda es estado de la cuenta por cobrar, no de la oportunidad.
- Un pago no puede superar el saldo bloqueado de la cuenta por cobrar.
- Un pedido confirmado marca la oportunidad vinculada como ganada. En la política de factura directa, la oportunidad se marca ganada cuando HKA autoriza la factura.
- Un pago parcial o total solo modifica la cuenta por cobrar; nunca decide el resultado de la oportunidad.

## Emisión fiscal desde cotización o pedido

1. Una cotización aceptada se convierte de forma idempotente en pedido confirmado o borrador fiscal, según su política.
2. Un pedido confirmado expone un borrador mediante `GET /api/erp/orders/:id/invoice-draft`.
3. La interfaz copia receptor, oportunidad, cotización de origen y renglones al formulario fiscal.
4. El usuario revisa la información antes de emitir; no hay emisión automática sin confirmación.
5. El servidor valida el origen convertido, su cliente y empresa, y recalcula subtotal, ITBMS y total.
6. Se reserva el correlativo y se envía el documento a HKA.
7. Si HKA autoriza, se conservan las relaciones, el pedido pasa a `invoiced` y se crea la cuenta por cobrar comercial.

Una factura puede referenciar cliente, cotización y oportunidad, pero `request_payload` conserva la fotografía exacta enviada. Cambios posteriores en maestros o cotizaciones no alteran el documento emitido.

## Emisión e idempotencia

1. Captura o selección del receptor y renglones.
2. Validación y recálculo en servidor.
3. Reserva transaccional del consecutivo y persistencia del payload.
4. Autenticación y envío a HKA.
5. Estado `authorized`, `rejected` o `uncertain`.
6. Reconciliación de resultados inciertos sin reutilizar el consecutivo.

La idempotencia evita que un reintento HTTP emita otro documento. La cuenta por cobrar utiliza una clave única por factura para evitar duplicación.

## Importación

1. El administrador carga un XLSX/CSV de hasta 5 MB.
2. El backend mapea y valida cada fila.
3. La vista previa reporta listos, duplicados, inválidos y advertencias.
4. La confirmación reprocesa y persiste las filas en una transacción.
5. La operación queda auditada sin guardar el archivo o su contenido en logs.

## Organización del código

La API CRM se compone una sola vez en `src/routes/crm-router.js`. Toda colisión por método y path debe estar descrita en el registro explícito de sustituciones, indicando fuente canónica y fuentes reemplazadas. Una colisión nueva, incompleta o mal declarada produce `DUPLICATE_ROUTE` y bloquea el arranque mostrando las fuentes involucradas.

La aplicación es un monolito modular. `src/app.js` construye Express y `src/server.js` abre el puerto.

Facturación, clientes y cotizaciones siguen el patrón Route → Controller → Application → Repository/Integration. `src/modules/quotations` contiene la implementación canónica completa. Las tablas físicas `crm_quotes` permanecen encapsuladas por `legacy-crm-quotes.repository.js`; `src/modules/quotes` contiene únicamente reexportaciones compatibles y no recibe reglas nuevas. `/api/crm/quotes` reutiliza el router canónico, envía encabezados de deprecación y registra uso por método; `/api/quotations` es la identidad permanente. `src/routes/erp.js` expone indicadores, pedidos y preparación fiscal, mientras `public/erp-ui.js` construye el espacio operativo.

Los casos de uso de facturación admiten dependencias explícitas y usan `ApplicationError` para errores operacionales. `invoicing.composition.js` conecta repositorio, HKA, configuración, auditoría y controladores.

## Integridad multiempresa

El contexto de empresa se deriva de una membresía activa y de una empresa activa dentro del tenant conservado por la sesión. Cambiar hacia una empresa de otro tenant se rechaza y una divergencia posterior invalida la sesión.

Las relaciones comerciales y fiscales sensibles están protegidas en MySQL mediante claves foráneas `(company_id,id)`, además de los filtros de repositorio. `db:init` ejecuta primero un preflight de referencias huérfanas o cruzadas y aborta antes del DDL si encuentra alguna. Los renglones sin columna empresarial heredan el alcance de su agregado padre y deben consultarse a través de ese padre.

## Límites

No existen inventario cuantitativo, compras, contabilidad general, cuentas por pagar ni caja formal. El POS mantiene carrito, monto recibido y cambio en el navegador; estos últimos no son movimientos contables. Las cuentas por cobrar registran saldos y pagos comerciales, pero no sustituyen un libro mayor, conciliación bancaria o tesorería.
