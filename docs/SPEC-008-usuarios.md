# SPEC-008 · Usuarios e invitaciones

## Objetivo

Administrar el acceso a la empresa activa sin eliminar cuentas ni romper referencias de auditoría o documentos fiscales.

## Flujo

1. Un administrador registra nombre, correo y rol.
2. Si la cuenta no existe, queda `pending` y se genera una invitación de un solo uso por 48 horas.
3. Solo el hash SHA-256 del token se guarda en MySQL; el enlace se muestra una vez para entrega manual.
4. El invitado define personalmente una contraseña robusta en `/invite.html`.
5. La aceptación consume el token y activa la cuenta. Un administrador enrola MFA en su primer acceso.
6. Si el correo ya pertenece a una cuenta activa, se añade la membresía sin duplicar la identidad.

## Administración sin eliminación

- Se puede editar nombre, correo y rol de empresa.
- Suspender cambia la membresía a `suspended`; no elimina el usuario.
- Revocar sesiones incrementa `auth_version` e invalida todas las sesiones de la cuenta.
- Un administrador no puede suspenderse a sí mismo.
- La empresa conserva al menos un administrador activo.
- No existe endpoint `DELETE` para usuarios o membresías.
- Crear, editar, suspender o revocar sesiones exige CSRF y MFA verificado en los últimos cinco minutos.

## API

- `GET /api/users`
- `POST /api/users/invite`
- `PUT /api/users/:id`
- `POST /api/users/:id/revoke-sessions`
- `GET /api/auth/invitation?token=...`
- `POST /api/auth/invitation/accept`

El correo automático queda pendiente. Mientras tanto, el enlace debe compartirse mediante un canal seguro.
