# Turn Lai Long View's run-at-login on or off (ASCII only: Windows PowerShell 5.1 reads scripts as ANSI).
#   tu-chay.ps1        on:  shortcut in the Startup folder, and start it now
#   tu-chay.ps1 -Tat   off: remove the shortcut and stop the background copy
param([switch]$Tat)

$root = Split-Path -Parent $PSScriptRoot
$vbs = Join-Path $PSScriptRoot 'chay-ngam.vbs'
$lnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Lai Long View.lnk'
$url = 'http://127.0.0.1:5173/'

function Test-Running {
  try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2 | Out-Null; return $true } catch { return $false }
}

# The background copy is a hidden cmd running chay-ngam.cmd plus the node server it started.
function Stop-Background {
  $loops = Get-CimInstance Win32_Process -Filter "Name='cmd.exe'" | Where-Object { $_.CommandLine -like '*chay-ngam.cmd*' }
  foreach ($loop in $loops) {
    Get-CimInstance Win32_Process -Filter "ParentProcessId=$($loop.ProcessId)" | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    Stop-Process -Id $loop.ProcessId -Force -ErrorAction SilentlyContinue
  }
  return @($loops).Count
}

if ($Tat) {
  if (Test-Path $lnk) { Remove-Item $lnk -Force }
  $n = Stop-Background
  Write-Host 'Da tat: Lai Long View khong con tu chay khi bat may.'
  if ($n -gt 0) { Write-Host 'Da dung ban dang chay ngam.' }
  exit 0
}

$sh = New-Object -ComObject WScript.Shell
$s = $sh.CreateShortcut($lnk)
$s.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
$s.Arguments = '"' + $vbs + '"'
$s.WorkingDirectory = $root
$s.Description = 'Lai Long View chay ngam tai http://localhost:5173'
$s.Save()
Write-Host 'Da bat: Lai Long View se tu chay ngam moi khi bat may.'

if (Test-Running) {
  Write-Host 'Lai Long View dang chay san tai http://localhost:5173'
  exit 0
}
Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList ('"' + $vbs + '"')
Write-Host 'Dang khoi dong (khoang 10-20 giay)...'
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 1
  if (Test-Running) { Write-Host 'San sang: mo http://localhost:5173'; exit 0 }
}
Write-Host 'Chua thay Lai Long View chay. Xem nhat ky trong data\server.log'
exit 1
