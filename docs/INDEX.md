# Mapa de documentación

## Estado y operación

- [Brief](BRIEF_PROYECTO.md): problema, alcance, roles y pendientes.
- [README](../README.md): instalación, operación, HKA, Zoho y verificación.
- [Arquitectura](ARQUITECTURA.md): componentes, persistencia y flujos.
- [Despliegue y reversión](RUNBOOK-DESPLIEGUE.md): puerta de entrega, despliegue gradual y rollback.
- [Respaldo y restauración](RUNBOOK-RESPALDO-RESTAURACION.md): copias verificables y simulacros de recuperación.
- [Recuperación MFA](RUNBOOK-RECUPERACION-MFA.md): diagnóstico de claves, re-enrolamiento controlado e invalidación de sesiones.
- [Observabilidad](RUNBOOK-OBSERVABILIDAD.md): sondas, métricas, alertas e incidentes.
- [Pruebas y habilitación del PAC](HOMOLOGACION-HKA-DGI.md): separación demo/producción y evidencia de habilitación productiva.
- [Modelo de amenazas](MODELO-AMENAZAS.md): amenazas críticas, controles y riesgo residual.
- [Identidad visual](04-identidad-visual.md): marca, tokens, componentes, responsive y estado de implementación.
- [Matriz de acceso](MATRIZ-ACCESO.md): permisos verificables por rol, módulo y acción.
- [Gobernanza de IA](IA-GOBERNANZA.md): alcance, prohibiciones, revisión y evidencia recurrente.
- [Registro de gates](REGISTRO-GATES.md): cambio, riesgo, evidencia, aprobadores y decisión.
- [Revisión Gate 4 de R6](REVISION-GATE4-R6.md): aislamiento, archivos, concurrencia y riesgos residuales de importaciones.
- [Retrospectivas](RETROSPECTIVAS.md): plantilla e historial ligero por iteración o release.

## Decisiones y especificaciones

1. [ADR-001](ADR-001-stack-autenticacion.md): stack y sesiones.
   - [ADR-002](ADR-002-aislamiento-multiempresa.md): aislamiento por empresa activa.
   - [ADR-003](ADR-003-integracion-the-factory-hka.md): integración fiscal y estado incierto.
   - [ADR-004](ADR-004-correlativos-idempotencia.md): correlativos e idempotencia.
   - [ADR-005](ADR-005-modularizacion-incremental.md): modularización progresiva del monolito.
   - [ADR-006](ADR-006-ciclos-comerciales-independientes.md): separación entre cierre comercial, facturación y cobranza.
   - [ADR-007](ADR-007-eventos-internos-y-outbox.md): eventos persistentes y consumidores internos idempotentes.
   - [ADR-008](ADR-008-INTEGRIDAD-MULTIEMPRESA-EN-PROFUNDIDAD.md): constraints compuestos, preflight y tenant de sesión.
2. [SPEC-001](SPEC-001-login.md): autenticación y CSRF.
3. [SPEC-002](SPEC-002-emision-hka.md): emisión HKA.
4. [SPEC-003](SPEC-003-mfa.md): MFA/TOTP.
5. [SPEC-004](SPEC-004-configuracion-segura.md): secretos write-only.
6. [SPEC-005](SPEC-005-ficha-clientes.md): clientes y Zoho Invoice.
7. [SPEC-006](SPEC-006-articulos.md): artículos y Zoho Inventory.
8. [SPEC-007](SPEC-007-pos.md): catálogo POS, carrito y cierre fiscal.
9. [SPEC-008](SPEC-008-usuarios.md): usuarios, invitaciones, suspensión y sesiones.
10. [SPEC-009](SPEC-009-recuperacion-password.md): recuperación segura de contraseña.
11. [Especificación multiempresa](SPEC-008-aislamiento-multiempresa.md): tenant, empresa activa, membresías y aislamiento de datos.
12. [SPEC-010](SPEC-010-roles-y-alcance.md): superusuario, administrador de empresa y alcance por membresías.
13. [SPEC-011](SPEC-011-crm.md): CRM con contactos, conversión guiada, pipeline, actividades, tareas, cotizaciones, automatizaciones y reportes.
14. [SPEC-012](SPEC-012-cotizacion-factura-cobro.md): cotización canónica, revisiones, pedidos, factura y pagos.
15. [SPEC-013](SPEC-013-erp-operativo.md): tablero y espacio de trabajo del ERP comercial y fiscal.

## Iteraciones arquitectónicas

- [R0 — Línea base y decisiones](ITERACION-R0-LINEA-BASE.md): inventario técnico, riesgos, decisiones y evidencia inicial.
- [R1 — Estados comerciales independientes](ITERACION-R1-ESTADOS-COMERCIALES.md): migración y separación de oportunidad, facturación y cobranza.
- [R2 — Rutas y cotizaciones](ITERACION-R2-RUTAS-COTIZACIONES.md): detección bloqueante de colisiones, sustituciones explícitas y módulo canónico.
- [R3 — Eventos y outbox](ITERACION-R3-OUTBOX.md): envelope versionado, entrega recuperable, deduplicación y replay operativo.
- [R4 — Reconciliación fiscal](ITERACION-R4-RECONCILIACION-FISCAL.md): recuperación de documentos inciertos sin reemisión ni efectos dobles.
- [R5 — Integridad multiempresa](ITERACION-R5-INTEGRIDAD-MULTIEMPRESA.md): preflight bloqueante, claves foráneas compuestas y sesión limitada al tenant.
- [R6 — Importaciones reproducibles](ITERACION-R6-IMPORTACIONES-REPRODUCIBLES.md): jobs por archivo, actor y empresa, confirmación idempotente y detección de cambios.
- [R7 — Consolidación](ITERACION-R7-CONSOLIDACION.md): verificación transversal, retención, integridad y preparación de entrega.
- [Auditoría técnica R7](AUDITORIA-TECNICA-R7.md): evidencia, hallazgos y bloqueos de producción.
- [Roadmap de mejoras arquitectónicas](ROADMAP-MEJORAS-ARQUITECTURA.md): secuencia completa R0–R7.

## Estado del producto frente a la visión

El documento fundacional describe la visión completa de CORE Smart. El README, el brief y las SPEC describen lo implementado. Cuando exista una diferencia, la capacidad fundacional debe leerse como dirección de producto y no como funcionalidad disponible.

## Regla de mantenimiento

Cuando una funcionalidad cambie, se actualiza su SPEC, el brief si cambia el alcance y el README si afecta instalación u operación. Una SPEC describe el comportamiento vigente y separa claramente lo pendiente.
