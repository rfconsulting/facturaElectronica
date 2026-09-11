# Registro mínimo de gates

Ningún gate se considera cerrado por la mera existencia de documentos. Requiere evidencia enlazada y aprobación humana identificada.

| Gate | Cambio | Riesgo principal | Evidencia | Aprobadores | Decisión | Fecha |
|---|---|---|---|---|---|---|
| Gate 2 — Architecture Ready | Arquitectura vigente y decisiones retroactivas | Diseño implícito o inconsistente | ADR-002 a ADR-005, ARQUITECTURA, MODELO-AMENAZAS | Arquitecto/propietario: identidad pendiente | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 3 — AI Governance | Política recurrente de uso de IA | Exposición de datos o aprobación ficticia | IA-GOBERNANZA | Seguridad y propietario: identidades pendientes | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 4 — Security Ready | Separación Contador/Operador | Privilegio excesivo | MATRIZ-ACCESO, middleware y pruebas positivas/negativas | Seguridad/QA: identidades pendientes | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 6 — Production Verified | Umbrales y retrospectiva | Despliegue sin criterios de decisión | RUNBOOK-OBSERVABILIDAD, RETROSPECTIVAS, RUNBOOK-DESPLIEGUE | Operaciones y negocio: identidades pendientes | Validación solicitada; no aprobable hasta aportar evidencia productiva | 2026-09-02 |
| Gate 1 — Problem Ready | R0 — Ciclos comerciales independientes | Confundir cierre de venta con pago | BRIEF_PROYECTO, SPEC-011/012/013, ADR-006, ITERACION-R0-LINEA-BASE | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 2 — Architecture Ready | R0 — Estados, rutas, eventos y deuda técnica | Implementar con decisiones ocultas o límites ambiguos | ARQUITECTURA, ADR-005/006/007, ROADMAP-MEJORAS-ARQUITECTURA, inventario R0 | Propietario del proyecto, aprobación expresa en conversación | Aprobado con riesgo R0-SEC-001 abierto hasta Gate 4 | 2026-09-10 |
| Gate 3 — Implementation Ready | R1 — Separación comercial y cobranza | Migración incorrecta de estados o regresión del pipeline | ADR-006, SPEC-011/012/013, ITERACION-R1-ESTADOS-COMERCIALES | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 3 — Implementation Ready | R2 — Rutas deterministas y cotizaciones canónicas | Handler inesperado o dependencia inversa | ADR-005, SPEC-012, ITERACION-R2-RUTAS-COTIZACIONES | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 3 — Implementation Ready | R3 — Eventos internos y outbox | Pérdida o duplicación de efectos asíncronos | ADR-007, ITERACION-R3-OUTBOX, schema, pruebas y runbook | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 3 — Implementation Ready | R4 — Reconciliación fiscal incierta | Reemisión o doble efecto fiscal | ADR-003/004, SPEC-002, ITERACION-R4-RECONCILIACION-FISCAL, 112/112 pruebas | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 4 — Security Ready | R1–R4 | Vulnerabilidades transitivas y cambios fiscales sin revisión independiente identificada | Pruebas en verde, R0-SEC-001 y expedientes R1–R4 | Propietario del proyecto, aprobación expresa en conversación | Aprobación de gobernanza registrada; cierre condicionado a revisión independiente y ensayo MySQL/HKA | 2026-09-10 |
| Gate 5 — Release Ready | R4 | Worker, alertas y migración no desplegados en el entorno objetivo | ITERACION-R4-RECONCILIACION-FISCAL y runbooks | Propietario del proyecto, aprobación expresa en conversación | Autorización registrada; no cerrado hasta aportar evidencia de despliegue y smoke test | 2026-09-10 |
| Gate 6 — Production Verified | R4 | No existe todavía observación productiva | Runbooks y criterios de observación | Propietario del proyecto, aprobación expresa en conversación | Aprobación anticipada registrada; no cerrado porque la evidencia productiva aún no existe | 2026-09-10 |
| Gate 3 — Implementation Ready | R5 — Integridad multiempresa | Referencias cruzadas o migración bloqueante | ADR-008, ITERACION-R5-INTEGRIDAD-MULTIEMPRESA, preflight previo/posterior, migración sobre la base objetivo de desarrollo y 116/116 pruebas | Propietario del proyecto, aprobación expresa de todos los gates en conversación | Aprobado para desarrollo | 2026-09-10 |
| Gate 3 — Implementation Ready | R6 — Importaciones reproducibles | Confirmar un archivo o reglas distintos, duplicar filas o cruzar empresas | SPEC-005/006, ITERACION-R6-IMPORTACIONES-REPRODUCIBLES, migración en desarrollo y 119/119 pruebas | Propietario del proyecto, aprobación expresa en conversación | Aprobado | 2026-09-10 |
| Gate 4 — Security Ready | R6 — Importaciones reproducibles | Aislamiento, autorización, concurrencia y archivos hostiles | REVISION-GATE4-R6, 16/16 pruebas dirigidas, 119/119 globales y `npm audit --omit=dev` | Richard Flores, revisor humano independiente; propietario del proyecto | Aprobado con riesgos aceptados R0-SEC-001, R6-OPS-001 y R6-ARCH-001 | 2026-09-10 |
| Gate 4 — Security Ready | R7 — Consolidación | Regresiones transversales o anomalías de datos | AUDITORIA-TECNICA-R7, suite global, preflight, outbox, integrity check y restauración verificada | Propietario del proyecto, alcance confirmado en conversación | Aprobado exclusivamente para desarrollo; no autoriza producción | 2026-09-10 |
| Gate 5 — Release Ready | R7 — Entrega | Liberar sin entorno productivo listo | AUDITORIA-TECNICA-R7, respaldo SHA-256, restauración de 37 tablas sin diferencias, RUNBOOK-DESPLIEGUE y `ops:check` | Operaciones/propietario: pendiente | Respaldo/restauración cerrados en desarrollo; bloqueado por configuración y despliegue productivos | 2026-09-10 |
| Gate 6 — Production Verified | R7 — Observación | Declarar estabilidad sin despliegue real | RUNBOOK-OBSERVABILIDAD y RETROSPECTIVAS | Operaciones y negocio: pendiente | Abierto; no existe despliegue ni ventana productiva | 2026-09-10 |

## Solicitud vigente

- El 2026-09-10, el propietario del proyecto expresó: «apruebo todos los gates».
- La aprobación cierra Gate 3 para R1–R4 y autoriza continuar el roadmap.
- Para Gates 4–6 se registra la decisión humana, pero no se fabrica evidencia: permanecen condicionados a revisión independiente, ensayo/despliegue y observación productiva, respectivamente.

- Fecha de solicitud: 2026-09-02.
- Solicitante: pendiente de identificar en el registro.
- Alcance enviado a revisión: Gates 2, 3 y 4.
- Gate 6: se solicitó validar la preparación documental, pero su cierre permanece bloqueado por falta de evidencia de producción.
- Respuesta de revisores: pendiente.
- Próximo paso: registrar nombre o identificador de cada revisor, decisión, observaciones y fecha. Una aprobación verbal o implícita no cierra el gate.

## Plantilla para próximas decisiones

| Gate | Cambio/SPEC | Riesgo | Evidencia verificable | Ejecutor | Revisor independiente | Decisión | Fecha |
|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  | Pendiente / Aprobado / Rechazado / Aceptado con riesgo |  |

Cambios fiscales, de identidad, secretos, permisos, aislamiento o migraciones requieren revisor independiente antes de merge y despliegue.

## Riesgos abiertos de R0

| ID | Evidencia | Riesgo | Tratamiento requerido | Gate límite | Responsable |
| --- | --- | --- | --- | --- | --- |
| R0-SEC-001 | `npm audit --omit=dev`, 2026-09-10 | 5 vulnerabilidades moderadas en `adm-zip` y cadena `express`/`body-parser`/`qs`, sin fix disponible reportado por npm | Evaluar alcanzabilidad, actualizar o sustituir dependencias cuando exista versión segura y documentar controles compensatorios | Gate 4 | Técnico/seguridad pendiente |
