# Iteración R2 — Rutas deterministas y cotizaciones canónicas

## Objetivo

Eliminar la selección silenciosa de handlers duplicados y convertir `quotations` en el propietario efectivo de la cotización, manteniendo compatibilidad deliberada con `/api/crm/quotes`.

## Alcance implementado

- `src/routes/crm-router.js` inspecciona todas las firmas `METHOD + PATH` antes de componer;
- una colisión no declarada lanza `DUPLICATE_ROUTE`, enumera las fuentes y bloquea el arranque;
- las sustituciones vigentes están declaradas con fuente canónica y lista exacta de reemplazos;
- una declaración incompleta, sobrante o con canónico ausente también bloquea la composición;
- rutas, controlador, aplicación, validación, composición y repositorio de cotizaciones viven en `src/modules/quotations`;
- el acceso temporal a `crm_quotes` quedó nombrado como capa anticorrupción;
- `src/modules/quotes` contiene solo adaptadores de reexportación hacia el módulo canónico;
- `/api/crm/quotes` reutiliza exactamente el router de `/api/quotations`;
- el alias heredado devuelve `Deprecation: true`, enlaza `/api/quotations` como sucesor y registra uso por método sin cardinalidad por ID.

## Sustituciones compatibles registradas

| Firma | Canónico | Reemplaza |
| --- | --- | --- |
| `GET/POST /quotes` | `quotations` | `advanced` |
| `GET /quotes/:id/invoice-draft` | `quotations` | `evolution` |
| `PUT /quotes/:id` | `quotations` | `evolution`, `advanced` |
| `GET /leads` | `evolution` | `legacy` |
| `POST/PUT /leads...` | `evolution` | `advanced` y/o `legacy` según firma |
| `GET/POST/PUT /opportunities...` | `evolution` | `advanced` y/o `legacy` según firma |
| `POST /activities`, `POST /tasks` | `evolution` | `legacy` |

El objeto `replacements` del código es el registro ejecutable y exhaustivo; esta tabla es su resumen documental.

## Compatibilidad y retiro

- no cambia el contrato HTTP de las cotizaciones;
- consumidores nuevos deben usar `/api/quotations`;
- el alias se mantiene durante una ventana mínima acordada de 30 días;
- puede retirarse cuando su métrica permanezca en cero durante la ventana, se actualice el inventario de consumidores y negocio/operación aprueben el retiro;
- el nombre físico `crm_quotes` puede cambiar en otra migración, sin afectar casos de uso.

## Pruebas previstas y ejecutadas

- unicidad del manifiesto final;
- colisión artificial no declarada bloqueante y mensaje con ambas fuentes;
- sustitución artificial declarada que conserva solo el canónico;
- equivalencia por reutilización del mismo router para ambos prefijos;
- ninguna implementación de `quotations` depende de `quotes`;
- todos los archivos de `quotes` apuntan a `quotations`;
- regresión del módulo, la composición y el arranque de Express.

## Riesgos residuales

| Riesgo | Tratamiento |
| --- | --- |
| Mutación de stacks Express durante la composición | La validación ocurre antes de mutar; mantener una sola composición por proceso y cubrirla con pruebas de arranque |
| Consumidores desconocidos del alias | Métrica y encabezados de deprecación; no retirar sin ventana en cero |
| Tablas físicas conservan el prefijo CRM | Encapsuladas en capa anticorrupción; migración física fuera de alcance |
| Adaptadores CRM avanzados/heredados aún existen | Cada reemplazo es visible y ejecutable; retirarlos por incrementos posteriores |

## Evidencia ejecutada el 2026-09-10

| Comando | Resultado leído |
| --- | --- |
| `npm run check` | Sintaxis válida |
| `npm test` | 100 pruebas aprobadas, 0 fallos |
| `npm audit --omit=dev` | 5 vulnerabilidades moderadas ya registradas como R0-SEC-001; npm no reporta fix disponible |
| `git diff --check` | Sin errores; solo avisos no bloqueantes de normalización LF/CRLF |
| Búsqueda de dependencia inversa | Sin referencias desde `src/modules/quotations` hacia `quotes` |

## Gate y estado

- Gate 3: evidencia preparada; requiere aprobación del responsable técnico.
- Gate 4: pendiente de revisión independiente y suite completa en verde.
- Despliegue: no realizado.
