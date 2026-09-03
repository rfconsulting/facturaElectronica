# Runbook de despliegue y reversión

## Alcance

Procedimiento independiente del proveedor para desplegar una versión inmutable de la aplicación detrás de TLS. La plataforma concreta debe ejecutar Node.js 20+, disponer de MySQL 8 compatible y conservar secretos fuera del repositorio.

## Evidencia obligatoria antes de desplegar

- Commit o etiqueta exacta de la versión.
- Revisión humana aprobada.
- `npm ci`, `npm run check`, `npm test` y `npm audit --omit=dev` exitosos.
- Respaldo reciente con checksum y prueba de restauración vigente.
- Variables de producción almacenadas en el gestor de secretos.
- `npm run ops:check` exitoso contra el entorno destino.
- Plan de reversión con versión anterior conocida.
- Revisión del impacto de migraciones sobre etapas CRM, contactos, versiones de cotización, snapshots, pedidos, relaciones fiscales y saldos.
- Expediente de habilitación productiva aprobado antes de configurar el PAC en `production`; demo no produce documentos fiscalmente válidos y producción sí.

## Despliegue

1. Poner el entorno en ventana de cambio y registrar responsable, inicio y versión.
2. Crear un respaldo mediante `scripts/backup-database.ps1` y copiarlo a almacenamiento cifrado separado del servidor.
3. Instalar exactamente el `package-lock.json` aprobado con `npm ci --omit=dev`.
4. Ejecutar `npm run db:init`. Las migraciones deben ser compatibles hacia atrás con la versión anterior.
5. Ejecutar `npm run ops:check`.
6. Iniciar la nueva versión sin habilitar tráfico.
7. Confirmar `GET /api/health/live` y `GET /api/health/ready`.
8. Verificar sin emisión real el tablero ERP, contactos, pipeline, cotizaciones, pedidos y cuentas por cobrar en la empresa activa.
9. Confirmar que un pedido confirmado puede preparar su borrador fiscal sin consumir correlativo ni llamar a HKA.
10. Habilitar tráfico gradualmente y observar errores, latencia, base de datos, facturas `uncertain` e invariantes comerciales.
11. Registrar fin, versión, resultados y enlace a la evidencia.

## Reversión

Revertir la aplicación cuando readiness falle, aumenten sostenidamente los errores 5xx, la base de datos quede degradada o aparezca una anomalía fiscal.

1. Detener tráfico hacia la versión nueva.
2. Conservar logs, identificadores de petición y facturas inciertas; no reenviar documentos.
3. Volver a la versión inmutable anterior.
4. No revertir el esquema si continúa siendo compatible. Las etapas nuevas no deben traducirse automáticamente al pipeline anterior. Si una migración destructiva exigiera restauración, detener el servicio y seguir el runbook de respaldo; esta operación requiere autorización humana.
5. Ejecutar sondas y una verificación funcional sin emitir un documento fiscal real.
6. Reabrir tráfico y documentar el incidente.

## Registro de entrega

| Campo | Evidencia |
|---|---|
| Versión/commit | Pendiente por entrega |
| Responsable y aprobador | Pendiente por entrega |
| Resultado CI | Pendiente por entrega |
| Respaldo y checksum | Pendiente por entrega |
| Resultado `ops:check` | Pendiente por entrega |
| Inicio/fin | Pendiente por entrega |
| Resultado y observaciones | Pendiente por entrega |
