# Arquitectura vigente

```text
Navegador HTML/CSS/JS
        | sesión HttpOnly + CSRF
        v
Express 5
  |-- autenticación y MFA
  |-- clientes y artículos
  |-- facturas y secuencias
  |-- configuración segura
  |-- importadores Zoho XLSX/CSV
        |----> MySQL
        +----> The Factory HKA
```

El frontend no es fuente de verdad fiscal. Express valida, recalcula importes, autoriza y realiza integraciones. MySQL conserva sesiones, usuarios, auditoría, secretos cifrados, maestros, secuencias y fotografías fiscales.

## Aislamiento multiempresa

- `tenants` agrupa una o más empresas bajo una frontera comercial.
- `companies` es la frontera obligatoria de datos operativos y configuración.
- `company_memberships` asigna a cada usuario un rol independiente por empresa.
- La sesión conserva la empresa activa, pero `requireAuth` revalida en cada petición que usuario, membresía, empresa y tenant continúan activos.
- Clientes, artículos, campos configurables, facturas, secuencias, credenciales HKA y auditoría incluyen `company_id`.
- Toda consulta por identificador combina `id` y `company_id`; conocer el identificador de otra empresa no concede acceso.
- Los tokens HKA se almacenan en cachés separadas por empresa.

`npm run db:init` crea una empresa inicial y asigna a ella los datos y usuarios de instalaciones anteriores. Antes de ejecutarlo sobre una base existente se requiere un respaldo verificable.

## Persistencia

- `users`, `user_sessions`, `audit_log`.
- `config_operational`, `config_secrets`.
- `clients` y sus campos personalizados.
- `articles` y la estructura de campos personalizados.
- `invoice_sequences`, `electronic_invoices`.

Una factura puede referenciar un cliente, pero `request_payload` conserva los datos enviados. Las líneas copian el artículo seleccionado; cambios posteriores en el catálogo no alteran una factura emitida.

## Emisión

1. Selección o captura manual del receptor.
2. Selección, creación rápida o captura manual de artículos.
3. Validación y recálculo de subtotal, ITBMS y total en servidor.
4. Reserva transaccional del consecutivo y persistencia del payload.
5. Autenticación y envío a HKA.
6. Estado `authorized`, `rejected` o `uncertain`.
7. Reconciliación de resultados inciertos sin reutilizar el consecutivo.

## Importación

1. El administrador carga un XLSX/CSV de hasta 5 MB.
2. El backend mapea y valida cada fila.
3. La vista previa reporta listos, duplicados, inválidos y advertencias.
4. La confirmación reprocesa y persiste filas listas en una transacción.
5. La operación queda auditada sin guardar el archivo ni su contenido en logs.

## Límites

No hay inventario cuantitativo, movimientos de stock ni descuentos fiscales modelados. Producto/servicio es una clasificación comercial; ambos usan actualmente la misma estructura de ítem HKA.

El POS usa `GET /api/articles?pos=true`, mantiene un carrito transitorio en el navegador y cierra mediante la emisión fiscal existente. Antes de calcular, el backend recupera nuevamente cada artículo POS desde MySQL. Todavía no existen caja, turnos, pagos mixtos ni control de stock.
# Evolución a monolito modular

La aplicación continúa siendo un monolito desplegable. No se introducen microservicios mientras no exista una necesidad independiente de escalado, despliegue o propiedad operativa.

`src/app.js` construye Express y `src/server.js` abre el puerto y administra el apagado. Esto permite probar la aplicación sin iniciar otro proceso.

Facturación es el primer módulo vertical migrado al patrón objetivo:

```text
src/modules/invoicing/
├── invoices.routes.js
├── invoices.controller.js
├── application/
│   ├── issue-invoice.js
│   ├── refresh-invoice-status.js
│   └── list-invoices.js
└── infrastructure/
    └── invoice.repository.js
```

- Routes: URL y middleware.
- Controller: traducción HTTP.
- Application: reglas y orquestación del caso de uso.
- Infrastructure: SQL, persistencia y transacciones.
- Integraciones existentes: comunicación con HKA y configuración segura.

Los casos de uso exponen fábricas (`createIssueInvoice`, `createRefreshInvoiceStatus` y `createListInvoices`) con dependencias explícitas. `invoicing.composition.js` es el único lugar que conecta repositorio, HKA, configuración, auditoría, casos de uso y controlador. Application no importa esas implementaciones concretas. Los errores operacionales esperados utilizan `ApplicationError`, con estado HTTP, código estable y detalles opcionales, sin introducir Express dentro de la capa de aplicación.

Las pruebas incluyen ejecución unitaria de los casos de uso y una prueba HTTP que construye `createApp()` con dependencias de prueba, abre un puerto efímero y nunca importa ni ejecuta `server.js`.

Clientes está completamente migrado: listado, consulta, creación, actualización, campos personalizados, vista previa e importación Zoho pasan por Route → Controller → Application → Repository/Parser. `routes/clients.js` conserva únicamente el punto de montaje compatible y no contiene comportamiento. El adaptador `clients-legacy.js` fue eliminado y una prueba impide que reaparezca.

El parser de archivos solamente transforma XLSX/CSV. Los casos de uso validan, detectan duplicados y deciden entre vista previa o confirmación; el repositorio ejecuta la transacción masiva con `companyId` explícito. La auditoría de Clientes recibe un contexto normalizado (`actorUserId`, `companyId`, `ipAddress`, `requestId`) y no conoce objetos `req`/`res`.

Artículos, usuarios y configuración se migrarán después; no se realizará un traslado masivo sin valor funcional.
