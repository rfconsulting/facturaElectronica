# SPEC-005 · Ficha de clientes

## Objetivo

Mantener un directorio reutilizable de receptores para reducir errores al emitir facturas electrónicas y conservar, en cada factura, una copia histórica de los datos utilizados.

`clients` representa al receptor fiscal o cuenta empresarial. Las personas se almacenan por separado en `client_contacts`; esto evita perder al interlocutor cuando un prospecto empresarial se convierte.

## Secciones

1. **Datos generales:** código interno, estado, razón social, nombre comercial, correos, teléfonos y notas internas.
2. **Datos fiscales:** tipo de receptor FE, tipo de contribuyente, RUC, DV, dirección y ubicación fiscal; o identificación y país cuando el receptor es extranjero.
3. **Datos configurables:** definiciones administrables de tipo texto, número, fecha o booleano, almacenadas separadamente de los campos fiscales.

## Reglas fiscales

- Tipos de receptor: `01` contribuyente, `02` consumidor final, `03` Gobierno y `04` extranjero.
- Contribuyente y Gobierno requieren tipo de contribuyente, RUC, DV, razón social, dirección, código de ubicación, provincia, distrito y corregimiento.
- El extranjero requiere tipo y número de identificación, y un país distinto de Panamá.
- `ZZ` como código de país requiere una descripción en `paisOtro`.
- Consumidor final no recibe requisitos fiscales que no le corresponden.

## Seguridad e integridad

- Todas las rutas exigen sesión autenticada y MFA cuando aplique al rol.
- Crear y editar exige CSRF; definir campos personalizados exige rol administrador.
- Las operaciones se auditan sin registrar el contenido de la ficha.
- No se elimina físicamente un cliente: puede marcarse inactivo para conservar trazabilidad.
- La factura referencia al cliente, pero guarda el payload fiscal emitido como fotografía histórica.

## API

- `GET /api/clients`
- `GET /api/clients/:id`
- `POST /api/clients`
- `PUT /api/clients/:id`
- `GET /api/clients/custom-fields`
- `POST /api/clients/custom-fields` (administrador)
- `POST /api/clients/import/zoho` (administrador, vista previa o confirmación)
- `GET /api/crm/contacts`
- `POST /api/crm/contacts`
- `PUT /api/crm/contacts/:id`

## Contactos asociados

- Un cliente puede tener varias personas de contacto.
- Cada contacto conserva nombre, cargo, correo, teléfono, estado e indicadores de principal y decisor.
- Solo puede existir un contacto marcado como principal mediante los flujos actuales de creación, edición y conversión.
- Desactivar un contacto no elimina su relación histórica.
- La conversión de un prospecto crea el contacto principal dentro de la misma transacción comercial.

## Importación desde Zoho Invoice

- Acepta exportaciones `.xlsx` y `.csv` de hasta 5 MB.
- Lee la hoja `Customer` e ignora hojas auxiliares como `DropdownData`.
- Mapea nombre, empresa, correo, teléfonos, estado, dirección de facturación, país, identificador Zoho, notas y condiciones de pago.
- Interpreta `CF.FiscalDGI` con el formato `<tipo>.<RUC>.<DV>`, incluyendo RUC con guiones. `N` clasifica persona natural, `J` persona jurídica, `F` consumidor final, `G` Gobierno y `E` extranjero.
- Para `N` y `J`, conserva RUC y DV y asigna el tipo de contribuyente correspondiente. `F`, `G` y `E` se traducen al tipo de receptor fiscal aplicable.
- Toma la dirección desde `Billing Address` y sus columnas relacionadas. Cuando no existe dirección utilizable en un cliente local, completa Panamá, Panamá, Bella Vista, el código oficial correspondiente y una dirección específica predeterminada; la vista previa advierte el valor aplicado.
- Detecta duplicados por identificador Zoho, correo o RUC.
- Siempre presenta una vista previa antes de escribir en la base de datos.
- Un registro fiscal que todavía resulte incompleto después de normalizar la dirección no se fuerza silenciosamente: la vista previa lo reporta para corrección antes de confirmar o facturar.
- La confirmación se ejecuta dentro de una transacción y queda registrada en auditoría.
- La vista previa crea un `import_job_id` ligado a empresa, usuario, SHA-256 y versión de reglas durante 30 minutos. Confirmar exige el mismo job y archivo; cambios o expiración obligan a generar otra vista previa. Repetir una confirmación completada devuelve el resultado previo sin duplicar clientes.

## Criterios de aceptación

- Un usuario puede buscar, crear y editar clientes desde el menú Clientes.
- Las validaciones fiscales cambian según el tipo de receptor.
- Un administrador puede crear campos personalizados y estos aparecen en la ficha.
- La selección de un cliente en Nueva factura completa los datos disponibles.
- Un usuario puede consultar y crear contactos desde la sección Contactos del CRM.
