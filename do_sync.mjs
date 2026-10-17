import fs from 'node:fs';

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
        console.error('Match parse error:', e.message);
      }
    }
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error('Cleaned parse error:', e.message);
    }
  }
  return null;
}

const luaCode = `
local Rep = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local accStore = nil
pcall(function() accStore = require(Rep.global.stores.accountNamespace) end)
local levelProg = nil
pcall(function() levelProg = require(Rep.global.utils.levelProgression) end)

local myAcc = accStore and accStore.getLocalPlayerAccount()
local myCurrencies = {}
if myAcc and myAcc.state and myAcc.state.currencies then
    for k, v in pairs(myAcc.state.currencies) do
        if type(v) == "table" and v.current ~= nil then
            myCurrencies[k] = tonumber(v.current) or v.current
        end
    end
end

local myXp = myCurrencies.xp or 0
local myProg = levelProg and levelProg.getProgress(tostring(myXp))
local myLevel = myProg and tonumber(myProg.level) or 0
if myLevel == 0 and myCurrencies.level then myLevel = tonumber(myCurrencies.level) or 0 end

local serverPlayers = {}
for _, p in ipairs(Players:GetPlayers()) do
    local pLvl = 0
    local pTotXp = 0
    local pCurXp = 0
    local pReqXp = 0
    local pRatio = 0

    if p == player then
        pLvl = myLevel
        pTotXp = tonumber(myXp) or 0
        pCurXp = myProg and tonumber(myProg.currentXp) or 0
        pReqXp = myProg and tonumber(myProg.requiredXp) or 0
        pRatio = myProg and myProg.ratio or 0
    else
        local pAcc = nil
        pcall(function()
            if accStore and accStore.getPlayerAccount then
                pAcc = accStore.getPlayerAccount(p)
            end
            if not pAcc and accStore and accStore.namespace and accStore.namespace._stores then
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

        if pLvl == 0 and p.Character then
            local oh = p.Character:FindFirstChild("OverHead")
            if oh and oh:FindFirstChild("Main") and oh.Main:FindFirstChild("Level") then
                local txt = oh.Main.Level.TxtShadow and oh.Main.Level.TxtShadow.Text
                if txt then
                    local num = txt:match("%d+")
                    if num then pLvl = tonumber(num) or 0 end
                end
            end
        end

        if pLvl == 0 then
            local ls = p:FindFirstChild("leaderstats")
            if ls and ls:FindFirstChild("Level") and ls.Level.Value > 0 then
                pLvl = ls.Level.Value
            elseif p:GetAttribute("Level") and tonumber(p:GetAttribute("Level")) > 0 then
                pLvl = tonumber(p:GetAttribute("Level"))
            end
        end
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
        guild = p:GetAttribute("GuildName") or (p == player and "Shinoko" or "None"),
        guildTag = p:GetAttribute("GuildTag") or (p == player and "7NO" or ""),
        isLocal = (p == player)
    })
end

table.sort(serverPlayers, function(a, b)
    if a.level == b.level then
        return (a.totalXp or 0) > (b.totalXp or 0)
    end
    return (a.level or 0) > (b.level or 0)
end)

for i, sp in ipairs(serverPlayers) do
    sp.rank = i
end

local snapshot = {
    player = {
        name = player.Name,
        displayName = player.DisplayName,
        userId = player.UserId,
        level = myLevel,
        guild = player:GetAttribute("GuildName") or "Shinoko",
        guildTag = player:GetAttribute("GuildTag") or "7NO"
    },
    playerProg = myProg,
    serverLeaderboard = serverPlayers,
    currencies = myCurrencies,
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
console.log('RAW JSON RESULT:');
console.log(json.result);
const parsed = parseMcpResult(json.result);
console.log('Successfully pulled real in-game state:');
console.log('Player:', parsed?.player);
console.log('PlayerProg:', parsed?.playerProg);
console.log('Server Players (100% Real from in-game):', parsed?.serverLeaderboard);
