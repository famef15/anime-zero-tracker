// High-detail SVG Icon and Artwork Library for Anime Zero Dashboard
// Crafted specifically to match the aesthetic of in-game items, currencies, and anime characters.

export function getCurrencyIconSvg(name) {
  const n = (name || "").toLowerCase();
  if (n.includes("gem")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="gemGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a5f3fc"/>
          <stop offset="30%" stop-color="#38bdf8"/>
          <stop offset="70%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
        <filter id="gemGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <polygon points="20,10 44,10 56,26 32,56 8,26" fill="url(#gemGrad)" filter="url(#gemGlow)"/>
      <polygon points="20,10 44,10 38,26 26,26" fill="#e0f2fe" opacity="0.9"/>
      <polygon points="8,26 20,10 26,26" fill="#38bdf8" opacity="0.8"/>
      <polygon points="56,26 44,10 38,26" fill="#0284c7" opacity="0.8"/>
      <polygon points="26,26 38,26 32,56" fill="#bae6fd" opacity="0.95"/>
      <polygon points="8,26 26,26 32,56" fill="#0369a1" opacity="0.85"/>
      <polygon points="56,26 38,26 32,56" fill="#075985" opacity="0.9"/>
      <!-- Sparkle -->
      <polygon points="22,14 24,18 28,20 24,22 22,26 20,22 16,20 20,18" fill="#ffffff"/>
    </svg>`;
  }
  if (n.includes("gold") || n.includes("money") || n.includes("coin")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="40%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#a16207"/>
        </linearGradient>
        <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <circle cx="32" cy="32" r="24" fill="url(#goldGrad)" filter="url(#goldGlow)"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke="#fef08a" stroke-width="2" stroke-dasharray="2 1"/>
      <!-- Coin Rim Edge -->
      <path d="M 32,14 A 18,18 0 0 1 50,32 A 18,18 0 0 1 32,50 A 18,18 0 0 1 14,32 A 18,18 0 0 1 32,14" fill="#ca8a04"/>
      <!-- Center Star / Anime Yen Emblem -->
      <polygon points="32,20 35,28 44,29 37,35 39,44 32,39 25,44 27,35 20,29 29,28" fill="#fef08a"/>
      <circle cx="32" cy="32" r="4" fill="#a16207"/>
    </svg>`;
  }
  if (n.includes("reroll") || n.includes("trait")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="cubeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="60%" stop-color="#9333ea"/>
          <stop offset="100%" stop-color="#581c87"/>
        </linearGradient>
        <filter id="traitGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Isometric Reroll Cube -->
      <g filter="url(#traitGlow)">
        <polygon points="32,8 54,20 32,32 10,20" fill="#d8b4fe"/>
        <polygon points="10,20 32,32 32,56 10,44" fill="#9333ea"/>
        <polygon points="32,32 54,20 54,44 32,56" fill="#6b21a8"/>
      </g>
      <!-- Runes on Dice -->
      <circle cx="32" cy="20" r="3" fill="#ffffff"/>
      <circle cx="21" cy="36" r="2.5" fill="#f3e8ff"/>
      <circle cx="21" cy="44" r="2.5" fill="#f3e8ff"/>
      <circle cx="43" cy="36" r="2.5" fill="#f3e8ff"/>
      <circle cx="37" cy="42" r="2.5" fill="#f3e8ff"/>
      <circle cx="43" cy="48" r="2.5" fill="#f3e8ff"/>
    </svg>`;
  }
  if (n.includes("spin") || n.includes("wheel") || n.includes("lucky")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="ticketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="50%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <!-- Lucky Wheel / Ticket -->
      <circle cx="32" cy="32" r="25" fill="#1e293b" stroke="#fde047" stroke-width="2"/>
      <circle cx="32" cy="32" r="21" fill="none" stroke="#eab308" stroke-width="1.5" stroke-dasharray="6 3"/>
      <!-- 4-Leaf Clover Center -->
      <path d="M32 32 Q26 22 32 16 Q38 22 32 32" fill="#4ade80"/>
      <path d="M32 32 Q22 26 16 32 Q22 38 32 32" fill="#22c55e"/>
      <path d="M32 32 Q38 42 32 48 Q26 42 32 32" fill="#16a34a"/>
      <path d="M32 32 Q42 38 48 32 Q42 26 32 32" fill="#4ade80"/>
      <circle cx="32" cy="32" r="3.5" fill="#fde047"/>
    </svg>`;
  }
  if (n.includes("xp") || n.includes("exp")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#38bdf8"/>
          <stop offset="50%" stop-color="#818cf8"/>
          <stop offset="100%" stop-color="#c084fc"/>
        </linearGradient>
        <filter id="xpGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <polygon points="34,6 16,32 30,32 26,58 48,26 34,26" fill="url(#xpGrad)" filter="url(#xpGlow)"/>
      <polygon points="34,10 20,30 30,30 28,50 44,28 34,28" fill="#ffffff" opacity="0.6"/>
    </svg>`;
  }
  return `<span style="font-size: 28px;">🎁</span>`;
}

export function getItemIconSvg(idOrName) {
  const s = String(idOrName || "").toLowerCase();

  // 101 - Fine Cloth
  if (s === "101" || s.includes("fine cloth") || s.includes("cloth")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="clothGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#991b1b"/>
        </linearGradient>
      </defs>
      <!-- Rolled Royal Silk Cloth -->
      <path d="M14 20 Q32 10 50 20 L46 48 Q28 58 10 48 Z" fill="url(#clothGrad)"/>
      <ellipse cx="48" cy="22" rx="6" ry="12" fill="#ef4444" stroke="#fca5a5" stroke-width="1.5"/>
      <path d="M12 22 Q30 32 48 22" fill="none" stroke="#fef08a" stroke-width="2.5"/>
      <path d="M10 34 Q28 44 46 34" fill="none" stroke="#fef08a" stroke-width="2"/>
      <path d="M10 46 Q28 56 46 46" fill="none" stroke="#fca5a5" stroke-width="1.5"/>
      <!-- Gold Ribbon Tie -->
      <rect x="26" y="16" width="8" height="34" rx="2" fill="#eab308" transform="rotate(-10 30 33)"/>
      <circle cx="29" cy="33" r="3" fill="#fef08a"/>
    </svg>`;
  }

  // 102 - Shinobi Scroll
  if (s === "102" || s.includes("shinobi scroll") || s.includes("scroll")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="scrollGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="60%" stop-color="#fde047"/>
          <stop offset="100%" stop-color="#ca8a04"/>
        </linearGradient>
      </defs>
      <!-- Ninja Scroll Roll -->
      <rect x="18" y="12" width="28" height="40" rx="3" fill="url(#scrollGrad)" stroke="#854d0e" stroke-width="2"/>
      <!-- Wooden Roller Ends -->
      <rect x="14" y="8" width="36" height="6" rx="3" fill="#78350f"/>
      <rect x="14" y="50" width="36" height="6" rx="3" fill="#78350f"/>
      <!-- Kanji Symbol / Emblem in center -->
      <circle cx="32" cy="32" r="10" fill="none" stroke="#dc2626" stroke-width="2"/>
      <path d="M32 26 L32 38 M26 32 L38 32 M28 28 L36 36" stroke="#dc2626" stroke-width="2" stroke-linecap="round"/>
      <!-- Red Ribbon Tie -->
      <path d="M18 31 Q32 36 46 31" fill="none" stroke="#dc2626" stroke-width="3"/>
    </svg>`;
  }

  // 103 - Mana Feather
  if (s === "103" || s.includes("mana feather") || s.includes("feather")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="featherGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e0f2fe"/>
          <stop offset="40%" stop-color="#38bdf8"/>
          <stop offset="80%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#0369a1"/>
        </linearGradient>
        <filter id="featherGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Ethereal Glowing Feather -->
      <path d="M48 10 C40 24 36 38 18 54 C16 56 12 58 10 56 C12 50 22 42 28 32 C34 22 42 14 48 10 Z" fill="url(#featherGrad)" filter="url(#featherGlow)"/>
      <path d="M48 10 Q32 34 16 54" fill="none" stroke="#ffffff" stroke-width="2"/>
      <!-- Feather Barbs -->
      <path d="M42 18 L48 24 M36 26 L44 32 M30 34 L38 40 M24 42 L30 46" stroke="#bae6fd" stroke-width="1.5" stroke-linecap="round"/>
      <!-- Mana Sparks -->
      <circle cx="44" cy="12" r="2" fill="#ffffff"/>
      <circle cx="26" cy="24" r="1.5" fill="#ffffff"/>
      <circle cx="48" cy="30" r="1.5" fill="#7dd3fc"/>
    </svg>`;
  }

  // 104 - Cursed Finger
  if (s === "104" || s.includes("cursed finger") || s.includes("finger")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="fingerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#64748b"/>
          <stop offset="40%" stop-color="#475569"/>
          <stop offset="80%" stop-color="#334155"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
      </defs>
      <!-- Sukuna's Cursed Finger -->
      <path d="M22 52 L26 24 C26 18 36 14 40 20 L40 50 C38 56 24 56 22 52 Z" fill="url(#fingerGrad)"/>
      <!-- Dark Crimson Claw / Nail -->
      <path d="M28 18 Q34 6 38 12 Q38 18 34 20 Z" fill="#991b1b" stroke="#7f1d1d" stroke-width="1"/>
      <!-- Talisman Wrapping & Knuckles -->
      <path d="M24 28 Q32 30 38 27 M25 36 Q32 39 39 35 M24 44 Q32 47 38 43" stroke="#fde047" stroke-width="2" fill="none"/>
      <!-- Cursed Red Aura Lines -->
      <path d="M20 20 Q16 32 20 44 M42 22 Q46 34 42 46" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3 2" fill="none"/>
    </svg>`;
  }

  // 105 - Tech Component
  if (s === "105" || s.includes("tech component") || s.includes("tech")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="chipGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1e293b"/>
          <stop offset="100%" stop-color="#0f172a"/>
        </linearGradient>
      </defs>
      <rect x="14" y="14" width="36" height="36" rx="4" fill="url(#chipGrad)" stroke="#38bdf8" stroke-width="2"/>
      <!-- Microchip Pins -->
      <line x1="20" y1="10" x2="20" y2="14" stroke="#94a3b8" stroke-width="2"/>
      <line x1="28" y1="10" x2="28" y2="14" stroke="#94a3b8" stroke-width="2"/>
      <line x1="36" y1="10" x2="36" y2="14" stroke="#94a3b8" stroke-width="2"/>
      <line x1="44" y1="10" x2="44" y2="14" stroke="#94a3b8" stroke-width="2"/>
      <line x1="20" y1="50" x2="20" y2="54" stroke="#94a3b8" stroke-width="2"/>
      <line x1="28" y1="50" x2="28" y2="54" stroke="#94a3b8" stroke-width="2"/>
      <line x1="36" y1="50" x2="36" y2="54" stroke="#94a3b8" stroke-width="2"/>
      <line x1="44" y1="50" x2="44" y2="54" stroke="#94a3b8" stroke-width="2"/>
      <!-- Glowing Core & Traces -->
      <circle cx="32" cy="32" r="8" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5"/>
      <circle cx="32" cy="32" r="4" fill="#a5f3fc"/>
      <path d="M20 20 L26 26 M44 20 L38 26 M20 44 L26 38 M44 44 L38 38" stroke="#38bdf8" stroke-width="1.5"/>
    </svg>`;
  }

  // 106 - Eyeball
  if (s === "106" || s.includes("eyeball") || s.includes("eye")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="irisGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ef4444"/>
          <stop offset="70%" stop-color="#991b1b"/>
          <stop offset="100%" stop-color="#450a0a"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="#f8fafc" stroke="#dc2626" stroke-width="2"/>
      <!-- Veins -->
      <path d="M14 26 Q22 28 26 32 M12 36 Q20 34 25 33 M50 24 Q42 28 38 31 M52 38 Q44 36 39 34" stroke="#ef4444" stroke-width="1.2" fill="none"/>
      <!-- Iris & Pupil -->
      <circle cx="32" cy="32" r="12" fill="url(#irisGrad)"/>
      <circle cx="32" cy="32" r="5" fill="#0f172a"/>
      <!-- Reflection -->
      <circle cx="28" cy="28" r="3" fill="#ffffff"/>
    </svg>`;
  }

  // 107 - Broken Blade
  if (s === "107" || s.includes("broken blade") || s.includes("blade")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="bladeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#e2e8f0"/>
          <stop offset="60%" stop-color="#94a3b8"/>
          <stop offset="100%" stop-color="#475569"/>
        </linearGradient>
      </defs>
      <!-- Shattered Katana Blade Tip -->
      <polygon points="18,52 36,14 42,16 38,32 46,36 34,54" fill="url(#bladeGrad)" stroke="#38bdf8" stroke-width="1.5"/>
      <!-- Jagged fracture line -->
      <polyline points="26,38 32,34 30,26 36,24" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <!-- Edge shine -->
      <line x1="20" y1="50" x2="36" y2="16" stroke="#ffffff" stroke-width="1.5"/>
    </svg>`;
  }

  // 108 - Soul Fragment
  if (s === "108" || s.includes("soul fragment") || s.includes("soul")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="soulGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#67e8f9"/>
          <stop offset="50%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0e7490"/>
        </linearGradient>
        <filter id="soulGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Spectral Flame / Soul -->
      <path d="M32 8 C36 18 48 24 48 38 C48 50 38 56 32 56 C26 56 16 50 16 38 C16 26 26 18 32 8 Z" fill="url(#soulGrad)" filter="url(#soulGlow)"/>
      <path d="M32 18 C35 24 40 30 40 38 C40 46 35 48 32 48 C29 48 24 46 24 38 C24 32 28 26 32 18 Z" fill="#cffafe" opacity="0.85"/>
      <!-- Soul Sparkle -->
      <circle cx="32" cy="36" r="3" fill="#ffffff"/>
    </svg>`;
  }

  // 109 - SunCore
  if (s === "109" || s.includes("suncore") || s.includes("sun")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="sunGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="35%" stop-color="#fef08a"/>
          <stop offset="70%" stop-color="#f59e0b"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
        <filter id="sunGlow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Corona Flares -->
      <g filter="url(#sunGlow)">
        <polygon points="32,6 36,20 32,16 28,20" fill="#f59e0b"/>
        <polygon points="32,58 36,44 32,48 28,44" fill="#f59e0b"/>
        <polygon points="6,32 20,36 16,32 20,28" fill="#f59e0b"/>
        <polygon points="58,32 44,36 48,32 44,28" fill="#f59e0b"/>
        <polygon points="14,14 26,22 22,22 22,26" fill="#f59e0b"/>
        <polygon points="50,14 42,26 42,22 38,22" fill="#f59e0b"/>
        <polygon points="14,50 26,42 22,42 22,38" fill="#f59e0b"/>
        <polygon points="50,50 42,38 42,42 38,42" fill="#f59e0b"/>
      </g>
      <!-- Sun Orb -->
      <circle cx="32" cy="32" r="16" fill="url(#sunGrad)" filter="url(#sunGlow)"/>
      <circle cx="32" cy="32" r="10" fill="#fffbeb"/>
    </svg>`;
  }

  // 110 - Magic Pendant
  if (s === "110" || s.includes("magic pendant") || s.includes("pendant")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="pendantGem" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#c084fc"/>
          <stop offset="60%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#4c1d95"/>
        </linearGradient>
      </defs>
      <!-- Chain -->
      <path d="M16 12 Q32 30 48 12" fill="none" stroke="#fde047" stroke-width="2.5" stroke-dasharray="3 2"/>
      <!-- Filigree Setting -->
      <circle cx="32" cy="36" r="16" fill="#ca8a04" stroke="#fef08a" stroke-width="2"/>
      <!-- Center Faceted Gem -->
      <polygon points="32,24 42,34 32,48 22,34" fill="url(#pendantGem)"/>
      <polygon points="32,24 38,32 32,42 26,32" fill="#e9d5ff" opacity="0.8"/>
    </svg>`;
  }

  // 111 - Forbidden Fruit
  if (s === "111" || s.includes("forbidden fruit") || s.includes("fruit")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="fruitGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#d8b4fe"/>
          <stop offset="50%" stop-color="#a855f7"/>
          <stop offset="90%" stop-color="#581c87"/>
          <stop offset="100%" stop-color="#2e1065"/>
        </radialGradient>
      </defs>
      <!-- Swirling Stem -->
      <path d="M32 18 Q30 8 38 6 Q42 8 36 12 Q34 16 32 18" fill="#4ade80" stroke="#16a34a" stroke-width="1.5"/>
      <!-- Devil Fruit Body -->
      <circle cx="32" cy="36" r="20" fill="url(#fruitGrad)"/>
      <!-- Devil Fruit Swirl Spirals -->
      <path d="M26 28 Q24 24 28 24 Q32 24 30 28" fill="none" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
      <path d="M36 32 Q34 28 38 28 Q42 28 40 32" fill="none" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
      <path d="M24 40 Q22 36 26 36 Q30 36 28 40" fill="none" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
      <path d="M34 44 Q32 40 36 40 Q40 40 38 44" fill="none" stroke="#e9d5ff" stroke-width="2" stroke-linecap="round"/>
    </svg>`;
  }

  // 112 - Waves Core
  if (s === "112" || s.includes("waves core") || s.includes("wave")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="waveGrad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#a5f3fc"/>
          <stop offset="45%" stop-color="#06b6d4"/>
          <stop offset="85%" stop-color="#0284c7"/>
          <stop offset="100%" stop-color="#082f49"/>
        </radialGradient>
      </defs>
      <!-- Hydro Sphere -->
      <circle cx="32" cy="32" r="22" fill="url(#waveGrad)"/>
      <!-- Swirling Wave Crests -->
      <path d="M16 34 Q24 22 32 30 Q40 38 48 26" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M18 42 Q26 34 34 40 Q42 46 46 38" fill="none" stroke="#bae6fd" stroke-width="2" stroke-linecap="round"/>
      <circle cx="24" cy="22" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="38" cy="20" r="1.5" fill="#ffffff" opacity="0.6"/>
    </svg>`;
  }

  // 113 - Ghost
  if (s === "113" || s.includes("ghost")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="ghostGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#bae6fd"/>
          <stop offset="70%" stop-color="#38bdf8"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
        <filter id="ghostGlow">
          <feGaussianBlur stdDeviation="2.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Boo Tao style cute ghost -->
      <path d="M32 10 C20 10 16 22 16 36 C16 46 20 54 24 50 C28 46 30 52 32 50 C34 48 36 54 40 50 C44 46 48 40 48 36 C48 22 44 10 32 10 Z" fill="url(#ghostGrad)" filter="url(#ghostGlow)"/>
      <!-- Eyes & Smile -->
      <circle cx="26" cy="26" r="3" fill="#0f172a"/>
      <circle cx="38" cy="26" r="3" fill="#0f172a"/>
      <ellipse cx="32" cy="32" rx="3" ry="2" fill="#0f172a"/>
      <!-- Blushing Cheeks -->
      <circle cx="22" cy="30" r="2" fill="#f43f5e" opacity="0.7"/>
      <circle cx="42" cy="30" r="2" fill="#f43f5e" opacity="0.7"/>
    </svg>`;
  }

  // 114 - Staff of Homa
  if (s === "114" || s.includes("staff of homa") || s.includes("homa")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="homaShaft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#991b1b"/>
          <stop offset="50%" stop-color="#ef4444"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>
      <!-- Shaft -->
      <line x1="12" y1="52" x2="44" y2="20" stroke="url(#homaShaft)" stroke-width="4" stroke-linecap="round"/>
      <line x1="12" y1="52" x2="44" y2="20" stroke="#fef08a" stroke-width="1.5" stroke-dasharray="4 6"/>
      <!-- Dual Crimson Spear Prongs -->
      <path d="M38 26 L52 10 L50 20 L58 14 L46 32 Z" fill="#dc2626" stroke="#fef08a" stroke-width="1.5"/>
      <polygon points="52,10 44,18 48,22" fill="#fef08a"/>
      <!-- Fiery Aura Ring -->
      <circle cx="42" cy="22" r="5" fill="none" stroke="#f97316" stroke-width="1.5"/>
    </svg>`;
  }

  // 115 - Shadow Essence
  if (s === "115" || s.includes("shadow essence") || s.includes("shadow")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="shadowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#a855f7"/>
          <stop offset="50%" stop-color="#581c87"/>
          <stop offset="100%" stop-color="#090514"/>
        </linearGradient>
        <filter id="shadowGlow">
          <feGaussianBlur stdDeviation="3.5" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Shadow Monarch Tendrils -->
      <path d="M32 10 C38 18 46 22 46 34 C46 48 38 54 32 54 C26 54 18 48 18 34 C18 20 26 18 32 10 Z" fill="url(#shadowGrad)" filter="url(#shadowGlow)"/>
      <path d="M32 16 Q40 28 36 40 Q28 44 26 32 Z" fill="#d8b4fe" opacity="0.6"/>
      <circle cx="32" cy="34" r="4" fill="#c084fc"/>
    </svg>`;
  }

  // 116 - Igris' Crest
  if (s === "116" || s.includes("igris") || s.includes("crest")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="igrisPlume" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="50%" stop-color="#dc2626"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </linearGradient>
      </defs>
      <!-- Crimson Flowing Plume -->
      <path d="M32 18 C38 8 50 10 52 24 C46 24 40 22 36 28 Z" fill="url(#igrisPlume)"/>
      <!-- Knight Helm Crest Base -->
      <polygon points="32,22 42,32 38,48 26,48 22,32" fill="#334155" stroke="#f87171" stroke-width="2"/>
      <polygon points="32,26 38,34 32,44 26,34" fill="#0f172a"/>
      <!-- Red Visor Glow Line -->
      <line x1="26" y1="34" x2="38" y2="34" stroke="#ef4444" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  // 117 - Zero Calories Flour
  if (s === "117" || s.includes("flour")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="flourGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="70%" stop-color="#e2e8f0"/>
          <stop offset="100%" stop-color="#cbd5e1"/>
        </linearGradient>
      </defs>
      <!-- Sack -->
      <path d="M22 20 L42 20 L48 50 C48 54 16 54 16 50 Z" fill="url(#flourGrad)" stroke="#94a3b8" stroke-width="2"/>
      <!-- Tied Sack Neck -->
      <ellipse cx="32" cy="20" rx="10" ry="3" fill="#cbd5e1"/>
      <polygon points="26,14 38,14 34,20 30,20" fill="#f8fafc"/>
      <line x1="24" y1="20" x2="40" y2="20" stroke="#ca8a04" stroke-width="2"/>
      <!-- Stamp Emblem -->
      <circle cx="32" cy="36" r="6" fill="#fde047" stroke="#ca8a04" stroke-width="1.5"/>
      <text x="32" y="39" font-size="7" font-weight="bold" fill="#854d0e" text-anchor="middle">0</text>
    </svg>`;
  }

  // 118 - Zero Calories Doughnuts
  if (s === "118" || s.includes("doughnut") || s.includes("donut")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="doughGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="70%" stop-color="#eab308"/>
          <stop offset="100%" stop-color="#b45309"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="22" fill="url(#doughGrad)"/>
      <!-- Pink / Strawberry Glaze -->
      <path d="M32 12 C44 12 52 20 52 32 C52 36 48 38 46 34 C44 30 40 38 36 34 C32 30 28 36 24 32 C20 28 16 36 14 32 C12 24 20 12 32 12 Z" fill="#f43f5e"/>
      <!-- Doughnut Hole -->
      <circle cx="32" cy="32" r="8" fill="#0f172a"/>
      <!-- Sprinkles -->
      <rect x="24" y="20" width="4" height="2" rx="1" fill="#fde047" transform="rotate(30 26 21)"/>
      <rect x="36" y="18" width="4" height="2" rx="1" fill="#38bdf8" transform="rotate(-20 38 19)"/>
      <rect x="42" y="26" width="4" height="2" rx="1" fill="#4ade80" transform="rotate(45 44 27)"/>
      <rect x="20" y="28" width="4" height="2" rx="1" fill="#ffffff" transform="rotate(-40 22 29)"/>
    </svg>`;
  }

  // 119 - Shadow's Cloak
  if (s === "119" || s.includes("cloak")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="cloakGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#3b0764"/>
          <stop offset="60%" stop-color="#1e1b4b"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <!-- Flowing Shadow Mantle -->
      <path d="M24 16 L40 16 L50 50 L38 46 L32 52 L26 46 L14 50 Z" fill="url(#cloakGrad)" stroke="#c084fc" stroke-width="1.5"/>
      <!-- Fur Collar / Shoulders -->
      <ellipse cx="32" cy="18" rx="12" ry="4" fill="#6b21a8"/>
      <!-- Brooch Pin -->
      <circle cx="32" cy="18" r="3" fill="#fde047"/>
    </svg>`;
  }

  // 120 - Monarch's Blessing
  if (s === "120" || s.includes("monarch") || s.includes("blessing")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <linearGradient id="monarchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fde047"/>
          <stop offset="50%" stop-color="#c084fc"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
        <filter id="monarchGlow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <!-- Royal Crown Sigil -->
      <polygon points="16,40 22,24 32,32 42,24 48,40" fill="url(#monarchGrad)" filter="url(#monarchGlow)"/>
      <rect x="18" y="42" width="28" height="6" rx="2" fill="#eab308"/>
      <circle cx="22" cy="24" r="2.5" fill="#ffffff"/>
      <circle cx="32" cy="32" r="2.5" fill="#ffffff"/>
      <circle cx="42" cy="24" r="2.5" fill="#ffffff"/>
      <polygon points="32,10 34,16 32,14 30,16" fill="#fde047"/>
    </svg>`;
  }

  // 121 - Caprese
  if (s === "121" || s.includes("caprese")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <!-- Ceramic Plate -->
      <ellipse cx="32" cy="34" rx="24" ry="18" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <!-- Tomato & Mozzarella Slices -->
      <ellipse cx="24" cy="32" rx="10" ry="7" fill="#ef4444"/>
      <ellipse cx="28" cy="34" rx="9" ry="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <ellipse cx="34" cy="32" rx="10" ry="7" fill="#dc2626"/>
      <ellipse cx="38" cy="34" rx="9" ry="6" fill="#ffffff" stroke="#e2e8f0" stroke-width="1"/>
      <!-- Basil Leaf -->
      <path d="M30 26 Q36 20 42 24 Q36 28 30 26" fill="#22c55e"/>
    </svg>`;
  }

  // 122 - Ham
  if (s === "122" || s.includes("ham") || s.includes("meat")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <defs>
        <radialGradient id="meatGrad" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stop-color="#f87171"/>
          <stop offset="60%" stop-color="#b91c1c"/>
          <stop offset="100%" stop-color="#7f1d1d"/>
        </radialGradient>
      </defs>
      <!-- Bone -->
      <rect x="8" y="30" width="48" height="6" rx="3" fill="#f1f5f9"/>
      <circle cx="10" cy="29" r="4" fill="#f1f5f9"/>
      <circle cx="10" cy="37" r="4" fill="#f1f5f9"/>
      <circle cx="54" cy="29" r="4" fill="#f1f5f9"/>
      <circle cx="54" cy="37" r="4" fill="#f1f5f9"/>
      <!-- Roasted Meat Chunk -->
      <ellipse cx="32" cy="33" rx="18" ry="13" fill="url(#meatGrad)" stroke="#450a0a" stroke-width="1.5"/>
      <ellipse cx="32" cy="33" rx="12" ry="8" fill="#fca5a5" stroke="#ef4444" stroke-width="1"/>
    </svg>`;
  }

  // 123 - Omurice
  if (s === "123" || s.includes("omurice") || s.includes("rice")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <!-- Plate -->
      <ellipse cx="32" cy="36" rx="24" ry="16" fill="#e2e8f0"/>
      <!-- Golden Fluffy Omelette -->
      <path d="M16 36 C16 24 48 24 48 36 C48 42 16 42 16 36 Z" fill="#fde047" stroke="#eab308" stroke-width="1.5"/>
      <!-- Ketchup Swirl -->
      <path d="M22 34 Q32 28 42 34" fill="none" stroke="#dc2626" stroke-width="3" stroke-linecap="round"/>
      <path d="M26 36 Q32 40 38 36" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
  }

  // 124 - Burger
  if (s === "124" || s.includes("burger")) {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%">
      <!-- Top Bun -->
      <path d="M16 26 C16 14 48 14 48 26 Z" fill="#f59e0b" stroke="#d97706" stroke-width="1.5"/>
      <!-- Sesame seeds -->
      <ellipse cx="26" cy="18" rx="1.5" ry="0.8" fill="#fef3c7"/>
      <ellipse cx="34" cy="16" rx="1.5" ry="0.8" fill="#fef3c7"/>
      <ellipse cx="38" cy="20" rx="1.5" ry="0.8" fill="#fef3c7"/>
      <!-- Lettuce -->
      <path d="M14 27 Q20 30 26 27 Q32 30 38 27 Q44 30 50 27" stroke="#22c55e" stroke-width="3" fill="none" stroke-linecap="round"/>
      <!-- Melted Cheese -->
      <polygon points="18,30 46,30 42,34 36,31 30,35 24,31 18,34" fill="#fde047"/>
      <!-- Patty -->
      <rect x="15" y="32" width="34" height="6" rx="3" fill="#78350f"/>
      <!-- Bottom Bun -->
      <rect x="16" y="39" width="32" height="6" rx="2" fill="#f59e0b"/>
    </svg>`;
  }

  // Generic Accessory fallback
  return `<svg viewBox="0 0 64 64" width="100%" height="100%">
    <circle cx="32" cy="32" r="22" fill="#1e1b4b" stroke="#a855f7" stroke-width="2"/>
    <polygon points="32,16 42,26 32,46 22,26" fill="#c084fc"/>
    <circle cx="32" cy="30" r="4" fill="#ffffff"/>
  </svg>`;
}

// Character Avatar artwork generator
export function getCharacterAvatarSvg(id, rarity) {
  const name = String(id || "").toLowerCase();
  const rar = String(rarity || "common").toLowerCase();

  let borderColor = "#38bdf8";
  let bgGrad = "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
  let initials = name.slice(0, 2).toUpperCase();

  if (rar.includes("zenless")) {
    borderColor = "#f43f5e";
    bgGrad = "linear-gradient(135deg, #4c0519 0%, #881337 50%, #1e1b4b 100%)";
  } else if (rar.includes("arcane")) {
    borderColor = "#ef4444";
    bgGrad = "linear-gradient(135deg, #450a0a 0%, #7f1d1d 50%, #1c1917 100%)";
  } else if (rar.includes("mythic")) {
    borderColor = "#c084fc";
    bgGrad = "linear-gradient(135deg, #3b0764 0%, #581c87 50%, #111827 100%)";
  } else if (rar.includes("legendary")) {
    borderColor = "#fbbf24";
    bgGrad = "linear-gradient(135deg, #451a03 0%, #78350f 50%, #172554 100%)";
  }

  // Character specific icon visuals
  let innerSvg = "";

  if (name.includes("astra")) {
    // Astra Yao: Cyan dragon horn / ice crystals
    innerSvg = `
      <polygon points="32,12 40,30 32,26 24,30" fill="#a5f3fc" filter="drop-shadow(0 0 6px #38bdf8)"/>
      <circle cx="32" cy="38" r="12" fill="#0369a1"/>
      <ellipse cx="28" cy="36" rx="2" ry="3" fill="#e0f2fe"/>
      <ellipse cx="36" cy="36" rx="2" ry="3" fill="#e0f2fe"/>
      <path d="M18 48 C24 40 40 40 46 48 Z" fill="#0c4a6e"/>
    `;
  } else if (name.includes("rin")) {
    // Rin: Ruby ribbon / magical pendant crest
    innerSvg = `
      <polygon points="32,16 44,28 32,48 20,28" fill="#f43f5e" filter="drop-shadow(0 0 6px #fb7185)"/>
      <circle cx="32" cy="30" r="5" fill="#fecdd3"/>
      <!-- Twin ribbons -->
      <path d="M22 22 Q12 28 16 38" fill="none" stroke="#e11d48" stroke-width="3"/>
      <path d="M42 22 Q52 28 48 38" fill="none" stroke="#e11d48" stroke-width="3"/>
    `;
  } else if (name.includes("sung") || name.includes("jinwoo")) {
    // Sung Jinwoo: Shadow Monarch neon purple eyes & dagger
    innerSvg = `
      <circle cx="32" cy="34" r="14" fill="#090514"/>
      <!-- Glowing Eyes -->
      <ellipse cx="26" cy="32" rx="3" ry="1.5" fill="#c084fc" filter="drop-shadow(0 0 5px #a855f7)"/>
      <ellipse cx="38" cy="32" rx="3" ry="1.5" fill="#c084fc" filter="drop-shadow(0 0 5px #a855f7)"/>
      <!-- Monarch Dagger -->
      <polygon points="32,10 35,26 29,26" fill="#e9d5ff"/>
      <line x1="27" y1="26" x2="37" y2="26" stroke="#9333ea" stroke-width="2"/>
    `;
  } else if (name.includes("hu") || name.includes("tao")) {
    // Hu Tao: Ghost Boo Tao & plum flower
    innerSvg = `
      <circle cx="32" cy="30" r="10" fill="#fca5a5" opacity="0.9"/>
      <circle cx="28" cy="28" r="2" fill="#7f1d1d"/>
      <circle cx="36" cy="28" r="2" fill="#7f1d1d"/>
      <path d="M29 34 Q32 37 35 34" fill="none" stroke="#7f1d1d" stroke-width="1.5"/>
      <!-- Plum Blossom Flower -->
      <circle cx="32" cy="16" r="3" fill="#ef4444"/>
      <circle cx="28" cy="14" r="2.5" fill="#ef4444"/>
      <circle cx="36" cy="14" r="2.5" fill="#ef4444"/>
      <circle cx="30" cy="19" r="2.5" fill="#ef4444"/>
      <circle cx="34" cy="19" r="2.5" fill="#ef4444"/>
      <circle cx="32" cy="16" r="1.5" fill="#fef08a"/>
    `;
  } else if (name.includes("sukuna")) {
    // Sukuna: Four red glowing eyes & black curse markings
    innerSvg = `
      <circle cx="32" cy="34" r="15" fill="#18181b"/>
      <!-- 4 Glowing Cursed Eyes -->
      <ellipse cx="26" cy="28" rx="2" ry="1.2" fill="#ef4444" filter="drop-shadow(0 0 4px #dc2626)"/>
      <ellipse cx="38" cy="28" rx="2" ry="1.2" fill="#ef4444" filter="drop-shadow(0 0 4px #dc2626)"/>
      <ellipse cx="25" cy="34" rx="2.5" ry="1.5" fill="#ef4444" filter="drop-shadow(0 0 4px #dc2626)"/>
      <ellipse cx="39" cy="34" rx="2.5" ry="1.5" fill="#ef4444" filter="drop-shadow(0 0 4px #dc2626)"/>
      <!-- Forehead tattoo mark -->
      <circle cx="32" cy="22" r="2.5" fill="#000000" stroke="#ef4444" stroke-width="1"/>
    `;
  } else if (name.includes("frieren")) {
    // Frieren: Elf twin tails & magical staff
    innerSvg = `
      <circle cx="32" cy="32" r="12" fill="#f1f5f9"/>
      <!-- Elf Ears -->
      <polygon points="18,30 24,32 20,24" fill="#fed7aa"/>
      <polygon points="46,30 40,32 44,24" fill="#fed7aa"/>
      <ellipse cx="28" cy="32" rx="2" ry="2.5" fill="#38bdf8"/>
      <ellipse cx="36" cy="32" rx="2" ry="2.5" fill="#38bdf8"/>
      <!-- Staff Tip -->
      <circle cx="48" cy="14" r="4" fill="none" stroke="#fde047" stroke-width="2"/>
      <polygon points="48,14 50,11 48,13 46,11" fill="#ef4444"/>
    `;
  } else if (name.includes("guts")) {
    // Guts: Iron dragon slayer & berserker mark
    innerSvg = `
      <!-- Dragon Slayer Blade Slab -->
      <polygon points="26,10 38,10 36,52 28,52" fill="#64748b" stroke="#334155" stroke-width="2"/>
      <line x1="32" y1="12" x2="32" y2="50" stroke="#94a3b8" stroke-width="2"/>
      <!-- Red Brand of Sacrifice -->
      <path d="M32 22 L36 28 L32 34 L28 28 Z M32 22 L32 40" stroke="#dc2626" stroke-width="1.5" fill="none"/>
    `;
  } else if (name.includes("saber")) {
    // Saber: Excalibur golden cross sword & crown
    innerSvg = `
      <polygon points="32,8 35,26 44,26 44,30 35,30 34,54 30,54 29,30 20,30 20,26 29,26" fill="#fde047" stroke="#ca8a04" stroke-width="1" filter="drop-shadow(0 0 6px #fef08a)"/>
      <circle cx="32" cy="28" r="3" fill="#38bdf8"/>
    `;
  } else if (name.includes("miyabi")) {
    // Miyabi: Kitsune mask & icy blue blade
    innerSvg = `
      <!-- Kitsune Fox Mask -->
      <polygon points="32,20 42,28 38,44 26,44 22,28" fill="#f8fafc" stroke="#38bdf8" stroke-width="1.5"/>
      <polygon points="22,28 20,18 27,24" fill="#38bdf8"/>
      <polygon points="42,28 44,18 37,24" fill="#38bdf8"/>
      <!-- Eye slits -->
      <path d="M26 32 Q29 35 30 32" stroke="#dc2626" stroke-width="1.5" fill="none"/>
      <path d="M38 32 Q35 35 34 32" stroke="#dc2626" stroke-width="1.5" fill="none"/>
    </svg>`;
  } else {
    // Generic stylish anime avatar
    innerSvg = `
      <circle cx="32" cy="32" r="18" fill="none" stroke="${borderColor}" stroke-width="2" stroke-dasharray="4 2"/>
      <text x="32" y="38" font-size="16" font-family="'Kanit', sans-serif" font-weight="700" fill="#ffffff" text-anchor="middle">${initials}</text>
    `;
  }

  return `
    <div style="width: 72px; height: 72px; border-radius: 16px; background: ${bgGrad}; border: 2px solid ${borderColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(0,0,0,0.5); position: relative; overflow: hidden; flex-shrink: 0;">
      <svg viewBox="0 0 64 64" width="60" height="60">
        ${innerSvg}
      </svg>
    </div>
  `;
}
