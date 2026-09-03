# ADR-003 — Integración fiscal con The Factory HKA

- Estado: aceptado técnicamente de forma retroactiva; justificación comercial y aprobación humana solicitadas el 2026-09-02 y pendientes de respuesta.
- Fecha de decisión reconstruida: 2026-09-02.
- Responsable: propietario fiscal/técnico; nombre pendiente.

## Contexto

La aplicación necesita emitir documentos electrónicos panameños mediante un PAC homologado, separar demo de producción y conservar trazabilidad cuando una llamada remota no confirma el resultado.

## Alternativas consideradas

1. Integración directa con otro PAC: requiere contrato, homologación y adaptación de contratos.
2. Capa multi-PAC desde el inicio: reduce dependencia futura, pero aumenta alcance y riesgo fiscal.
3. Adaptador dedicado a The Factory HKA detrás de una frontera de integración.

## Decisión

Usar The Factory HKA como PAC vigente, encapsulado en el módulo de facturación. Las credenciales son write-only y cifradas; el JWT vive en memoria y se separa por empresa. Una respuesta ambigua produce `uncertain`: no se libera el correlativo ni se reemite; se consulta `EstadoDocumento`.

## Consecuencias

- La salida a producción depende de contrato, homologación y habilitación HKA/DGI.
- El contrato actual acopla campos fiscales al PAC, aunque el caso de uso permanece separado.
- Cambiar o sumar PAC exige un nuevo ADR y pruebas fiscales equivalentes.
- El estado `uncertain` requiere monitoreo y reconciliación operacional.

## Evidencia

SPEC-002, HOMOLOGACION-HKA-DGI, adaptador HKA, persistencia de solicitudes/respuestas y runbook de factura incierta.
