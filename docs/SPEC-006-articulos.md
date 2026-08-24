# SPEC-006 · Catálogo de artículos

## Objetivo

Mantener productos y servicios reutilizables al facturar e importar el catálogo de Zoho Inventory sin perder su clasificación.

## Datos

- Identificador Zoho, SKU, nombre y descripción.
- Clasificación obligatoria: `product` o `service`.
- Estado, unidad, precio de venta y moneda.
- Bandera `availableInPos`, desactivada por defecto, para decidir si aparece en el punto de venta.
- Código de ITBMS, nombre del impuesto, código CPBS y utilidad.
- Estructura reservada para campos personalizados del artículo.

## Integración con facturación

- Cada línea ofrece un selector de artículos activos almacenados en MySQL.
- La selección copia descripción, SKU, precio e ITBMS a la línea.
- Los valores copiados pueden ajustarse para la factura actual sin modificar el maestro.
- La entrada manual continúa disponible.
- **Crear artículo** abre un formulario rápido dentro de facturación; al guardar, persiste mediante `POST /api/articles`, actualiza el catálogo y selecciona el nuevo registro en la línea actual.
- La factura guarda los valores de la línea, no una referencia mutable al artículo.

## Importación Zoho

- Acepta `.xlsx` y `.csv` de hasta 5 MB.
- Lee la hoja `Item`.
- `Product Type=goods` se guarda como producto y `Product Type=service` como servicio.
- Detecta duplicados por `Item ID` o SKU.
- Presenta vista previa con conteo separado de productos y servicios.
- Omite duplicados e inválidos; la confirmación es transaccional y auditada.
- La importación masiva requiere rol administrador.
- Los precios negativos se reportan como inválidos. Los descuentos requieren un modelo fiscal explícito y no se representan como artículos ordinarios.

## API

- `GET /api/articles`
- `GET /api/articles/:id`
- `POST /api/articles`
- `PUT /api/articles/:id`
- `POST /api/articles/import/zoho`

`GET /api/articles?pos=true` devuelve únicamente artículos activos marcados como disponibles en POS. Los filtros `search` y `type` pueden combinarse con esta bandera.

## Seguridad e integridad

- Todas las rutas requieren sesión y MFA cuando aplique al rol.
- Crear y editar exige CSRF; importar exige además rol administrador.
- Los SKU e identificadores Zoho son únicos cuando están informados.
- No existe eliminación física: los artículos se marcan inactivos para conservar trazabilidad.
- Marcar un artículo para POS no reemplaza su estado: el POS exige simultáneamente `status=active` y `available_in_pos=true`.
