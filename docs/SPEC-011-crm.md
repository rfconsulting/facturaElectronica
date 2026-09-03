# SPEC-011 — CRM comercial integrado

## Objetivo

Gestionar la relación comercial desde la captación hasta la preparación de la venta fiscal, sin duplicar clientes, contactos, artículos o importes.

## Flujo vigente

`Prospecto → Cliente fiscal + Contacto + Oportunidad → Cotización aceptada → ERP`

La conversión ocurre después de calificar al prospecto. El cliente es la entidad fiscal y el contacto es la persona con la que se mantiene la relación.

## Prospectos

Estados:

| Estado | Uso |
| --- | --- |
| `new` | Registro recién capturado |
| `attempting_contact` | Se intenta establecer comunicación |
| `contacted` | Ya hubo contacto efectivo |
| `qualified` | Existe necesidad o intención comercial válida |
| `nurturing` | Requiere seguimiento a medio o largo plazo |
| `discarded` | No continuará en el proceso |
| `converted` | Fue convertido mediante el caso de uso protegido |

El puntaje inicial considera correo, teléfono, empresa, próxima acción y estado. Es una medida de completitud y avance, no un modelo predictivo de intención.

`converted` no se acepta en `PUT /api/crm/leads/:id`; solo lo establece `POST /api/crm/leads/:id/convert`.

## Coincidencias y conversión

Antes de convertir, `GET /api/crm/leads/:id/matches` busca posibles clientes por correo, teléfono normalizado, razón o nombre comercial y dominio empresarial. Los proveedores públicos de correo no se consideran dominio empresarial.

El usuario puede elegir un cliente existente o crear uno. La conversión:

1. Bloquea el prospecto.
2. Valida la empresa activa.
3. Selecciona o crea el cliente fiscal.
4. Crea el contacto principal y conserva a la persona del prospecto.
5. Crea opcionalmente una oportunidad completa.
6. Marca el prospecto como convertido.
7. Registra una actividad de sistema y un evento en `integration_outbox`.

Si se crea una oportunidad, son obligatorios nombre, monto mayor que cero, cierre esperado y próxima acción.

## Contactos

`client_contacts` almacena nombre, cargo, correo, teléfono, indicador de contacto principal, indicador de decisor y estado. Un contacto siempre pertenece a un cliente de la misma empresa. Al designar un nuevo contacto principal se desmarca el principal anterior.

API:

- `GET /api/crm/contacts`
- `POST /api/crm/contacts`
- `PUT /api/crm/contacts/:id`

## Oportunidades y pipeline

| Etapa | Probabilidad |
| --- | ---: |
| `diagnosis` | 20 % |
| `solution_defined` | 40 % |
| `quote_sent` | 60 % |
| `follow_up` | 65 % |
| `negotiation` | 80 % |
| `payment_pending` | 90 % |
| `won` | 100 % |
| `lost` | 0 % |

La oportunidad comienza donde termina la calificación del prospecto. Puede capturarse directamente, pero debe estar vinculada a un prospecto o cliente y tener responsable, monto, cierre y próxima acción.

Reglas de transición:

- Para avanzar más allá de diagnóstico debe conservar todos los datos mínimos.
- `quote_sent` exige una cotización enviada o aceptada.
- `payment_pending` exige una factura autorizada vinculada.
- `lost` conserva el motivo de pérdida.
- El pago total de la cuenta por cobrar marca la oportunidad como `won`.

## Actividades y tareas

Una actividad representa algo ocurrido; una tarea representa algo pendiente. Ambas requieren relación con un prospecto, cliente u oportunidad y pueden señalar un contacto.

Actividades manuales: nota, llamada, correo o reunión. También existen actividades de sistema y factura. Se conservan asunto, detalle, resultado, próxima acción y fecha.

Las tareas conservan responsable, vencimiento, prioridad y estado. Se completan o cancelan sin eliminación destructiva.

## Enlace con cotizaciones

- El CRM origina y consulta la cotización canónica; no mantiene una copia propia.
- La API principal es `/api/quotations`; `/api/crm/quotes` permanece como adaptador temporal.
- Los estados son `draft`, `pending_approval`, `approved`, `sent`, `viewed`, `accepted`, `converted`, `rejected`, `expired` y `cancelled`.
- La cotización conserva snapshots, descuentos, versiones e historial.
- Enviar una cotización mueve la oportunidad a `quote_sent`; convertirla en pedido confirmado mueve la oportunidad a `won`.

Después de aceptar, el ERP ejecuta la conversión idempotente a pedido o borrador fiscal. El usuario debe revisar y emitir desde el formulario fiscal; aceptar no emite automáticamente.

## Interfaz

El centro comercial incluye Resumen, Prospectos, Contactos, Oportunidades, Pipeline, Actividad y cotizaciones, y Cobros. Los formularios se abren en un panel lateral. La conversión guiada muestra coincidencias y recopila los datos comerciales antes de confirmar.

## Seguridad y trazabilidad

- Sesión y MFA según el rol.
- CSRF en todas las escrituras.
- Validación de cada relación contra `company_id`.
- Operaciones no destructivas.
- Eventos transaccionales en `integration_outbox`.
- La bandeja no constituye un conector activo.

## Pendiente

Consolidar las rutas heredadas restantes en módulos verticales, reglas configurables de transición, fusión asistida de duplicados, plantillas/PDF, conectores de correo/calendario/WhatsApp, campañas consentidas, metas y pronósticos.
