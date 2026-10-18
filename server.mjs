// [LISTN] Language: JavaScript (ESM) | File: server.mjs | Runtime: Node.js >= 18
// Dedicated Discord OAuth2 Isolated Cloud Tracker Server for Anime Zero

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "data.json");
const HTML_FILE = path.join(__dirname, "index.html");
const ENV_FILE = path.join(__dirname, ".env");

// Built-in .env parser (zero external dependencies)
if (fs.existsSync(ENV_FILE)) {
  try {
    const envLines = fs.readFileSync(ENV_FILE, "utf-8").split(/\r?\n/);
    for (const line of envLines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  } catch (e) {
    console.error("Failed to parse .env:", e.message);
  }
}

const PORT = process.env.PORT || 18888;
const MCP_PORT = process.env.MCP_PORT || 16384;
const DASHBOARD_PIN = process.env.DASHBOARD_PIN || "";
const TRACKER_SECRET = process.env.TRACKER_SECRET || "";

// Discord OAuth2 App Configuration (Loaded from .env, system environment, or production defaults)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "1561147994416349285";
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "tn9oqgyfI-9_ZqGG6QYN5oZ2iMZXPQKa";
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || "https://anime-zero-tracker.onrender.com/api/auth/discord/callback";

function getDiscordRedirectUri(req) {
  if (req && req.headers && req.headers.host && (req.headers.host.includes("localhost") || req.headers.host.includes("127.0.0.1"))) {
    return `http://${req.headers.host}/api/auth/discord/callback`;
  }
  if (DISCORD_REDIRECT_URI) return DISCORD_REDIRECT_URI;
  const proto = (req && req.headers && req.headers["x-forwarded-proto"]) || "https";
  return `${proto}://${req ? req.headers.host : "anime-zero-tracker.onrender.com"}/api/auth/discord/callback`;
}

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

// Initial state container
let state = {
  player: {
    name: "Liesajsor17919",
    displayName: "フレーム",
    userId: 9165405454,
    level: 457,
    guild: "Shinoko",
    guildTag: "7NO",
    avatarUrl: "/icons/default_avatar.png"
  },
  playerProg: {
    level: 457,
    currentXp: "439462",
    requiredXp: "447979",
    ratio: 0.98,
    totalXp: "56539353"
  },
  characters: [],
  serverLeaderboard: [],
  globalLeaderboard: [],
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
  connected: false,

  // Discord Accounts Store (Isolated per Discord Snowflake ID)
  discordAccounts: {},
  sessions: {},
  // Roblox Multi-User Store
  robloxUsers: {}
};

// Load persistent data
try {
  if (fs.existsSync(DATA_FILE)) {
    let raw = fs.readFileSync(DATA_FILE, "utf-8");
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
    const loaded = JSON.parse(raw);
    state = { ...state, ...loaded, connected: false };

    if (!state.robloxUsers || typeof state.robloxUsers !== "object") {
      state.robloxUsers = {};
    }

    // Seed initial Roblox user from default player if not already present
    if (state.player && (state.player.userId || state.player.name)) {
      const defUid = String(state.player.userId || state.player.name);
      if (!state.robloxUsers[defUid]) {
        state.robloxUsers[defUid] = {
          player: { ...state.player },
          playerProg: state.playerProg || {},
          characters: state.characters || [],
          currencies: state.currencies || {},
          materials: state.materials || {},
          accessories: state.accessories || {},
          matchLogs: (defUid === "9165405454" ? (state.matchLogs || []) : []),
          latestMatch: (defUid === "9165405454" ? (state.latestMatch || null) : null),
          sessionStats: (defUid === "9165405454" ? (state.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 }) : { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 }),
          lastUpdated: state.lastUpdated || Math.floor(Date.now() / 1000)
        };
      }
    }

    if (!state.discordAccounts || typeof state.discordAccounts !== "object") {
      state.discordAccounts = {};
    }
    state.sessions = {};

    // Seed default verified Discord account if empty
    if (Object.keys(state.discordAccounts).length === 0) {
      state.discordAccounts["discord_zerox7"] = {
        id: "discord_zerox7",
        username: "zerox7_xm",
        displayName: "zerox7",
        discordId: "zerox7_xm",
        avatarUrl: "/icons/default_avatar.png",
        apiKey: "key_dc_zerox7_master",
        linkedRoblox: [
          {
            userId: 9165405454,
            name: "Liesajsor17919",
            displayName: "フレーム",
            avatarUrl: "/icons/default_avatar.png"
          }
        ],
        createdAt: Math.floor(Date.now() / 1000)
      };
      saveData();
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

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 3e6) {
        req.destroy();
        reject(new Error("Payload too large"));
      }
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getAuthDiscordUser(req, url) {
  const authHeader = req.headers["authorization"] || "";
  let token = "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  }
  if (!token) {
    token = req.headers["x-auth-token"] || url.searchParams.get("token") || "";
  }
  if (!token) return null;

  if (!state.sessions) state.sessions = {};
  const session = state.sessions[token];
  if (!session) return null;
  if (session.expiresAt && Date.now() > session.expiresAt) {
    delete state.sessions[token];
    return null;
  }

  if (!state.discordAccounts) state.discordAccounts = {};
  const acc = state.discordAccounts[session.accountId];
  return acc || null;
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

async function lookupRobloxUser(identifier) {
  if (!identifier) return null;
  const cleanId = String(identifier).trim();
  try {
    // If numeric userId
    if (/^\d+$/.test(cleanId)) {
      const avatarUrl = await fetchRobloxAvatar(cleanId);
      const res = await fetch(`https://users.roblox.com/v1/users/${cleanId}`, {
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const u = await res.json();
        return {
          userId: u.id,
          name: u.name,
          displayName: u.displayName || u.name,
          avatarUrl: avatarUrl || `/api/avatar?userId=${u.id}`
        };
      }
    }

    // By username
    const res = await fetch("https://users.roblox.com/v1/usernames/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usernames: [cleanId], excludeBannedUsers: false }),
      signal: AbortSignal.timeout(4000)
    });
    if (res.ok) {
      const json = await res.json();
      const u = json.data?.[0];
      if (u) {
        const avatarUrl = await fetchRobloxAvatar(u.id);
        return {
          userId: u.id,
          name: u.name,
          displayName: u.displayName || u.name,
          avatarUrl: avatarUrl || `/api/avatar?userId=${u.id}`
        };
      }
    }
  } catch (e) {
    console.error("Roblox lookup error:", e.message);
  }
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
                rarity = (info.Tier == "4" and "Mythic") or (info.Tier == "3" and "Legendary") or (info.Tier == "2" and "Epic") or "Rare",
                description = info.Description or ""
            }
        end
    end
end

-- Characters
local chars = {}
if acc.state.character and acc.state.character.entries then
    for id, v in pairs(acc.state.character.entries) do
        local cinfo = charRoll.rolls and charRoll.rolls[id] or {}
        local cLvl = tonumber(getVal(v.level)) or 1
        local cCurXp = tonumber(getVal(v.currentXp)) or 0
        local cReqXp = tonumber(getVal(v.requiredXp)) or 1000
        table.insert(chars, {
            id = id,
            name = cinfo.Name or id,
            level = cLvl,
            currentXp = cCurXp,
            requiredXp = cReqXp,
            ratio = math.clamp(cCurXp / math.max(1, cReqXp), 0, 1),
            skills = v.skills or {}
        })
    end
end

-- Player Progression
local level = 0
local playerProg = {}
if acc.state.playerProgression then
    local xpVal = acc.state.playerProgression.currentXp
    if type(xpVal) == "table" and xpVal.current ~= nil then xpVal = xpVal.current end
    local prog = levelProg.getProgress(tostring(xpVal))
    if prog then
        level = tonumber(prog.level) or 0
        playerProg = {
            level = level,
            currentXp = tonumber(prog.currentXp) or 0,
            requiredXp = tonumber(prog.requiredXp) or 0,
            ratio = prog.ratio or 0,
            isMaxLevel = prog.isMaxLevel or false,
            totalXp = tostring(xpVal)
        }
    end
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
    currencies = currencies,
    materials = materials,
    accessories = accessories,
    timestamp = os.time()
}
return HttpService:JSONEncode(snapshot)
`;

  try {
    const res = await fetch(`http://127.0.0.1:${MCP_PORT}/api/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: luaCode }),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      if (data.result) {
        return JSON.parse(data.result);
      }
    }
  } catch {}
  return null;
}

// Background poller
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
}, 3000);

// HTTP Server
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS & Anti-Cache
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-auth-token, x-dashboard-pin, x-tracker-secret");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // HTTPS Enforcement on Render / Cloud Reverse Proxies
  if (process.env.RENDER && req.headers["x-forwarded-proto"] === "http") {
    res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
    res.end();
    return;
  }

  // Cloud Health Check Endpoint
  if ((url.pathname === "/health" || url.pathname === "/api/health") && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", timestamp: Date.now() }));
    return;
  }

  // Static Root Images & Game Assets Route
  if ((url.pathname === "/anime_zero_cover.png" || 
       url.pathname === "/anime_zero_icon.png" || 
       url.pathname === "/user_avatar.png" || 
       url.pathname === "/cover.png" || 
       url.pathname === "/favicon.ico" ||
       (url.pathname.endsWith(".png") && !url.pathname.includes(".."))) && 
      (req.method === "GET" || req.method === "HEAD")) {
    const filename = path.basename(url.pathname);
    const candidatePath = path.join(__dirname, filename);
    const iconCandidatePath = path.join(__dirname, "icons", filename);
    const filePath = fs.existsSync(candidatePath) ? candidatePath : (fs.existsSync(iconCandidatePath) ? iconCandidatePath : null);
    if (filePath) {
      res.writeHead(200, {
        "Content-Type": filename.endsWith(".ico") ? "image/x-icon" : "image/png",
        "Cache-Control": "public, max-age=604800, immutable"
      });
      if (req.method === "HEAD") { res.end(); return; }
      fs.createReadStream(filePath).pipe(res);
      return;
    }
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

  // Roblox Avatar Proxy (CORS, Hotlink & CDN Cache Safe)
  if (url.pathname === "/api/avatar" && (req.method === "GET" || req.method === "HEAD")) {
    const uid = url.searchParams.get("userId") || url.searchParams.get("id") || url.searchParams.get("u");
    if (!uid) {
      res.writeHead(400, { "Content-Type": "text/plain" });
      res.end("Missing userId");
      return;
    }
    try {
      const cdnUrl = await fetchRobloxAvatar(uid);
      if (cdnUrl) {
        const imgRes = await fetch(cdnUrl, { signal: AbortSignal.timeout(4000) });
        if (imgRes.ok) {
          res.writeHead(200, {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800"
          });
          if (req.method === "HEAD") { res.end(); return; }
          const buf = Buffer.from(await imgRes.arrayBuffer());
          res.end(buf);
          return;
        }
      }
    } catch (e) {
      // Offline / sandbox fallback
    }
    // Safe Local Fallback: Always returns HTTP 200 with local avatar PNG (immune to CDN expiry/adblockers)
    const fallbackAvatar = path.join(__dirname, "icons", "default_avatar.png");
    const userAvatar = path.join(__dirname, "user_avatar.png");
    const safePath = fs.existsSync(fallbackAvatar) ? fallbackAvatar : (fs.existsSync(userAvatar) ? userAvatar : null);
    if (safePath) {
      res.writeHead(200, {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400"
      });
      if (req.method === "HEAD") { res.end(); return; }
      fs.createReadStream(safePath).pipe(res);
      return;
    }
    res.writeHead(302, { Location: "/icons/default_avatar.png" });
    res.end();
    return;
  }

  // Luau Scripts Download Routes (Dynamically injected with current host)
  if ((url.pathname === "/tracker.luau" || url.pathname === "/tracker.obf.luau") && req.method === "GET") {
    const filename = url.pathname === "/tracker.obf.luau" ? "tracker.obf.luau" : "tracker.luau";
    const p = path.join(__dirname, filename);
    if (fs.existsSync(p)) {
      const proto = req.headers["x-forwarded-proto"] || (req.headers.host.includes("localhost") || req.headers.host.includes("127.0.0.1") ? "http" : "https");
      const origin = `${proto}://${req.headers.host}`;
      let content = fs.readFileSync(p, "utf-8");
      content = content.replace(/local CLOUD_SERVER_URL = ".*?"/, `local CLOUD_SERVER_URL = "${origin}/api/report"`);
      res.writeHead(200, {
        "Content-Type": "text/plain; charset=utf-8",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(content);
      return;
    }
  }

  // Dashboard Page & Direct Clean User Route
  if ((url.pathname === "/" || url.pathname.startsWith("/u/")) && (req.method === "GET" || req.method === "HEAD")) {
    try {
      const html = fs.readFileSync(HTML_FILE, "utf-8");
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      if (req.method === "HEAD") { res.end(); return; }
      res.end(html);
    } catch (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error loading index.html: " + err.message);
    }
    return;
  }

  // ========================================================
  // DISCORD OAUTH2 AUTHORIZATION API
  // ========================================================

  // Discord Config Status
  if (url.pathname === "/api/auth/discord/status" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      configured: !!(DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET),
      clientId: DISCORD_CLIENT_ID || null
    }));
    return;
  }

  // Discord OAuth2 Login Redirect (Official Flow)
  if (url.pathname === "/api/auth/discord/login" && req.method === "GET") {
    if (DISCORD_CLIENT_ID && DISCORD_CLIENT_SECRET) {
      const redirectUri = getDiscordRedirectUri(req);
      const discordUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&scope=identify`;
      res.writeHead(302, { Location: discordUrl });
      res.end();
      return;
    } else {
      // Local / Dev Fallback: Open interactive Discord Authorize Modal matching reference
      res.writeHead(302, { Location: "/?open_discord_auth=1" });
      res.end();
      return;
    }
  }

  // Discord OAuth2 Callback (Exchange Code with Discord Token Endpoint)
  if (url.pathname === "/api/auth/discord/callback" && req.method === "GET") {
    const code = url.searchParams.get("code");
    if (!code) {
      res.writeHead(302, { Location: "/?auth_error=no_code" });
      res.end();
      return;
    }
    try {
      const redirectUri = getDiscordRedirectUri(req);
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: DISCORD_CLIENT_ID,
          client_secret: DISCORD_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri
        })
      });
      if (!tokenRes.ok) throw new Error("Discord token exchange failed");
      const tokenData = await tokenRes.json();
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      });
      if (!userRes.ok) throw new Error("Discord user profile fetch failed");
      const dUser = await userRes.json();

      const accountId = "discord_" + dUser.id;
      if (!state.discordAccounts) state.discordAccounts = {};
      if (!state.discordAccounts[accountId]) {
        state.discordAccounts[accountId] = {
          id: accountId,
          username: dUser.username,
          displayName: dUser.global_name || dUser.username,
          discordId: dUser.id,
          avatarUrl: dUser.avatar ? `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/0.png`,
          apiKey: "key_dc_" + crypto.randomBytes(16).toString("hex"),
          linkedRoblox: [],
          createdAt: Math.floor(Date.now() / 1000)
        };
      } else {
        state.discordAccounts[accountId].username = dUser.username;
        state.discordAccounts[accountId].displayName = dUser.global_name || dUser.username;
        if (dUser.avatar) {
          state.discordAccounts[accountId].avatarUrl = `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png`;
        }
      }

      const acc = state.discordAccounts[accountId];
      const token = crypto.randomBytes(32).toString("hex");
      if (!state.sessions) state.sessions = {};
      state.sessions[token] = {
        accountId: acc.id,
        username: acc.username,
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000
      };
      saveData();

      res.writeHead(302, { Location: `/?token=${token}&discord_auth=success` });
      res.end();
      return;
    } catch (err) {
      res.writeHead(302, { Location: `/?auth_error=${encodeURIComponent(err.message)}` });
      res.end();
      return;
    }
  }

  // Interactive 1-Click Discord Authorize Modal (Instant Local / Sandbox Auth)
  if (url.pathname === "/api/auth/discord/authorize" && req.method === "POST") {
    try {
      const body = await parseJsonBody(req);
      const discordTag = String(body.username || "zerox7_xm").trim();
      const displayName = String(body.displayName || (discordTag.toLowerCase() === "zerox7_xm" ? "frxmz_.q" : discordTag)).trim();
      const avatarUrl = String(body.avatarUrl || (discordTag.toLowerCase() === "zerox7_xm" ? "https://cdn.discordapp.com/avatars/1107270583093317772/c3a0dec24aebee5fbc5965d2b75d2945.png" : "https://cdn.discordapp.com/embed/avatars/0.png"));
      const robloxUser = String(body.roblox || "").trim();

      const accountId = "discord_" + discordTag.toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (!state.discordAccounts) state.discordAccounts = {};
      if (!state.discordAccounts[accountId]) {
        state.discordAccounts[accountId] = {
          id: accountId,
          username: discordTag,
          displayName: displayName,
          discordId: discordTag,
          avatarUrl: avatarUrl,
          apiKey: "key_dc_" + crypto.randomBytes(16).toString("hex"),
          linkedRoblox: [],
          createdAt: Math.floor(Date.now() / 1000)
        };
      } else {
        if (displayName) state.discordAccounts[accountId].displayName = displayName;
        if (avatarUrl) state.discordAccounts[accountId].avatarUrl = avatarUrl;
      }

      const acc = state.discordAccounts[accountId];

      if (robloxUser) {
        const rbx = await lookupRobloxUser(robloxUser);
        if (rbx) {
          const already = acc.linkedRoblox.some(r => String(r.userId) === String(rbx.userId));
          if (!already) {
            acc.linkedRoblox.push(rbx);
          }
        }
      }



      const token = crypto.randomBytes(32).toString("hex");
      if (!state.sessions) state.sessions = {};
      state.sessions[token] = {
        accountId: acc.id,
        username: acc.username,
        expiresAt: Date.now() + 30 * 24 * 3600 * 1000
      };
      saveData();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        token,
        user: {
          id: acc.id,
          username: acc.username,
          displayName: acc.displayName,
          avatarUrl: acc.avatarUrl,
          linkedRoblox: acc.linkedRoblox,
          apiKey: acc.apiKey
        }
      }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return;
    }
  }

  // Get Current Authenticated Profile
  if (url.pathname === "/api/auth/me" && req.method === "GET") {
    const acc = getAuthDiscordUser(req, url);
    if (!acc) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, authenticated: false, error: "Not logged in" }));
      return;
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      ok: true,
      authenticated: true,
      user: {
        id: acc.id,
        username: acc.username,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        linkedRoblox: acc.linkedRoblox || [],
        apiKey: acc.apiKey
      }
    }));
    return;
  }

  // Link a Roblox Account (Main or Alt)
  if (url.pathname === "/api/auth/link-roblox" && req.method === "POST") {
    const acc = getAuthDiscordUser(req, url);
    if (!acc) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "กรุณาเข้าสู่ระบบด้วย Discord ก่อน" }));
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const target = String(body.roblox || "").trim();
      if (!target) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "กรุณาระบุชื่อ Roblox Username หรือ User ID" }));
        return;
      }

      const rbx = await lookupRobloxUser(target);
      if (!rbx) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: `ไม่พบบัญชี Roblox: "${target}"` }));
        return;
      }

      if (!acc.linkedRoblox) acc.linkedRoblox = [];
      const already = acc.linkedRoblox.some(r => String(r.userId) === String(rbx.userId) || r.name.toLowerCase() === rbx.name.toLowerCase());
      if (!already) {
        acc.linkedRoblox.push({
          userId: rbx.userId,
          name: rbx.name,
          displayName: rbx.displayName,
          avatarUrl: rbx.avatarUrl
        });
      }

      const uid = String(rbx.userId);
      if (!state.robloxUsers[uid]) {
        state.robloxUsers[uid] = {
          player: {
            name: rbx.name,
            displayName: rbx.displayName,
            userId: rbx.userId,
            level: 0,
            guild: "รอสคริปต์ในเกม",
            guildTag: "",
            avatarUrl: rbx.avatarUrl
          },
          playerProg: { level: 0, currentXp: 0, requiredXp: 1, ratio: 0, totalXp: 0 },
          characters: [],
          currencies: { gold: 0, money: 0, gems: 0, rolls: 0, luckySpins: 0, traitRerolls: 0 },
          materials: {},
          accessories: {},
          matchLogs: [],
          latestMatch: null,
          sessionStats: { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 },
          lastUpdated: 0,
          connected: false,
          waitingForScript: true
        };
      }

      saveData();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        ok: true,
        linked: rbx,
        linkedRoblox: acc.linkedRoblox
      }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return;
    }
  }

  // Unlink a Roblox Account
  if (url.pathname === "/api/auth/unlink-roblox" && req.method === "POST") {
    const acc = getAuthDiscordUser(req, url);
    if (!acc) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: "กรุณาเข้าสู่ระบบก่อน" }));
      return;
    }

    try {
      const body = await parseJsonBody(req);
      const userIdOrName = String(body.userId || "").trim().toLowerCase();
      if (!userIdOrName) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "Missing userId" }));
        return;
      }

      if (acc.linkedRoblox) {
        acc.linkedRoblox = acc.linkedRoblox.filter(r => String(r.userId).toLowerCase() !== userIdOrName && r.name.toLowerCase() !== userIdOrName);
      }
      saveData();

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, linkedRoblox: acc.linkedRoblox }));
      return;
    } catch (err) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: err.message }));
      return;
    }
  }

  // Logout
  if (url.pathname === "/api/auth/logout" && req.method === "POST") {
    const authHeader = req.headers["authorization"] || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : (req.headers["x-auth-token"] || url.searchParams.get("token"));
    if (token && state.sessions && state.sessions[token]) {
      delete state.sessions[token];
    }
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // ========================================================
  // STATE & DATA API (AUTHENTICATED & ISOLATED)
  // ========================================================

  if (url.pathname === "/api/data" && req.method === "GET") {
    const pin = req.headers["x-dashboard-pin"] || url.searchParams.get("pin");
    if (DASHBOARD_PIN && pin !== DASHBOARD_PIN) {
      res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ locked: true, requirePin: true, error: "Unauthorized" }));
      return;
    }

    const acc = getAuthDiscordUser(req, url);
    if (!acc) {
      // Unauthenticated -> Show Clean Discord OAuth Landing
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        authenticated: false,
        isPrivateGateway: true,
        connected: false
      }));
      return;
    }

    // Authenticated Discord user -> Resolve targeted Roblox account
    const linked = acc.linkedRoblox || [];
    let target = url.searchParams.get("u") || url.searchParams.get("user") || url.searchParams.get("id");
    if (!target && url.pathname.startsWith("/u/")) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2) {
        target = decodeURIComponent(parts[1]);
      }
    }

    if (!target && linked.length > 0) {
      target = String(linked[0].name || linked[0].userId);
    }

    let foundUser = null;
    if (target && state.robloxUsers) {
      const targetLower = target.trim().toLowerCase();
      for (const [uid, u] of Object.entries(state.robloxUsers)) {
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

    // If user has not linked any account or no script reported yet
    if (!foundUser || linked.length === 0) {
      res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({
        authenticated: true,
        hasLinked: false,
        waitingForScript: true,
        accountUser: {
          id: acc.id,
          username: acc.username,
          displayName: acc.displayName,
          discordId: acc.discordId,
          avatarUrl: acc.avatarUrl,
          linkedRoblox: acc.linkedRoblox || [],
          apiKey: acc.apiKey
        },
        connected: false
      }));
      return;
    }

    const responseData = {
      ...foundUser,
      authenticated: true,
      hasLinked: linked.length > 0,
      accountUser: {
        id: acc.id,
        username: acc.username,
        displayName: acc.displayName,
        avatarUrl: acc.avatarUrl,
        linkedRoblox: acc.linkedRoblox || [],
        apiKey: acc.apiKey
      },
      isPrivateGateway: false,
      connected: state.connected
    };

    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(responseData));
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

        // Auto-forward to cloud if running locally
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
  if (d.player) state.player = { ...state.player, ...d.player };
  if (d.playerProg) state.playerProg = d.playerProg;
  if (d.characters) state.characters = d.characters;
  if (d.currencies) state.currencies = d.currencies;
  if (d.materials) state.materials = d.materials;
  if (d.accessories) state.accessories = d.accessories;

  const validLevel = (state.playerProg?.level && Number(state.playerProg.level) > 0)
    ? Number(state.playerProg.level)
    : (state.player?.level && Number(state.player.level) > 0 ? Number(state.player.level) : null);
  if (validLevel && state.player) {
    state.player.level = validLevel;
  }

  // Update in robloxUsers store
  if (state.player && (state.player.userId || state.player.name)) {
    const uid = String(state.player.userId || state.player.name);
    const prevUser = state.robloxUsers[uid] || {};
    state.robloxUsers[uid] = {
      ...prevUser,
      player: { ...state.player },
      playerProg: state.playerProg,
      characters: state.characters,
      currencies: state.currencies,
      materials: state.materials,
      accessories: state.accessories,
      matchLogs: prevUser.matchLogs || (uid === "9165405454" ? (state.matchLogs || []) : []),
      latestMatch: prevUser.latestMatch || (uid === "9165405454" ? (state.latestMatch || null) : null),
      sessionStats: prevUser.sessionStats || (uid === "9165405454" ? (state.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 }) : { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 }),
      lastUpdated: Math.floor(Date.now() / 1000)
    };
  }

  state.lastUpdated = d.timestamp || Math.floor(Date.now() / 1000);
  state.connected = true;
  saveData();
}

const KNOWN_ITEM_RARITIES_SERVER = {
  // Materials - Common (Tier 1)
  "fine cloth": "Common",
  "shinobi scroll": "Common",
  "zero calories flour": "Common",
  "caprese": "Common",

  // Materials - Epic (Tier 2)
  "mana feather": "Epic",
  "eyeball": "Epic",
  "broken blade": "Epic",
  "shadow essence": "Epic",
  "zero calories doughnuts": "Epic",
  "zero calories donut": "Epic",
  "zero calories donuts": "Epic",
  "ham": "Epic",

  // Materials - Legendary (Tier 3)
  "cursed finger": "Legendary",
  "tech component": "Legendary",
  "soul fragment": "Legendary",
  "waves core": "Legendary",
  "wave core": "Legendary",
  "igris' crest": "Legendary",
  "igris crest": "Legendary",
  "shadow's cloak": "Legendary",
  "shadows cloak": "Legendary",
  "omurice": "Legendary",

  // Materials - Mythic (Tier 4)
  "suncore": "Mythic",
  "sun core": "Mythic",
  "magic pendant": "Mythic",
  "forbidden fruit": "Mythic",
  "ghost": "Mythic",
  "staff of homa": "Mythic",
  "monarch's blessing": "Mythic",
  "monarchs blessing": "Mythic",
  "burger": "Mythic",

  // Accessories - Common (Tier 1)
  "leaf shinobi headband": "Common",
  "gentleman's top hat": "Common",
  "gentlemans top hat": "Common",
  "capsule scarf": "Common",
  "8th brigade fire hat": "Common",
  "order assassin's tie": "Common",
  "order assassins tie": "Common",

  // Accessories - Rare (Tier 1/2)
  "sunglasses": "Rare",
  "sun glasses": "Rare",

  // Accessories - Epic (Tier 2/3)
  "kitsune mask": "Epic",
  "panther hollow mask": "Epic",
  "diva headphones": "Epic",
  "void hunter's eye": "Epic",
  "void hunters eye": "Epic",
  "wangsheng director's hat": "Epic",
  "wangsheng directors hat": "Epic",
  "strawhat captain's hat": "Epic",
  "strawhat captains hat": "Epic",
  "zoldyck collar": "Epic",

  // Accessories - Legendary (Tier 3/4)
  "light admiral cloak": "Legendary",
  "wind spirit wing": "Legendary",
  "wind spirit wings": "Legendary",
  "dark captain wings": "Legendary",
  "dark captain wing": "Legendary",
  "flame pirate hat": "Legendary",
  "red emperor's cloak": "Legendary",
  "red emperors cloak": "Legendary",
  "cursed king's collar": "Legendary",
  "cursed kings collar": "Legendary",
  "no-life king's shades": "Legendary",
  "no life king's shades": "Legendary",
  "otherworld halo": "Legendary",
  "divine general's wheel": "Legendary",
  "divine generals wheel": "Legendary",

  // Accessories - Mythic (Tier 4/5)
  "blast archer crown": "Mythic",
  "blast archer wings": "Mythic",
  "solar wings": "Mythic",
  "astral wings": "Mythic",
  "spectral wings": "Mythic",
  "shadow monarch coat": "Mythic"
};

const AUTHENTIC_MAT_ID_RARITIES = {
  // Tier 1: Common
  "101": "Common", "102": "Common", "117": "Common", "121": "Common",
  // Tier 2: Epic
  "103": "Epic", "106": "Epic", "107": "Epic", "115": "Epic", "118": "Epic", "122": "Epic",
  // Tier 3: Legendary
  "104": "Legendary", "105": "Legendary", "108": "Legendary", "112": "Legendary", "116": "Legendary", "119": "Legendary", "123": "Legendary",
  // Tier 4: Mythic
  "109": "Mythic", "110": "Mythic", "111": "Mythic", "113": "Mythic", "114": "Mythic", "120": "Mythic", "124": "Mythic"
};

const AUTHENTIC_ACC_ID_RARITIES = {
  // Tier 1: Common
  "101": "Common", "102": "Common", "103": "Common", "104": "Common", "124": "Common",
  // Tier 2: Rare
  "105": "Rare",
  // Tier 3: Epic
  "106": "Epic", "107": "Epic", "108": "Epic", "118": "Epic", "120": "Epic", "125": "Epic", "126": "Epic",
  // Tier 4: Legendary
  "109": "Legendary", "110": "Legendary", "111": "Legendary", "112": "Legendary",
  "121": "Legendary", "122": "Legendary", "123": "Legendary", "127": "Legendary", "128": "Legendary",
  // Tier 5: Mythic
  "113": "Mythic", "114": "Mythic", "115": "Mythic", "116": "Mythic", "117": "Mythic", "119": "Mythic"
};

function normalizeItemRarity(item, category) {
  if (!item) return;
  const nameLower = String(item.name || "").toLowerCase().trim();
  if (KNOWN_ITEM_RARITIES_SERVER[nameLower]) {
    item.rarity = KNOWN_ITEM_RARITIES_SERVER[nameLower];
    return;
  }
  const idStr = String(item.id || "").trim();
  if (category === "material") {
    if (AUTHENTIC_MAT_ID_RARITIES[idStr]) {
      item.rarity = AUTHENTIC_MAT_ID_RARITIES[idStr];
      return;
    }
  } else if (category === "accessory") {
    if (AUTHENTIC_ACC_ID_RARITIES[idStr]) {
      item.rarity = AUTHENTIC_ACC_ID_RARITIES[idStr];
      return;
    }
  }
  // Check tier fallback
  const tier = String(item.tier || "");
  if (tier) {
    if (category === "accessory") {
      if (tier === "4") item.rarity = "Mythic";
      else if (tier === "3") item.rarity = "Legendary";
      else if (tier === "2") item.rarity = "Epic";
      else item.rarity = "Rare";
    } else {
      if (tier === "4") item.rarity = "Legendary";
      else if (tier === "3") item.rarity = "Epic";
      else if (tier === "2") item.rarity = "Rare";
      else item.rarity = "Common";
    }
  }
}

function applyReport(payload) {
  const discordId = payload.discord_id ? String(payload.discord_id).trim() : null;
  const pcName = payload.pc_name || "PC-001";
  const p = payload.player || {};
  const uid = String(p.userId || p.name || "").trim();

  if (!uid) return;

  if (!state.robloxUsers) state.robloxUsers = {};
  if (!state.robloxUsers[uid]) {
    state.robloxUsers[uid] = {
      player: {
        name: p.name || "",
        displayName: p.displayName || p.name || "",
        userId: p.userId || uid,
        level: p.level || 0,
        guild: (p.guild && p.guild !== "None" && p.guild !== "none") ? p.guild : "",
        guildTag: p.guildTag || "",
        avatarUrl: p.userId ? `/api/avatar?userId=${p.userId}` : ""
      },
      playerProg: payload.playerProg || { level: 0, currentXp: 0, requiredXp: 1, ratio: 0, totalXp: 0 },
      characters: payload.characters || [],
      currencies: payload.currencies || { gold: 0, money: 0, gems: 0, rolls: 0, luckySpins: 0, traitRerolls: 0 },
      materials: payload.materials || {},
      accessories: payload.accessories || {},
      matchLogs: [],
      latestMatch: null,
      sessionStats: { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 },
      pcName: pcName,
      discordId: discordId,
      lastUpdated: Math.floor(Date.now() / 1000),
      connected: true
    };
  }

  const userRecord = state.robloxUsers[uid];

  const realAvatarUrl = p.userId
    ? `/api/avatar?userId=${p.userId}`
    : (p.avatarUrl || userRecord.player?.avatarUrl || "");

  userRecord.player = {
    ...userRecord.player,
    ...p,
    avatarUrl: realAvatarUrl
  };

  // Clean guild name if 'None' or empty
  if (userRecord.player.guild === "None" || userRecord.player.guild === "none") {
    userRecord.player.guild = "";
  }

  if (payload.playerProg) userRecord.playerProg = payload.playerProg;
  if (payload.characters) userRecord.characters = payload.characters;
  if (payload.currencies) userRecord.currencies = payload.currencies;

  // Normalize material rarities
  if (payload.materials) {
    for (const [id, m] of Object.entries(payload.materials)) {
      normalizeItemRarity(m, "material");
    }
    userRecord.materials = payload.materials;
  }

  // Normalize accessory rarities
  if (payload.accessories) {
    for (const [id, a] of Object.entries(payload.accessories)) {
      normalizeItemRarity(a, "accessory");
    }
    userRecord.accessories = payload.accessories;
  }

  const validLevel = (userRecord.playerProg?.level && Number(userRecord.playerProg.level) > 0)
    ? Number(userRecord.playerProg.level)
    : (userRecord.player?.level && Number(userRecord.player.level) > 0 ? Number(userRecord.player.level) : null);
  if (validLevel) {
    userRecord.player.level = validLevel;
  }

  userRecord.lastUpdated = Math.floor(Date.now() / 1000);
  userRecord.connected = true;
  userRecord.pcName = pcName;
  if (discordId) userRecord.discordId = discordId;

  // Normalize reward rarities if present
  if (payload.rewards && Array.isArray(payload.rewards)) {
    for (const r of payload.rewards) {
      if (r.category === "material") normalizeItemRarity(r, "material");
      else if (r.category === "accessory") normalizeItemRarity(r, "accessory");
    }
  }

  if (payload.type === "reward_update") {
    if (userRecord.latestMatch && payload.rewards && payload.rewards.length > 0) {
      userRecord.latestMatch.rewards = userRecord.latestMatch.rewards || [];
      for (const r of payload.rewards) {
        if (!userRecord.latestMatch.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
          userRecord.latestMatch.rewards.push(r);
          userRecord.sessionStats = userRecord.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 };
          if (r.name === "Gems") userRecord.sessionStats.gemsGained += (r.amount || 0);
          if (r.name === "Money" || r.name === "Gold") userRecord.sessionStats.goldGained += (r.amount || 0);
          if (r.category === "material" || r.category === "accessory") userRecord.sessionStats.itemsGained += (r.amount || 0);
        }
      }
    }
  }

  if (payload.type === "match_finish" && payload.match) {
    const matchRecord = {
      ...payload.match,
      rewards: payload.rewards || []
    };

    userRecord.matchLogs = userRecord.matchLogs || [];
    const existing = userRecord.matchLogs.find(m => m.time && m.time === matchRecord.time);
    if (existing) {
      if (matchRecord.rewards && matchRecord.rewards.length > 0) {
        existing.rewards = existing.rewards || [];
        for (const r of matchRecord.rewards) {
          if (!existing.rewards.some(er => er.name === r.name && er.amount === r.amount)) {
            existing.rewards.push(r);
            userRecord.sessionStats = userRecord.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 };
            if (r.name === "Gems") userRecord.sessionStats.gemsGained += (r.amount || 0);
            if (r.name === "Money" || r.name === "Gold") userRecord.sessionStats.goldGained += (r.amount || 0);
            if (r.category === "material" || r.category === "accessory") userRecord.sessionStats.itemsGained += (r.amount || 0);
          }
        }
      }
    } else {
      if (!matchRecord.duration || matchRecord.duration <= 0) {
        if (userRecord.matchLogs.length > 0 && userRecord.matchLogs[0].time && matchRecord.time) {
          const diff = Math.abs(matchRecord.time - userRecord.matchLogs[0].time);
          if (diff > 0 && diff < 1800) {
            matchRecord.duration = diff;
          }
        }
      }

      userRecord.matchLogs.unshift(matchRecord);
      if (userRecord.matchLogs.length > 50) userRecord.matchLogs.pop();
      userRecord.latestMatch = matchRecord;

      userRecord.sessionStats = userRecord.sessionStats || { totalMatches: 0, wins: 0, losses: 0, gemsGained: 0, goldGained: 0, itemsGained: 0 };
      userRecord.sessionStats.totalMatches = (userRecord.sessionStats.totalMatches || 0) + 1;
      if (matchRecord.won) userRecord.sessionStats.wins = (userRecord.sessionStats.wins || 0) + 1;
      else userRecord.sessionStats.losses = (userRecord.sessionStats.losses || 0) + 1;

      for (const r of (matchRecord.rewards || [])) {
        if (r.name === "Gems") userRecord.sessionStats.gemsGained = (userRecord.sessionStats.gemsGained || 0) + (r.amount || 0);
        if (r.name === "Money" || r.name === "Gold") userRecord.sessionStats.goldGained = (userRecord.sessionStats.goldGained || 0) + (r.amount || 0);
        if (r.category === "material" || r.category === "accessory") userRecord.sessionStats.itemsGained = (userRecord.sessionStats.itemsGained || 0) + (r.amount || 0);
      }
    }
  }

  // Alias by lowercase name if different
  if (p.name && String(p.name).toLowerCase() !== uid.toLowerCase()) {
    state.robloxUsers[String(p.name).toLowerCase()] = userRecord;
  }

  // Auto-link to Discord Account if discordId provided in script loader
  if (discordId && state.discordAccounts) {
    for (const [accId, acc] of Object.entries(state.discordAccounts)) {
      if (
        String(acc.discordId) === discordId ||
        acc.id === "discord_" + discordId ||
        String(acc.username).toLowerCase() === discordId.toLowerCase()
      ) {
        if (!acc.linkedRoblox) acc.linkedRoblox = [];
        const existing = acc.linkedRoblox.find(
          r => String(r.userId) === uid || String(r.name).toLowerCase() === String(p.name).toLowerCase()
        );
        if (!existing) {
          acc.linkedRoblox.push({
            userId: p.userId || uid,
            name: p.name,
            displayName: p.displayName || p.name,
            avatarUrl: realAvatarUrl,
            pcName: pcName,
            lastSeen: Math.floor(Date.now() / 1000)
          });
        } else {
          existing.displayName = p.displayName || p.name;
          existing.avatarUrl = realAvatarUrl || existing.avatarUrl;
          existing.pcName = pcName;
          existing.lastSeen = Math.floor(Date.now() / 1000);
        }
        break;
      }
    }
  }

  state.connected = true;
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
