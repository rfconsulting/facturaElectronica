# Política de gobernanza de IA

## Alcance y transparencia

Los asistentes de IA usados para desarrollar este repositorio pueden recibir código fuente, documentación, esquemas, resultados de pruebas y datos sintéticos o anonimizados necesarios para una tarea. No deben recibir secretos, credenciales reales, dumps productivos, datos personales reales ni payloads fiscales productivos.

La asistencia de IA no equivale a autoría aprobada ni a revisión independiente. El responsable humano conserva la decisión, la validación de negocio y la autorización de merge o despliegue.

## Acciones prohibidas

- Leer, copiar, mostrar o modificar `.env`, credenciales HKA, JWT, claves maestras, semillas MFA o respaldos productivos.
- Usar datos reales de clientes o documentos fiscales en prompts, ejemplos o pruebas.
- habilitar HKA en producción, emitir documentos reales o ajustar correlativos productivos.
- Ejecutar migraciones sobre producción, borrar/restaurar datos o desplegar sin aprobación humana y respaldo verificado.
- Declarar homologación, cumplimiento, revisión humana o cierre de gate sin evidencia registrada.
- Introducir dependencias, servicios externos o transferencia de datos sin revisión de licencia, privacidad y seguridad.

## Flujo recurrente

1. La SPEC o issue declara si se usará IA, alcance de contexto y datos excluidos.
2. La salida se revisa mediante diff, pruebas y controles de seguridad proporcionales al riesgo.
3. Un revisor humano independiente del ejecutor aprueba cambios fiscales, identidad, secretos, permisos y migraciones.
4. El registro de gates enlaza cambio, riesgo, evidencia, aprobadores y decisión.
5. Hallazgos o incidentes alimentan la retrospectiva y esta política.

## Evidencia retroactiva disponible

Hay evidencia de uso de asistencia de IA en la implementación y documentación reciente. El asistente tuvo acceso al workspace, código, documentación, esquema y salidas de pruebas. No consta evidencia suficiente para afirmar revisión humana independiente de cada salida anterior. Por ello, los ADR retroactivos y gates permanecen con aprobación pendiente hasta que una persona identificada los revise y firme.

## Evidencia mínima por cambio futuro

- Identificador de SPEC/issue y herramientas de IA utilizadas.
- Categorías de información expuestas; nunca valores secretos.
- Archivos generados o modificados.
- Pruebas y revisión de seguridad ejecutadas.
- Nombre/identificador del revisor independiente, fecha y decisión.
