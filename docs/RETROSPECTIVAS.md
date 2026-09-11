# Retrospectivas de iteración y release

## Plantilla

- Fecha y versión:
- Objetivo y resultado medible:
- Métricas observadas frente al objetivo:
- Incidentes, regresiones o facturas `uncertain`:
- Supuestos confirmados o refutados:
- Riesgos y deuda aceptada:
- Acciones, responsable y fecha objetivo:
- Evidencia:
- Facilitador y aprobador:

## 2026-09-02 — Evolución CRM/ERP y formalización metodológica

- Objetivo: conectar prospecto, cotización, pedido, factura y cobro; actualizar evidencia arquitectónica.
- Resultado: flujo y documentación implementados; suite automatizada y migración local ejecutadas.
- Métricas observadas: 77 pruebas aprobadas antes de incorporar controles de rol; sin fallos de sintaxis ni migración local.
- Incidentes: ninguno registrado en entorno local. No constituye verificación productiva.
- Supuestos revisados: la aplicación se describe como ERP comercial/fiscal, no como ERP contable universal.
- Riesgos/deuda: revisión humana independiente, homologación productiva, permisos configurables y pruebas end-to-end permanecen pendientes.
- Acción: aprobación de Gates 2, 3 y 4 solicitada el 2026-09-02; falta identificar revisores y registrar sus decisiones. Gate 6 requiere además evidencia de producción.
- Evidencia: historial del repositorio, SPEC-011/012/013, ADR-002 a ADR-005 y suite de pruebas.
- Facilitador: asistencia de IA. Aprobador humano: pendiente.

## 2026-09-10 — R0–R7 en desarrollo

- Objetivo: desacoplar estados, hacer deterministas las rutas, persistir eventos, reconciliar facturas, reforzar multiempresa y hacer reproducibles las importaciones.
- Resultado: R1–R6 implementados; R7 consolidado parcialmente en la base objetivo de desarrollo.
- Métricas: 31 relaciones multiempresa y cinco invariantes comerciales sin anomalías; 12/12 eventos entregados; cero `uncertain` y `dead_letter`.
- Incidentes: una colisión de índice heredado durante R5 fue corregida de forma reejecutable; el respaldo R7 no pudo comenzar por ausencia de `mysqldump`.
- Riesgos: R0-SEC-001 y R6-ARCH-001 abiertos; R7-OPS-001 y preparación productiva bloquean Gates 5–6.
- Evidencia: expedientes R0–R7, auditoría transversal, suite y comandos operativos.
- Facilitador: asistencia de IA. Revisor Gate 4 R6: Richard Flores.
