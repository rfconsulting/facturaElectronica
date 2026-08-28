# SPEC-007 · Punto de venta

## Objetivo

Ofrecer un flujo rápido y táctil para seleccionar artículos publicados en POS, cobrar y emitir una factura electrónica reutilizando las reglas fiscales existentes.

## Catálogo

- Solo muestra artículos con `status=active` y `available_in_pos=true`.
- Permite buscar por nombre o SKU y filtrar productos o servicios.
- Cada tarjeta muestra clasificación, nombre, código y precio.
- El servidor vuelve a consultar descripción, SKU, precio e ITBMS durante el cierre; no confía en los valores enviados por el navegador.

## Carrito

- Agregar un artículo incrementa su cantidad.
- Permite aumentar, disminuir, retirar o limpiar líneas.
- Limpiar una venta con artículos exige confirmación para evitar pérdidas accidentales.
- Calcula subtotal, ITBMS y total para respuesta inmediata; el servidor realiza el cálculo fiscal definitivo.
- En escritorio, el panel de venta permanece en su columna del grid y se vuelve sticky al desplazarse, sin superponerse al catálogo ni a los indicadores. Solo las líneas desplazan cuando realmente exceden el espacio útil. Los controles de cantidad ofrecen un área táctil mínima de 44 × 44 px.
- Permite consumidor final o un cliente activo guardado.
- Formas implementadas: efectivo, crédito/débito, transferencia y cheque.
- Para efectivo se captura el monto recibido, se calcula el cambio y se impide cobrar cuando no cubre el total. Este dato es transitorio de caja y no altera el valor fiscal de la factura.
- Al seleccionar efectivo, el campo adicional no puede comprimir ni ocultar las líneas: el panel crece con el pedido y utiliza el desplazamiento general de la página si fuera necesario.

## Cierre

1. El POS envía los identificadores y cantidades a `POST /api/invoices`.
2. El backend exige que todos los artículos sigan activos y publicados en POS.
3. Sustituye los datos manipulables por los valores vigentes en MySQL.
4. Aplica la validación y emisión HKA ordinaria.
5. Solo limpia el carrito tras una autorización exitosa; errores o estados inciertos permanecen visibles.

## Pendiente

Turnos y arqueo de caja, monto recibido y cambio, pagos mixtos, descuentos, suspensión/recuperación de ventas, impresión de ticket, lector de códigos de barras, inventario, devoluciones, operación offline y reportes POS.
