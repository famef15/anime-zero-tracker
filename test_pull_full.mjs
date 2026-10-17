const MCP_PORT = 16384;

function decodeHexEscapes(str) {
  return str.replace(/(?:\\x[0-9A-Fa-f]{2})+/g, (match) => {
    const bytes = [];
    const hexRegex = /\\x([0-9A-Fa-f]{2})/g;
    let m;
    while ((m = hexRegex.exec(match)) !== null) {
      bytes.push(parseInt(m[1], 16));
    }
    return Buffer.from(bytes).toString('utf-8');
  });
}

function parseMcpResult(raw) {
  if (!raw) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw === 'string') {
    const cleaned = decodeHexEscapes(raw);
    const match = cleaned.match(/^\{\"([\s\S]*)\",n=\d+\}$/);
    if (match) {
      try {
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return JSON.parse(unescaped);
      } catch (e) {
        console.error('Match unescaped error:', e);
      }
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Cleaned parse error:', e);
    }
  }
  return null;
}

const luaCode = `
local Rep = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local accStore = require(Rep.global.stores.accountNamespace)
local acc = accStore.getLocalPlayerAccount()
local levelProg = require(Rep.global.utils.levelProgression)
local charRoll = require(Rep.assets.config.characterRollConfig)

local currencies = {}
if acc and acc.state and acc.state.currencies then
    for k, v in pairs(acc.state.currencies) do
        if type(v) == "table" and v.current ~= nil then
            currencies[k] = tonumber(v.current) or v.current
        end
    end
end

local playerXp = currencies.xp or 0
local playerProg = levelProg and levelProg.getProgress(tostring(playerXp))

local serverPlayers = {}
for _, p in ipairs(Players:GetPlayers()) do
    local pLvl = 0
    local pTotXp = 0
    local pCurXp = 0
    local pReqXp = 0
    local pRatio = 0

    local pAcc = nil
    pcall(function()
        if accStore.getPlayerAccount then
            pAcc = accStore.getPlayerAccount(p)
        end
        if not pAcc and accStore.namespace and accStore.namespace._stores then
            pAcc = accStore.namespace._stores[tostring(p.UserId)]
        end
    end)

    if pAcc and pAcc.state and pAcc.state.currencies and pAcc.state.currencies.xp then
        local xpVal = pAcc.state.currencies.xp
        if type(xpVal) == "table" and xpVal.current ~= nil then xpVal = xpVal.current end
        pTotXp = tonumber(xpVal) or 0
        local prog = levelProg and levelProg.getProgress(tostring(xpVal))
        if prog then
            pLvl = tonumber(prog.level) or 0
            pCurXp = tonumber(prog.currentXp) or 0
            pReqXp = tonumber(prog.requiredXp) or 0
            pRatio = prog.ratio or 0
        end
    end

    if pLvl == 0 and p == player and playerProg then
        pLvl = tonumber(playerProg.level) or 0
        pTotXp = tonumber(playerXp) or 0
        pCurXp = tonumber(playerProg.currentXp) or 0
        pReqXp = tonumber(playerProg.requiredXp) or 0
        pRatio = playerProg.ratio or 0
    end

    table.insert(serverPlayers, {
        name = p.Name,
        displayName = p.DisplayName,
        userId = p.UserId,
        level = pLvl,
        totalXp = pTotXp,
        currentXp = pCurXp,
        requiredXp = pReqXp,
        ratio = pRatio,
        guild = p:GetAttribute("GuildName") or "Shinoko",
        guildTag = p:GetAttribute("GuildTag") or "7NO",
        isLocal = (p == player)
    })
end

local snapshot = {
    player = {
        name = player.Name,
        displayName = player.DisplayName,
        userId = player.UserId,
        level = playerProg and tonumber(playerProg.level) or 457,
        guild = player:GetAttribute("GuildName") or "Shinoko",
        guildTag = player:GetAttribute("GuildTag") or "7NO"
    },
    playerProg = playerProg,
    serverLeaderboard = serverPlayers,
    currencies = currencies,
    timestamp = os.time()
}

return HttpService:JSONEncode(snapshot)
`;

const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'get-data-by-code', code: luaCode, maxOutputChars: 64000 })
});

const json = await res.json();
console.log('Result length:', json?.result?.length);
console.log('Result sample:', json?.result);
const parsed = parseMcpResult(json.result);
console.log('Player parsed:', parsed?.player);
console.log('Progression parsed:', parsed?.playerProg);
console.log('Server Players parsed:', parsed?.serverLeaderboard);
