# ADR-004 — Correlativos e idempotencia fiscal

- Estado: aceptado técnicamente de forma retroactiva; aprobación humana solicitada el 2026-09-02 y pendiente de respuesta.
- Fecha de decisión reconstruida: 2026-09-02.
- Responsable: propietario técnico y responsable fiscal; nombres pendientes.

## Contexto

Reintentos HTTP, fallos de red y concurrencia pueden duplicar facturas o reutilizar números fiscales. Ambos resultados dañan la integridad y pueden tener consecuencias regulatorias.

## Alternativas consideradas

1. Correlativo generado en memoria: no resiste concurrencia ni reinicios.
2. UUID como número fiscal: incompatible con el formato requerido.
3. Secuencia transaccional en MySQL más clave idempotente por intención.

## Decisión

Reservar el correlativo dentro de una transacción usando `SELECT ... FOR UPDATE`, segmentado por empresa, sucursal, punto y tipo documental. Exigir `Idempotency-Key`, guardar una huella canónica de la solicitud y aplicar unicidad por empresa. La llamada al PAC ocurre después de confirmar la reserva; un resultado ambiguo conserva `uncertain`.

## Consecuencias

- Los números reservados no se reutilizan, incluso ante rechazo o incertidumbre.
- La misma clave y payload devuelve el resultado persistido; una clave con otro payload produce conflicto.
- MySQL es dependencia de consistencia y debe estar disponible antes de aceptar tráfico.
- Ajustar manualmente el próximo número requiere control administrativo y MFA reciente.

## Evidencia

`invoice_sequences`, índices de idempotencia, caso de uso de emisión, pruebas de reintento/conflicto y SPEC-002.
