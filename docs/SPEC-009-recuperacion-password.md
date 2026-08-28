# SPEC-009 · Recuperación de contraseña

## Flujo

1. `forgot-password.html` solicita el correo.
2. La API responde siempre el mismo mensaje, exista o no la cuenta.
3. Para una cuenta activa genera 256 bits aleatorios, guarda solo SHA-256 y vence el enlace en 30 minutos.
4. Invalida solicitudes anteriores y envía el enlace mediante Resend.
5. `reset-password.html` valida el token y exige la misma política robusta usada al crear cuentas.
6. Al completar, consume todos los tokens del usuario, limpia bloqueos e incrementa `auth_version` para revocar sesiones.
7. El proceso no desactiva MFA ni revela el correo asociado.

## Configuración

- `RESEND_API_KEY`: API key restringida al envío.
- `PASSWORD_RESET_EMAIL_FROM`: remitente de un dominio verificado.
- `APP_PUBLIC_URL`: origen HTTPS usado para construir el enlace.

Sin proveedor configurado se mantiene la respuesta genérica y el token nunca se expone. En producción debe verificarse la entrega antes de habilitar el flujo al público.

## Controles

- CSRF en solicitud y cambio.
- Máximo cinco solicitudes por IP y hora.
- Token de un solo uso y comparación por hash.
- Respuesta anti-enumeración.
- Auditoría sin token, contraseña ni cuerpo.
- Revocación de sesiones tras el cambio.
