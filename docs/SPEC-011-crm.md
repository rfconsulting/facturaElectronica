# SPEC-011 — CRM comercial integrado

## Objetivo

Incorporar seguimiento comercial sin duplicar el dominio fiscal. El CRM administra prospectos, oportunidades, actividades, tareas y cotizaciones; clientes, artículos y facturas continúan siendo los registros fiscales.

## Alcance implementado

- Prospectos con responsable, origen, estado, próxima acción y puntaje inicial.
- Pipeline: Nuevo, Contactado, Calificado, Propuesta, Negociación, Ganado y Perdido.
- Conversión asistida de prospecto a cliente y, opcionalmente, a oportunidad.
- Oportunidades con monto, probabilidad, cierre esperado y responsable.
- Tareas con vencimiento, prioridad, responsable y estado.
- Línea de tiempo de notas, llamadas, correos, reuniones, sistema y facturas autorizadas.
- Cotizaciones con renglones, ITBMS 0%, 7%, 10% y 15%, estados y correlativo transaccional por empresa.
- Automatizaciones configurables para crear tareas ante eventos comerciales.
- Reporte de oportunidades, ventas ganadas y pipeline por responsable.
- Bandeja de salida para futuras integraciones y aislamiento obligatorio por empresa.

## Experiencia operativa

La entrada del CRM funciona como centro de acción comercial y no como pantalla de captura. El resumen prioriza KPI, estado del pipeline, seguimientos pendientes y oportunidades abiertas. La navegación secundaria separa Resumen, Prospectos, Oportunidades, Pipeline y Actividades. Los formularios de creación se abren en un panel lateral que mantiene el contexto y ocupa la pantalla completa en móvil.

El eje operativo es: prospectar → seguir → negociar → cotizar → convertir → facturar. El botón de actualización manual se presenta como acción secundaria; las operaciones realizadas desde el módulo recargan automáticamente los datos.

## CRUD y trazabilidad

El CRM usa operaciones no destructivas. Un prospecto se descarta, una oportunidad se marca perdida, una tarea o cotización se cancela y una automatización se desactiva. Las actividades son históricas y no se eliminan.

## Seguridad e integraciones

- Las escrituras exigen sesión, MFA cuando corresponda y CSRF.
- Las relaciones se validan contra la empresa activa.
- El navegador no recibirá secretos de proveedores después de guardarlos.
- `integration_outbox` desacopla el CRM de correo, calendario, WhatsApp y webhooks.

## Próximas iteraciones

Conectores OAuth de correo y calendario, proveedor oficial de WhatsApp, consumidor reintentable de eventos, plantillas, campañas con consentimiento, metas y pronósticos avanzados.
