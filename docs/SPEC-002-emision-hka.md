# SPEC-002: Emisión electrónica mediante The Factory HKA

## Objetivo

Emitir una factura de operación interna en Panamá usando la API REST oficial, manteniendo trazabilidad local y evitando duplicidad cuando el resultado remoto sea ambiguo.

## Contrato y decisiones

- Demo: `https://demointegracion.thefactoryhka.com.pa/api`; producción: `https://integracion.thefactoryhka.com.pa/api`.
- `POST /Autenticacion` recibe `usuario` y `clave`; el JWT se conserva solo en memoria y se renueva al vencer o recibir 401.
- `POST /Enviar` recibe `{ documento }` con `Authorization: Bearer <JWT>`.
- `POST /EstadoDocumento` permite reconciliar una emisión cuyo resultado no pudo confirmarse.
- La primera iteración fija operación interna normal, destino Panamá, generación propia y USD/Balboa.
- Los campos opcionales no aplicables se omiten, conforme a la advertencia del manual.
- Los tipos de receptor implementados son `01` contribuyente, `02` consumidor final, `03` Gobierno y `04` extranjero, con validación condicional de identidad y ubicación.
- El receptor puede capturarse manualmente o copiarse desde una ficha de cliente. El documento conserva la fotografía enviada aunque la ficha cambie.
- Cada línea puede capturarse manualmente, copiarse desde el catálogo o partir de un artículo creado rápidamente desde la factura.

## Invariantes

- La secuencia se bloquea con `SELECT ... FOR UPDATE`, se incrementa y se confirma antes de la llamada externa.
- Un timeout produce estado `uncertain`; nunca libera ni reutiliza el consecutivo.
- Subtotal, ITBMS y total se recalculan en el servidor.
- Se persisten solicitud y respuesta para soporte, pero nunca credenciales ni JWT.
- Un fallo al registrar la auditoría se reporta en el log operacional, pero no modifica el resultado fiscal ya persistido ni convierte una autorización o rechazo de HKA en estado incierto.
- Solo se considera autorizada una respuesta exitosa del proveedor; los rechazos conservan su código y mensaje.

## Alcance pendiente

Notas de crédito/débito, exportación fiscal completa, contingencia, descuentos, retenciones, ISC/OTI, plazos mixtos, descarga PDF/XML, envío por correo y anulación requieren especificaciones separadas por sus reglas condicionales.

La clasificación producto/servicio se conserva en el catálogo, pero no cambia todavía la estructura fiscal enviada a HKA. Un precio negativo no se acepta como sustituto de un descuento fiscal.

## Puerta de producción

Pendiente: credenciales oficiales, homologación HKA/DGI, confirmación de sucursal y punto de facturación, casos fiscales representativos, descarga del CAFE/XML, monitoreo, respaldo y procedimiento de incidentes.
