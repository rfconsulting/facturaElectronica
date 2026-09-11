# Iteración R5 — Integridad multiempresa

## Objetivo

Impedir referencias entre empresas tanto en la sesión y los repositorios como en las restricciones de MySQL.

## Alcance implementado

- preflight bloqueante de 31 relaciones comerciales y fiscales;
- claves candidatas `(company_id,id)` en nueve agregados empresariales;
- 31 claves foráneas compuestas instaladas de forma reejecutable por `db:init`;
- cambio de empresa limitado al tenant original de la sesión;
- invalidación de sesiones cuyo tenant no coincide con la empresa activa;
- lecturas de valores y renglones sin `company_id` ancladas a un padre de la empresa;
- comprobación `tenant_reference_integrity` incorporada a `ops:check`;
- comando independiente `npm run db:preflight-tenants`.

## Migración y seguridad

`db:init` ejecuta el preflight antes de alterar las claves foráneas. Si existe una referencia huérfana o cruzada, termina con `TENANT_INTEGRITY_VIOLATIONS` y presenta tabla, columna, padre y cantidad. No corrige ni reasigna datos automáticamente.

Antes de producción se debe respaldar, ejecutar el preflight, resolver cada hallazgo con responsable humano, ensayar `db:init` sobre una copia y verificar restauración. Las relaciones opcionales usan `RESTRICT` para no anular el `company_id` ni perder trazabilidad.

## Evidencia

| Verificación | Resultado |
| --- | --- |
| `npm run check` | Correcto |
| `npm test` | 116 pruebas aprobadas, 0 fallidas |
| Pruebas R5 | Constraints compuestos, preflight negativo, tenant de sesión y lecturas transitivas aprobados |
| Preflight MySQL previo | Correcto; 31 relaciones verificadas, sin inconsistencias |
| Migración MySQL | Correcta sobre la base objetivo de desarrollo configurada en `.env`; tenant 1, empresa 1, 31 relaciones endurecidas |
| Preflight MySQL posterior | Correcto; 31 relaciones verificadas, sin inconsistencias |

La primera ejecución del DDL detectó un índice auxiliar heredado llamado `fk_crm_lead_client` después de retirar la clave foránea simple. La migración se ajustó para eliminar esos índices residuales antes de crear cada constraint compuesta y se ejecutó nuevamente con éxito. El ajuste es reejecutable.

## Riesgos residuales

- El tiempo de bloqueo observado representa la base objetivo de desarrollo configurada en `.env`; debe medirse nuevamente antes de una futura migración en producción si cambian el volumen o la infraestructura.
- Las referencias a usuarios continúan siendo globales; su pertenencia se valida mediante `company_memberships` porque un usuario puede pertenecer legítimamente a varias empresas.
- Renglones y valores personalizados heredan empresa del padre y no duplican `company_id`; ampliar esto exige una migración coordinada de todos sus escritores.
- R0-SEC-001 permanece abierto hasta evaluación independiente de seguridad.

## Gate

Gate 3 queda aprobado para R5 con evidencia técnica y ejecución sobre la base objetivo de desarrollo. Gate 4 conserva la aprobación de gobernanza del propietario, pero su cierre de seguridad requiere revisión independiente. Gate 5 no aplica a R5; cualquier despliegue futuro a producción se evaluará en R7.
