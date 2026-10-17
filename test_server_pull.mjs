const MCP_PORT = 16384;
const luaCode = `
local Rep = game:GetService('ReplicatedStorage')
local HttpService = game:GetService('HttpService')
local player = game:GetService('Players').LocalPlayer

local serverPlayers = {}
for _, p in ipairs(game:GetService('Players'):GetPlayers()) do
    table.insert(serverPlayers, {
        name = p.Name,
        displayName = p.DisplayName,
        userId = p.UserId,
        isLocal = (p == player)
    })
end

local snapshot = {
    player = { name = player.Name, userId = player.UserId },
    serverLeaderboard = serverPlayers
}
return HttpService:JSONEncode(snapshot)
`;

const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'get-data-by-code', code: luaCode, maxOutputChars: 64000 })
});
const j = await res.json();
console.log('Result type:', typeof j.result);
console.log('Raw:', j.result);

function parseMcpResult(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const match = raw.match(/^\{\"([\s\S]*)\",n=\d+\}$/);
    if (match) {
      try {
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return JSON.parse(unescaped);
      } catch (e) {
        console.error('Parse regex error:', e);
      }
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error('Parse raw error:', e);
    }
  }
  return null;
}

const parsed = parseMcpResult(j.result);
console.log('Parsed:', JSON.stringify(parsed, null, 2));
