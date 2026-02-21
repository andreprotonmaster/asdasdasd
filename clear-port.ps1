$conn = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
if ($conn) {
    $procIds = $conn.OwningProcess | Select-Object -Unique
    foreach ($p in $procIds) {
        $proc = Get-Process -Id $p -ErrorAction SilentlyContinue
        Write-Host "Killing $($proc.ProcessName) (PID $p) on port 4000"
        Stop-Process -Id $p -Force
    }
    Write-Host "Port 4000 cleared."
} else {
    Write-Host "Port 4000 is already free."
}
