# SPEC-002: Emisión electrónica mediante The Factory HKA

## Objetivo

Emitir una factura de operación interna en Panamá usando la API REST oficial, manteniendo trazabilidad local y evitando duplicidad cuando el resultado remoto sea ambiguo.

## Contrato y decisiones

- Demo: `https://demointegracion.thefactoryhka.com.pa/api`, destinado a integración y pruebas; los documentos generados allí no tienen validez fiscal.
- Producción: `https://integracion.thefactoryhka.com.pa/api`; los documentos emitidos allí sí tienen validez fiscal y afectan la operación real del contribuyente.
- Ambos ambientes exigen usuario y contraseña de servicios web para obtener el JWT usado por la API. Las credenciales son emitidas para un ambiente específico y no se presumen reutilizables entre demo y producción.
- `POST /Autenticacion` recibe `usuario` y `clave`; el JWT se conserva solo en memoria y se renueva al vencer o recibir 401.
- `POST /Enviar` recibe `{ documento }` con `Authorization: Bearer <JWT>`.
- `POST /EstadoDocumento` permite reconciliar una emisión cuyo resultado no pudo confirmarse.
- La primera iteración fija operación interna normal, destino Panamá, generación propia y USD/Balboa.
- Los campos opcionales no aplicables se omiten, conforme a la advertencia del manual.
- Los tipos de receptor implementados son `01` contribuyente, `02` consumidor final, `03` Gobierno y `04` extranjero, con validación condicional de identidad y ubicación.
- El receptor puede capturarse manualmente o copiarse desde una ficha de cliente. El documento conserva la fotografía enviada aunque la ficha cambie.
- Cada línea puede capturarse manualmente, copiarse desde el catálogo o partir de un artículo creado rápidamente desde la factura.
- `POST /api/invoices` exige `Idempotency-Key`. La clave identifica una sola intención fiscal dentro de la empresa activa y se conserva en los reintentos.
- Una factura preparada desde una cotización convertida o un pedido confirmado conserva `source_quote_id` y `opportunity_id`; el servidor vuelve a validar la relación antes de reservar el correlativo.

## Invariantes

- La secuencia se bloquea con `SELECT ... FOR UPDATE`, se incrementa y se confirma antes de la llamada externa.
- La secuencia se comparte por empresa, sucursal, punto de facturación y tipo documental. Un usuario puede tener sucursal y punto asignados; sin asignación usa la configuración HKA general.
- El administrador puede establecer el próximo número para continuar desde otro PAC, pero nunca por debajo de un número ya reservado localmente.
- La combinación `company_id + idempotency_key` es única. Un reintento devuelve el resultado persistido y nunca reserva otro consecutivo ni vuelve a invocar `Enviar`.
- Reutilizar una clave con un payload JSON canónico diferente produce `409 IDEMPOTENCY_CONFLICT`. La comprobación ocurre antes de consultar datos mutables del catálogo.
- Un timeout produce estado `uncertain`; nunca libera ni reutiliza el consecutivo.
- Subtotal, ITBMS y total se recalculan en el servidor. Antes de emitir, la interfaz presenta el desglose por Exento, 7%, 10% y 15%, indicando para cada tasa su base y el impuesto calculado.
- Se persisten solicitud y respuesta para soporte, pero nunca credenciales ni JWT.
- Un fallo al registrar la auditoría se reporta en el log operacional, pero no modifica el resultado fiscal ya persistido ni convierte una autorización o rechazo de HKA en estado incierto.
- Solo se considera autorizada una respuesta exitosa del proveedor; los rechazos conservan su código y mensaje.
- Una factura comercial autorizada origina, de forma idempotente por factura, una cuenta por cobrar. Una factura directa de contado sin cotización u oportunidad no crea saldo pendiente.

## Integración comercial

Aceptar una cotización no emite automáticamente. Se convierte mediante `POST /api/quotations/:id/convert` a borrador directo o pedido confirmado; `GET /api/erp/orders/:id/invoice-draft` prepara el pedido para el formulario fiscal. El usuario revisa y emite por el flujo ordinario. La autorización marca el pedido como facturado y crea la actividad y, cuando corresponde, la cuenta por cobrar; un rechazo o estado incierto no crea el saldo.

## Alcance pendiente

Notas de crédito/débito, exportación fiscal completa, contingencia, descuentos, retenciones, ISC/OTI, plazos mixtos, descarga PDF/XML, envío por correo y anulación requieren especificaciones separadas por sus reglas condicionales.

La clasificación producto/servicio se conserva en el catálogo, pero no cambia todavía la estructura fiscal enviada a HKA. Un precio negativo no se acepta como sustituto de un descuento fiscal.

## Puerta de producción

Pendiente: habilitación productiva del emisor por el PAC, credenciales productivas, confirmación de sucursal y punto de facturación, aceptación de casos representativos, descarga del CAFE/XML, monitoreo, respaldo y procedimiento de incidentes.
