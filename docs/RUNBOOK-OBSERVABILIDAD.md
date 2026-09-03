# Runbook de observabilidad e incidentes

## Señales disponibles

- `GET /api/health/live`: proceso HTTP vivo; no consulta dependencias.
- `GET /api/health/ready`: preparación para tráfico y conexión MySQL.
- `GET /api/health`: alias compatible de readiness.
- `GET /internal/metrics`: métricas Prometheus protegidas con `Authorization: Bearer <OBSERVABILITY_TOKEN>`.
- Logs JSON `request_completed`, `request_failed` y `audit_write_failed`, correlacionados mediante `x-request-id`.

Las métricas no contienen rutas, usuarios, empresas, documentos ni otros valores de alta cardinalidad. Los logs no deben incorporar cuerpos HTTP, credenciales, JWT ni payloads fiscales.

## Alertas iniciales propuestas

- Readiness fallida durante 2 comprobaciones consecutivas: crítica.
- Proporción 5xx superior al 2% durante 5 minutos: alta.
- Latencia p95 superior a 2 segundos durante 10 minutos: alta.
- Cualquier `audit_write_failed`: alta.
- Cualquier factura `uncertain`: alta y requiere reconciliación antes de reemitir.
- Factura comercial autorizada sin cuenta por cobrar: alta; reparar de forma idempotente sin reemitir.
- Cuenta por cobrar con saldo negativo o pagos superiores al importe original: crítica.
- Oportunidad en `payment_pending` sin factura autorizada: alta.
- Reinicios repetidos del proceso o saturación de conexiones MySQL: crítica.

Los umbrales deben ajustarse con evidencia real después de homologación y carga.

## Respuesta a factura incierta

1. Localizar la factura por ID, consecutivo y `requestId` sin exponer su payload en canales inseguros.
2. No volver a emitir ni generar una nueva clave de idempotencia.
3. Usar `POST /api/invoices/:id/refresh` para consultar `EstadoDocumento`.
4. Si HKA no resuelve el estado, escalar con sucursal, punto fiscal, tipo y consecutivo.
5. Registrar resultado, duración, impacto y acción correctiva.

## Protección operacional

`OBSERVABILITY_TOKEN` es obligatorio en producción, debe tener al menos 32 caracteres, rotarse como secreto y no enviarse a navegadores. El endpoint de métricas debería limitarse adicionalmente por red privada o allowlist del proxy.

## Incidente de integridad comercial

1. Suspender únicamente la operación afectada; no anular ni reemitir documentos fiscales como reparación.
2. Correlacionar `source_quote_id`, `opportunity_id`, `invoice_id` y cuenta por cobrar dentro de la misma empresa.
3. Comparar el total autorizado con el importe original, la suma de pagos y el saldo.
4. Conservar logs y eventos de `integration_outbox`.
5. Aplicar una corrección auditada e idempotente y documentar causa, impacto y aprobación.
