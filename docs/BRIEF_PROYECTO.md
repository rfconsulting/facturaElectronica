# Brief del proyecto

## Problema

Las PYMES de Panamá necesitan convertir una relación comercial en una venta facturada y cobrable sin duplicar clientes, artículos ni importes entre un CRM y un facturador separado.

## Propuesta de valor

CORE Smart es una plataforma multiempresa de gestión comercial y facturación electrónica que conecta:

`Prospecto → Cliente fiscal + Contacto + Oportunidad → Cotización → Pedido → Factura electrónica → Cuenta por cobrar → Cobro`

Su diferenciador actual es la continuidad entre la gestión comercial, la ejecución del pedido y el documento fiscal panameño. El ERP cubre ventas, facturación y cobranza, pero no pretende ser todavía un ERP contable completo.

## Resultado implementado

- Autenticación con sesiones MySQL, MFA administrativo, CSRF, auditoría e invitaciones.
- Aislamiento por tenant y empresa activa con roles por membresía.
- Configuración cifrada y prueba de credenciales de The Factory HKA.
- Emisión, consulta y reconciliación de facturas internas.
- Clientes fiscales, contactos, artículos y migraciones desde Zoho/HKA.
- POS con catálogo, carrito, formas de pago y emisión fiscal.
- CRM con prospectos, conversión guiada, oportunidades, pipeline, tareas y actividades.
- Cotización canónica con aprobación, snapshots, descuentos, versiones y conversión idempotente.
- Tablero ERP y vistas de cotizaciones, pedidos confirmados, facturas y cobros.
- Preparación de factura desde una cotización aceptada o su pedido confirmado.
- Cuentas por cobrar y pagos parciales o totales asociados a facturas comerciales.

## Roles

- **Superusuario:** capacidad global concedida solo por consola; crea empresas y administra administradores.
- **Administrador:** configuración HKA, usuarios, campos configurables, importaciones y automatizaciones dentro de sus empresas.
- **Contador:** operación fiscal y mantenimiento ordinario de maestros.
- **Operador:** CRM, facturación, POS y maestros permitidos por las rutas operativas.

Contador y operador comparten la operación ordinaria; solo Administrador/Contador pueden aprobar cotizaciones y registrar cobros. La matriz completa y la deuda de permisos configurables están en `MATRIZ-ACCESO.md`.

## Alcance fiscal

- Factura interna normal mediante The Factory HKA.
- Consumidor final, contribuyente, Gobierno y extranjero.
- ITBMS 0 %, 7 %, 10 % y 15 %.
- Correlativos transaccionales, idempotencia y consulta de resultados inciertos.
- Conservación de la fotografía fiscal enviada aunque cambien los maestros.

## Alcance comercial

- Prospectos calificados sin creación prematura de clientes fiscales.
- Clientes fiscales separados de sus personas de contacto.
- Coincidencias por correo, teléfono, empresa y dominio empresarial durante la captación y conversión.
- Oportunidades con información mínima obligatoria y pipeline posterior a la calificación.
- Actividades históricas y tareas pendientes vinculadas a registros comerciales.
- Cotizaciones con artículos, precios, descuentos, impuestos, correlativo, aprobación y revisiones.
- Pedidos confirmados con snapshots de la oferta aceptada.
- Trazabilidad desde cotización y pedido hasta factura y saldo pendiente.
- Cobros parciales y totales; el pago completo cierra la oportunidad como ganada.

## Fuera del alcance actual

- Notas de crédito/débito, anulaciones, contingencia, descuentos fiscales, retenciones e ISC/OTI.
- Inventario cuantitativo, almacenes, compras y proveedores.
- Caja formal, turnos, arqueos, pagos mixtos y conciliación bancaria.
- Contabilidad general, cuentas por pagar, tesorería, presupuesto, activos, planilla y RR. HH.
- CAFE/XML descargable, impresión de comprobantes y envío de facturas por correo.
- Marketing, campañas, conectores activos de correo/calendario/WhatsApp y pronósticos avanzados.
- Códigos MFA de respaldo y permisos granulares.

## Criterios transversales

- El servidor recalcula importes fiscales y valida pertenencia a la empresa activa.
- `converted` solo se alcanza mediante conversión transaccional.
- Una oportunidad no avanza sin relación, responsable, monto, cierre esperado y próxima acción.
- Una cotización debe estar aceptada para convertirse; un pedido confirmado puede preparar una factura revisable.
- Un pago nunca puede superar el saldo de la cuenta por cobrar.
- Credenciales, secretos y cuerpos sensibles no llegan a logs.
- Las escrituras exigen CSRF; las acciones administrativas sensibles, MFA reciente.
- `npm run check`, `npm test` y `npm audit --omit=dev` deben pasar antes de entregar.
