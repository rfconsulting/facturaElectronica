# SPEC-010 — Roles, permisos y alcance multiempresa

## Objetivo

Separar la autoridad global del sistema de los permisos operativos de cada empresa. Ningún rol obtenido desde el panel concede privilegios globales.

## Niveles efectivos

| Nivel | Persistencia | Alcance | Administración de usuarios |
| --- | --- | --- | --- |
| Superusuario | `users.is_superuser = TRUE` | Sistema y empresas a las que tenga membresía | Crea empresas y asigna, modifica o suspende administradores de empresa |
| Administrador de empresa | `company_memberships.role = administrator` | Solo empresas asignadas | Gestiona operadores y contadores de la empresa activa |
| Contador | `company_memberships.role = accountant` | Solo empresa activa | Sin administración de usuarios |
| Operador | `company_memberships.role = operator` | Solo empresa activa | Sin administración de usuarios |

El superusuario es una capacidad global adicional, no un valor de `company_memberships.role`. Solo se concede desde consola con `npm run create-admin`; el panel y las API ordinarias nunca pueden establecer `is_superuser`.

## Multiempresa

La clave primaria de `company_memberships` es `(company_id, user_id)`. Por ello un administrador puede tener acceso a una empresa hoy y recibir otra membresía administrativa en el futuro. La sesión conserva una única empresa activa y todas las consultas de negocio se filtran en servidor por esa empresa.

Cambiar de empresa exige una membresía activa. Si el rol de la empresa destino es administrador, o la cuenta es superusuario, se exige nuevamente MFA.

## Reglas de autorización

- Solo el superusuario crea empresas y concede el rol `administrator`.
- Solo el superusuario modifica o suspende una membresía que ya sea `administrator`.
- El administrador de empresa puede invitar, editar, suspender y revocar sesiones de operadores y contadores de su empresa activa.
- Las cuentas y membresías se suspenden; no se eliminan desde el aplicativo.
- Administradores y superusuarios requieren MFA y MFA reciente para cambios sensibles.
- Contador y operador comparten por ahora las rutas operativas. La separación funcional más granular se añadirá cuando se definan permisos contables y de caja específicos.

## Criterios de aceptación

1. Una petición de un administrador de empresa para crear una empresa devuelve `403`.
2. Una petición de un administrador de empresa para crear, ascender, editar o suspender a un administrador devuelve `403`.
3. Un usuario no puede cambiar a una empresa sin membresía activa.
4. Una cuenta puede tener membresías y roles diferentes en varias empresas.
5. Ningún endpoint recibe ni actualiza `is_superuser`.

