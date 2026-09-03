# Runbook de respaldo y restauración

## Objetivos operativos propuestos

- RPO inicial: 24 horas hasta implementar respaldos incrementales/binlog.
- RTO inicial: 4 horas, sujeto a una prueba cronometrada.
- Retención propuesta: 30 respaldos diarios y 12 respaldos mensuales.

Estos valores son una propuesta y requieren aceptación del propietario según volumen, criticidad y obligaciones fiscales.

## Contenido protegido

El respaldo de MySQL contiene usuarios, maestros, CRM, contactos, cotizaciones y snapshots, pedidos, facturas, cuentas por cobrar, pagos, eventos, auditoría y secretos cifrados. También deben respaldarse por separado `MFA_ENCRYPTION_KEY` y `CONFIG_MASTER_KEY` en un gestor de secretos. Sin esas claves, restaurar la base no permite recuperar TOTP ni credenciales HKA.

## Crear respaldo

Requiere `mysqldump` compatible en `PATH`:

```powershell
./scripts/backup-database.ps1 -Destination D:\respaldos\factura -EnvFile .env
```

El script usa una transacción consistente, incluye rutinas, triggers y eventos, evita exponer la contraseña en la línea de comandos y genera un archivo `.sha256`. El dump y el checksum deben copiarse a almacenamiento cifrado, con acceso restringido y separado del host de aplicación.

## Probar restauración

La prueba siempre debe utilizar una base vacía y aislada; nunca la base de producción:

```powershell
./scripts/restore-database.ps1 -BackupFile D:\respaldos\factura\factura_electronica-AAAAMMDD-HHMMSS.sql -TargetDatabase factura_restore_test -EnvFile .env.restore-test -ConfirmRestore
```

Después:

1. Configurar la aplicación contra `factura_restore_test` sin tráfico externo.
2. Ejecutar `npm run ops:check` con `NODE_ENV=production` y HKA apuntando a un entorno seguro de validación.
3. Comparar conteos de empresas, usuarios, clientes, contactos, artículos, prospectos, oportunidades, cotizaciones, pedidos, facturas, cuentas por cobrar y pagos con el origen.
4. Verificar una muestra del encadenamiento cotización–pedido–factura–cuenta por cobrar, snapshots, payloads fiscales, saldos y capacidad de descifrar secretos.
5. Registrar fecha, duración, checksum, responsable y resultado.
6. Eliminar la copia de prueba mediante el procedimiento autorizado del administrador de base de datos.

## Evidencia de restauración

| Campo | Valor |
|---|---|
| Respaldo/checksum | Pendiente |
| Fecha de prueba | Pendiente |
| Responsable/aprobador | Pendiente |
| Duración/RTO observado | Pendiente |
| Conteos conciliados | Pendiente |
| Secretos descifrables | Pendiente |
| Resultado | Pendiente |
