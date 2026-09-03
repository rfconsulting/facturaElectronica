# SPEC-012 — Cotizaciones, pedidos, facturación y cobro

## Objetivo

Mantener una sola cotización canónica para CRM y ERP. CRM origina la intención comercial, Cotizaciones formaliza la oferta, ERP ejecuta el pedido, Facturación emite el documento fiscal y Finanzas registra el cobro.

`Prospecto → Oportunidad → Cotización versionada → Pedido o borrador fiscal → Factura autorizada → Cuenta por cobrar → Pago`

## Propiedad del dominio

- La API canónica es `/api/quotations`; `/api/crm/quotes` es un adaptador temporal compatible.
- La persistencia mantiene por ahora `crm_quotes` y `crm_quote_items`, encapsuladas por `src/modules/quotations`. El nombre físico no define la propiedad funcional.
- No existe una cotización CRM y otra ERP. Los módulos consumidores referencian el mismo identificador.

## Datos y snapshots

Cada cotización tiene empresa, cliente, contacto y oportunidad opcional; número, versión, vigencia, moneda, condiciones de pago, política de conversión, notas y renglones. Al guardar, el servidor valida pertenencia multiempresa, recalcula descuentos e impuestos y captura snapshots del receptor y los artículos. Los cambios posteriores en maestros no modifican documentos históricos.

## Estados y revisiones

`draft → pending_approval → approved → sent → viewed → accepted → converted`

También puede terminar en `rejected`, `expired` o `cancelled`. Una devolución de aprobación regresa a borrador. Una propuesta enviada, vista, rechazada o vencida solo cambia mediante una nueva revisión: conserva el número comercial e incrementa `version`. Cada transición conserva actor, fecha y motivo.

## Conversión

`POST /api/quotations/:id/convert` exige `Idempotency-Key` y estado `accepted`.

- `sales_order`: crea un pedido confirmado con snapshots; la oportunidad pasa a ganada.
- `direct_invoice`: produce un borrador fiscal revisable. No consume correlativo ni llama a HKA.
- Repetir la misma clave devuelve el resultado anterior; otra clave responde conflicto.
- Una factura autorizada completa la referencia, crea actividad y cuenta por cobrar idempotente.
- Cuando la factura procede de un pedido, la autorización cambia el pedido a `invoiced`.

## API

- `GET/POST /api/quotations`
- `GET/PUT /api/quotations/:id`
- `POST /api/quotations/:id/status`
- `POST /api/quotations/:id/revisions`
- `POST /api/quotations/:id/duplicate`
- `POST /api/quotations/:id/convert`
- `GET /api/quotations/:id/invoice-draft`
- `GET /api/erp/orders`
- `GET /api/erp/orders/:id`
- `GET /api/erp/orders/:id/invoice-draft`

Las escrituras requieren sesión, MFA, empresa activa y CSRF. Toda consulta filtra por `company_id`; los cambios generan auditoría, historial y eventos outbox.

## Límites actuales

- No hay matriz configurable de aprobación por importe o rol.
- No se implementan listas de precios, reservas, entregas ni facturación parcial de pedidos.
- El borrador fiscal pliega el descuento comercial en el precio unitario efectivo porque el contrato fiscal vigente no expone descuentos separados.
