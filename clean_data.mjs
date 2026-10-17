import fs from 'node:fs';

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

const raw = fs.readFileSync('data.json', 'utf8');
const d = JSON.parse(raw);

if (d.player) {
  d.player.level = 457;
}
if (d.playerProg) {
  d.playerProg.level = 457;
}

if (Array.isArray(d.serverLeaderboard)) {
  d.serverLeaderboard = d.serverLeaderboard.filter(p => !FAKE_MOCK_NAMES.has(p.name));
  d.serverLeaderboard.forEach((p, idx) => {
    p.rank = idx + 1;
    if (p.isLocal) p.level = 457;
  });
}

if (Array.isArray(d.globalLeaderboard)) {
  d.globalLeaderboard = d.globalLeaderboard.filter(p => !FAKE_MOCK_NAMES.has(p.name));
  d.globalLeaderboard.forEach((p, idx) => {
    p.rank = idx + 1;
    if (p.isLocal) p.level = 457;
  });
}

fs.writeFileSync('data.json', JSON.stringify(d, null, 2), 'utf8');
console.log('Cleaned data.json successfully.');
console.log('Server Leaderboard length:', d.serverLeaderboard.length, d.serverLeaderboard);
console.log('Global Leaderboard length:', d.globalLeaderboard.length, d.globalLeaderboard);
