# Modelo mínimo de amenazas

Alcance: autenticación/MFA, emisión fiscal y secretos HKA. Revisión obligatoria cuando cambien identidad, PAC, payload fiscal, cifrado o roles. Responsable y aprobación humana: pendientes de asignación.

| Flujo | Amenaza verificable | Impacto | Controles vigentes | Evidencia/prueba | Riesgo residual |
|---|---|---|---|---|---|
| Sesión | Robo o fijación de sesión | Acceso a empresa y datos | Cookie `HttpOnly`, `SameSite=lax`, `secure` en producción, sesión MySQL, rotación al autenticar, revocación por `auth_version` | SPEC-001 y pruebas HTTP | XSS o host comprometido aún puede operar la sesión |
| Login | Fuerza bruta y enumeración | Toma de cuenta | bcrypt, respuesta homogénea, rate limit | pruebas de validación y configuración de límites | Ataques distribuidos requieren protección perimetral |
| MFA | Omisión o repetición TOTP | Escalada administrativa | MFA obligatorio, límite de intentos, ventana temporal, step-up reciente | SPEC-003 y pruebas MFA | No existen códigos de recuperación |
| Empresa activa | Acceso horizontal | Fuga entre empresas | revalidación de membresía, `company_id` en consultas y relaciones | SPEC-008 y pruebas multiempresa | Una consulta nueva sin filtro sigue siendo riesgo crítico |
| Emisión | Duplicación por reintento | Doble documento fiscal | `Idempotency-Key`, huella de payload, restricción única | pruebas de reintento y conflicto | Operación manual fuera del sistema no se detecta |
| Correlativo | Carrera o reutilización | Inconsistencia fiscal | transacción y `SELECT ... FOR UPDATE`; números no reutilizados | ADR-004 y pruebas de repositorio | Dependencia de integridad MySQL |
| PAC | Timeout después de procesar | Reemisión accidental | estado `uncertain`, reconciliación con `EstadoDocumento` | SPEC-002 y runbook | Indisponibilidad prolongada requiere escalamiento al PAC |
| Payload | Manipulación de importes | Documento incorrecto | validación y recálculo en servidor | pruebas fiscales por tasa | Reglas fiscales aún no implementadas quedan fuera de alcance |
| Secretos HKA | Lectura desde UI, DB o logs | Emisión fraudulenta | campos write-only, cifrado autenticado, claves fuera de DB, logs sin cuerpos/JWT | SPEC-004 y pruebas de cifrado | Host o clave maestra comprometida permite descifrado |
| IA/desarrollo | Inclusión de secretos en prompts o salidas | Exposición externa | política de gobernanza IA, exclusión de `.env`, revisión humana requerida | IA-GOBERNANZA y registro de gates | Evidencia histórica incompleta antes de adoptar la política |

## Criterios de aceptación

- Ninguna prueba negativa devuelve datos de otra empresa.
- Un reintento no reserva otro correlativo ni vuelve a enviar al PAC.
- Ningún endpoint sensible funciona sin sesión, MFA aplicable, CSRF y rol exigido.
- Logs y métricas no contienen cuerpos, JWT, credenciales ni identificadores de alta cardinalidad.
- Toda factura `uncertain` se reconcilia antes de considerar una nueva emisión.
