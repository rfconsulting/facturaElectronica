# Arquitectura vigente

## Migración frontend hacia App Shell modular

La migración adopta de forma incremental el patrón del modelo PWA empresarial sin debilitar los controles transaccionales existentes. `public/dashboard.html` continúa siendo el shell autenticado mientras `public/js/app-shell.js` inicia capacidades transversales mediante módulos ES.

La primera fase introduce:

- `public/js/core/`: conectividad, diálogos, cliente HTTP y router por hash;
- `manifest.webmanifest`: instalación de la aplicación;
- `sw.js`: caché exclusiva para recursos estáticos del mismo origen;
- estado de conexión accesible en el encabezado.

El Service Worker no intercepta navegación, `/api/*` ni `/internal/*`; tampoco precachea login, MFA o dashboard. Facturación, autenticación y escrituras continúan siendo `network-only`. El cliente HTTP y el router modular son contratos para las siguientes extracciones; los dominios heredados seguirán funcionando como scripts clásicos hasta migrarse y probarse individualmente.

La segunda fase extrae la navegación, el menú lateral, el selector de empresa y la administración de usuarios desde `dashboard.js`. `public/js/core/navigation-bridge.js` conserva temporalmente las funciones globales requeridas por CRM y ERP; `public/js/modules/administration.js` concentra empresas, membresías, invitaciones, usuarios y step-up MFA. Esta capa puente se retirará cuando todos los consumidores utilicen importaciones ES explícitas.

La tercera fase extrae `public/js/modules/clients.js` y `public/js/modules/articles.js`. Clientes concentra ficha fiscal, campos personalizados, ubicación oficial de Panamá e importación Zoho; Artículos concentra catálogo, edición, importación y creación rápida. Ambos módulos conservan por ahora contratos globales consumidos por facturación, ERP y POS, y se cargan antes de `dashboard.js` para mantener compatibilidad durante la migración incremental.

La cuarta fase extrae `public/js/modules/invoicing.js` y `public/js/modules/pos.js`. Facturación conserva cálculo fiscal, carga de borradores comerciales, emisión e idempotencia; POS conserva catálogo habilitado, carrito, cobro e idempotencia. Se mantiene un puente global temporal para los borradores generados desde CRM y ERP, mientras `dashboard.js` queda limitado a sesión, configuración fiscal y coordinación del arranque.

La quinta fase elimina `public/dashboard.js`. `public/js/core/runtime.js` concentra temporalmente el cliente HTTP, CSRF y escape seguro; `public/js/modules/fiscal-configuration.js` contiene la integración HKA y su step-up MFA; `public/js/bootstrap.js` autentica la sesión y coordina el arranque después de cargar CRM y ERP. El orden de scripts queda declarado en `dashboard.html` y protegido por pruebas, preparando la conversión posterior de los puentes clásicos a importaciones ES.

La sexta fase convierte el núcleo a módulos ES. `runtime.js` importa el cliente de `http.js` y exporta el estado CSRF, la solicitud HTTP y el escape seguro; `navigation-bridge.js` importa esas dependencias y exporta navegación, menú y selector de empresa; `bootstrap.js` consume ambos módulos mediante imports explícitos. Un puente acotado en `window` mantiene compatibilidad con CRM, ERP y los dominios clásicos hasta su migración individual.

La séptima fase convierte Clientes y Artículos a módulos ES. Ambos importan runtime explícitamente y el bootstrap importa sus operaciones de carga e instalación. Clientes importa además navegación para abrir su ficha desde facturación. Solo permanecen publicados en `window` `selectInvoiceClient`, el catálogo de artículos y sus adaptadores de selección, porque CRM, ERP y Facturación aún son consumidores clásicos. La creación del primer renglón de factura se difiere hasta que el grafo modular termina de cargar.

La octava fase convierte Facturación y POS a módulos ES. Facturación importa el catálogo de Artículos y exporta cálculo fiscal, emisión, historial e inicialización; POS importa runtime y los contratos fiscales de Facturación. El bootstrap instala y carga ambos dominios mediante imports explícitos y el HTML deja de incluir sus scripts individuales. Los puentes de `addItem`, `calculate`, `taxRates`, `loadInvoices` e `invoiceCommercialSource` permanecen exclusivamente para los flujos clásicos de CRM y ERP.

La novena fase convierte CRM y ERP a módulos ES. Ambos importan runtime, navegación, Clientes, Artículos y Facturación según sus necesidades; ERP reutiliza explícitamente los componentes de cotización de CRM. El bootstrap instala ambos espacios y registra sus cargadores mediante `registerSectionLoader`, sustituyendo la detección de funciones globales en navegación. La procedencia comercial de una factura se establece con `setInvoiceCommercialSource` en vez de asignar estado global directamente. También se eliminan los puentes globales de navegación, clientes, catálogo y facturación; el bootstrap conecta Artículos con las acciones de Facturación mediante `configureArticleInvoiceActions`, evitando una dependencia circular.

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

## Migración del frontend: fase 10

Administración, usuarios, configuración fiscal y correlativos se cargan ahora mediante módulos ES desde `bootstrap.js`. Estos módulos importan explícitamente sus dependencias del runtime y entre sí, en lugar de depender del orden de etiquetas `script` clásicas.

`js/core/runtime.js` conserva una API interna basada exclusivamente en exportaciones ES (`request`, `escapeHtml`, `getCsrfToken` y `setCsrfToken`). Ya no publica puentes equivalentes en `window`, lo que permite detectar dependencias implícitas durante desarrollo y mantiene una sola ruta de acceso al cliente HTTP y al token CSRF.
