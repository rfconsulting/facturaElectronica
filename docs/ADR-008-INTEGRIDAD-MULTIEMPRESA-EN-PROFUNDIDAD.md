# ADR-008 — Integridad multiempresa en profundidad

## Estado

Propuesto; implementación R5 preparada para Gate 3.

## Contexto

Los repositorios aplicaban filtros por `company_id`, pero varias claves foráneas solo referenciaban el `id` global. Una escritura defectuosa podía, por tanto, asociar una fila de una empresa con un padre de otra sin que MySQL la rechazara.

## Decisión

- Los agregados empresariales exponen una clave candidata única `(company_id,id)`.
- Las relaciones comerciales y fiscales sensibles usan claves foráneas compuestas `(company_id,foreign_id)`.
- Las relaciones opcionales antes configuradas con `SET NULL` pasan a `RESTRICT`, porque MySQL no puede anular solo el identificador conservando el `company_id` de una clave compuesta. La aplicación ya usa estados no destructivos; eliminar un padre referenciado debe ser explícito.
- Antes de cambiar constraints se ejecuta un preflight bloqueante sobre todas las relaciones cubiertas.
- Las tablas de renglones y valores que no tienen `company_id` conservan pertenencia transitiva por su padre; sus lecturas se anclan al padre filtrado por empresa.
- Una sesión no puede cambiar de empresa hacia otro tenant. Cualquier divergencia entre `tenantId` de sesión y la empresa activa invalida la sesión.

## Consecuencias

MySQL rechaza referencias cruzadas aunque falle una validación de aplicación. La migración se detiene sin modificar constraints si encuentra inconsistencias. La eliminación física de entidades referenciadas es más restrictiva, coherente con la retención fiscal y la auditoría.

## Reversión

Restaurar las claves foráneas simples solo después de respaldar la base. Los índices `(company_id,id)` pueden permanecer porque no alteran datos ni contratos.
