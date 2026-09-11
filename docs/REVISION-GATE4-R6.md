# Revisión Gate 4 — R6 Importaciones reproducibles

## Decisión

Aprobado. El propietario del proyecto declaró el 2026-09-10 que Richard Flores realizó la revisión humana independiente y aprobó Gate 4. Los riesgos moderados aceptados continúan en seguimiento y no se consideran corregidos por la aprobación.

## Evidencia revisada

- 16/16 pruebas dirigidas de aislamiento, roles, multipart, hash, expiración, cambio de preview e idempotencia aprobadas;
- 119/119 pruebas globales aprobadas en el cierre de R6;
- importación restringida a administrador, con autenticación, MFA y CSRF;
- archivo limitado a 5 MB, una sola parte de archivo y procesamiento exclusivamente en memoria;
- job consultado con `id + company_id + created_by + import_type` y bloqueado con `FOR UPDATE`;
- inserciones y transición a `completed` dentro de la misma transacción;
- hash SHA-256 y versiones de reglas/mapeo conservados; archivo original no persistido;
- replay de job completado devuelve el resultado persistido sin insertar ni auditar nuevamente.

## Hallazgos

| ID | Severidad | Hallazgo | Tratamiento |
| --- | --- | --- | --- |
| R0-SEC-001 | Moderada | `npm audit --omit=dev` informa cinco vulnerabilidades transitivas sin fix disponible en `adm-zip` y `qs`/Express | Mantener seguimiento. `adm-zip` solo lee entradas XLSX en memoria y no usa APIs de extracción a disco; el vector de sobrescritura por symlink no es alcanzable en este flujo. La API limita JSON a 32 KB y multipart a 5 MB. |
| R6-OPS-001 | Moderada | No existe limpieza programada de jobs expirados | Incorporar purga por lotes y métrica de antigüedad antes de producción. No afecta aislamiento ni exactitud de confirmación. |
| R6-ARCH-001 | Baja | El importador de artículos continúa dentro de una ruta horizontal | Migrarlo a Route→Controller→Application→Repository durante consolidación; no bloquea Gate 4 de seguridad. |

## Controles sin hallazgos

No se observó cruce de empresa/usuario, confirmación sin job, reutilización con archivo distinto, doble escritura por replay, persistencia del archivo ni exposición del contenido en logs o respuestas.

## Aprobación humana independiente

- Fecha declarada: 2026-09-10.
- Resultado: aprobado.
- Evidencia de decisión: declaración expresa del propietario en conversación.
- Revisor humano independiente: Richard Flores.
- Riesgos aceptados: R0-SEC-001, R6-OPS-001 y R6-ARCH-001.
