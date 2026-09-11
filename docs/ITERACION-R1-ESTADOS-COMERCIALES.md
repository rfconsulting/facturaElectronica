# Iteración R1 — Estados comerciales independientes

## Objetivo

Separar el cierre de la oportunidad del estado de cobranza conforme a ADR-006, conservando trazabilidad e instalabilidad sobre bases nuevas y existentes.

## Alcance implementado

- se retiró `payment_pending` de la API, interfaz y esquema objetivo de oportunidades;
- la inicialización migra `payment_pending` a `won` con probabilidad 100 antes de restringir el enum;
- se reemplazó `partial` por `partially_paid` y se añadió `overdue` al esquema de cuentas por cobrar;
- registrar pagos ya no modifica oportunidades;
- una factura autorizada cierra una oportunidad abierta solo cuando la cotización usa `direct_invoice`;
- una oportunidad `lost` queda protegida contra ese efecto;
- la conversión a pedido conserva el cierre `won` ya existente;
- tablero ERP, etiquetas de UI, documentación y observabilidad usan los estados nuevos.

## Fuera de alcance

- automatización para calcular `overdue` por fecha;
- contrato definitivo de eventos y deduplicación de pagos, que corresponden a R3;
- cambio físico del nombre de las tablas de cotizaciones;
- despliegue o ejecución de `db:init` sobre una base productiva.

## Estrategia de datos

La migración de `scripts/init-database.js` es reejecutable:

1. detecta el tipo actual del enum;
2. convierte `payment_pending` a `won` antes de retirar el valor;
3. amplía temporalmente cobranza para admitir `partial` y `partially_paid`;
4. actualiza las filas legadas;
5. restringe el enum al contrato final.

Antes de producción se requiere respaldo y preflight que confirme que las oportunidades `payment_pending` tienen factura autorizada. No se ejecutó la migración contra datos reales durante esta iteración.

## Pruebas

- esquema sin estados comerciales/financieros mezclados;
- presencia y orden de las conversiones de migración;
- pago parcial y total sin SQL sobre oportunidades;
- factura directa autorizada cierra solo oportunidades no perdidas;
- regresión de CRM, facturación y cotizaciones;
- suite completa del proyecto.

### Evidencia ejecutada el 2026-09-10

| Comando | Resultado leído |
| --- | --- |
| `npm run check` | Sintaxis válida |
| `npm test` | 95 pruebas aprobadas, 0 fallos |
| `npm audit --omit=dev` | 5 vulnerabilidades moderadas ya registradas como R0-SEC-001; sin fix disponible reportado |
| `git diff --check` | Sin errores; solo avisos no bloqueantes de normalización LF/CRLF |

## Riesgos residuales

| Riesgo | Tratamiento |
| --- | --- |
| Datos productivos que no cumplan la precondición histórica de `payment_pending` | Ejecutar consulta preflight, bloquear y revisar excepciones antes de `db:init` |
| Efectos comerciales posteriores a la autorización no son una sola transacción con el PAC | R3 moverá efectos a eventos idempotentes; R4 reforzará reconciliación |
| `overdue` todavía no se calcula automáticamente | Mantenerlo como estado permitido y especificar política en una iteración posterior |
| Vulnerabilidades moderadas de dependencias | Riesgo R0-SEC-001 permanece bloqueante para Gate 4 |

## Gate y estado

- Gate 3: evidencia preparada; requiere aprobación del responsable técnico.
- Gate 4: pendiente de revisión humana independiente, ensayo de migración sobre copia representativa y resolución/aceptación de R0-SEC-001.
- Despliegue: no realizado.
