$browser = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$outDir = "C:\Users\matrw\.gemini\antigravity\brain\d5f89d27-0779-4c84-a5af-635e3d6d8950"

Write-Host "Taking player dashboard screenshot via /u/ route..."
& $browser --headless --disable-gpu "--screenshot=$outDir\private_player_preview.png" --window-size=1400,900 "http://localhost:18888/u/Liesajsor17919"
Start-Sleep -Seconds 2
Write-Host "DONE"
