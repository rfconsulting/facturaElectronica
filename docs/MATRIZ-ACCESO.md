# Matriz de acceso vigente

Leyenda: **L** lectura, **C** crear/operar, **A** aprobar o administrar, **—** denegado. Superusuario es una capacidad global adicional a la membresía.

| Módulo / acción | Superusuario | Administrador | Contador | Operador |
|---|---:|---:|---:|---:|
| Cambiar entre empresas asignadas | L | L | L | L |
| Crear empresas / gestionar administradores | A | — | — | — |
| Usuarios de la empresa | A | A | — | — |
| Configuración HKA y correlativos | A | A | — | — |
| Importar clientes o artículos | A | A | — | — |
| Consultar y mantener clientes/artículos | C | C | C | C |
| CRM: prospectos, contactos, oportunidades, tareas y actividades | C | C | C | C |
| Automatizaciones CRM | A | A | — | — |
| Cotizaciones: leer, crear, editar, enviar y convertir | C | C | C | C |
| Aprobar cotización (`approved`) | A | A | A | — |
| Pedidos: consultar y preparar factura | C | C | C | C |
| Facturas: emitir, consultar y reconciliar | C | C | C | C |
| POS | C | C | C | C |
| Cuentas por cobrar: consultar | L | L | L | L |
| Registrar pagos | C | C | C | — |
| Métricas internas | Token independiente | Token independiente | Token independiente | Token independiente |

## Controles ejecutables

- `requireAdministrator` protege configuración, usuarios, importaciones y automatizaciones.
- `requireRoles('administrator','accountant')` protege aprobación de cotizaciones y registro de pagos; superusuario siempre satisface el control.
- Sesión, MFA y empresa activa se verifican antes de los controles de rol.
- Las pruebas `role-permissions.test.js` cubren autorización positiva y negativa.

## Deuda conocida

Emisión fiscal, edición de maestros y operación CRM siguen compartidas por Contador y Operador porque ambos participan en la operación actual. Separarlas requiere perfiles configurables y migración de UI; cualquier ampliación debe actualizar esta matriz y sus pruebas.
