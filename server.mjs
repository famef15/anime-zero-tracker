import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");
const HTML_FILE = path.join(__dirname, "index.html");
const ICONS_DIR = path.join(__dirname, "icons");
const ICONS_MAP_FILE = path.join(__dirname, "icons_map.json");
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

const PORT = process.env.PORT || 18888;
const MCP_PORT = process.env.MCP_PORT || 16384;
const DASHBOARD_PIN = process.env.DASHBOARD_PIN || "";
const TRACKER_SECRET = process.env.TRACKER_SECRET || "";

// Icon name-to-URL lookup
let iconNameToUrl = {};
try {
  if (fs.existsSync(ICONS_MAP_FILE)) {
    iconNameToUrl = JSON.parse(fs.readFileSync(ICONS_MAP_FILE, "utf-8"));
  }
} catch {}

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
                rarity = (info.Tier == "4" and "Mythic") or (info.Tier == "3" and "Legendary") or (info.Tier == "2" and "Epic") or "Common",
                icon = info.Icon and tostring(info.Icon) or "",
                iconUrl = "/icons/material_" .. tostring(id) .. ".png",
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
                rarity = (info.Tier == "4" and "Mythic") or (info.Tier == "3" and "Legendary") or (info.Tier == "2" and "Epic") or "Common",
                slot = tostring(info.Slot or ""),
                icon = info.Icon and tostring(info.Icon) or "",
                iconUrl = "/icons/accessory_" .. tostring(id) .. ".png",
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

  // CORS & Anti-Cache (Zero delay, pure real-time)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-dashboard-pin, x-tracker-secret");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Dashboard Page
  if (url.pathname === "/" && (req.method === "GET" || req.method === "HEAD")) {
    try {
      const html = fs.readFileSync(HTML_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
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

  // API: Get Icons Mapping
  if (url.pathname === "/api/icons-map" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(iconNameToUrl));
    return;
  }

  // API: Trigger Icon Extraction from Roblox
  if (url.pathname === "/api/extract-icons" && req.method === "POST") {
    extractGameIcons();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, message: "Icon extraction dispatched" }));
    return;
  }

  // API: Save Icon (from in-game exporter)
  if (url.pathname === "/api/save-icon" && req.method === "POST") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
      try {
        const payload = JSON.parse(body);
        const { id, category, name, assetId, b64 } = payload;
        if (b64) {
          const rawB64 = b64.replace(/^data:image\/\w+;base64,/, "");
          const buffer = Buffer.from(rawB64, "base64");
          const filename = `${category}_${id}.bmp`;
          fs.writeFileSync(path.join(ICONS_DIR, filename), buffer);
          if (assetId) {
            fs.writeFileSync(path.join(ICONS_DIR, `${assetId}.bmp`), buffer);
          }
          if (name) {
            iconNameToUrl[name.toLowerCase()] = `/icons/${filename}`;
            fs.writeFileSync(ICONS_MAP_FILE, JSON.stringify(iconNameToUrl, null, 2), "utf-8");
          }
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // Static Icon Serving: /icons/<file> or /api/icon/<id>
  if ((url.pathname.startsWith("/icons/") || url.pathname.startsWith("/api/icon/")) && (req.method === "GET" || req.method === "HEAD")) {
    const rawTarget = url.pathname.replace(/^\/(icons|api\/icon)\//, "");
    const baseTarget = path.basename(rawTarget);
    const noExt = baseTarget.replace(/\.(bmp|png|jpe?g)$/i, "");
    
    // Candidate filenames in priority order (PNG first for crystal-clear alpha transparency)
    const candidates = [
      `${noExt}.png`,
      `material_${noExt}.png`,
      `accessory_${noExt}.png`,
      `currency_${noExt}.png`,
      `${baseTarget}`,
      `${noExt}.bmp`,
      `material_${noExt}.bmp`,
      `accessory_${noExt}.bmp`,
      `currency_${noExt}.bmp`
    ];

    let foundFile = null;
    for (const c of candidates) {
      const p = path.join(ICONS_DIR, c);
      if (fs.existsSync(p) && fs.statSync(p).isFile()) {
        foundFile = p;
        break;
      }
    }

    if (foundFile) {
      const ext = path.extname(foundFile).toLowerCase();
      const mime = ext === ".png" ? "image/png" : (ext === ".bmp" ? "image/bmp" : "application/octet-stream");
      res.writeHead(200, {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable"
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(foundFile).pipe(res);
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Icon Not Found");
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
  if (payload.live) {
    state.live = payload.live;
  }

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

async function extractGameIcons() {
  const existing = fs.readdirSync(ICONS_DIR).filter(f => f.endsWith(".bmp"));
  if (existing.length >= 45) {
    console.log(`[Icons] Cache ready with ${existing.length} item icons.`);
    return;
  }

  console.log("[Icons] Dispatching real in-game item texture extractor to Roblox...");
  const luaCode = `
    local AssetService = game:GetService("AssetService")
    local Rep = game:GetService("ReplicatedStorage")
    local matConfig = require(Rep.assets.config.materialConfig)
    local accConfig = require(Rep.assets.config.accessoryConfig)
    local req = (syn and syn.request) or (http and http.request) or http_request or request

    local function extractAndSend(id, category, name, assetId)
      if not assetId or assetId == "" then return end
      local ok, res = pcall(function()
        return AssetService:CreateEditableImageAsync(Content.fromUri("rbxassetid://" .. tostring(assetId)))
      end)
      if not ok or not res then return end

      local srcW = res.Size.X
      local srcH = res.Size.Y
      local srcBuf = res:ReadPixelsBuffer(Vector2.zero, res.Size)
      res:Destroy()

      local targetW = 96
      local targetH = 96
      local stepX = srcW / targetW
      local stepY = srcH / targetH
      local pixelDataSize = targetW * targetH * 4
      local fileSize = 54 + pixelDataSize
      local outBuf = buffer.create(fileSize)

      buffer.writeu8(outBuf, 0, 0x42)
      buffer.writeu8(outBuf, 1, 0x4D)
      buffer.writeu32(outBuf, 2, fileSize)
      buffer.writeu32(outBuf, 6, 0)
      buffer.writeu32(outBuf, 10, 54)

      buffer.writeu32(outBuf, 14, 40)
      buffer.writei32(outBuf, 18, targetW)
      buffer.writei32(outBuf, 22, -targetH)
      buffer.writeu16(outBuf, 26, 1)
      buffer.writeu16(outBuf, 28, 32)
      buffer.writeu32(outBuf, 30, 0)
      buffer.writeu32(outBuf, 34, pixelDataSize)
      buffer.writei32(outBuf, 38, 2835)
      buffer.writei32(outBuf, 42, 2835)
      buffer.writeu32(outBuf, 46, 0)
      buffer.writeu32(outBuf, 50, 0)

      local dstPos = 54
      for y = 0, targetH - 1 do
        local srcY = math.floor(y * stepY)
        for x = 0, targetW - 1 do
          local srcX = math.floor(x * stepX)
          local srcIdx = (srcY * srcW + srcX) * 4
          buffer.writeu8(outBuf, dstPos, buffer.readu8(srcBuf, srcIdx + 2))
          buffer.writeu8(outBuf, dstPos + 1, buffer.readu8(srcBuf, srcIdx + 1))
          buffer.writeu8(outBuf, dstPos + 2, buffer.readu8(srcBuf, srcIdx))
          buffer.writeu8(outBuf, dstPos + 3, buffer.readu8(srcBuf, srcIdx + 3))
          dstPos = dstPos + 4
        end
      end

      local b64 = (crypt and crypt.base64encode) or base64_encode or (syn and syn.crypt.base64.encode)
      local b64Str = b64(buffer.tostring(outBuf))

      if req then
        req({
          Url = "http://127.0.0.1:${PORT}/api/save-icon",
          Method = "POST",
          Headers = { ["Content-Type"] = "application/json" },
          Body = game:GetService("HttpService"):JSONEncode({
            id = tostring(id),
            category = category,
            name = name,
            assetId = tostring(assetId),
            b64 = b64Str
          })
        })
      end
      task.wait(0.04)
    end

    task.spawn(function()
      for id, info in pairs(matConfig) do
        if info.Icon then
          extractAndSend(id, "material", info.Name or info.name, info.Icon)
        end
      end
      for id, info in pairs(accConfig) do
        if info.Icon then
          extractAndSend(id, "accessory", info.Name or info.name, info.Icon)
        end
      end
      print("[AZ Tracker] All real in-game textures extracted & sent to server!")
    end)
  `;

  try {
    await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "execute", code: luaCode }),
      signal: AbortSignal.timeout(8000)
    });
  } catch (err) {
    console.error("[Icons] Error sending extract script to Roblox:", err.message);
  }
}

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[Dashboard] Anime Zero Tracker running at http://localhost:${PORT}/`);
  pullFromRoblox().then(data => {
    if (data) {
      applySnapshot(data);
      console.log(`[Dashboard] Initial snapshot synced with characters and EXP!`);
    }
  });
  extractGameIcons();
});
