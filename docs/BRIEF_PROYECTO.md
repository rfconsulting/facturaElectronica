# Brief del proyecto

## Problema

La operación necesita emitir documentos fiscales electrónicos en Panamá desde una aplicación segura, mantener maestros confiables de clientes y artículos, y migrar datos desde Zoho sin perder clasificación ni trazabilidad.

## Resultado actual

La aplicación entrega autenticación con sesiones MySQL y MFA administrativo, configuración segura de HKA, emisión y consulta de facturas, fichas de clientes, catálogo de productos y servicios, importaciones Zoho con vista previa y auditoría.

## Roles

- `administrator`: operación completa, configuración HKA, campos configurables e importaciones; MFA obligatorio.
- `accountant`: operación fiscal y mantenimiento ordinario de maestros.
- `operator`: emisión y mantenimiento permitido por las rutas operativas.

No existe todavía una matriz granular de capacidades. Salvo operaciones expresamente administrativas, los usuarios autenticados pueden usar los módulos operativos.

## Alcance vigente

- Factura interna normal mediante The Factory HKA.
- Receptores consumidor final, contribuyente, Gobierno y extranjero.
- ITBMS 0%, 7%, 10% y 15%.
- Secuencias fiscales transaccionales y consulta de resultados inciertos.
- Clientes con datos fiscales condicionales y campos personalizados.
- Productos y servicios reutilizables desde la factura.
- Importación Zoho Invoice/Inventory en XLSX y CSV.
- POS inicial con catálogo habilitado, carrito y emisión electrónica.

## Fuera de alcance

Notas de crédito/débito, anulaciones, contingencia, descuentos, retenciones, ISC/OTI, inventario cuantitativo, recuperación de contraseña, gestión de usuarios, códigos MFA de respaldo, descarga CAFE/XML, correo transaccional y reportes contables.

## Criterios transversales

- Los totales fiscales se recalculan en el servidor.
- Credenciales, contraseñas, secretos TOTP y cuerpos sensibles no llegan a logs.
- Las escrituras exigen CSRF; las acciones administrativas sensibles, MFA reciente.
- Las importaciones presentan vista previa y reportan duplicados o inválidos.
- Cada factura conserva el payload emitido aunque después cambien clientes o artículos.
- `npm run check`, `npm test` y la auditoría de dependencias deben pasar antes de entregar.
