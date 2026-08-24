# SPEC-001: Acceso al portal

## Flujo

1. El navegador solicita un token CSRF ligado a la sesión.
2. Envía correo normalizado y contraseña a `POST /api/auth/login`.
3. El servidor compara siempre con bcrypt, incluso si la cuenta no existe.
4. Si procede, rota la sesión, guarda una identidad mínima y redirige al dashboard.
5. Cada acceso protegido revalida estado y `auth_version` en MySQL.
6. Logout registra auditoría, destruye la sesión y limpia la cookie.

## Contrato HTTP

- `GET /api/csrf-token` → `{ csrfToken }`.
- `POST /api/auth/login` → `{ message, user, redirect }` o error genérico.
- `GET /api/auth/me` → usuario de sesión; requiere autenticación.
- `POST /api/auth/logout` → confirmación; requiere autenticación y CSRF.
- `GET /api/health` → estado de aplicación/base de datos.

## Quality gates

Problema, alcance, arquitectura, criterios verificables y riesgos están documentados. La puerta de producción queda pendiente hasta contar con infraestructura destino, TLS, respaldo, observabilidad, prueba de integración y procedimiento de reversión.
