
const DEFAULT_GLOBAL_LEADERBOARD = [];

const FAKE_MOCK_NAMES = new Set([
  'shadow_reaper99', 'kuroko_strike', 'ryu_demon7', 'zero_slayer', 'zenith_blade', 'phantom_jin',
  'blaze_hunter', 'frost_monarch', 'valkyrie_x', 'nexus_warlord', 'tempest_kai', 'crimson_fang',
  'viper_strike', 'abyssal_rex', 'solaris_prime', 'hyperion_zero', 'dread_knight', 'astral_weaver',
  'void_walker9', 'lunar_eclipse', 'titan_breaker', 'blood_scythe', 'storm_caller', 'venom_edge',
  'aurora_borealis', 'glacier_fang', 'pyro_maniac', 'omega_pulse', 'celestial_arc', 'iron_claws',
  'shadow_step', 'raiden_blade', 'ember_soul', 'zen_master', 'nova_burst', 'draco_rex',
  'silent_assassin', 'chaos_bringer', 'abyss_walker', 'flame_heart', 'frost_bite', 'lunar_blade',
  'apex_predator', 'spirit_wolf', 'dark_matter', 'crimson_tide', 'solar_flare', 'void_whisper',
  'phantom_blade'
]);
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

// Ensure icons directory and unpack bundle if needed
const ICONS_DIR = path.join(__dirname, "icons");
const BUNDLE_FILE = path.join(__dirname, "icons_bundle.json");
if (!fs.existsSync(ICONS_DIR)) {
  try { fs.mkdirSync(ICONS_DIR, { recursive: true }); } catch {}
}
if (fs.existsSync(BUNDLE_FILE)) {
  try {
    const bundle = JSON.parse(fs.readFileSync(BUNDLE_FILE, "utf-8"));
    for (const [filename, b64] of Object.entries(bundle)) {
      const target = path.join(ICONS_DIR, filename);
      if (!fs.existsSync(target)) {
        fs.writeFileSync(target, Buffer.from(b64, "base64"));
      }
    }
  } catch (e) {
    console.error("Failed to unpack icons_bundle.json:", e.message);
  }
}

// Default initial state
let state = {
  player: {
    name: "Liesajsor17919",
    displayName: "フレーム",
    userId: 9165405454,
    level: 456,
    guild: "Shinoko"
  },
  playerProg: {
    level: 456,
    currentXp: 321007,
    requiredXp: 445593,
    ratio: 0.72,
    totalXp: "55987056"
  },
  characters: [],
  serverLeaderboard: [],
  globalLeaderboard: [...DEFAULT_GLOBAL_LEADERBOARD],
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

// Function to keep Global Leaderboard synchronized with live player and server players
function syncGlobalLeaderboard() {
  if (!state.globalLeaderboard || !Array.isArray(state.globalLeaderboard)) {
    state.globalLeaderboard = [];
  }

  const p = state.player;
  const prog = state.playerProg;
  if (!p) return;

  const currentLevel = Number(prog?.level || p.level || 0);
  const currentTotalXp = Number(prog?.totalXp || 0);

  // Update or insert current user into global leaderboard
  let userFound = false;
  for (const entry of state.globalLeaderboard) {
    if (entry.isLocal || (p.userId && entry.userId === p.userId) || entry.name === p.name) {
      entry.level = currentLevel;
      if (currentTotalXp > 0) entry.totalXp = currentTotalXp;
      entry.name = p.name || entry.name;
      entry.displayName = p.displayName || entry.displayName;
      entry.guild = p.guild || entry.guild;
      entry.guildTag = p.guildTag || entry.guildTag;
      entry.avatarUrl = p.avatarUrl || entry.avatarUrl;
      entry.isLocal = true;
      userFound = true;
      break;
    }
  }

  if (!userFound && p.name) {
    state.globalLeaderboard.push({
      rank: 1,
      name: p.name,
      displayName: p.displayName || p.name,
      level: currentLevel,
      totalXp: currentTotalXp,
      guild: p.guild || "Shinoko",
      guildTag: p.guildTag || "7NO",
      userId: p.userId || 9165405454,
      isLocal: true,
      avatarUrl: p.avatarUrl || `https://www.roblox.com/headshot-thumbnail/image?userId=${p.userId}&width=150&height=150&format=png`
    });
  }

  // Integrate real server players into global leaderboard if they have higher or valid levels
  if (state.serverLeaderboard && Array.isArray(state.serverLeaderboard)) {
    for (const sp of state.serverLeaderboard) {
      if (!sp.name || FAKE_MOCK_NAMES.has(sp.name)) continue;
      const existing = state.globalLeaderboard.find(e => (sp.userId && e.userId === sp.userId) || e.name === sp.name);
      if (existing) {
        if ((sp.level || 0) > (existing.level || 0)) {
          existing.level = sp.level;
          existing.totalXp = sp.totalXp || existing.totalXp;
        }
        if (sp.displayName) existing.displayName = sp.displayName;
        if (sp.guild && sp.guild !== 'None') existing.guild = sp.guild;
        if (sp.guildTag) existing.guildTag = sp.guildTag;
        if (sp.avatarUrl && !existing.avatarUrl) existing.avatarUrl = sp.avatarUrl;
      } else if (sp.level && sp.level > 0) {
        state.globalLeaderboard.push({
          rank: 99,
          name: sp.name,
          displayName: sp.displayName || sp.name,
          level: sp.level,
          totalXp: sp.totalXp || 0,
          guild: sp.guild || 'Shinoko',
          guildTag: sp.guildTag || '',
          userId: sp.userId,
          isLocal: !!sp.isLocal,
          avatarUrl: sp.avatarUrl || (sp.userId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${sp.userId}&width=150&height=150&format=png` : '')
        });
      }
    }
  }

  // Remove any leftover mock fake names
  state.globalLeaderboard = state.globalLeaderboard.filter(e => !FAKE_MOCK_NAMES.has(e.name));
  if (state.serverLeaderboard && Array.isArray(state.serverLeaderboard)) {
    state.serverLeaderboard = state.serverLeaderboard.filter(e => !FAKE_MOCK_NAMES.has(e.name));
  }

  // Re-sort globalLeaderboard by Level DESC, then totalXp DESC
  state.globalLeaderboard.sort((a, b) => {
    const lvlDiff = (Number(b.level) || 0) - (Number(a.level) || 0);
    if (lvlDiff !== 0) return lvlDiff;
    return (Number(b.totalXp) || 0) - (Number(a.totalXp) || 0);
  });

  // Re-index ranks 1..N
  state.globalLeaderboard.forEach((e, idx) => {
    e.rank = idx + 1;
  });
}

// Load persistent data
try {
  if (fs.existsSync(DATA_FILE)) {
    let raw = fs.readFileSync(DATA_FILE, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const loaded = JSON.parse(raw);
    state = { ...state, ...loaded, connected: false };
    if (!state.globalLeaderboard || state.globalLeaderboard.length === 0) state.globalLeaderboard = [...DEFAULT_GLOBAL_LEADERBOARD];
    if (!state.serverLeaderboard) state.serverLeaderboard = [];
    syncGlobalLeaderboard();
    
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

    // Initialize Multi-User Store
    if (!state.users || typeof state.users !== "object") {
      state.users = {};
    }
    if (state.player && (state.player.userId || state.player.name)) {
      const defaultUid = String(state.player.userId || state.player.name);
      if (!state.users[defaultUid]) {
        state.users[defaultUid] = {
          player: { ...state.player },
          playerProg: state.playerProg || {},
          characters: state.characters || [],
          currencies: state.currencies || {},
          materials: state.materials || {},
          accessories: state.accessories || {},
          matchLogs: state.matchLogs || [],
          latestMatch: state.latestMatch || null,
          sessionStats: state.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 },
          lastUpdated: state.lastUpdated || Math.floor(Date.now() / 1000),
          connected: state.connected || false
        };
      }
      state.lastActiveUserId = defaultUid;
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

-- Scan all players in server for real-time Server Leaderboard
local serverPlayers = {}
for _, p in ipairs(game:GetService("Players"):GetPlayers()) do
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
    materials = materials,
    accessories = accessories,
    timestamp = os.time()
}

local req = request or http_request or (syn and syn.request)
if req then
    pcall(function()
        req({
            Url = "http://localhost:18888/api/report",
            Method = "POST",
            Headers = { ["Content-Type"] = "application/json" },
            Body = HttpService:JSONEncode(snapshot)
        })
    end)
end
`;

  try {
    const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/tool`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "execute", code: luaCode }),
      signal: AbortSignal.timeout(8000)
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

function parseMcpResult(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  if (typeof raw === "string") {
    const match = raw.match(/^\{\"([\s\S]*)\",n=\d+\}$/);
    if (match) {
      try {
        const unescaped = match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        return JSON.parse(unescaped);
      } catch (e) {}
    }
    try {
      return JSON.parse(raw);
    } catch {}
  }
  return null;
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

  // Static Icons Route
  if (url.pathname.startsWith("/icons/") && (req.method === "GET" || req.method === "HEAD")) {
    const filename = path.basename(url.pathname);
    const iconPath = path.join(__dirname, "icons", filename);
    if (fs.existsSync(iconPath)) {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=604800, immutable"
      });
      if (req.method === "HEAD") {
        res.end();
        return;
      }
      fs.createReadStream(iconPath).pipe(res);
      return;
    }
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Icon Not Found");
    return;
  }

  // Download Deployment ZIP Routes (Clean & OBF)
  if ((url.pathname === "/cfame-tracker-clean.zip" || url.pathname === "/cfame-tracker-deploy.zip" || url.pathname === "/download-zip") && req.method === "GET") {
    const zipPath = path.join(__dirname, "cfame-tracker-deploy.zip");
    if (fs.existsSync(zipPath)) {
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="cfame-tracker-clean.zip"'
      });
      fs.createReadStream(zipPath).pipe(res);
      return;
    }
  }
  if ((url.pathname === "/cfame-tracker-obf.zip" || url.pathname === "/download-obf") && req.method === "GET") {
    const zipPath = path.join(__dirname, "cfame-tracker-obf.zip");
    if (fs.existsSync(zipPath)) {
      res.writeHead(200, {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="cfame-tracker-obf.zip"'
      });
      fs.createReadStream(zipPath).pipe(res);
      return;
    }
  }

  // Download Luau Scripts
  if (url.pathname === "/tracker.luau" && req.method === "GET") {
    const p = path.join(__dirname, "tracker.luau");
    if (fs.existsSync(p)) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      fs.createReadStream(p).pipe(res);
      return;
    }
  }
  if (url.pathname === "/tracker.obf.luau" && req.method === "GET") {
    const p = path.join(__dirname, "tracker.obf.luau");
    if (fs.existsSync(p)) {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      fs.createReadStream(p).pipe(res);
      return;
    }
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

  // API: Get State (Multi-User)
  if (url.pathname === "/api/data" && req.method === "GET") {
    const pin = req.headers["x-dashboard-pin"] || url.searchParams.get("pin");
    if (DASHBOARD_PIN && pin !== DASHBOARD_PIN) {
      res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ locked: true, requirePin: true, error: "Unauthorized" }));
      return;
    }

    const target = url.searchParams.get("u") || url.searchParams.get("user") || url.searchParams.get("id");
    let foundUser = null;

    if (target && state.users) {
      const targetLower = target.trim().toLowerCase();
      for (const [uid, u] of Object.entries(state.users)) {
        if (
          uid.toLowerCase() === targetLower ||
          (u.player?.userId && String(u.player.userId) === target.trim()) ||
          (u.player?.name && u.player.name.toLowerCase() === targetLower) ||
          (u.player?.displayName && u.player.displayName.toLowerCase() === targetLower)
        ) {
          foundUser = u;
          break;
        }
      }
    }

    if (!foundUser && state.users) {
      if (state.lastActiveUserId && state.users[state.lastActiveUserId]) {
        foundUser = state.users[state.lastActiveUserId];
      } else {
        const firstKey = Object.keys(state.users)[0];
        if (firstKey) foundUser = state.users[firstKey];
      }
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const activeUsersList = Object.values(state.users || {}).map(u => ({
      userId: u.player?.userId,
      name: u.player?.name || "Player",
      displayName: u.player?.displayName || u.player?.name || "Player",
      avatarUrl: u.player?.avatarUrl || (u.player?.userId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${u.player.userId}&width=150&height=150&format=png` : ''),
      level: u.playerProg?.level || u.player?.level || 1,
      guild: u.player?.guild || "None",
      lastUpdated: u.lastUpdated || 0,
      connected: (nowSec - (u.lastUpdated || 0)) < 45
    }));

    const responseData = foundUser ? {
      ...foundUser,
      activeUsers: activeUsersList,
      serverLeaderboard: state.serverLeaderboard || [],
      globalLeaderboard: state.globalLeaderboard || []
    } : {
      ...state,
      activeUsers: activeUsersList
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(responseData));
    return;
  }

  // API: Get All Active Users
  if (url.pathname === "/api/users" && req.method === "GET") {
    const nowSec = Math.floor(Date.now() / 1000);
    const activeUsersList = Object.values(state.users || {}).map(u => ({
      userId: u.player?.userId,
      name: u.player?.name || "Player",
      displayName: u.player?.displayName || u.player?.name || "Player",
      avatarUrl: u.player?.avatarUrl || (u.player?.userId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${u.player.userId}&width=150&height=150&format=png` : ''),
      level: u.playerProg?.level || u.player?.level || 1,
      guild: u.player?.guild || "None",
      lastUpdated: u.lastUpdated || 0,
      connected: (nowSec - (u.lastUpdated || 0)) < 45
    }));
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(activeUsersList));
    return;
  }

  // API: Sync Now
  if (url.pathname === "/api/sync" && req.method === "POST") {
    await pullFromRoblox();
    await new Promise(r => setTimeout(r, 400));
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, state }));
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

        // Auto-forward to Render Cloud if running on local server
        const cloudUrl = process.env.CLOUD_FORWARD_URL || "https://anime-zero-tracker.onrender.com/api/report";
        if (!process.env.RENDER && cloudUrl) {
          fetch(cloudUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body
          }).catch(() => {});
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

  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

function applySnapshot(data) {
  if (!data) return;
  const d = Array.isArray(data) ? data[0] : data;
  if (!d) return;
  applyReport(d);
}

function applyReport(payload) {
  if (!payload) return;
  const p = payload.player || {};
  const uid = String(p.userId || p.name || state.lastActiveUserId || "default");

  if (!state.users) state.users = {};
  if (!state.users[uid]) {
    state.users[uid] = {
      player: {
        name: p.name || "Player",
        displayName: p.displayName || p.name || "Player",
        userId: p.userId,
        level: Number(payload.playerProg?.level || p.level || 1),
        guild: p.guild || "None",
        guildTag: p.guildTag || "",
        avatarUrl: p.avatarUrl || (p.userId ? `https://www.roblox.com/headshot-thumbnail/image?userId=${p.userId}&width=150&height=150&format=png` : '')
      },
      playerProg: payload.playerProg || {},
      characters: payload.characters || [],
      currencies: payload.currencies || {},
      materials: payload.materials || {},
      accessories: payload.accessories || {},
      matchLogs: [],
      latestMatch: payload.latestMatch || null,
      sessionStats: { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 },
      lastUpdated: Math.floor(Date.now() / 1000),
      connected: true
    };
  }

  const u = state.users[uid];

  if (payload.player) u.player = { ...u.player, ...payload.player };
  if (payload.playerProg) u.playerProg = payload.playerProg;
  if (payload.characters) u.characters = payload.characters;
  if (payload.currencies) u.currencies = payload.currencies;
  if (payload.materials) u.materials = payload.materials;
  if (payload.accessories) u.accessories = payload.accessories;
  if (payload.latestMatch && !u.latestMatch) u.latestMatch = payload.latestMatch;

  // Ensure player.level is valid and synced with progression
  const validLevel = (u.playerProg?.level && Number(u.playerProg.level) > 0)
    ? Number(u.playerProg.level)
    : (u.player?.level && Number(u.player.level) > 0 ? Number(u.player.level) : null);
  if (validLevel && u.player) {
    u.player.level = validLevel;
  }

  if (u.player && u.player.userId && !u.player.avatarUrl) {
    fetchRobloxAvatar(u.player.userId).then(url => {
      if (url && u.player) {
        u.player.avatarUrl = url;
        syncGlobalLeaderboard();
        saveData();
      }
    });
  }

  u.lastUpdated = payload.timestamp || Math.floor(Date.now() / 1000);
  u.connected = true;
  state.lastActiveUserId = uid;

  if (payload.type === "reward_update") {
    if (u.latestMatch && payload.rewards && payload.rewards.length > 0) {
      u.latestMatch.rewards = u.latestMatch.rewards || [];
      for (const r of payload.rewards) {
        if (!u.latestMatch.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
          u.latestMatch.rewards.push(r);
          if (r.name === "Gems") u.sessionStats.gemsGained += r.amount;
          if (r.name === "Money" || r.name === "Gold") u.sessionStats.goldGained += r.amount;
          if (r.category === "material" || r.category === "accessory") u.sessionStats.itemsGained += r.amount;
        }
      }
    }
  }

  if (payload.type === "match_finish" && payload.match) {
    const matchRecord = {
      ...payload.match,
      rewards: payload.rewards || []
    };

    const existing = u.matchLogs.find(m => m.time && m.time === matchRecord.time);
    if (existing) {
      if (matchRecord.rewards && matchRecord.rewards.length > 0) {
        existing.rewards = existing.rewards || [];
        for (const r of matchRecord.rewards) {
          if (!existing.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
            existing.rewards.push(r);
            if (r.name === "Gems") u.sessionStats.gemsGained += r.amount;
            if (r.name === "Money" || r.name === "Gold") u.sessionStats.goldGained += r.amount;
            if (r.category === "material" || r.category === "accessory") u.sessionStats.itemsGained += r.amount;
          }
        }
      }
    } else {
      if (!matchRecord.duration || matchRecord.duration <= 0) {
        if (u.matchLogs.length > 0 && u.matchLogs[0].time && matchRecord.time) {
          const diff = Math.abs(matchRecord.time - u.matchLogs[0].time);
          if (diff > 0 && diff < 1800) {
            matchRecord.duration = diff;
          }
        }
      }

      u.matchLogs.unshift(matchRecord);
      if (u.matchLogs.length > 50) u.matchLogs.pop();
      u.latestMatch = matchRecord;

      u.sessionStats.totalMatches++;
      if (matchRecord.won) u.sessionStats.wins++;
      else u.sessionStats.losses++;

      for (const r of (matchRecord.rewards || [])) {
        if (r.name === "Gems") u.sessionStats.gemsGained += r.amount;
        if (r.name === "Money" || r.name === "Gold") u.sessionStats.goldGained += r.amount;
        if (r.category === "material" || r.category === "accessory") u.sessionStats.itemsGained += r.amount;
      }
    }
  }

  // Also mirror to global state for legacy fallback
  state.player = u.player;
  state.playerProg = u.playerProg;
  state.characters = u.characters;
  state.currencies = u.currencies;
  state.materials = u.materials;
  state.accessories = u.accessories;
  state.matchLogs = u.matchLogs;
  state.latestMatch = u.latestMatch;
  state.sessionStats = u.sessionStats;
  state.lastUpdated = u.lastUpdated;
  state.connected = true;

  if (payload.serverLeaderboard && Array.isArray(payload.serverLeaderboard)) {
    state.serverLeaderboard = payload.serverLeaderboard;
  }

  syncGlobalLeaderboard();
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
