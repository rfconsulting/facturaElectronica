# Iteración R0 — Línea base y decisiones de dominio

## Objetivo

Dejar las mejoras arquitectónicas listas para implementación sin decisiones estructurales ocultas, corrigiendo la semántica documental y registrando el estado técnico real.

## Alcance

### Incluido

- ciclos de estado y punto de cierre comercial;
- propiedad canónica de cotizaciones y deuda de composición de rutas;
- contrato objetivo de eventos y outbox;
- inventario de rutas, datos, consumidores e integraciones afectados;
- línea base de verificación.

### No incluido

- cambios de código, esquema o API;
- migración de estados;
- dispatcher de outbox o reconciliador fiscal;
- inventario, compras, tesorería o contabilidad.

## Decisiones

- ADR-006 propone cerrar la venta al confirmar pedido o autorizar factura directa, nunca al cobrar.
- ADR-007 propone outbox MySQL con entrega al menos una vez y consumidores idempotentes.
- ADR-005 continúa vigente, con la desviación explícita de que `quotations` todavía depende de `quotes`.
- `/api/quotations` es la identidad futura; `/api/crm/quotes` será un alias temporal declarado.
- una firma de ruta repetida debe bloquear el arranque salvo reemplazo explícito.

## Inventario técnico verificado

| Área | Estado vigente | Brecha que recibe el siguiente incremento |
| --- | --- | --- |
| Oportunidades | `crm_opportunities.stage` mezcla pipeline, `payment_pending`, `won` y `lost` | R1 migra `payment_pending` y separa cierre de cobranza |
| Pagos | `POST /receivables/:id/payments` marca `won` al llegar saldo a cero | R1 elimina el efecto lateral |
| Pedido | conversión `sales_order` ya marca `won` | R1 conserva y protege esta regla |
| Factura directa | autorización crea cuenta y mueve a `payment_pending` | R1 marca `won` al autorizar y deja deuda en cobranza |
| Cobranza | estados físicos `pending`, `partial`, `paid`, `cancelled` | R1 migra a `partially_paid` y añade política `overdue` |
| Rutas CRM | `crm-router.js` descarta firmas repetidas según precedencia | R2 falla al arrancar y admite reemplazos declarados |
| Cotizaciones | `src/modules/quotations/quotations.routes.js` importa `modules/quotes` | R2 invierte la dependencia y crea adaptador legado |
| Outbox | estado, intentos y disponibilidad básicos; productores heterogéneos | R3 versiona envelope, entrega y deduplicación |
| Emisión fiscal | idempotencia, hash, correlativo y `uncertain` presentes | R4 completa intentos, reconciliación programada y alertas |
| Multiempresa | filtros por `company_id` e índices parciales | R5 audita referencias cruzadas y restricciones compuestas |
| Importación | preview y confirm vuelven a procesar el archivo | R6 crea `import_jobs`, hash, expiración e idempotencia |

## Consumidores afectados

- UI de CRM y ERP: pipeline, filtros, etiquetas y tablero;
- API `/api/crm`, `/api/quotations`, `/api/erp` y `/api/invoices`;
- reportes y observabilidad que consultan `payment_pending` o `partial`;
- tablas `crm_opportunities`, `crm_quotes`, `sales_orders`, `electronic_invoices`, `accounts_receivable`, `receivable_payments` e `integration_outbox`;
- importadores de clientes y artículos;
- runbooks de despliegue, observabilidad y reconciliación fiscal.

## Riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
| --- | --- | --- | --- |
| Cambiar reportes al retirar `payment_pending` | Alta | Medio | Inventariar consultas y agregar pruebas de regresión antes de migrar |
| Inferir mal la etapa de oportunidades legadas | Media | Alto | Preflight bloqueante y resolución humana de ambiguos |
| Duplicar efectos al introducir eventos | Media | Alto | Identidad por evento/consumidor y pruebas adversariales |
| Reemitir una factura incierta | Baja | Crítico | Reconciliar por identidad existente; prohibir envío nuevo |
| Referencias cruzadas entre empresas | Media | Crítico | Pruebas negativas y endurecimiento progresivo de constraints |
| Romper consumidores del alias legado | Media | Medio | Pruebas de contrato, telemetría y retiro programado |

## Pruebas previstas para R1

- camino exitoso por `sales_order` y `direct_invoice`;
- estados y transiciones inválidos;
- permisos insuficientes y recurso de otra empresa;
- oportunidad `lost`, reintentos y concurrencia;
- compatibilidad de datos `payment_pending` y `partial`;
- migración, preflight, rollback y regresión del flujo completo.

## Línea base

Fecha: 2026-09-10.

| Comando | Resultado |
| --- | --- |
| `npm run check` | Correcto: sintaxis válida |
| `npm test` | Correcto: 91 pruebas, 91 aprobadas, 0 fallos |
| `git diff --check` | Correcto: sin errores; advertencias locales de normalización LF/CRLF no bloqueantes |
| `npm audit --omit=dev` | 5 vulnerabilidades moderadas: `adm-zip` (1) y cadena `express`/`body-parser`/`qs` (4); npm informa que no hay corrección disponible |

El audit constituye una línea base, no un resultado verde. Antes de Gate 4, el responsable técnico debe evaluar exposición real, controles compensatorios y actualización o sustitución de dependencias. No se ejecutó `npm audit fix` porque no existe corrección propuesta y una mutación automática quedaría fuera del alcance documental de R0.

## Definition of Ready para R1

- [x] Objetivo, alcance, consumidores y datos identificados.
- [x] Semántica propuesta y alternativas documentadas.
- [x] Riesgos y pruebas previstas registrados.
- [x] Cambios de código fuera de esta iteración.
- [x] Aprobación humana de ADR-006.
- [x] Aprobación humana de ADR-007.
- [x] Aprobador registrado como propietario del proyecto; el revisor independiente de implementación se asignará antes de Gate 4.
- [x] `npm audit --omit=dev` ejecutado y leído; riesgo residual registrado.

## Estado

Completada. Gate 1 y Gate 2 fueron aprobados expresamente por el propietario del proyecto el 2026-09-10. El riesgo R0-SEC-001 permanece abierto y debe resolverse o aceptarse formalmente antes de Gate 4.
