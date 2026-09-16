# SPEC-003: MFA obligatorio para administradores

## Objetivo

Exigir un segundo factor TOTP a toda cuenta con rol `administrator`, replicando el patrón probado en `psicoeducandonos` y evitando acceso a facturación con solo una contraseña comprometida.

## Flujo

1. Tras validar correo y contraseña, el servidor rota la sesión y marca `mfaVerified=false` para administradores.
2. Si la cuenta no está enrolada, se genera un secreto de 160 bits, se cifra con AES-256-GCM y se presenta como QR `otpauth://`.
3. El usuario introduce un TOTP de seis dígitos. Se acepta el intervalo actual de 30 segundos y uno adyacente a cada lado.
4. Al validar, se activa `mfa_enabled`, se marca la sesión y se habilitan dashboard y APIs de facturación.
5. Cinco fallos bloquean el desafío de esa sesión durante diez minutos.

## Respuestas del protocolo

- `AUTH_REQUIRED` (`401`): la sesión no existe, venció o fue revocada; el navegador vuelve al inicio de sesión.
- `MFA_INVALID` (`401`): el TOTP no coincide; el formulario permanece visible y permite corregirlo.
- `MFA_RATE_LIMITED` (`429`): se alcanzó el límite de intentos de la sesión.
- `MFA_REENROLL_REQUIRED` (`409`): el secreto almacenado no puede descifrarse con la clave activa. No se trata como un código incorrecto ni se expone la excepción criptográfica.

## Controles

- El secreto nunca se devuelve después del enrolamiento inicial.
- El secreto se cifra en reposo con una clave separada de 256 bits en `MFA_ENCRYPTION_KEY`.
- La clave MFA es obligatoria en producción y no se almacena en el repositorio.
- Dashboard y rutas de facturas aplican `requireAuth` y `requireMfa`.
- Los eventos `mfa_failed`, `mfa_challenge_limited` y `mfa_verified` se auditan.
- Un error de descifrado se registra como `mfa_secret_decryption_failed` sin incluir el secreto cifrado, el TOTP ni la clave.
- La interfaz conserva las referencias al formulario durante solicitudes asíncronas y muestra el error recibido sin convertir un rechazo MFA en una sesión vencida.

## Claves, restauración y re-enrolamiento

`MFA_ENCRYPTION_KEY` forma parte inseparable del respaldo. Debe mantenerse estable entre reinicios, despliegues y restauraciones; rotarla sin migrar previamente los secretos deja inutilizables los enrolamientos existentes.

Ante pérdida de la clave o del autenticador se sigue [el runbook de recuperación MFA](RUNBOOK-RECUPERACION-MFA.md). El restablecimiento elimina el secreto solo para la cuenta verificada, incrementa `auth_version` para invalidar sus sesiones y obliga a iniciar sesión y escanear un QR nuevo.

## Pendiente antes de producción

Implementar códigos de respaldo de un solo uso. El procedimiento administrativo de re-enrolamiento ya está definido, pero en producción nunca debe ejecutarse basándose solo en una solicitud por correo: requiere verificación independiente de identidad, doble control y evidencia de auditoría.
