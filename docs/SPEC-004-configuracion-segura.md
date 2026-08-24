# SPEC-004: Configuración segura de proveedores

## Objetivo

Permitir que un administrador establezca y reemplace credenciales de The Factory HKA desde el panel sin que el navegador pueda recuperarlas posteriormente.

## Modelo

- `config_operational`: ambiente, sucursal, tipo de sucursal, punto fiscal y timeout.
- `config_secrets`: usuario y contraseña HKA cifrados, con versión y responsable del cambio.
- `CONFIG_MASTER_KEY`: clave AES-256 externa a MySQL e independiente de `MFA_ENCRYPTION_KEY`.

Cada secreto usa AES-256-GCM con IV aleatorio y AAD formado por clave lógica y versión. Sustituir una credencial incrementa su versión. La API de estado consulta solo metadatos y nunca descifra ni devuelve valores.

Tanto demo como producción requieren usuario y contraseña de servicios web. El par guardado corresponde al ambiente seleccionado; cambiar de ambiente exige guardar también las credenciales entregadas por el PAC para ese destino. El servidor las utiliza únicamente para autenticarse y comunicarse con la API correspondiente.

## Endpoints

- `GET /api/config/fiscal-api`: devuelve estado y configuración no sensible.
- `PUT /api/config/fiscal-api`: reemplaza configuración y credenciales.
- `POST /api/config/fiscal-api/test`: prueba las credenciales guardadas contra `Autenticacion` de HKA.
- `POST /api/auth/mfa/step-up`: renueva la autorización sensible por cinco minutos.

Todos requieren administrador y MFA. Las operaciones de escritura o prueba requieren MFA reciente, CSRF, rate limit y `Cache-Control: no-store`. La auditoría registra la acción, nunca el cuerpo ni los valores.

## Regla write-only

La interfaz puede establecer o reemplazar un secreto, pero nunca recuperarlo. El servidor conserva solo la capacidad de usarlo en nombre de la aplicación.

## Rotación y recuperación

Respaldar `CONFIG_MASTER_KEY` en un gestor de secretos. Perderla vuelve irrecuperables las credenciales cifradas. Para rotarla se requiere un proceso que descifre con la clave anterior y vuelva a cifrar con la nueva; no basta cambiar la variable de entorno.

`CONFIG_MASTER_KEY` y `MFA_ENCRYPTION_KEY` deben ser claves distintas. El servidor puede arrancar en desarrollo sin la primera para permitir migraciones y consultar estado, pero rechaza cualquier intento de cifrar credenciales hasta que se configure explícitamente.

Si falta `CONFIG_MASTER_KEY`, `PUT /api/config/fiscal-api` responde `503 CONFIG_MASTER_KEY_MISSING` sin intentar guardar credenciales ni reducir el problema a un error interno genérico.
