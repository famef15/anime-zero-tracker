import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_FILE = path.join(__dirname, "tracker.luau");
const OBF_FILE = path.join(__dirname, "tracker.obf.luau");
const FORMATTED_FILE = path.join(__dirname, "tracker.formatted.obf.luau");

const source = fs.readFileSync(SOURCE_FILE, "utf-8");
const KEY_BASE = 0x5E;
const MOD = 29;

let hexParts = [];
for (let i = 0; i < source.length; i++) {
  const code = source.charCodeAt(i);
  const k = (KEY_BASE + (i % MOD)) & 0xFF;
  const enc = code ^ k;
  hexParts.push(enc.toString(16).padStart(2, "0"));
}

const fullHex = hexParts.join("");

// 1. Single-line Obfuscated File
const obfContent = `-- [CFame.HOST | Anime Zero Tracker - Obfuscated Payload]
local _H="${fullHex}";local _K,R,C,B=0x5E,{},string.char,bit32 for i=1,#_H,2 do local b=tonumber(_H:sub(i,i+1),16)R[#R+1]=C(B.bxor(b,B.band(_K+(((i-1)/2)%29),255)))end;loadstring(table.concat(R))()
`;
fs.writeFileSync(OBF_FILE, obfContent, "utf-8");

// 2. Formatted Multi-Line Obfuscated File
const CHUNK_SIZE = 80;
let chunks = [];
for (let i = 0; i < fullHex.length; i += CHUNK_SIZE) {
  chunks.push(`    "${fullHex.slice(i, i + CHUNK_SIZE)}"`);
}

const formattedContent = `-- ========================================================
-- CFame.HOST | Anime Zero 24/7 Web Tracker (Encrypted Loader)
-- Runtime: Roblox Client / Luau Executor
-- Target: Dual Cloud (Render) + Local (18888) + AI Bridge (16384)
-- ========================================================
local _O = {
${chunks.join(",\n")}
}

local _H = table.concat(_O)
local _K, R, C, B = 0x5E, {}, string.char, bit32

for i = 1, #_H, 2 do
    local b = tonumber(_H:sub(i, i + 1), 16)
    R[#R + 1] = C(B.bxor(b, B.band(_K + (((i - 1) / 2) % 29), 255)))
end

local loader = loadstring(table.concat(R))
if type(loader) == "function" then
    task.spawn(loader)
end
`;
fs.writeFileSync(FORMATTED_FILE, formattedContent, "utf-8");

console.log(`[Obfuscator] Success! Encrypted ${source.length} chars into:`);
console.log(`  - ${OBF_FILE} (${fs.statSync(OBF_FILE).size} bytes)`);
console.log(`  - ${FORMATTED_FILE} (${fs.statSync(FORMATTED_FILE).size} bytes)`);
