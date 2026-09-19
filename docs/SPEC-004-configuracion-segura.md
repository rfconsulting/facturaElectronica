# SPEC-004: Configuración segura de proveedores fiscales

## Objetivo

Permitir que un administrador seleccione por empresa The Factory HKA o Electronic Business Intelligence (EBI), y establezca sus credenciales sin que el navegador pueda recuperarlas posteriormente.

## Modelo

- `fiscal.provider`: proveedor activo, `hka` o `ebi`.
- `config_operational`: ambiente, sucursal, tipo de sucursal, punto fiscal, timeout y, para EBI, URL SOAP.
- `config_secrets`: usuario/contraseña HKA o `tokenEmpresa`/`tokenPassword` EBI, cifrados y versionados.
- `CONFIG_MASTER_KEY`: clave AES-256 externa a MySQL e independiente de `MFA_ENCRYPTION_KEY`.

Cada secreto usa AES-256-GCM con IV aleatorio y AAD formado por clave lógica y versión. La API de estado consulta solo metadatos y nunca devuelve secretos.

## Endpoints

- `GET /api/config/fiscal-api`: devuelve proveedor activo y configuración no sensible.
- `PUT /api/config/fiscal-api`: reemplaza proveedor, configuración y credenciales.
- `POST /api/config/fiscal-api/test`: prueba HKA mediante autenticación o EBI mediante `EstadoDocumento`, sin emitir.
- `POST /api/auth/mfa/step-up`: renueva la autorización sensible por cinco minutos.

Todos requieren administrador y MFA. Las operaciones de escritura o prueba requieren MFA reciente, CSRF, rate limit y `Cache-Control: no-store`. La auditoría registra la acción, nunca el cuerpo ni los valores.

## Trazabilidad multi-PAC

`electronic_invoices.fiscal_provider` conserva el PAC con el que se reservó y envió cada factura. La reconciliación utiliza ese valor aunque luego la empresa cambie su proveedor activo. Correlativos e idempotencia siguen siendo locales y comunes.

## Rotación y recuperación

Respaldar `CONFIG_MASTER_KEY` en un gestor de secretos. Perderla vuelve irrecuperables las credenciales cifradas. Para rotarla se requiere descifrar con la clave anterior y volver a cifrar con la nueva.

Si falta `CONFIG_MASTER_KEY`, `PUT /api/config/fiscal-api` responde `503 CONFIG_MASTER_KEY_MISSING`.

La decisión arquitectónica y el procedimiento previo a producción se detallan en [ADR-009](ADR-009-integracion-multi-pac.md).
