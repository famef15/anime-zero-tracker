const MCP_PORT = 16384;

const luaCode = `
local Rep = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")
local player = Players.LocalPlayer
local accStore = require(Rep.global.stores.accountNamespace)
local acc = accStore.getLocalPlayerAccount()
local levelProg = require(Rep.global.utils.levelProgression)

local xp = (acc and acc.state and acc.state.currencies and acc.state.currencies.xp) or 0
if type(xp) == "table" and xp.current then xp = xp.current end
local prog = levelProg and levelProg.getProgress(tostring(xp))

local plrs = {}
for _, p in ipairs(Players:GetPlayers()) do
    table.insert(plrs, {
        name = p.Name,
        displayName = p.DisplayName,
        userId = p.UserId,
        level = tonumber(prog.level) or 0
    })
end

return {
    level = tonumber(prog.level) or 0,
    totalXp = tonumber(prog.totalXp) or 0,
    currentXp = tonumber(prog.currentXp) or 0,
    requiredXp = tonumber(prog.requiredXp) or 0,
    players = plrs
}
`;

const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'get-data-by-code', code: luaCode })
});

const json = await res.json();
console.log('Returned:', json.result);
