-- ========================================================
-- Anime Zero Match Drops & Inventory Web Tracker
-- Sends real-time drops and inventory updates to http://localhost:18888/
-- ========================================================

local Rep = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local Players = game:GetService("Players")
local player = Players.LocalPlayer

local accStore = require(Rep.global.stores.accountNamespace)
local matConfig = require(Rep.assets.config.materialConfig)
local accConfig = require(Rep.assets.config.accessoryConfig)

local SERVER_URL = "http://localhost:18888/api/report"

local function requestHttp(payload)
    local fn = request or http_request or (syn and syn.request)
    if not fn then return end
    pcall(function()
        fn({
            Url = SERVER_URL,
            Method = "POST",
            Headers = { ["Content-Type"] = "application/json" },
            Body = HttpService:JSONEncode(payload)
        })
    end)
end

local function getVal(v)
    if type(v) == "table" and v.current ~= nil then return v.current end
    return v
end

local function getSnapshot()
    local acc = accStore.getLocalPlayerAccount()
    if not acc or not acc.state then return nil end

    -- Currencies
    local currencies = {}
    if acc.state.currencies then
        for k, v in pairs(acc.state.currencies) do
            if type(v) == "table" and v.current ~= nil then
                currencies[k] = tonumber(v.current) or v.current
            end
        end
    end

    -- Materials
    local materials = {}
    if acc.state.material and acc.state.material.entries then
        for id, v in pairs(acc.state.material.entries) do
            local count = tonumber(getVal(v)) or 0
            if count > 0 then
                local info = matConfig[tonumber(id)] or matConfig[tostring(id)] or {}
                materials[tostring(id)] = {
                    id = tostring(id),
                    name = info.Name or info.name or ("Material " .. id),
                    count = count,
                    rarity = info.Rarity or info.rarity or "Common"
                }
            end
        end
    end

    -- Accessories
    local accessories = {}
    if acc.state.accessory and acc.state.accessory.entries then
        for id, v in pairs(acc.state.accessory.entries) do
            local count = tonumber(getVal(v)) or 0
            if count > 0 then
                local info = accConfig[tonumber(id)] or accConfig[tostring(id)] or {}
                accessories[tostring(id)] = {
                    id = tostring(id),
                    name = info.Name or info.name or ("Accessory " .. id),
                    count = count,
                    rarity = info.Rarity or info.rarity or "Common"
                }
            end
        end
    end

    -- Matches
    local matches = {}
    if acc.state.matchHistory and acc.state.matchHistory.current then
        pcall(function()
            matches = HttpService:JSONDecode(acc.state.matchHistory.current)
        end)
    end

    local level = 0
    local leaderstats = player:FindFirstChild("leaderstats")
    if leaderstats and leaderstats:FindFirstChild("Level") then
        level = leaderstats.Level.Value
    end

    return {
        player = {
            name = player.Name,
            displayName = player.DisplayName,
            userId = player.UserId,
            level = level,
            guild = player:GetAttribute("GuildName") or "None"
        },
        currencies = currencies,
        materials = materials,
        accessories = accessories,
        matches = matches,
        latestMatch = matches[1],
        timestamp = os.time()
    }
end

-- Initialize Tracker
task.spawn(function()
    print("[Tracker] Starting Anime Zero Drop Tracker...")
    local baseline = nil

    -- Wait until account is loaded
    while not baseline do
        baseline = getSnapshot()
        task.wait(1)
    end

    local lastMatchTime = baseline.latestMatch and baseline.latestMatch.time or 0

    -- Send initial state to dashboard
    requestHttp({
        type = "init",
        player = baseline.player,
        currencies = baseline.currencies,
        materials = baseline.materials,
        accessories = baseline.accessories,
        latestMatch = baseline.latestMatch
    })

    print("[Tracker] Baseline recorded. Monitoring for match completions...")

    -- Monitoring Loop
    while task.wait(1.5) do
        local current = getSnapshot()
        if current then
            local currentLatest = current.latestMatch
            local isNewMatch = currentLatest and currentLatest.time and (currentLatest.time > lastMatchTime)

            if isNewMatch then
                lastMatchTime = currentLatest.time
                local rewards = {}

                -- Check Currency differences
                local cDiff = {
                    { key = "gems", name = "Gems", icon = "💎", cat = "currency" },
                    { key = "money", name = "Gold / Money", icon = "🪙", cat = "currency" },
                    { key = "luckySpins", name = "Lucky Spins", icon = "🎲", cat = "currency" },
                    { key = "traitRerolls", name = "Trait Rerolls", icon = "🔄", cat = "currency" },
                    { key = "rolls", name = "Rolls", icon = "📜", cat = "currency" },
                    { key = "xp", name = "XP", icon = "⚡", cat = "currency" }
                }

                for _, item in ipairs(cDiff) do
                    local curVal = tonumber(current.currencies[item.key]) or 0
                    local prevVal = tonumber(baseline.currencies[item.key]) or 0
                    local delta = curVal - prevVal
                    if delta > 0 then
                        table.insert(rewards, {
                            category = item.cat,
                            name = item.name,
                            amount = delta,
                            icon = item.icon
                        })
                    end
                end

                -- Check Materials differences
                for id, curMat in pairs(current.materials) do
                    local prevCount = (baseline.materials[id] and baseline.materials[id].count) or 0
                    local delta = curMat.count - prevCount
                    if delta > 0 then
                        table.insert(rewards, {
                            category = "material",
                            name = curMat.name,
                            amount = delta,
                            rarity = curMat.rarity,
                            icon = "🎒"
                        })
                    end
                end

                -- Check Accessories differences
                for id, curAcc in pairs(current.accessories) do
                    local prevCount = (baseline.accessories[id] and baseline.accessories[id].count) or 0
                    local delta = curAcc.count - prevCount
                    if delta > 0 then
                        table.insert(rewards, {
                            category = "accessory",
                            name = curAcc.name,
                            amount = delta,
                            icon = "👑"
                        })
                    end
                end

                print(string.format("[Tracker] Match Completed! Map: %s, Won: %s, Rewards Count: %d",
                    tostring(currentLatest.map),
                    tostring(currentLatest.won),
                    #rewards
                ))

                -- Send report to web dashboard
                requestHttp({
                    type = "match_finish",
                    player = current.player,
                    match = currentLatest,
                    rewards = rewards,
                    currencies = current.currencies,
                    materials = current.materials,
                    accessories = current.accessories
                })

                -- Update baseline to current after match
                baseline = current
            else
                -- Keep baseline currencies/materials in sync if items were spent in lobby (e.g. rolls/crafts)
                baseline.currencies = current.currencies
                baseline.materials = current.materials
                baseline.accessories = current.accessories
                baseline.player = current.player
            end
        end
    end
end)
