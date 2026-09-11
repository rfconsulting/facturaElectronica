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
- Cuenta por cobrar abierta sin factura autorizada: alta.
- Cualquier evento `dead_letter`: alta; no borrarlo ni repetir efectos manualmente.
- Evento `pending` o `processing` por más de 15 minutos: alta.
- Reinicios repetidos del proceso o saturación de conexiones MySQL: crítica.
- Cualquier preview de importación vencido aún en estado `previewed`: media; ejecutar `npm run imports:cleanup`.
- Jobs `expired` o `failed` con más de 30 días: media; ejecutar y programar `npm run imports:cleanup`.

Los umbrales deben ajustarse con evidencia real después de homologación y carga.

## Umbrales de decisión

| Señal | Continuar / aceptar | Pausar despliegue | Revertir o aislar |
|---|---|---|---|
| Readiness | 100 % durante la ventana | 1 fallo transitorio mientras se investiga | 2 fallos consecutivos o más de 2 minutos sin disponibilidad |
| Respuestas 5xx | Menos de 1 % durante 15 minutos | 1–2 % durante 5 minutos | Más de 2 % durante 5 minutos |
| Latencia p95 | Menor de 1 s | 1–2 s durante 10 minutos | Mayor de 2 s durante 10 minutos si afecta operación |
| Auditoría | Sin fallos | Un fallo aislado con operación no fiscal detenida para diagnóstico | Fallos repetidos o pérdida de trazabilidad sensible |
| Factura `uncertain` | Cero | Una: detener reintento y reconciliar | Más de una relacionada con el release: suspender emisión nueva |
| Integridad comercial | Relaciones y saldos consistentes | Diferencia reparable sin emisión | Saldo negativo, pago excesivo, duplicación o factura autorizada sin trazabilidad |
| Outbox | Sin `dead_letter` y lag menor de 5 min | Lag de 5–15 min o reintentos aislados | Cualquier `dead_letter` o lag mayor de 15 min |

Solo el responsable de operaciones junto con el responsable fiscal puede aceptar temporalmente una desviación. Debe registrar duración, alcance, mitigación y fecha límite. Una desviación nunca autoriza reemitir una factura incierta.

## Respuesta a factura incierta

1. Localizar la factura por ID, consecutivo y `requestId` sin exponer su payload en canales inseguros.
2. No volver a emitir ni generar una nueva clave de idempotencia.
3. Usar `POST /api/invoices/:id/refresh` para consultar `EstadoDocumento`.
4. Verificar `attemptCount`, `lastAttemptAt` y que no exista un lease activo anormalmente antiguo. Una respuesta `409 INVOICE_RECONCILIATION_CONFLICT` indica que otro proceso ya está reconciliando.
5. Si HKA no resuelve el estado, dejar que `InvoiceReconciliationRequested` aplique backoff; no generar otra solicitud fiscal.
6. Si el evento llega a `dead_letter`, escalar con sucursal, punto fiscal, tipo y consecutivo y seguir el replay controlado del outbox.
7. Registrar resultado, duración, impacto y acción correctiva.

## Protección operacional

`OBSERVABILITY_TOKEN` es obligatorio en producción, debe tener al menos 32 caracteres, rotarse como secreto y no enviarse a navegadores. El endpoint de métricas debería limitarse adicionalmente por red privada o allowlist del proxy.

## Operación del outbox

1. Ejecutar `npm run outbox:process` desde un worker programado y con acceso a MySQL; el proceso web no usa una empresa activa de sesión.
2. Observar el resumen JSON `claimed`, `delivered`, `retried` y `deadLettered` y conservarlo en la plataforma de logs.
3. `npm run ops:check` bloquea preparación si existe un `dead_letter` o un evento activo con más de 15 minutos.
4. Investigar el consumidor y la causa antes de hacer replay. No editar payload, empresa, agregado o identidad del evento.
5. Con aprobación operativa, ejecutar `npm run outbox:replay -- <event_id>` para un único evento fallido y conservar el log `outbox_replay_requested`.
6. Procesar nuevamente y comprobar que el recibo por consumidor impide repetir efectos ya confirmados.

La entrega es al menos una vez. `integration_event_receipts` es la fuente de deduplicación por empresa, consumidor y evento; no debe limpiarse mientras un evento pueda repetirse.

## Mantenimiento de importaciones

Ejecutar `npm run imports:cleanup` diariamente. El comando marca previews vencidos y elimina por lotes de hasta 500 los jobs fallidos o expirados con más de 30 días. No elimina jobs completados ni archivos, porque los archivos nunca se persisten. Conservar el resumen JSON en logs operativos.

## Incidente de integridad comercial

1. Suspender únicamente la operación afectada; no anular ni reemitir documentos fiscales como reparación.
2. Correlacionar `source_quote_id`, `opportunity_id`, `invoice_id` y cuenta por cobrar dentro de la misma empresa.
3. Comparar el total autorizado con el importe original, la suma de pagos y el saldo.
4. Conservar logs y eventos de `integration_outbox`.
5. Aplicar una corrección auditada e idempotente y documentar causa, impacto y aprobación.
