# Expediente de pruebas y habilitación productiva del PAC

Estado actual: **bloqueado — no existe evidencia de habilitación productiva del emisor**.

El PAC ofrece dos ambientes con efectos distintos:

- `demo`: integración y pruebas técnicas; ningún documento emitido tiene validez fiscal.
- `production`: operación fiscal real; los documentos emitidos tienen validez fiscal.

Los dos ambientes se consumen mediante API autenticada y cada uno requiere usuario y contraseña de servicios web proporcionados por el PAC. La evidencia debe confirmar que las credenciales probadas corresponden al ambiente indicado, sin registrar sus valores.

Superar casos en demo aporta evidencia técnica, pero no convierte esos documentos en fiscales ni sustituye la habilitación productiva otorgada por el PAC.

## Datos y responsables

| Evidencia | Estado |
|---|---|
| Razón social, RUC y DV definitivos del emisor | Pendiente |
| Sucursal, tipo de sucursal y punto fiscal autorizados | Pendiente |
| Credenciales oficiales entregadas por canal seguro | Pendiente |
| Responsable fiscal y aprobador técnico | Pendiente |
| Manual/contrato API versionado y fecha de consulta | Pendiente |
| Constancia de habilitación productiva emitida por el PAC | Pendiente |

## Casos mínimos con evidencia

- Consumidor final exento y gravado al 7%.
- Contribuyente con RUC/DV y ubicación fiscal completa.
- Gobierno, si aplica al negocio.
- Receptor extranjero, si aplica al negocio.
- Tasas ITBMS 0%, 7%, 10% y 15% según actividades autorizadas.
- Rechazo fiscal controlado y conservación de código/mensaje.
- Timeout o pérdida de respuesta, estado `uncertain` y reconciliación sin duplicidad.
- Reintento con la misma `Idempotency-Key` sin segundo envío.
- Concurrencia de dos emisiones sin repetir consecutivo.
- Emisión desde una cotización convertida o pedido confirmado, conservación de las relaciones y creación de una sola cuenta por cobrar tras autorización.
- Rechazo o estado `uncertain` desde cotización o pedido sin marcar prematuramente el pedido como facturado ni crear la cuenta por cobrar.
- CAFE/XML y QR validados cuando esas capacidades sean incorporadas.

Cada caso debe conservar: identificador interno, consecutivo, fecha, ambiente, entrada anonimizada, respuesta, resultado esperado/real y aprobación humana. No deben copiarse credenciales ni JWT al expediente.

## Criterio de salida

Solo se permite seleccionar el ambiente productivo cuando todos los casos aplicables estén aprobados, no existan facturas inciertas pendientes, respaldo/restauración estén probados, observabilidad esté conectada y la habilitación del PAC esté adjunta. Cambiar una variable a `production` no constituye por sí solo una habilitación; una vez conectado, cada emisión tendrá efectos fiscales reales.
