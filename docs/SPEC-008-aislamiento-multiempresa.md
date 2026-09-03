# SPEC-008 — Aislamiento multiempresa

## Objetivo

Garantizar que toda operación de CORE Smart se ejecute dentro de una empresa activa y que conocer identificadores de otra organización no permita leer ni modificar sus datos.

## Modelo

- `tenants`: frontera comercial superior.
- `companies`: frontera de datos operativos y configuración.
- `company_memberships`: relación usuario–empresa con rol y estado propios.
- Un usuario puede pertenecer a varias empresas y selecciona una empresa activa en su sesión.

## Autenticación y cambio de empresa

1. El inicio de sesión selecciona la primera membresía activa disponible.
2. `requireAuth` revalida en cada petición usuario, membresía, empresa y tenant.
3. `GET /api/auth/companies` lista únicamente las membresías activas del usuario.
4. `POST /api/auth/company` rechaza empresas sin membresía y rota el contexto activo.
5. Cambiar a una empresa donde el rol es administrador invalida la verificación MFA previa.

## Datos aislados

`company_id` es obligatorio para clientes, contactos, artículos, prospectos, oportunidades, actividades, tareas, cotizaciones, pedidos, facturas, cuentas por cobrar, pagos, secuencias comerciales y fiscales, eventos, configuración HKA y secretos. La auditoría conserva también la empresa de la acción.

Las operaciones de lista, lectura por ID, actualización, conversión, asociación, importación, detección de coincidencias, emisión, cobranza y reconciliación fiscal incluyen la empresa activa en su consulta.

La caché de autenticación HKA mantiene un token independiente por empresa.

## Migración

`npm run db:init` crea un tenant y empresa iniciales, asigna los usuarios mediante membresías y vincula los datos preexistentes a esa empresa. También reemplaza unicidades globales por claves compuestas con `company_id`.

La migración modifica claves e índices; exige respaldo verificado antes de ejecutarse sobre una base con datos reales.

## Pruebas

- El esquema debe contener tenants, empresas, membresías y `company_id` en recursos sensibles.
- Las consultas operativas no pueden usar búsquedas globales conocidas.
- La configuración fiscal debe rechazar llamadas sin contexto empresarial.
- Una relación comercial no puede apuntar a un cliente, contacto, prospecto u oportunidad de otra empresa.
- Una cuenta por cobrar y sus pagos deben compartir la empresa de la factura.

## Administración

Los administradores disponen de **Empresas y acceso**:

- pueden crear empresas dentro del tenant actual y reciben automáticamente la membresía administrativa inicial;
- pueden listar empresas del tenant;
- administran membresías solamente sobre la empresa activa;
- agregan por correo usuarios activos ya existentes;
- pueden cambiar rol y estado;
- no pueden suspender o degradar al último administrador activo.

La creación de credenciales de usuario y las invitaciones continúan fuera de este alcance.
