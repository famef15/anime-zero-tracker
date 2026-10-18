$browser = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outFile = "C:\Users\matrw\.gemini\antigravity\brain\d5f89d27-0779-4c84-a5af-635e3d6d8950\preview_player_v2.png"

Write-Host "Running Edge headless screenshot..."
Start-Process -FilePath $browser -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1400,1000",
    "--screenshot=$outFile",
    "http://localhost:18888/?u=Liesajsor17919"
) -Wait -NoNewWindow

if (Test-Path $outFile) {
    Write-Host "SUCCESS: File created at $outFile ($( (Get-Item $outFile).Length ) bytes)"
} else {
    Write-Host "FAILED: File not created"
}
