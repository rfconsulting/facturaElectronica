param(
  [Parameter(Mandatory=$true)][string]$BackupFile,
  [Parameter(Mandatory=$true)][string]$TargetDatabase,
  [Parameter(Mandatory=$true)][switch]$ConfirmRestore,
  [string]$EnvFile = '.env'
)
$ErrorActionPreference = 'Stop'
if (-not $ConfirmRestore) { throw 'La restauración requiere -ConfirmRestore.' }
if ($TargetDatabase -notmatch '^[A-Za-z0-9_]+$') { throw 'TargetDatabase contiene caracteres no permitidos.' }
$backupPath = [System.IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $backupPath -PathType Leaf)) { throw 'No existe el archivo de respaldo.' }
$hashPath = "$backupPath.sha256"
if (-not (Test-Path -LiteralPath $hashPath -PathType Leaf)) { throw 'Falta el archivo .sha256 del respaldo.' }
$expectedHash = ((Get-Content -LiteralPath $hashPath -Raw).Trim() -split '\s+')[0].ToLowerInvariant()
$actualHash = (Get-FileHash -LiteralPath $backupPath -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actualHash -ne $expectedHash) { throw 'El checksum SHA-256 del respaldo no coincide.' }

$config = @{}
foreach ($line in Get-Content -LiteralPath $EnvFile) { if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $config[$matches[1]] = $matches[2].Trim() } }
foreach ($key in 'DB_HOST','DB_PORT','DB_USER','DB_PASSWORD') { if (-not $config[$key]) { throw "Falta $key en $EnvFile" } }
$mysqlTool = (Get-Command mysql -ErrorAction Stop).Source
$defaultsPath = Join-Path ([System.IO.Path]::GetTempPath()) ("factura-restore-{0}.cnf" -f [guid]::NewGuid())
try {
  if ($config.DB_PASSWORD -match "[`r`n]") { throw 'DB_PASSWORD no puede contener saltos de línea.' }
  "[client]`nhost=$($config.DB_HOST)`nport=$($config.DB_PORT)`nuser=$($config.DB_USER)`npassword=$($config.DB_PASSWORD)" | Set-Content -LiteralPath $defaultsPath -Encoding UTF8
  $process = Start-Process -FilePath $mysqlTool -ArgumentList "--defaults-extra-file=$defaultsPath",$TargetDatabase -RedirectStandardInput $backupPath -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "mysql terminó con código $($process.ExitCode)." }
  Write-Output "Restauración completada en $TargetDatabase. Ejecuta npm run ops:check con la configuración del entorno restaurado."
} finally { Remove-Item -LiteralPath $defaultsPath -Force -ErrorAction SilentlyContinue }
