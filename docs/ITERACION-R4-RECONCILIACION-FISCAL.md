# Iteración R4 — Reconciliación fiscal segura

## Objetivo

Resolver resultados ambiguos de HKA consultando el documento ya reservado, sin emitir uno nuevo ni duplicar efectos comerciales.

## Alcance implementado

- la factura conserva `attempt_count`, `last_attempt_at`, `external_identifier`, `authorized_at`, `normalized_response` y lease de reconciliación;
- el intento de envío inicial se registra al reservar el correlativo;
- un fallo ambiguo persiste `uncertain` y `InvoiceReconciliationRequested` en una sola transacción;
- el consumidor `invoice-reconciliation` del outbox ejecuta `EstadoDocumento`;
- el caso de uso manual y el worker comparten exactamente la misma lógica;
- estados `authorized` y `rejected` se devuelven sin consultar nuevamente HKA;
- respuestas desconocidas, vacías o fallos de red mantienen `uncertain` y fuerzan reintento con backoff;
- un lease UUID por cinco minutos impide reconciliaciones concurrentes sobre la misma factura;
- la respuesta pública se reduce a código y mensaje; la base conserva además una forma normalizada para operación;
- una autorización reconciliada repara idempotentemente actividad, pedido, oportunidad directa y cuenta por cobrar;
- una factura `reserved` o `uncertain` bloquea una nueva emisión para la misma cotización u oportunidad.

## Invariantes

1. El reconciliador solo llama `EstadoDocumento`; no tiene acceso a `Enviar` mediante su contrato de caso de uso.
2. El correlativo, payload e idempotency key originales no cambian.
3. `uncertain` nunca se convierte en `authorized` por ausencia de datos o inferencia local.
4. Una transición terminal emite `InvoiceAuthorized` como máximo una vez por cambio de estado.
5. La cuenta por cobrar usa unicidad por factura y la actividad autorizada verifica existencia previa.
6. Toda consulta y actualización combina ID con `company_id`.

## Flujo

```text
Enviar
  ├─ respuesta terminal ─> authorized | rejected
  └─ timeout/ambigua ─> uncertain + InvoiceReconciliationRequested
                              |
                              v
                    worker reclama evento
                              |
                       lease por factura
                              |
                    EstadoDocumento (nunca Enviar)
                 ┌────────────┼────────────┐
                 v            v            v
            authorized     rejected     uncertain/error
            efectos idem.  terminal     backoff/dead letter
```

## Migración

`db:init` agrega las columnas de recuperación sin modificar correlativos, payloads ni estados existentes. Los contadores históricos comienzan en cero; los nuevos envíos comienzan en uno.

Antes de producción:

- respaldar y verificar restauración;
- contar documentos `reserved` y `uncertain`;
- comprobar que no hay más de un documento abierto por origen;
- ensayar la migración y el worker en una copia;
- confirmar credenciales y comportamiento de `EstadoDocumento` en el ambiente HKA correspondiente.

## Pruebas

- clasificación autorizada, rechazada, en proceso y vacía;
- fallo de consulta mantiene `uncertain` sin llamar `Enviar`;
- estado terminal se reproduce sin llamada remota;
- origen con documento abierto rechaza nueva emisión con `409 INVOICE_RECONCILIATION_REQUIRED`;
- autorización reconciliada ejecuta efectos idempotentes;
- esquema, evento, consumidor, lease y columnas de evidencia;
- suite completa y verificación de sintaxis.

### Evidencia de cierre técnico

| Verificación | Resultado |
| --- | --- |
| `npm run check` | Correcto; sintaxis válida |
| `npm test` | 112 pruebas ejecutadas, 112 aprobadas, 0 fallidas |
| Búsqueda de `send`/`Enviar` en reconciliador, consumidor y worker | Sin coincidencias; la reconciliación no reemite documentos |
| Comprobación de campos R4 en esquema y migración | Correcto |
| `git diff --check` | Sin errores; solo advertencias de normalización LF/CRLF |
| `npm audit --omit=dev` | 5 vulnerabilidades moderadas transitivas, sin corrección disponible; registradas como R0-SEC-001 |

No se ejecutaron `db:init`, el worker ni pruebas contra HKA demo: requieren una base MySQL y credenciales del entorno objetivo. Por ello, esta evidencia permite presentar Gate 3, pero no cerrar Gates 4 o 5.

## Riesgos residuales

| Riesgo | Tratamiento |
| --- | --- |
| Contrato real de respuestas HKA puede contener variantes no observadas | Validar casos representativos en demo; toda variante desconocida queda `uncertain` |
| Worker no programado en plataforma | Gate 5 exige frecuencia, alertas y responsable operativo |
| Datos históricos podrían contener varios documentos abiertos por origen | Preflight bloqueante y resolución fiscal humana |
| Respuesta original puede incluir datos fiscales | Acceso restringido; API y logs usan respuesta normalizada, sin payload completo |
| Dependencias con vulnerabilidades moderadas | R0-SEC-001 sigue abierto para Gate 4 |

## Gate y estado

- Gate 3: aprobado expresamente por el propietario del proyecto el 2026-09-10.
- Gate 4: aprobación de gobernanza registrada; cierre condicionado a revisión independiente, pruebas contra HKA demo y ensayo MySQL.
- Gate 5: autorización registrada; cierre pendiente de programar worker y alertas en el entorno objetivo y ejecutar el smoke test.
- Gate 6: aprobación anticipada registrada; solo puede cerrarse con una reconciliación observada o una ventana real sin incidencias.
- Despliegue: no realizado.
