# Iteración R7 — Consolidación

## Objetivo

Consolidar la evidencia R1–R6 y demostrar la preparación del flujo comercial/fiscal antes de habilitar nuevos dominios.

## Implementado

- limpieza acotada de jobs expirados mediante `npm run imports:cleanup`;
- controles de retención de imports en `ops:check`;
- comprobación ejecutable de saldos, autorización fiscal, empresa, duplicados de origen y outbox mediante `npm run integrity:check`;
- prueba integral del ciclo cotización→pedido→factura→cuenta por cobrar→pagos, preservando estados independientes e idempotencia;
- procesamiento controlado del outbox en desarrollo;
- auditoría transversal y plan fechado del alias heredado.

## Pendiente bloqueante

- configuración y despliegue productivos;
- ventana de observación para Gate 6;
- revisión humana de Gate 5 cuando exista un artefacto/versionado de entrega.

## Estado

R7 está parcialmente completado y aprobado exclusivamente para desarrollo. No habilita expansión de alcance, release ni producción.

## Evidencia global

- `npm run check`: correcto.
- `npm test`: 123 pruebas aprobadas, 0 fallidas.
- `npm audit --omit=dev`: cinco vulnerabilidades moderadas transitivas sin fix disponible.
- `git diff --check`: sin errores; solo advertencias LF/CRLF.
- `npm run integrity:check`: cinco controles aprobados.
- `npm run ops:check`: bloqueado correctamente por condiciones productivas ausentes en desarrollo.
- respaldo lógico con checksum: 37 tablas, restaurado y verificado sin diferencias en la base desechable `factura_electronica_restore_test`.
