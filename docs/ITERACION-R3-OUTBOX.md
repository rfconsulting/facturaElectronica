# Iteración R3 — Eventos internos y outbox confiable

## Objetivo

Persistir los eventos de dominio junto con sus cambios de negocio y ofrecer entrega recuperable, al menos una vez, con consumidores idempotentes y contexto empresarial explícito.

## Contrato implementado

Cada evento conserva:

- UUID estable `event_id`;
- `event_type` y `event_version`;
- `company_id` obligatorio;
- `aggregate_type` y `aggregate_id`;
- `correlation_id` y `causation_id` opcionales;
- payload mínimo y `occurred_at`.

`eventEnvelope` valida el contrato y `enqueueEvent` escribe usando la conexión transaccional entregada por el caso de uso.

## Eventos incorporados

| Evento | Productor | Agregado |
| --- | --- | --- |
| `QuotationAccepted` | transición de cotización | quotation |
| `OrderConfirmed` | conversión `sales_order` | sales_order |
| `InvoiceAuthorized` | emisión o reconciliación que cambia a autorizada | invoice |
| `ReceivableCreated` | creación idempotente de cuenta por cobrar | receivable |
| `PaymentRegistered` | registro de pago | receivable_payment |
| `ReceivableSettled` | pago que lleva saldo a cero | receivable |

Los eventos históricos de CRM siguen pasando por un adaptador compatible que produce el mismo envelope versionado.

## Entrega y recuperación

- el repositorio reclama lotes con `FOR UPDATE SKIP LOCKED`;
- un evento `processing` con lock vencido vuelve a ser reclamable;
- cada intento incrementa `attempts` y registra `locked_at`/`locked_by`;
- los fallos reciben backoff exponencial entre 5 segundos y una hora;
- al alcanzar 8 intentos pasan a `dead_letter`;
- `integration_event_receipts` aplica unicidad por empresa, consumidor y evento;
- el efecto del consumidor y su recibo se confirman en la misma transacción;
- si el marcado final falla y el evento reaparece, los recibos evitan repetir efectos;
- un consumidor comodín explícito registra la recepción de eventos existentes mientras se incorporan proyecciones concretas.

## Operación

- `npm run outbox:process -- <batch-size>` procesa un lote de 1 a 100 eventos;
- `npm run outbox:replay -- <event_id>` habilita un único evento `failed` o `dead_letter` después de aprobación;
- `npm run ops:check` bloquea preparación ante dead letters o eventos activos con más de 15 minutos;
- el worker usa `company_id` del evento y nunca una empresa almacenada en sesión.

## Migración

`db:init` agrega las columnas faltantes, asigna UUID a eventos anteriores antes de volver `event_id` obligatorio, amplía el enum e incorpora índices. El esquema crea además `integration_event_receipts` para instalaciones nuevas.

Antes de producción se requiere respaldo, conteo de eventos por estado, ensayo sobre copia y comprobación de compatibilidad de `FOR UPDATE SKIP LOCKED` con MySQL 8.

## Pruebas

- envelope válido e inválido;
- persistencia mediante la conexión recibida;
- entrega correcta con consumidor comodín;
- reintento con backoff y transición a dead letter;
- contrato de esquema, locks y deduplicación;
- presencia de los seis eventos normativos en sus productores;
- regresión completa del proyecto.

## Riesgos residuales

| Riesgo | Tratamiento |
| --- | --- |
| El worker aún debe programarse en la plataforma de despliegue | Runbook y comando listos; Gate 5 exige configurar frecuencia y responsable |
| El consumidor actual solo registra recepción | Añadir proyecciones por caso de uso, manteniendo recibos transaccionales |
| Creación de saldo ocurre después de guardar autorización fiscal | Evento `InvoiceAuthorized` queda durable; R4 debe usarlo para reparación/reconciliación |
| Replay es una acción sensible | UUID único, estado restringido, aprobación y log obligatorios |
| Riesgo de dependencias R0-SEC-001 | Continúa bloqueante para Gate 4 si no se acepta o mitiga |

## Evidencia ejecutada el 2026-09-10

| Comando | Resultado leído |
| --- | --- |
| `npm run check` | Sintaxis válida |
| `npm test` | 106 pruebas aprobadas, 0 fallos |
| `npm audit --omit=dev` | 5 vulnerabilidades moderadas ya registradas como R0-SEC-001; npm no reporta fix disponible |
| `git diff --check` | Sin errores; solo avisos no bloqueantes de normalización LF/CRLF |
| Búsqueda de SQL directo al outbox | Ningún productor escribe fuera de `integration-outbox.js` |

## Gate y estado

- Gate 3: evidencia preparada; requiere aprobación técnica.
- Gate 4: pendiente de revisión independiente y ensayo de migración/caídas con MySQL 8.
- Gate 5: pendiente de programar el worker y conectar alertas en el entorno objetivo.
- Despliegue: no realizado.
