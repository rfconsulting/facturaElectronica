# ADR-007 — Eventos internos persistentes y outbox

- Estado: aceptado por el propietario del proyecto el 2026-09-10; su implementación corresponde a R3.
- Fecha: 2026-09-10.
- Responsable: identidad pendiente de registrar en `REGISTRO-GATES.md`.

## Contexto

El monolito actual registra algunos eventos en `integration_outbox`, pero el esquema y los productores no constituyen aún un contrato uniforme de entrega. Varias transiciones actualizan directamente agregados ajenos. Se necesita desacoplar estos efectos sin introducir infraestructura distribuida innecesaria.

## Alternativas consideradas

1. Mantener llamadas directas entre módulos: menor trabajo inicial, mayor acoplamiento y reintentos inconsistentes.
2. Introducir un broker externo: aporta capacidades operativas, pero excede las necesidades y madurez actuales.
3. Usar outbox transaccional en MySQL y consumidores internos idempotentes.

## Decisión

Adoptar la alternativa 3 dentro del monolito modular.

El cambio del agregado y su evento se escriben en la misma transacción MySQL. Un dispatcher interno entrega eventos a consumidores explícitos. La entrega es al menos una vez; por ello cada consumidor debe registrar y rechazar efectos duplicados.

El envelope objetivo incluye:

- `event_id` estable y único;
- `event_type` y `event_version`;
- `company_id` obligatorio;
- `aggregate_type` y `aggregate_id`;
- `occurred_at`, `correlation_id` y `causation_id`;
- payload mínimo, versionado y sin secretos.

Los eventos iniciales son `QuotationAccepted`, `OrderConfirmed`, `InvoiceAuthorized`, `ReceivableCreated`, `PaymentRegistered` y `ReceivableSettled`.

## Reglas

- ningún worker obtiene empresa o tenant desde una sesión web; usa el `company_id` persistido en el evento;
- un consumidor no cambia el agregado emisor;
- un evento repetido produce como máximo un efecto por consumidor;
- fallos usan bloqueo temporal, backoff, límite de intentos y estado terminal recuperable;
- replay requiere autorización operativa, alcance explícito y auditoría;
- errores y payloads se sanean antes de persistir o registrar;
- Kafka, microservicios y un broker externo permanecen fuera de alcance.

## Consecuencias

- se acepta consistencia eventual para efectos secundarios no fiscales;
- el estado crítico que origina el evento sigue siendo transaccional;
- se requieren métricas de lag, intentos, fallos terminales y antigüedad;
- R3 deberá migrar el esquema, implementar dispatcher, deduplicación y runbook.

## Evidencia requerida

Pruebas de rollback atómico, entrega repetida, reinicio, aislamiento por empresa y replay; métricas y revisión humana del contrato.
