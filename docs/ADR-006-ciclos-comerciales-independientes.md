# ADR-006 — Ciclos comerciales y financieros independientes

- Estado: aceptado por el propietario del proyecto el 2026-09-10; revisión independiente de la implementación requerida antes de Gate 4.
- Fecha: 2026-09-10.
- Responsables: identidades pendientes de registrar en `REGISTRO-GATES.md`.

## Contexto

La implementación vigente mezcla el avance comercial con la cobranza: una factura autorizada mueve la oportunidad a `payment_pending` y el pago total la mueve a `won`. Esto hace que una venta formalizada siga apareciendo abierta hasta cobrar y permite que un evento financiero decida retrospectivamente un resultado comercial.

Oportunidad, cotización, pedido, factura y cuenta por cobrar son agregados distintos. Comparten trazabilidad, pero cada uno necesita una fuente de verdad y una máquina de estados propia.

## Alternativas consideradas

1. Marcar `won` al aceptar la cotización. Es temprano cuando la empresa exige confirmar pedido o completar una emisión directa.
2. Marcar `won` al pagar. Confunde cierre comercial con liquidez y distorsiona el pipeline.
3. Definir el compromiso según la política de conversión: pedido confirmado para `sales_order` y factura autorizada para `direct_invoice`.

## Decisión

Adoptar la alternativa 3.

- `sales_order`: la creación transaccional del pedido `confirmed` marca la oportunidad `won`.
- `direct_invoice`: preparar el borrador no cierra la venta; una factura `authorized` marca la oportunidad `won`.
- registrar pagos modifica únicamente la cuenta por cobrar.
- `payment_pending` deja de ser una etapa de oportunidad y se migra a `won`: su precondición histórica era una factura autorizada, que ya satisface el compromiso comercial definido por esta decisión.
- una oportunidad `lost` no puede cambiar por efectos laterales de facturación o cobranza; reabrirla requiere un comando comercial explícito y auditado.

La probabilidad pertenece al pipeline abierto. `won` fija 100 % y `lost` fija 0 %. La deuda se consulta desde `accounts_receivable` y no se infiere desde la oportunidad.

## Máquinas de estado normativas

| Agregado | Estados | Transiciones terminales |
| --- | --- | --- |
| Oportunidad | `diagnosis`, `solution_defined`, `quote_sent`, `follow_up`, `negotiation`, `won`, `lost` | `won`, `lost` |
| Cotización | `draft`, `pending_approval`, `approved`, `sent`, `viewed`, `accepted`, `converted`, `rejected`, `expired`, `cancelled` | `converted`, `rejected`, `expired`, `cancelled` |
| Pedido | `draft`, `confirmed`, `partially_invoiced`, `invoiced`, `cancelled` | `invoiced`, `cancelled` |
| Factura | `reserved`, `authorized`, `rejected`, `uncertain` | `authorized`, `rejected`; `uncertain` exige reconciliación |
| Cuenta por cobrar | `pending`, `partially_paid`, `paid`, `overdue`, `cancelled` | `paid`, `cancelled` |

## Transiciones y eventos

| Comando o hecho | Precondición | Cambio propietario | Evento resultante | Repetición |
| --- | --- | --- | --- | --- |
| Aceptar cotización | Cotización enviada/vista y vigente | Cotización → `accepted` | `QuotationAccepted` | Devuelve estado existente, sin evento doble |
| Convertir a pedido | Cotización `accepted`; clave idempotente válida | Cotización → `converted`; pedido → `confirmed`; oportunidad → `won` | `OrderConfirmed` | Misma clave devuelve el pedido original |
| Preparar factura directa | Cotización `accepted`; clave válida | Cotización → `converted`; borrador sin efecto fiscal | Evento técnico de conversión, no `InvoiceAuthorized` | Misma clave devuelve el borrador original |
| Autorizar factura | Factura `reserved`/`uncertain`; respuesta inequívoca | Factura → `authorized`; pedido → `invoiced` si aplica; oportunidad directa → `won` | `InvoiceAuthorized`, después `ReceivableCreated` cuando aplica | Un efecto por factura/evento |
| Registrar pago | Cuenta abierta; importe válido | Inserta pago; cuenta → `partially_paid` o `paid` | `PaymentRegistered`; si saldo cero, `ReceivableSettled` | Requiere identidad idempotente en R3 |
| Marcar perdida | Oportunidad abierta; motivo | Oportunidad → `lost` | Evento comercial versionado en R3 | Repetición sin efecto doble |

## Migración prevista para R1

- retirar las escrituras a `payment_pending` desde autorización fiscal;
- mapear oportunidades existentes en `payment_pending` a `won`, con probabilidad 100, preservando actividad e historial disponible;
- cambiar `accounts_receivable.status = 'partial'` a `partially_paid` mediante migración reejecutable;
- retirar la escritura a `won` del endpoint de pagos;
- asegurar que la autorización de factura directa aplica `won` una sola vez;
- no alterar importes, pagos, facturas ni correlativos durante la migración.

Antes de ejecutar sobre producción se debe registrar cuántos registros serán migrados y verificar que todos los `payment_pending` correspondan a una factura autorizada. Una excepción bloquea la migración para decisión humana.

## Consecuencias

- el pipeline representa cierres comerciales y cobranza representa exposición financiera;
- los reportes que usen `payment_pending` deben migrar a una consulta de cuentas por cobrar;
- una empresa puede tener ventas ganadas con saldos pendientes, que es el comportamiento esperado;
- R1 necesita migración, compatibilidad temporal y pruebas de regresión.

## Evidencia requerida

SPEC-011, SPEC-012, SPEC-013, pruebas de transición por política, pruebas negativas para oportunidades perdidas, preflight/migración y aprobación humana registrada.
