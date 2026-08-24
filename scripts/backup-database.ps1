param(
  [Parameter(Mandatory=$true)][string]$Destination,
  [string]$EnvFile = '.env'
)
$ErrorActionPreference = 'Stop'

function Read-EnvFile([string]$Path) {
  $values = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)$') { $values[$matches[1]] = $matches[2].Trim() }
  }
  return $values
}

$config = Read-EnvFile $EnvFile
foreach ($key in 'DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD') { if (-not $config[$key]) { throw "Falta $key en $EnvFile" } }
if ($config.DB_NAME -notmatch '^[A-Za-z0-9_]+$') { throw 'DB_NAME contiene caracteres no permitidos.' }
$dumpTool = (Get-Command mysqldump -ErrorAction Stop).Source
$destinationPath = [System.IO.Path]::GetFullPath($Destination)
[System.IO.Directory]::CreateDirectory($destinationPath) | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$dumpPath = Join-Path $destinationPath "$($config.DB_NAME)-$stamp.sql"
$defaultsPath = Join-Path ([System.IO.Path]::GetTempPath()) ("factura-backup-{0}.cnf" -f [guid]::NewGuid())
try {
  if ($config.DB_PASSWORD -match "[`r`n]") { throw 'DB_PASSWORD no puede contener saltos de línea.' }
  "[client]`nhost=$($config.DB_HOST)`nport=$($config.DB_PORT)`nuser=$($config.DB_USER)`npassword=$($config.DB_PASSWORD)" | Set-Content -LiteralPath $defaultsPath -Encoding UTF8
  $process = Start-Process -FilePath $dumpTool -ArgumentList "--defaults-extra-file=$defaultsPath",'--single-transaction','--routines','--triggers','--events','--hex-blob','--set-gtid-purged=OFF',$config.DB_NAME -RedirectStandardOutput $dumpPath -NoNewWindow -Wait -PassThru
  if ($process.ExitCode -ne 0) { throw "mysqldump terminó con código $($process.ExitCode)." }
  if ((Get-Item -LiteralPath $dumpPath).Length -eq 0) { throw 'El respaldo resultó vacío.' }
  $hash = (Get-FileHash -LiteralPath $dumpPath -Algorithm SHA256).Hash.ToLowerInvariant()
  "$hash  $([System.IO.Path]::GetFileName($dumpPath))" | Set-Content -LiteralPath "$dumpPath.sha256" -Encoding ascii
  Write-Output $dumpPath
} finally { Remove-Item -LiteralPath $defaultsPath -Force -ErrorAction SilentlyContinue }
