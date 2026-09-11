# Auditoría técnica transversal R7

## Resultado ejecutivo

La base de desarrollo cumple los invariantes automatizados de separación comercial, idempotencia fiscal, outbox, aislamiento multiempresa e importaciones reproducibles. No se encontraron hallazgos críticos o altos sin tratamiento en desarrollo. La aplicación no está habilitada para producción: `ops:check` permanece bloqueado por configuración deliberadamente de desarrollo y no existe observación productiva.

## Evidencia del 2026-09-10

| Control | Resultado |
| --- | --- |
| Integridad multiempresa | 31 relaciones verificadas, 0 anomalías |
| Outbox | 12 reclamados, 12 entregados, 0 reintentos, 0 dead letters |
| Integridad comercial | 5 invariantes, 0 anomalías |
| Facturas inciertas | 0 |
| Import jobs fuera de retención | 0 |
| Readiness productivo | Bloqueado correctamente: `NODE_ENV=development`, HTTP local y HKA no productivo |
| Respaldo | Respaldo lógico alternativo completado: 37 tablas, 298031 bytes, SHA-256 `1b4703da6581222b1e7d51b8b5e823f90ce2ee697fc4a40b35d5a78dc795028f` |
| Restauración | Completada en `factura_electronica_restore_test`; 37 tablas y conteos de filas sin diferencias |

## Hallazgos

| ID | Severidad | Estado | Tratamiento |
| --- | --- | --- | --- |
| R0-SEC-001 | Moderada | Abierto, aceptado para desarrollo | Vigilar actualizaciones o sustitución de `adm-zip` y cadena `qs`; mantener controles compensatorios documentados |
| R6-OPS-001 | Moderada | Cerrado en código y desarrollo | `npm run imports:cleanup`, lotes de 500 y retención de 30 días; programar antes de producción |
| R6-ARCH-001 | Baja | Abierto | Migrar importador de artículos a módulo vertical; no es hallazgo de seguridad |
| R7-OPS-001 | Alta para producción | Cerrado en desarrollo | Se implementó respaldo lógico con `mysql2`, checksum, restauración restringida a base desechable y comparación de conteos |
| R7-REL-001 | Bloqueante para producción | Abierto por diseño | Configurar entorno productivo, TLS, HKA habilitado, secretos y ejecutar `ops:check` |

## Alias heredado

`/api/crm/quotes` conserva telemetría y encabezados de deprecación. Revisión fijada para 2026-10-15 o después de 30 días de observación productiva, lo que ocurra más tarde. Solo se retirará con cero consumidores confirmados y contrato canónico `/api/quotations` validado.

## Decisión

R7 puede continuar en desarrollo. Gates 5 y 6 no se cierran con esta auditoría.

El propietario confirmó expresamente que la revisión y aprobación actuales cubren solo desarrollo. No constituyen autorización de release, despliegue o verificación productiva.
