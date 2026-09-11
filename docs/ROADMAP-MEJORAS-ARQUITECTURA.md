# Roadmap de mejoras arquitectónicas

## Propósito

Implementar las mejoras surgidas de la revisión arquitectónica sin ampliar todavía el producto hacia inventario, compras, cuentas por pagar, tesorería o contabilidad general.

El roadmap sigue el enfoque *engineering first* del [AI-Assisted Software Engineering Playbook](https://github.com/rfconsulting/AI-Assisted-Software-Engineering-Playbook): cada incremento comienza con un problema y una especificación verificable, conserva decisiones y evidencia, y solo avanza cuando supera una puerta de calidad con aprobación humana.

## Resultado esperado

Al cerrar el roadmap, CORE Smart debe contar con:

- ciclos de oportunidad, cotización, pedido, factura y cobranza independientes y explícitos;
- una sola implementación canónica de cotizaciones, con compatibilidad heredada deliberada;
- detección bloqueante de rutas duplicadas al arrancar;
- eventos internos persistentes y consumidores idempotentes;
- reconciliación segura de emisiones fiscales inciertas;
- aislamiento multiempresa reforzado también en restricciones e índices de base de datos;
- importaciones reproducibles entre vista previa y confirmación;
- documentación que describa con precisión una plataforma comercial y fiscal, no un ERP contable completo.

## Reglas de ejecución

1. Cada incremento usa un plan basado en `PLAN_ITERACION` del playbook: objetivo, alcance, contexto inspeccionado, riesgos, pruebas y reversión.
2. Antes de implementar se actualiza o crea la SPEC correspondiente y, si cambia una decisión estructural, un ADR.
3. Las pruebas se diseñan desde los criterios de aceptación, no desde el código producido.
4. La IA puede investigar, proponer, implementar y hacer una primera revisión; no aprueba gates, acepta riesgos ni autoriza despliegues.
5. Cada cambio debe ser pequeño, reversible y rastreable. No se mezclan refactorizaciones ajenas al objetivo del incremento.
6. Una afirmación de cierre requiere una ejecución nueva y leída de `npm run check`, `npm test` y `npm audit --omit=dev`, además de las pruebas específicas del incremento.
7. Los cambios de datos, emisión fiscal, autorización o aislamiento multiempresa requieren revisión humana independiente.
8. La evidencia y la decisión se registran en `docs/REGISTRO-GATES.md`; una casilla o un documento sin evidencia no cierra un gate.

## Dependencias y secuencia

```text
R0 Línea base y decisiones
 ├─> R1 Estados comerciales desacoplados
 ├─> R2 Rutas y cotizaciones canónicas
 └─> R3 Contrato de eventos y outbox
          ├─> R4 Reconciliación fiscal
          └─> R6 Importaciones reproducibles

R0 ─> R5 Integridad multiempresa

R1 + R2 + R3 + R4 + R5 + R6 ─> R7 Consolidación y habilitación de expansión
```

R1 y R2 pueden ejecutarse en paralelo después de R0 si no comparten una migración. R5 puede avanzar en paralelo, pero sus cambios de esquema deben coordinarse con R3, R4 y R6. R7 solo comienza cuando los incrementos anteriores tienen evidencia de Gate 4.

## Roadmap por incrementos

### R0 — Línea base y decisiones de dominio

**Prioridad:** P0  
**Esfuerzo orientativo:** 2–4 días  
**Gates:** 1 — Problem Ready y 2 — Architecture Ready

**Objetivo:** eliminar ambigüedades antes de cambiar código y fijar una línea base reproducible.

**Entregables:**

- corregir `BRIEF_PROYECTO`, `ARQUITECTURA`, `SPEC-011`, `SPEC-012` y `SPEC-013` para que venta ganada y factura pagada sean conceptos independientes;
- agregar una tabla normativa de estados, transiciones, comando responsable y evento resultante para cada agregado;
- definir mediante ADR:
  - cuándo una oportunidad pasa a `won` según la política comercial;
  - propiedad canónica de `quotations` y vida útil del alias `/api/crm/quotes`;
  - semántica de eventos, outbox, reintentos y consumidores idempotentes;
- inventariar rutas actuales, restricciones multiempresa, eventos existentes, columnas fiscales e importadores;
- registrar la línea base de `npm run check`, `npm test` y `npm audit --omit=dev`.

**Criterios de aceptación:**

- ninguna SPEC afirma que cobrar convierte una venta en ganada;
- cada transición tiene precondiciones, actor, efecto, evento y comportamiento ante repetición;
- las decisiones pendientes tienen responsable humano y no quedan ocultas en la implementación;
- el inventario identifica migraciones, consumidores y compatibilidad afectados.

**Salida del gate:** aprobación del responsable de negocio sobre la semántica comercial y del responsable técnico sobre ADR, riesgos y secuencia.

---

### R1 — Desacoplar oportunidad, venta y cobranza

**Prioridad:** P0  
**Esfuerzo orientativo:** 1 iteración  
**Dependencia:** R0  
**Gates:** 3 — Implementation Ready y 4 — Security Ready

**Objetivo:** que cada agregado controle su propio ciclo de vida sin actualizaciones mágicas desde otro módulo.

**Alcance técnico:**

- normalizar los estados de oportunidad a `open`, `won` y `lost`, o documentar explícitamente la convivencia entre estado terminal y etapa del pipeline;
- establecer el punto de cierre comercial aprobado en R0: aceptación de cotización, confirmación de pedido o autorización de factura;
- eliminar del registro de pago cualquier transición de oportunidad a `won`;
- normalizar cobranza a `pending`, `partially_paid`, `paid`, `overdue` y `cancelled`; preparar una migración compatible desde `partial` si aplica;
- impedir que un rechazo, incertidumbre fiscal o deuda pendiente reviertan una venta ya ganada;
- conservar auditoría y timestamps de las transiciones.

**Pruebas mínimas:**

- aceptación/confirmación cambia la oportunidad una sola vez;
- pago parcial y total solo cambian la cuenta por cobrar;
- una oportunidad `lost` no puede ganar por efecto lateral de un pago;
- reintentos no duplican actividades ni transiciones;
- permisos y `company_id` se validan en caminos positivos y negativos;
- migración y rollback se ensayan sobre una copia representativa.

**Evidencia de cierre:** SPEC y ADR aprobados, migración versionada, pruebas de estado y regresión, revisión independiente y comandos globales en verde.

---

### R2 — Rutas deterministas y cotizaciones realmente canónicas

**Prioridad:** P0  
**Esfuerzo orientativo:** 1 iteración  
**Dependencia:** R0  
**Gates:** 3 — Implementation Ready y 4 — Security Ready

**Objetivo:** impedir que el orden de composición decida silenciosamente qué handler atiende una ruta y retirar la dependencia conceptual de `quotations` sobre `quotes`.

**Alcance técnico:**

- construir un manifiesto de rutas con método, path normalizado, módulo y handler;
- fallar al arrancar si se repite una firma `METHOD + PATH`;
- permitir una sustitución solo mediante declaración explícita de alias/reemplazo, validada al iniciar;
- mover aplicación, dominio e infraestructura canónicos a `src/modules/quotations`;
- encapsular las tablas `crm_quotes` detrás de `legacy-crm-quotes.repository.js` mientras dure la migración física;
- mantener `/api/crm/quotes` como adaptador fino hacia los mismos casos de uso de `/api/quotations`;
- agregar telemetría de uso y fecha/criterio de retiro del alias heredado.

**Pruebas mínimas:**

- una ruta duplicada muestra ambas fuentes y aborta el arranque;
- un reemplazo declarado no genera ambigüedad;
- ambas URLs producen el mismo contrato, autorización y efectos;
- el módulo canónico no importa código de `src/modules/quotes`;
- retirar el adaptador en una prueba no afecta los casos de uso canónicos.

**Evidencia de cierre:** manifiesto verificable, prueba de arranque negativo, pruebas de contrato para ambas rutas y mapa de dependencias sin dirección inversa.

---

### R3 — Eventos internos y outbox confiable

**Prioridad:** P0  
**Esfuerzo orientativo:** 1–2 iteraciones  
**Dependencias:** R0; coordinar con R1 y R2  
**Gates:** 2, 3 y 4

**Objetivo:** desacoplar los ciclos comerciales mediante eventos persistentes, sin introducir Kafka ni microservicios.

**Eventos iniciales:** `QuotationAccepted`, `OrderConfirmed`, `InvoiceAuthorized`, `ReceivableCreated`, `PaymentRegistered` y `ReceivableSettled`.

**Alcance técnico:**

- definir envelope versionado: `event_id`, `event_type`, `event_version`, `company_id`, `aggregate_type`, `aggregate_id`, `occurred_at`, `correlation_id`, `causation_id` y payload mínimo;
- escribir el evento y el cambio de negocio en la misma transacción local;
- ampliar `integration_outbox` con estado de entrega, intentos, próxima ejecución, bloqueo temporal y último error saneado;
- implementar dispatcher recuperable y consumidores internos idempotentes con identidad única por consumidor y evento;
- definir backoff, límite de intentos, estado terminal/dead-letter y procedimiento de replay;
- impedir que trabajos en segundo plano dependan de una empresa activa almacenada en sesión.

**Pruebas mínimas:**

- rollback del agregado implica rollback del evento;
- entregar el mismo evento varias veces produce un solo efecto;
- un consumidor fallido no bloquea permanentemente otros eventos;
- reiniciar durante el procesamiento recupera el evento sin pérdida;
- `company_id` viaja en el evento y limita toda operación del consumidor;
- logs y payloads no exponen secretos ni datos fiscales innecesarios.

**Evidencia de cierre:** contrato de eventos, migración, pruebas de fallos y repetición, métricas de cola y runbook de replay.

---

### R4 — Emisión fiscal incierta y reconciliación segura

**Prioridad:** P0  
**Esfuerzo orientativo:** 1–2 iteraciones  
**Dependencia:** R3  
**Gates:** 3, 4, 5 — Release Ready y 6 — Production Verified

**Objetivo:** recuperar una emisión cuyo resultado HKA no pudo confirmarse sin crear un documento fiscal nuevo.

**Alcance técnico:**

- completar el registro local con intento actual, `last_attempt_at`, identificador externo cuando exista, `authorized_at` y respuesta normalizada/saneada;
- mantener `company_id`, correlativo, `idempotency_key` y hash de payload como invariantes únicos;
- implementar un caso de uso de reconciliación que consulte HKA por identidad disponible;
- programar reconciliación mediante outbox con backoff y límite operativo;
- bloquear una nueva emisión para el mismo origen cuando exista un documento `pending` o `uncertain` compatible;
- permitir intervención manual auditada únicamente para consultar, reconciliar o escalar; nunca para “reenviar como nuevo”;
- alertar por antigüedad y volumen de `uncertain`, y documentar el procedimiento de incidente.

**Pruebas mínimas:**

- timeout posterior a la recepción por HKA termina en `uncertain` y reserva un solo correlativo;
- el reintento usa consulta/reconciliación, no `send`;
- respuestas autorizada, rechazada, aún desconocida y malformada son idempotentes;
- dos workers concurrentes no reconcilian con efectos dobles;
- aislamiento por empresa y saneamiento de respuestas se prueban explícitamente;
- smoke test en ambiente HKA autorizado y rollback operativo documentado.

**Evidencia de cierre:** pruebas con fallos inyectados, tablero/alerta, runbook actualizado y evidencia de una reconciliación controlada. Gate 6 solo se cierra con observación real o ventana explícita de seguimiento.

---

### R5 — Integridad multiempresa en profundidad

**Prioridad:** P1  
**Esfuerzo orientativo:** 1–2 iteraciones  
**Dependencia:** R0  
**Gates:** 2, 3 y 4

**Objetivo:** complementar los filtros de aplicación con restricciones que impidan referencias cruzadas y unicidad global accidental.

**Alcance técnico:**

- auditar todas las tablas operativas y relaciones contra `company_id`;
- comprobar en autenticación que `company.tenant_id` coincide con el tenant de la membresía;
- incorporar `company_id` en índices únicos de alcance empresarial, incluidos números comerciales, factura e idempotencia;
- crear índices de consulta por `company_id`, estado y fecha donde el plan de ejecución lo justifique;
- usar claves foráneas compuestas en relaciones sensibles cuando MySQL y el modelo lo permitan; en los demás casos, validar en repositorio y aplicación dentro de la transacción;
- exigir `company_id` explícito en jobs, eventos y comandos asíncronos;
- preparar un detector de datos huérfanos o cruzados previo a endurecer restricciones.

**Pruebas mínimas:**

- lecturas y escrituras cruzadas entre empresas y tenants fallan;
- IDs válidos de otra empresa se comportan como recurso no disponible;
- unicidad puede repetirse entre empresas, pero no dentro de la misma;
- migración aborta de forma segura si el preflight detecta inconsistencias;
- consultas críticas mantienen planes e índices aceptables.

**Evidencia de cierre:** matriz tabla/relación/control, reporte de preflight, migración y rollback ensayados, pruebas negativas independientes.

---

### R6 — Importaciones reproducibles

**Prioridad:** P1  
**Esfuerzo orientativo:** 1 iteración  
**Dependencias:** R3 y contrato multiempresa de R5  
**Gates:** 3 y 4

**Objetivo:** garantizar que la confirmación corresponda al contenido y reglas mostrados en la vista previa.

**Alcance técnico:**

- crear `import_jobs` con empresa, usuario, tipo, hash SHA-256, mapeo/versiones de reglas, resumen, estado, expiración e idempotency key;
- devolver un `import_job_id` en la vista previa;
- confirmar por job y volver a comprobar empresa, actor autorizado, expiración y hash del archivo;
- reprocesar las reglas dentro de la empresa original y abortar si el contenido o la versión incompatible cambia;
- hacer la confirmación idempotente y auditar conteos de creados, duplicados e inválidos;
- definir retención de metadatos y eliminación del archivo temporal; el archivo no necesita persistencia permanente.

**Pruebas mínimas:**

- archivo modificado entre preview y confirmación se rechaza;
- job de otra empresa, usuario no autorizado o expirado se rechaza;
- doble confirmación devuelve el mismo resultado sin duplicar registros;
- reglas cambiadas tienen política explícita de reproceso o invalidación;
- fallos parciales no dejan una importación marcada como completada.

**Evidencia de cierre:** migración, contrato API actualizado, pruebas de concurrencia/idempotencia y política de retención documentada.

---

### R7 — Consolidación, despliegue gradual y decisión de expansión

**Prioridad:** P1  
**Esfuerzo orientativo:** 1 iteración más ventana de observación  
**Dependencias:** R1–R6  
**Gates:** 4, 5 y 6

**Objetivo:** demostrar que la base corregida funciona en condiciones reales antes de añadir nuevos dominios.

**Entregables:**

- auditoría técnica transversal con hallazgos, severidad, evidencia y remediación;
- suite end-to-end del flujo `Prospecto → Cotización → Pedido → Factura → Cuenta por cobrar → Pago` verificando estados independientes;
- ensayo de migración, respaldo, restauración y rollback;
- métricas y alertas para duplicados de ruta, lag/fallos del outbox, reconciliaciones fiscales, violaciones multiempresa e import jobs;
- actualización de brief, arquitectura, SPEC, runbooks, matriz de acceso e índice documental;
- retiro del módulo `quotes` o plan fechado basado en telemetría para retirar el alias heredado;
- retrospectiva con métricas contra la línea base de R0.

**Criterio de habilitación para inventario/compras/tesorería:**

- cero hallazgos críticos o altos sin corrección o aceptación humana vigente;
- gates 1–5 cerrados con evidencia para todos los incrementos;
- Gate 6 cerrado tras la ventana acordada o mantenido explícitamente abierto con responsable y fecha;
- no existen eventos atascados ni emisiones `uncertain` fuera del SLA definido;
- aislamiento multiempresa y restauración han sido probados;
- negocio y responsable técnico aprueban el siguiente dominio mediante un nuevo brief/SPEC, no como extensión informal de este roadmap.

## Matriz resumida de trazabilidad

| Mejora propuesta | Incremento | Artefactos principales | Evidencia decisiva |
| --- | --- | --- | --- |
| Separar venta ganada de factura pagada | R0–R1 | Brief, SPEC-011/012/013, ADR de estados | Pruebas de transiciones y migración |
| Fallar ante rutas duplicadas | R2 | ADR-005, manifiesto de rutas | Prueba de arranque bloqueado |
| Hacer `quotations` canónico | R2 | SPEC-012, estructura modular, adaptador legado | Contratos equivalentes y dependencias correctas |
| Formalizar eventos y handlers idempotentes | R3 | ADR de eventos, schema, runbook | Pruebas de repetición, caída y replay |
| Reconciliar emisiones `uncertain` | R4 | SPEC-002, ADR-003/004, runbooks | Fallos inyectados y reconciliación observada |
| Reforzar multiempresa | R5 | ADR-002, matriz de controles, schema | Pruebas cruzadas y preflight de datos |
| Asegurar preview/confirm de importación | R6 | SPEC-005/006, schema, política de retención | Hash, expiración e idempotencia |
| Documentar máquinas de estado y alcance real | R0 y R7 | Brief, Arquitectura, SPEC, README | Revisión humana y trazabilidad completa |

## Plantilla mínima para cada incremento

Antes de iniciar cada bloque se debe crear su plan de iteración con:

| Campo | Contenido requerido |
| --- | --- |
| Objetivo | Resultado observable, no actividad |
| Incluido / no incluido | Frontera pequeña y explícita |
| Contexto | Archivos, consumidores, datos, ADR y SPEC |
| Cambios | Pasos ordenados con evidencia esperada |
| Riesgos | Probabilidad, impacto, mitigación y responsable |
| Pruebas | Éxito, inválidos, permisos, otra empresa, compatibilidad y regresión |
| Datos | Migración, reejecución, respaldo, preflight y rollback |
| IA | Datos permitidos, acciones autorizadas y revisión independiente |
| Resultado | Archivos, comandos leídos, riesgos residuales y próximo paso |

## Definition of Done del roadmap

El roadmap no termina al fusionar código. Termina cuando:

- todos los criterios funcionales y de seguridad tienen evidencia reproducible;
- migraciones y rollback fueron ensayados sobre datos representativos;
- un revisor independiente auditó cambios críticos;
- documentación y runbooks permiten operar sin conocimiento privado del autor;
- la versión exacta fue desplegada y observada;
- negocio confirma la semántica del flujo y operación confirma su estabilidad;
- la retrospectiva convierte resultados y desviaciones en decisiones o backlog priorizado.

