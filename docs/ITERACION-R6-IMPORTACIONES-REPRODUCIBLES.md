# Iteración R6 — Importaciones reproducibles

## Objetivo

Garantizar que cada confirmación corresponda al archivo, reglas, empresa, usuario y resultado mostrados en la vista previa.

## Alcance implementado

- tabla `import_jobs` con UUID, empresa, actor, tipo, SHA-256, versiones de reglas/mapeo, resumen, resultado, estado y expiración;
- vista previa de clientes y artículos devuelve `importJobId` con vigencia de 30 minutos;
- confirmación exige el mismo archivo y vuelve a parsear, validar y detectar duplicados;
- cambio de hash, reglas o resumen produce `IMPORT_PREVIEW_CHANGED` sin escrituras;
- jobs de otra empresa o usuario se comportan como no encontrados;
- confirmación expirada se rechaza y doble confirmación reproduce el resultado sin duplicar filas ni auditoría;
- confirmación, inserciones y cambio a `completed` ocurren en una transacción;
- el archivo permanece solo en memoria y no se conserva en base ni logs.

## Evidencia

- `npm run check`: correcto.
- `npm test`: 119 pruebas aprobadas, 0 fallidas.
- pruebas unitarias de hash, job, cambio y replay: aprobadas.
- `db:init` ejecutado correctamente sobre la base objetivo de desarrollo; tabla creada.
- `git diff --check`: sin errores; solo advertencias LF/CRLF.
- `npm audit --omit=dev`: 5 vulnerabilidades moderadas transitivas sin fix disponible, conservadas como R0-SEC-001.

## Riesgos residuales

- La ruta de artículos sigue siendo un adaptador horizontal; debe migrarse a un módulo vertical en una iteración posterior.
- Un cambio concurrente en maestros puede modificar los duplicados entre preview y confirmación; R6 lo detecta como resumen distinto y exige nueva vista previa.
- La limpieza periódica quedó implementada y probada en R7; falta programar `npm run imports:cleanup` diariamente en la plataforma productiva.

## Gate

Gate 3 fue aprobado expresamente por el propietario del proyecto. Gate 4 queda aprobado tras la revisión humana independiente de Richard Flores, declarada el 2026-09-10, con R0-SEC-001, R6-OPS-001 y R6-ARCH-001 aceptados y abiertos.
