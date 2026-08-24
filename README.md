# Factura Electrónica

Aplicación web para administrar clientes y artículos, y emitir facturas electrónicas de Panamá mediante The Factory HKA. Usa Node.js 20, Express 5, MySQL y frontend HTML/CSS/JavaScript sin framework, siguiendo el enfoque técnico de `psicoeducandonos` y un flujo de desarrollo guiado por especificaciones.

## Funcionalidad actual

- Sesiones persistidas en MySQL, bloqueo temporal y auditoría.
- MFA/TOTP obligatorio para administradores y step-up MFA para cambios sensibles.
- Credenciales HKA write-only cifradas con AES-256-GCM.
- Emisión, secuencia fiscal transaccional y reconciliación de estados inciertos.
- Emisión idempotente por empresa para impedir duplicados ante reintentos de red o del navegador.
- Clientes con datos generales, fiscales y personalizados; importación desde Zoho Invoice.
- Productos y servicios importables desde Zoho Inventory sin perder su clasificación.
- Selección y creación rápida de artículos desde la factura.
- Control individual para publicar o retirar productos y servicios del futuro POS.
- POS con catálogo publicado, búsqueda, carrito, cliente, forma de pago y emisión HKA.
- Interfaz responsive con roles administrador, contador y operador.
- Aislamiento multiempresa por tenant, empresa activa y membresía; maestros, facturas, configuración fiscal, secuencias y auditoría se filtran en servidor.
- Pantalla administrativa para crear empresas del tenant y gestionar roles o suspensiones de usuarios existentes en la empresa activa.

## Inicio local

Requisitos: Node.js 20 o superior y MySQL 8 compatible.

1. Copia `.env.example` como `.env` y reemplaza todos los valores de ejemplo.
2. Crea la base indicada por `DB_NAME` y concede permisos mínimos al usuario de aplicación.
3. Ejecuta `npm install`.
4. Ejecuta `npm run db:init`; es idempotente, crea la empresa inicial y migra instalaciones existentes. Realiza un respaldo antes de aplicarlo sobre datos reales.
5. Define `ADMIN_NAME`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`, y ejecuta `npm run create-admin`.
6. Ejecuta `npm run dev` y abre `http://localhost:3000`.

Genera claves diferentes para sesión, MFA y configuración:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

`MFA_ENCRYPTION_KEY` y `CONFIG_MASTER_KEY` deben tener 64 caracteres hexadecimales y nunca ser iguales. Perderlas impide descifrar los secretos asociados.

## Configuración y emisión HKA

El administrador configura ambiente, sucursal, punto fiscal y credenciales desde Configuración. El frontend puede reemplazar credenciales, pero nunca recuperarlas. Las variables `HKA_*` son un fallback de transición; la configuración cifrada en base de datos tiene prioridad.

La emisión actual cubre factura interna (`tipoDocumento=01`, `tipoEmision=01`) con ITBMS de 0%, 7%, 10% y 15%. Admite consumidor final, contribuyente, Gobierno y extranjero. Los consecutivos reservados nunca se reutilizan. Ante estado `uncertain`, usa Consultar estado antes de intentar otra emisión.

Mantén demo hasta completar homologación HKA/DGI, datos del emisor, pruebas fiscales representativas, TLS, respaldo, observabilidad y reversión.

## Importaciones Zoho

Las importaciones requieren administrador, archivo `.xlsx` o `.csv` de hasta 5 MB y confirmación posterior a la vista previa.

- Clientes: hoja `Customer`; duplicados por ID Zoho, correo o RUC. Un registro con RUC/DV pero ubicación incompleta se importa provisionalmente como consumidor final.
- Artículos: hoja `Item`; `goods` se conserva como producto y `service` como servicio. Duplicados por Item ID o SKU. Los precios negativos se rechazan porque los descuentos fiscales deben modelarse explícitamente.

## Verificación

```powershell
npm run check
npm test
npm audit --omit=dev
```

Consulta [docs/INDEX.md](docs/INDEX.md) para el mapa documental y la arquitectura vigente.
