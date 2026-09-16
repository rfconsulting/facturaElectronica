# Runbook de recuperación y re-enrolamiento MFA

## Propósito y alcance

Recuperar una cuenta administrativa cuando se pierde el autenticador o el secreto almacenado no puede descifrarse con la `MFA_ENCRYPTION_KEY` activa. El procedimiento aplica a una cuenta identificada de forma inequívoca y no autoriza reinicios masivos.

## Diagnóstico

1. Confirma que correo y contraseña fueron aceptados y que el fallo ocurre en `POST /api/auth/mfa/verify`.
2. Distingue el código devuelto:
   - `MFA_INVALID`: revisar hora automática del dispositivo y utilizar el código vigente.
   - `MFA_RATE_LIMITED`: esperar diez minutos o iniciar una sesión nueva según la política vigente.
   - `AUTH_REQUIRED`: volver a iniciar sesión.
   - `MFA_REENROLL_REQUIRED`: verificar la clave de cifrado y seguir este runbook.
3. Comprueba que el servidor usa la misma `MFA_ENCRYPTION_KEY` asociada al respaldo de la base. Nunca registres ni muestres la clave, el secreto cifrado o un TOTP.
4. Si la clave correcta está disponible, restáurala antes de modificar la cuenta. Esta opción conserva el enrolamiento y es preferible al reinicio.

## Autorización

### Desarrollo

El responsable del entorno confirma por un canal autenticado la cuenta exacta y que la base objetivo es la declarada en `.env`. Se valida que la consulta encuentra exactamente un usuario.

### Producción

Se requiere verificación independiente de identidad, aprobación de una segunda persona autorizada, ticket o incidente, respaldo verificable y ventana de cambio. Una solicitud por correo no basta por sí sola.

## Restablecimiento controlado

Dentro de una única transacción y filtrando por el correo normalizado:

1. Verifica que existe exactamente una cuenta.
2. Establece `mfa_enabled=FALSE`.
3. Establece `mfa_secret_encrypted=NULL`.
4. Incrementa `auth_version` para revocar todas las sesiones anteriores.
5. Confirma la transacción únicamente si se modificó exactamente una fila.
6. Registra quién autorizó, ejecutó y revisó el cambio, sin copiar secretos.

No se debe sustituir el secreto directamente, desactivar MFA permanentemente ni reutilizar un QR anterior.

## Re-enrolamiento y verificación

1. El usuario inicia sesión nuevamente con correo y contraseña.
2. La pantalla MFA genera un secreto nuevo y muestra un QR.
3. El usuario elimina la entrada anterior de su autenticador, escanea el QR nuevo e introduce el TOTP vigente.
4. El servidor activa MFA, registra `mfa_verified` y establece la verificación reciente.
5. Verifica acceso al dashboard y una operación protegida por step-up.
6. Confirma que una sesión anterior ya no funciona.

## Evidencia y cierre

- Cuenta afectada e identificador del incidente.
- Motivo: pérdida del dispositivo, clave no disponible u otro motivo comprobado.
- Fecha, ejecutor, aprobador y revisor.
- Resultado del re-enrolamiento y revocación de sesiones.
- Confirmación de que ningún secreto apareció en tickets, capturas o logs.

Si la causa fue pérdida o cambio accidental de `MFA_ENCRYPTION_KEY`, revisa también el proceso de despliegue y el respaldo de secretos antes de cerrar el incidente.
