# Registro mínimo de gates

Ningún gate se considera cerrado por la mera existencia de documentos. Requiere evidencia enlazada y aprobación humana identificada.

| Gate | Cambio | Riesgo principal | Evidencia | Aprobadores | Decisión | Fecha |
|---|---|---|---|---|---|---|
| Gate 2 — Architecture Ready | Arquitectura vigente y decisiones retroactivas | Diseño implícito o inconsistente | ADR-002 a ADR-005, ARQUITECTURA, MODELO-AMENAZAS | Arquitecto/propietario: identidad pendiente | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 3 — AI Governance | Política recurrente de uso de IA | Exposición de datos o aprobación ficticia | IA-GOBERNANZA | Seguridad y propietario: identidades pendientes | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 4 — Security Ready | Separación Contador/Operador | Privilegio excesivo | MATRIZ-ACCESO, middleware y pruebas positivas/negativas | Seguridad/QA: identidades pendientes | Aprobación solicitada; respuesta pendiente | 2026-09-02 |
| Gate 6 — Production Verified | Umbrales y retrospectiva | Despliegue sin criterios de decisión | RUNBOOK-OBSERVABILIDAD, RETROSPECTIVAS, RUNBOOK-DESPLIEGUE | Operaciones y negocio: identidades pendientes | Validación solicitada; no aprobable hasta aportar evidencia productiva | 2026-09-02 |

## Solicitud vigente

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
