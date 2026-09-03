# ADR-002 — Aislamiento por empresa activa

- Estado: aceptado técnicamente de forma retroactiva; aprobación humana solicitada el 2026-09-02 y pendiente de respuesta.
- Fecha de decisión reconstruida: 2026-09-02.
- Responsable: propietario técnico del producto; nombre y firma pendientes.

## Contexto

Una cuenta puede operar varias empresas y cada empresa conserva configuración fiscal, correlativos, clientes y datos comerciales propios. Mezclar datos entre empresas produciría exposición de información y riesgo fiscal.

## Alternativas consideradas

1. Base de datos independiente por empresa: máximo aislamiento, mayor costo de provisión y migración.
2. Esquema independiente por empresa: aislamiento intermedio, complejidad operacional alta.
3. Tablas compartidas con `company_id` y empresa activa revalidada en cada petición.

## Decisión

Adoptar tablas compartidas con `company_id`. La sesión identifica la empresa activa, pero `requireAuth` revalida usuario, membresía, tenant y empresa en cada petición. Toda consulta por ID debe combinarlo con `company_id`. Configuración HKA, secuencias y cachés se separan por empresa.

## Consecuencias

- Simplifica operación y permite transacciones entre dominios de una misma empresa.
- Cada consulta nueva debe demostrar filtrado empresarial; una omisión constituye vulnerabilidad crítica.
- Las pruebas y revisiones deben incluir intentos cruzados entre empresas.
- Una futura separación física requerirá migración, pero conserva `company_id` como clave de partición.

## Evidencia

`company_memberships`, middleware `requireAuth`, SPEC-008 de aislamiento, restricciones del esquema y pruebas multiempresa.
