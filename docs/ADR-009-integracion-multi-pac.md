# ADR-009: integración fiscal multi-PAC HKA y EBI

## Decisión

La empresa selecciona un proveedor fiscal activo: `hka` o `ebi`. La capa de aplicación usa una fachada fiscal común y no conoce el protocolo concreto. HKA conserva su API JSON con JWT; EBI usa su integración directa SOAP con `tokenEmpresa` y `tokenPassword`.

Cada factura guarda `fiscal_provider`. La emisión utiliza el proveedor activo al reservar el correlativo, mientras que una consulta o reconciliación posterior utiliza siempre el proveedor almacenado en la factura. Cambiar el PAC activo no reencamina documentos históricos.

## Configuración y seguridad

- `fiscal.provider` identifica el PAC activo por empresa.
- Las opciones operativas se almacenan con prefijo `hka.*` o `ebi.*`.
- Las credenciales permanecen cifradas en `config_secrets` y nunca regresan al navegador.
- EBI requiere una URL SOAP HTTPS configurable. Demo usa `https://demointegracion.ebi-pac.com/ws/obj/v1.0/Service.svc`; producción no presupone una URL y debe configurarse con el dato contractual entregado por el PAC.
- Guardar o probar la configuración mantiene MFA reciente, CSRF y auditoría.

## Fiabilidad

Se conservan el correlativo local, la idempotencia, los estados `reserved`, `authorized`, `rejected` y `uncertain`, y el bloqueo exclusivo de reconciliación. Para EBI, `codigo=200` se interpreta como autorización; un timeout o resultado sin evidencia terminal queda `uncertain` y no se reemite automáticamente.

## Operación

Antes de activar EBI en producción se debe validar con EBI la URL contractual, los tokens, sucursal, punto de facturación y homologación de los documentos requeridos. La prueba de conexión usa `EstadoDocumento` y no emite una factura.
