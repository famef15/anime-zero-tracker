$browser = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$artifactDir = "C:\Users\matrw\.gemini\antigravity\brain\d5f89d27-0779-4c84-a5af-635e3d6d8950"
$tempProfile = "C:\Users\matrw\AppData\Local\Temp\edge_clean_profile"

if (Test-Path $tempProfile) {
    Remove-Item -Recurse -Force $tempProfile -ErrorAction SilentlyContinue
}

$outModal = "$artifactDir\discord_modal_preview.png"
$outHub = "$artifactDir\hub_discord_preview.png"

Write-Host "Capturing Hub Discord preview screenshot (unauthenticated)..."
Start-Process -FilePath $browser -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,950",
    "--user-data-dir=$tempProfile",
    "--virtual-time-budget=2000",
    "--screenshot=$outHub",
    "http://localhost:18888/"
) -Wait -NoNewWindow

Write-Host "Capturing Discord Modal screenshot..."
Start-Process -FilePath $browser -ArgumentList @(
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--window-size=1280,950",
    "--user-data-dir=$tempProfile",
    "--virtual-time-budget=2000",
    "--screenshot=$outModal",
    "http://localhost:18888/?open_discord_auth=1"
) -Wait -NoNewWindow

if (Test-Path $outModal) {
    Write-Host "SUCCESS: Modal screenshot created at $outModal ($( (Get-Item $outModal).Length ) bytes)"
}
if (Test-Path $outHub) {
    Write-Host "SUCCESS: Hub screenshot created at $outHub ($( (Get-Item $outHub).Length ) bytes)"
}
