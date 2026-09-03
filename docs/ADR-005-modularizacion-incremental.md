# ADR-005 — Modularización incremental del monolito

- Estado: aceptado técnicamente de forma retroactiva; revisión arquitectónica humana solicitada el 2026-09-02 y pendiente de respuesta.
- Fecha de decisión reconstruida: 2026-09-02.
- Responsable: propietario técnico; nombre pendiente.

## Contexto

El producto comenzó con rutas Express directas. Facturación, clientes y cotizaciones acumularon reglas críticas, integraciones y necesidad de pruebas aisladas; migrar todo simultáneamente habría ampliado el riesgo y retrasado capacidades comerciales.

## Alternativas consideradas

1. Mantener todas las reglas en rutas: rápido inicialmente, difícil de probar y evolucionar.
2. Reescritura completa hexagonal: arquitectura uniforme, riesgo y costo de migración elevados.
3. Monolito modular con migración vertical progresiva por criticidad.

## Decisión

Conservar un monolito desplegable y migrar primero dominios críticos al patrón Route → Controller → Application → Repository/Integration. Facturación, clientes y cotizaciones usan esa separación. CRM y ERP mantienen adaptadores y rutas convencionales hasta extraerlos mediante iteraciones verificables.

## Consecuencias

- Hay heterogeneidad temporal y deuda explícita.
- No se crearán dependencias nuevas desde casos de uso hacia Express.
- Cada extracción debe mantener rutas compatibles, pruebas y aislamiento empresarial.
- No se justifican microservicios hasta demostrar una necesidad operacional concreta.

## Evidencia

`src/modules/invoicing`, `src/modules/clients`, `src/modules/quotations`, puntos de composición y pruebas de fronteras arquitectónicas.
