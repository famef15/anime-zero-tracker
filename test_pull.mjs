const res = await fetch("http://127.0.0.1:16384/api/tool", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "get-data-by-code",
    code: `
local Rep = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local accStore = require(Rep.global.stores.accountNamespace)
local acc = accStore.getLocalPlayerAccount()
local matConfig = require(Rep.assets.config.materialConfig)
local accConfig = require(Rep.assets.config.accessoryConfig)
local levelProg = require(Rep.global.utils.levelProgression)
local charRoll = require(Rep.assets.config.characterRollConfig)

local function getVal(v)
    if type(v) == "table" and v.current ~= nil then return v.current end
    return v
end

-- Currencies
local currencies = {}
if acc.state.currencies then
    for k, v in pairs(acc.state.currencies) do
        if type(v) == "table" and v.current ~= nil then
            currencies[k] = tonumber(v.current) or v.current
        end
    end
end

-- Characters Progression
local chars = {}
if acc.state.CharactersData then
    for charName, charData in pairs(acc.state.CharactersData) do
        if type(charData) == "table" and charData.Progression and charData.Progression.Xp then
            local xpVal = charData.Progression.Xp.current or "0"
            local prog = levelProg.getProgress(xpVal)
            local skills = {}
            if charData.Progression.Skills then
                for sk, sv in pairs(charData.Progression.Skills) do
                    if type(sv) == "number" or (type(sv) == "table" and sv.current) then
                        skills[sk] = type(sv) == "table" and sv.current or sv
                    end
                end
            end
            table.insert(chars, {
                id = charName,
                name = charName:gsub("_", " "):gsub("^%l", string.upper),
                rarity = charRoll.rarityByCharacter[charName] or "Common",
                level = prog and prog.level or 0,
                currentXp = prog and tonumber(prog.currentXp) or 0,
                requiredXp = prog and tonumber(prog.requiredXp) or 100,
                ratio = prog and prog.ratio or 0,
                skills = skills,
                trait = (charData.TraitData and charData.TraitData.Trait) or 0
            })
        end
    end
end
table.sort(chars, function(a, b) return a.level > b.level end)

-- Player Progression
local playerXp = currencies.xp or 0
local playerProg = levelProg.getProgress(tostring(playerXp))

local level = (playerProg and tonumber(playerProg.level) and tonumber(playerProg.level) > 0 and tonumber(playerProg.level)) or 0
if level == 0 then
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats and leaderstats:FindFirstChild("Level") and leaderstats.Level.Value > 0 then
        level = leaderstats.Level.Value
    end
end
if level == 0 and currencies.level then
    level = tonumber(currencies.level) or 0
end

-- Server players scan
local serverPlayers = {}
for _, p in ipairs(Players:GetPlayers()) do
    local pLvl = 0
    local pCurXp = 0
    local pReqXp = 0
    local pTotXp = 0
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
        local prog = levelProg.getProgress(tostring(xpVal))
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

    local gName = p:GetAttribute("GuildName") or "None"
    local gTag = p:GetAttribute("GuildTag") or ""

    table.insert(serverPlayers, {
        name = p.Name,
        displayName = p.DisplayName,
        userId = p.UserId,
        level = pLvl,
        currentXp = pCurXp,
        requiredXp = pReqXp,
        totalXp = pTotXp,
        ratio = pRatio,
        guild = gName,
        guildTag = gTag,
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
        level = level,
        guild = player:GetAttribute("GuildName") or "None",
        guildTag = player:GetAttribute("GuildTag") or ""
    },
    playerProg = playerProg,
    characters = chars,
    serverLeaderboard = serverPlayers,
    currencies = currencies,
    timestamp = os.time()
}

return HttpService:JSONEncode(snapshot)
`,
    maxOutputChars: 64000
  })
});

const json = await res.json();

function parseMcpResult(raw) {
  if (typeof raw !== "string") return raw;
  const match = raw.match(/^\{\"([\s\S]*)\",n=\d+\}$/);
  if (match) {
    const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    return JSON.parse(unescaped);
  }
  return null;
}

const parsed = parseMcpResult(json.result);
console.log("Player:", parsed?.player);
console.log("Progression:", parsed?.playerProg);
console.log("Server Leaderboard:", parsed?.serverLeaderboard);
