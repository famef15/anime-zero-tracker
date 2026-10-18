$body = @{
    username = "zerox7_xm"
    displayName = "zerox7"
    roblox = "Liesajsor17919"
} | ConvertTo-Json

$auth = Invoke-RestMethod -Uri "http://127.0.0.1:18888/api/auth/discord/authorize" -Method POST -ContentType "application/json" -Body $body

$data = Invoke-RestMethod -Uri "http://127.0.0.1:18888/api/data" -Headers @{ Authorization = "Bearer $($auth.token)" }
@{
    authenticated = $data.authenticated
    username = $data.accountUser.username
    player = $data.player.name
    level = $data.playerProg.level
    materialsCount = ($data.materials.PSObject.Properties | Measure-Object).Count
    charactersCount = $data.characters.Count
} | ConvertTo-Json
