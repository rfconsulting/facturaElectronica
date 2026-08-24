# SPEC-003: MFA obligatorio para administradores

## Objetivo

Exigir un segundo factor TOTP a toda cuenta con rol `administrator`, replicando el patrón probado en `psicoeducandonos` y evitando acceso a facturación con solo una contraseña comprometida.

## Flujo

1. Tras validar correo y contraseña, el servidor rota la sesión y marca `mfaVerified=false` para administradores.
2. Si la cuenta no está enrolada, se genera un secreto de 160 bits, se cifra con AES-256-GCM y se presenta como QR `otpauth://`.
3. El usuario introduce un TOTP de seis dígitos. Se acepta el intervalo actual de 30 segundos y uno adyacente a cada lado.
4. Al validar, se activa `mfa_enabled`, se marca la sesión y se habilitan dashboard y APIs de facturación.
5. Cinco fallos bloquean el desafío de esa sesión durante diez minutos.

## Controles

- El secreto nunca se devuelve después del enrolamiento inicial.
- El secreto se cifra en reposo con una clave separada de 256 bits en `MFA_ENCRYPTION_KEY`.
- La clave MFA es obligatoria en producción y no se almacena en el repositorio.
- Dashboard y rutas de facturas aplican `requireAuth` y `requireMfa`.
- Los eventos `mfa_failed`, `mfa_challenge_limited` y `mfa_verified` se auditan.

## Pendiente antes de producción

Definir un procedimiento verificado de recuperación por pérdida del autenticador y códigos de respaldo de un solo uso. El restablecimiento nunca debe hacerse solo mediante correo sin verificación adicional de identidad.
