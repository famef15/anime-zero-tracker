import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");
const HTML_FILE = path.join(__dirname, "index.html");
const PORT = process.env.PORT || 18888;
const MCP_PORT = process.env.MCP_PORT || 16384;
const DASHBOARD_PIN = process.env.DASHBOARD_PIN || "";
const TRACKER_SECRET = process.env.TRACKER_SECRET || "";

// Default initial state
let state = {
  player: {
    name: "Liesajsor17919",
    displayName: "フレーム",
    userId: 9165405454,
    level: 438,
    guild: "Shinoko"
  },
  playerProg: {
    level: 438,
    currentXp: 249307,
    requiredXp: 403747,
    ratio: 0.617,
    totalXp: "48166059"
  },
  characters: [],
  currencies: {},
  materials: {},
  accessories: {},
  matchLogs: [],
  sessionStats: {
    totalMatches: 0,
    wins: 0,
    losses: 0,
    gemsGained: 0,
    goldGained: 0,
    itemsGained: 0
  },
  lastUpdated: Math.floor(Date.now() / 1000),
  connected: false
};

// Load persistent data
try {
  if (fs.existsSync(DATA_FILE)) {
    let raw = fs.readFileSync(DATA_FILE, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const loaded = JSON.parse(raw);
    state = { ...state, ...loaded, connected: false };
    
    // Deduplicate matchLogs by time
    if (state.matchLogs && state.matchLogs.length > 0) {
      const seenTimes = new Set();
      state.matchLogs = state.matchLogs.filter(m => {
        if (!m.time) return true;
        if (seenTimes.has(m.time)) return false;
        seenTimes.add(m.time);
        return true;
      });

      // Backfill duration for logs
      for (let i = 0; i < state.matchLogs.length; i++) {
        if (!state.matchLogs[i].duration && i + 1 < state.matchLogs.length) {
          const tCurrent = state.matchLogs[i].time;
          const tNext = state.matchLogs[i + 1].time;
          if (tCurrent && tNext) {
            const diff = Math.abs(tCurrent - tNext);
            if (diff > 0 && diff < 1800) {
              state.matchLogs[i].duration = diff;
            }
          }
        }
      }
    }

    if (!state.latestMatch && state.matchLogs && state.matchLogs.length > 0) {
      state.latestMatch = state.matchLogs[0];
    }
  }
} catch (e) {
  console.error("Failed to read data.json:", e);
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save data.json:", e);
  }
}

async function fetchRobloxAvatar(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const json = await res.json();
      return json.data?.[0]?.imageUrl || null;
    }
  } catch {}
  return null;
}

// Direct state pull from Roblox client via MCP
async function pullFromRoblox() {
  const luaCode = `
local Rep = game:GetService("ReplicatedStorage")
local HttpService = game:GetService("HttpService")
local player = game:GetService("Players").LocalPlayer

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
                tier = tostring(info.Tier or "1"),
                rarity = (info.Tier == "4" and "Legendary") or (info.Tier == "3" and "Epic") or (info.Tier == "2" and "Rare") or "Common",
                description = info.Description or ""
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
                tier = tostring(info.Tier or "1"),
                rarity = (info.Tier == "4" and "Legendary") or (info.Tier == "3" and "Epic") or (info.Tier == "2" and "Rare") or "Common",
                slot = tostring(info.Slot or ""),
                description = info.Description or ""
            }
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

return {
    player = {
        name = player.Name,
        displayName = player.DisplayName,
        userId = player.UserId,
        level = level,
        guild = player:GetAttribute("GuildName") or "None"
    },
    playerProg = playerProg,
    characters = chars,
    currencies = currencies,
    materials = materials,
    accessories = accessories,
    timestamp = os.time()
}
`;

  try {
    const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "get-data-by-code", code: luaCode, maxOutputChars: 32000 }),
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.result;
  } catch (err) {
    return null;
  }
}

// Background status poller & periodic live Roblox sync
let pollerTick = 0;
setInterval(async () => {
  try {
    const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/server-info`, {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      const data = await res.json();
      state.connected = data.activeClients?.length > 0;
    } else {
      state.connected = false;
    }
  } catch {
    state.connected = false;
  }

  // Periodic pull straight from Roblox every 6 seconds to keep Level and EXP in 100% sync
  pollerTick++;
  if (state.connected && pollerTick % 2 === 0) {
    try {
      const snap = await pullFromRoblox();
      if (snap) applySnapshot(snap);
    } catch {}
  }
}, 3000);

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Dashboard Page
  if (url.pathname === "/" && req.method === "GET") {
    try {
      const html = fs.readFileSync(HTML_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error loading index.html: " + err.message);
    }
    return;
  }

  // API: Get State
  if (url.pathname === "/api/data" && req.method === "GET") {
    const pin = req.headers["x-dashboard-pin"] || url.searchParams.get("pin");
    if (DASHBOARD_PIN && pin !== DASHBOARD_PIN) {
      res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ locked: true, requirePin: true, error: "Unauthorized" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(state));
    return;
  }

  // API: Sync Now
  if (url.pathname === "/api/sync" && req.method === "POST") {
    const raw = await pullFromRoblox();
    if (raw) {
      applySnapshot(raw);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, state }));
      return;
    }
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false, error: "Failed to pull from Roblox" }));
    return;
  }

  // API: Report from in-game script
  if (url.pathname === "/api/report" && req.method === "POST") {
    const secret = req.headers["x-tracker-secret"] || url.searchParams.get("secret");
    if (TRACKER_SECRET && secret !== TRACKER_SECRET) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Unauthorized report" }));
      return;
    }
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        applyReport(payload);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

function applySnapshot(data) {
  if (!data) return;
  const d = Array.isArray(data) ? data[0] : data;
  if (!d) return;
  if (d.player) state.player = { ...state.player, ...d.player };
  if (d.playerProg) state.playerProg = d.playerProg;
  if (d.characters) state.characters = d.characters;
  if (d.currencies) state.currencies = d.currencies;
  if (d.materials) state.materials = d.materials;
  if (d.accessories) state.accessories = d.accessories;

  // Ensure player.level is valid and synced with progression
  const validLevel = (state.playerProg?.level && Number(state.playerProg.level) > 0)
    ? Number(state.playerProg.level)
    : (state.player?.level && Number(state.player.level) > 0 ? Number(state.player.level) : null);
  if (validLevel && state.player) {
    state.player.level = validLevel;
  }
  if (state.player && state.player.userId && !state.player.avatarUrl) {
    fetchRobloxAvatar(state.player.userId).then(url => {
      if (url && state.player) {
        state.player.avatarUrl = url;
        saveData();
      }
    });
  }

  state.lastUpdated = d.timestamp || Math.floor(Date.now() / 1000);
  state.connected = true;
  saveData();
}

function applyReport(payload) {
  if (payload.player) state.player = { ...state.player, ...payload.player };
  if (payload.playerProg) state.playerProg = payload.playerProg;
  if (payload.characters) state.characters = payload.characters;
  if (payload.currencies) state.currencies = payload.currencies;
  if (payload.materials) state.materials = payload.materials;
  if (payload.accessories) state.accessories = payload.accessories;

  // Ensure player.level is valid and synced with progression
  const validLevel = (state.playerProg?.level && Number(state.playerProg.level) > 0)
    ? Number(state.playerProg.level)
    : (state.player?.level && Number(state.player.level) > 0 ? Number(state.player.level) : null);
  if (validLevel && state.player) {
    state.player.level = validLevel;
  }

  if (state.player && state.player.userId && !state.player.avatarUrl) {
    fetchRobloxAvatar(state.player.userId).then(url => {
      if (url && state.player) {
        state.player.avatarUrl = url;
        saveData();
      }
    });
  }

  state.lastUpdated = Math.floor(Date.now() / 1000);
  state.connected = true;

  if (payload.type === "reward_update") {
    // If passive reward update arrives and we have latestMatch, append to latestMatch
    if (state.latestMatch && payload.rewards && payload.rewards.length > 0) {
      state.latestMatch.rewards = state.latestMatch.rewards || [];
      for (const r of payload.rewards) {
        if (!state.latestMatch.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
          state.latestMatch.rewards.push(r);
          if (r.name === "Gems") state.sessionStats.gemsGained += r.amount;
          if (r.name === "Money" || r.name === "Gold") state.sessionStats.goldGained += r.amount;
          if (r.category === "material" || r.category === "accessory") state.sessionStats.itemsGained += r.amount;
        }
      }
    }
  }

  if (payload.type === "match_finish" && payload.match) {
    const matchRecord = {
      ...payload.match,
      rewards: payload.rewards || []
    };

    // Check if match with this timestamp is already recorded
    const existing = state.matchLogs.find(m => m.time && m.time === matchRecord.time);
    if (existing) {
      // Merge rewards into existing match without adding duplicate row
      if (matchRecord.rewards && matchRecord.rewards.length > 0) {
        existing.rewards = existing.rewards || [];
        for (const r of matchRecord.rewards) {
          if (!existing.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
            existing.rewards.push(r);
            if (r.name === "Gems") state.sessionStats.gemsGained += r.amount;
            if (r.name === "Money" || r.name === "Gold") state.sessionStats.goldGained += r.amount;
            if (r.category === "material" || r.category === "accessory") state.sessionStats.itemsGained += r.amount;
          }
        }
      }
      saveData();
      return;
    }

    // Calculate duration from previous match if not supplied or invalid
    if (!matchRecord.duration || matchRecord.duration <= 0) {
      if (state.matchLogs.length > 0 && state.matchLogs[0].time && matchRecord.time) {
        const diff = Math.abs(matchRecord.time - state.matchLogs[0].time);
        if (diff > 0 && diff < 1800) {
          matchRecord.duration = diff;
        }
      }
    }

    state.matchLogs.unshift(matchRecord);
    if (state.matchLogs.length > 50) state.matchLogs.pop();
    state.latestMatch = matchRecord;

    state.sessionStats.totalMatches++;
    if (matchRecord.won) state.sessionStats.wins++;
    else state.sessionStats.losses++;

    for (const r of (matchRecord.rewards || [])) {
      if (r.name === "Gems") state.sessionStats.gemsGained += r.amount;
      if (r.name === "Money" || r.name === "Gold") state.sessionStats.goldGained += r.amount;
      if (r.category === "material" || r.category === "accessory") state.sessionStats.itemsGained += r.amount;
    }
  }

  saveData();
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Dashboard] Anime Zero Tracker running at http://localhost:${PORT}/`);
  pullFromRoblox().then(data => {
    if (data) {
      applySnapshot(data);
      console.log(`[Dashboard] Initial snapshot synced with characters and EXP!`);
    }
  });
});
