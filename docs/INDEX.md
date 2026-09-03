# Mapa de documentación

## Estado y operación

- [Brief](BRIEF_PROYECTO.md): problema, alcance, roles y pendientes.
- [README](../README.md): instalación, operación, HKA, Zoho y verificación.
- [Arquitectura](ARQUITECTURA.md): componentes, persistencia y flujos.
- [Despliegue y reversión](RUNBOOK-DESPLIEGUE.md): puerta de entrega, despliegue gradual y rollback.
- [Respaldo y restauración](RUNBOOK-RESPALDO-RESTAURACION.md): copias verificables y simulacros de recuperación.
- [Observabilidad](RUNBOOK-OBSERVABILIDAD.md): sondas, métricas, alertas e incidentes.
- [Pruebas y habilitación del PAC](HOMOLOGACION-HKA-DGI.md): separación demo/producción y evidencia de habilitación productiva.

## Decisiones y especificaciones

1. [ADR-001](ADR-001-stack-autenticacion.md): stack y sesiones.
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

## Estado del producto frente a la visión

El documento fundacional describe la visión completa de CORE Smart. El README, el brief y las SPEC describen lo implementado. Cuando exista una diferencia, la capacidad fundacional debe leerse como dirección de producto y no como funcionalidad disponible.

## Regla de mantenimiento

Cuando una funcionalidad cambie, se actualiza su SPEC, el brief si cambia el alcance y el README si afecta instalación u operación. Una SPEC describe el comportamiento vigente y separa claramente lo pendiente.
