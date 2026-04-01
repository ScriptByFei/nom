'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  NOM — Maze Chase  |  v2 — fixed collision & corridors
// ═══════════════════════════════════════════════════════════════════════════

// ── Config ───────────────────────────────────────────────────────────────
const TILE        = 40;   // Logical tile px size (fixed, canvas scales)
const PLAYER_R    = 14;   // Visual radius in px
const GHOST_R     = 14;
const DOT_R       = 4;
const POWER_R     = 8;
const WALL_PAD    = 3;     // Wall inset padding (creates corridors)

// TIMING: ms per tile move — adjust these values
const PLAYER_MS_PER_TILE = 280;  // Player: 280ms per tile (≈3.6 tiles/sec — comfortable)
const ENEMY_MS_PER_TILE = 350;  // Enemy:  350ms per tile (slightly slower than player)
const ENEMY_FRIGHT_MS   = 700;  // Enemy frightened: half speed
const START_LIVES = 3;
const LEVELS      = 7;

const T_WALL = 1, T_PATH = 0, T_DOT = 2, T_PWR = 3, T_HOUS = 4, T_FRUIT = 5;

// Fruit types: cherry, strawberry, orange
const FRUITS = [
  {type:'cherry',   col:'#ff3333', pts:100, prob:0.5},
  {type:'strawberry',col:'#ff6688',pts:200, prob:0.3},
  {type:'orange',   col:'#ffaa33', pts:500, prob:0.2}
];

// Fruit state
let currentFruit = null; // {x, y, type} or null
let fruitActive = false;
let fruitTimer = 0; // frames until next spawn (30-60 sec at 60fps = 1800-3600)

// Colors
const C = {
  bg:    '#0a0a18',
  wall:  '#9966ff',   // Brighter purple — visible on dark bg
  wallD: '#7755dd',   // Slightly darker inner
  dot:   '#ffdd44',
  power: '#00ffcc',
  player:'#ffee00',
  pw: ['#ff3366','#ff66ff','#33ccff','#ffaa33'],
  house: '#110022',
};

// ── Level Maps ─────────────────────────────────────────────────────────────
// 0=path, 1=wall, 2=dot, 3=power, 4=ghost house (center)
// Designed with CORRIDORS: paths are explicit walkable corridors
const LEVEL_MAPS = [
  // Level 1 — Simple open corridors
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,3,1,0,1,2,1,0,1,2,1,0,1,3,1],
    [1,2,1,0,1,2,2,2,2,2,1,0,1,2,1],
    [1,2,2,2,2,0,0,0,0,0,2,2,2,2,1],
    [1,1,1,1,1,0,4,4,4,0,1,1,1,1,1],
    [1,2,2,2,2,0,4,4,4,0,2,2,2,2,1],
    [1,2,1,0,1,2,2,2,2,2,1,0,1,2,1],
    [1,3,1,0,1,2,1,0,1,2,1,0,1,3,1],
    [1,2,1,1,1,2,1,1,1,2,1,1,1,2,1],
    [1,2,2,2,2,2,2,1,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 2 — More complex
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,2,1,1,1,1,1,2,2,1],
    [1,3,1,0,0,1,2,0,2,0,0,0,0,1,3,2,1],
    [1,2,1,0,2,2,2,2,2,2,2,2,0,1,2,2,1],
    [1,2,2,2,2,0,0,0,0,0,0,2,2,2,2,2,1],
    [1,1,1,1,2,0,4,4,4,4,0,2,1,1,1,1,1],
    [1,2,2,2,2,0,4,4,4,4,0,2,2,2,2,2,1],
    [1,2,1,2,2,2,2,2,1,2,2,2,2,1,2,2,1],
    [1,3,1,2,0,0,0,0,0,0,0,0,2,1,3,2,1],
    [1,2,1,2,2,2,2,2,1,2,2,2,2,1,2,2,1],
    [1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 3 — Classic layout
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,2,1,2,1,2,1,1,1,1,2,1],
    [1,3,1,0,0,1,2,0,2,0,2,0,2,1,0,0,1,3,1],
    [1,2,1,0,2,2,2,2,2,2,2,2,2,2,2,0,1,2,1],
    [1,2,2,2,2,0,0,0,1,1,1,0,0,0,2,2,2,2,1],
    [1,1,1,1,2,0,1,0,0,0,0,0,1,0,2,1,1,1,1],
    [1,2,2,2,2,0,1,0,4,4,4,0,1,0,2,2,2,2,1],
    [1,1,1,1,2,0,1,0,4,4,4,0,1,0,2,1,1,1,1],
    [1,2,2,2,2,0,1,1,1,1,1,1,1,0,2,2,2,2,1],
    [1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,1],
    [1,3,1,2,0,0,0,0,0,0,0,0,0,0,2,1,3,2,1],
    [1,2,1,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,1],
    [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 4 — Challenge
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,2,1,2,1,2,1,2,1,1,1,1,1,2,1],
    [1,3,1,0,0,0,1,2,0,2,0,2,0,2,1,0,0,0,1,3,1],
    [1,2,1,0,2,0,2,2,2,2,2,2,2,2,2,0,2,0,1,2,1],
    [1,2,2,2,2,2,0,0,0,1,1,1,0,0,0,2,2,2,2,2,1],
    [1,1,1,1,1,2,0,1,0,0,0,0,0,1,0,2,1,1,1,1,1],
    [1,2,2,2,2,2,0,1,0,4,4,4,0,1,0,2,2,2,2,2,1],
    [1,1,1,1,1,2,0,1,1,1,1,1,1,1,0,2,1,1,1,1,1],
    [1,2,2,2,2,2,0,0,0,0,0,0,0,0,0,2,2,2,2,2,1],
    [1,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,1],
    [1,3,1,2,0,0,0,0,0,0,0,0,0,0,0,2,1,3,2,2,1],
    [1,2,1,2,2,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 5 — Narrow corridors
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,2,1],
    [1,3,1,0,0,0,0,0,0,1,2,1,2,1,0,0,0,0,0,0,1,3,1],
    [1,2,1,0,2,2,2,2,0,1,2,2,2,1,0,2,2,2,2,0,1,2,1],
    [1,2,2,2,2,0,0,2,2,2,2,0,2,2,2,2,0,0,2,2,2,2,1],
    [1,1,1,1,2,0,4,4,4,4,0,4,0,4,4,4,4,0,2,1,1,1,1],
    [1,2,2,2,2,0,4,4,4,4,0,4,0,4,4,4,4,0,2,2,2,2,1],
    [1,2,1,0,2,2,2,2,0,1,2,2,2,1,0,2,2,2,2,0,1,2,1],
    [1,3,1,0,0,0,0,0,0,1,2,1,2,1,0,0,0,0,0,0,1,3,1],
    [1,2,1,1,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 6 — Double ghost house
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,3,1,0,0,1,2,0,0,0,0,1,0,0,0,2,1,0,0,0,1,3,1],
    [1,2,1,0,2,2,2,2,2,2,0,1,0,2,2,2,2,2,2,0,1,2,1],
    [1,2,2,2,2,0,0,0,0,2,2,2,2,2,0,0,0,0,2,2,2,2,1],
    [1,1,1,2,2,0,4,4,4,4,4,0,4,4,4,4,4,0,2,2,1,1,1],
    [1,2,2,2,2,0,4,4,4,4,4,0,4,4,4,4,4,0,2,2,2,2,1],
    [1,2,1,0,2,2,2,2,2,2,0,1,0,2,2,2,2,2,2,0,1,2,1],
    [1,3,1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,3,1],
    [1,2,1,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
  // Level 7 — Ultimate challenge
  [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,1],
    [1,2,1,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,1,2,1],
    [1,2,2,2,2,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,2,2,2,2,1],
    [1,1,1,1,2,0,4,4,4,4,0,1,1,0,4,4,4,4,0,2,1,1,1,1,1],
    [1,2,2,2,2,0,4,4,4,4,0,1,1,0,4,4,4,4,0,2,2,2,2,2,1],
    [1,2,1,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,0,1,2,1],
    [1,3,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,3,1],
    [1,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ],
];

// ── DOM ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  start:    $('start-screen'),
  howto:    $('howto-screen'),
  game:     $('game-screen'),
  pause:    $('pause-screen'),
  gameover: $('gameover-screen'),
  leaderboard: $('leaderboard-screen'),
};
const canvas = $('game-canvas');
const ctx    = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// Map canvas cache for performance
const mapCanvas = document.createElement('canvas');
let mapCacheDirty = true;

// ── Game State ─────────────────────────────────────────────────────────────
let score=0, lives=START_LIVES, level=1;
let map=[], mapRows=0, mapCols=0;
let dotsTotal=0, dotsEaten=0;
let player={}, enemies=[];
let powerMode=false, powerTimer=0;
let lastMoveTime=0;
let animID=null, tick=0;
let state='start';

// ── Audio ───────────────────────────────────────────────────────────────────
let _ac=null;
let musicEnabled=true;
let bgMusicInterval=null;
let bgMusicOsc=null;
let ghostEatCombo=0;
let lastExtraLifeScore=0;

// Initialize AudioContext on first user interaction (mobile browser requirement)
function initAudio() {
  if(!_ac) {
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      return false;
    }
  }
  // Resume if suspended (mobile browsers start in suspended state)
  if(_ac.state === 'suspended') {
    _ac.resume();
  }
  return true;
}

// Get ready-to-use AudioContext (creates if needed, resumes if suspended)
const ac = () => {
  if(!_ac) {
    try {
      _ac = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      return null;
    }
  }
  if(_ac.state === 'suspended') {
    _ac.resume();
  }
  return _ac;
};

// Optimized tone function - accepts optional volume override
function tone(f, d, t = 'square', v = .10) {
  const a = ac();
  if(!a) return;
  try {
    const o = a.createOscillator(), g = a.createGain();
    o.connect(g);
    g.connect(a.destination);
    o.type = t;
    o.frequency.value = f;
    g.gain.value = v;
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d);
    o.start(a.currentTime);
    o.stop(a.currentTime + d);
  } catch(e) {}
}

const SFX = {
  // Waka-waka: alternate between two tones for eating dots
  _wakaTone:false,
  eat:()=>{ SFX._wakaTone=!SFX._wakaTone; tone(SFX._wakaTone?620:500,.04,'square',.08); },
  power:()=>{ tone(380,.08,'sawtooth',.12); setTimeout(()=>tone(700,.12,'sawtooth',.12),70); },
  // Ghost eaten: higher pitch based on combo (resets when player dies)
  eatGhost:()=>{ ghostEatCombo++; const baseFreq=900+Math.min(ghostEatCombo,4)*150; tone(baseFreq,.07,'square',.12); setTimeout(()=>tone(baseFreq*1.33,.1,'square',.12),55); },
  die:()=>{ tone(300,.1,'sawtooth',.15); setTimeout(()=>tone(200,.18,'sawtooth',.12),110); setTimeout(()=>tone(150,.28,'sawtooth',.1),260); ghostEatCombo=0; },
  // Extra life: ascending arpeggio
  extraLife:()=>{ [262,330,392,523,659].forEach((f,i)=>setTimeout(()=>tone(f,.15,'square',.12),i*70)); },
  // Level complete fanfare (extended)
  levelUp:()=>{ [523,659,784,1047,1319,1568].forEach((f,i)=>setTimeout(()=>tone(f,.13,'square',.12),i*80)); },
  // Fruit eaten: ascending cheerful tone
  fruitEat:()=>{ tone(880,.08,'sine',.14); setTimeout(()=>tone(1100,.1,'sine',.12),60); setTimeout(()=>tone(1320,.12,'sine',.1),130); },
};

// Background music: simple looping arpeggio melody
function startBackgroundMusic() {
  if(!musicEnabled) return;
  const a=ac(); if(!a) return;
  stopBackgroundMusic();
  // C minor arpeggio pattern for ambient background
  const mel=[261,311,349,392,440,392,349,311,261,311,392,440,349,311,261,220];
  let idx=0;
  const step=()=>{
    if(!musicEnabled) return;
    const f=mel[idx%mel.length], v=.06;
    const o=a.createOscillator(),g=a.createGain();
    o.type='triangle'; o.frequency.value=f;
    g.gain.value=v; g.gain.exponentialRampToValueAtTime(.001,a.currentTime+.18);
    o.connect(g); g.connect(a.destination);
    o.start(a.currentTime); o.stop(a.currentTime+.22);
    idx++;
  };
  step(); bgMusicInterval=setInterval(step,220);
}
function stopBackgroundMusic() { if(bgMusicInterval){clearInterval(bgMusicInterval);bgMusicInterval=null;} }
function pauseBackgroundMusic() { musicEnabled=false; stopBackgroundMusic(); }
function resumeBackgroundMusic() { if(!musicEnabled)return; musicEnabled=true; startBackgroundMusic(); }
function toggleMusic() {
  musicEnabled=!musicEnabled;
  const btn=document.getElementById('muteBtn');
  if(btn) btn.textContent=musicEnabled?'🔊':'🔇';
  if(musicEnabled) startBackgroundMusic(); else stopBackgroundMusic();
}
// Create mute button UI element
function createMuteButton() {
  if(document.getElementById('muteBtn')) return;
  const btn=document.createElement('button');
  btn.id='muteBtn'; btn.textContent='🔊';
  btn.style.cssText='position:fixed;top:10px;right:10px;z-index:1000;background:rgba(0,0,0,.5);border:1px solid #fff;border-radius:5px;color:#fff;padding:5px 10px;cursor:pointer;font-size:16px;';
  btn.addEventListener('click',toggleMusic);
  document.body.appendChild(btn);
}

// ── Storage ────────────────────────────────────────────────────────────────
const getHigh = () => parseInt(localStorage.getItem('nom_hi')||'0');
const setHigh = v => { if(v>getHigh()) localStorage.setItem('nom_hi',String(v)); };

// ── Leaderboard ─────────────────────────────────────────────────────────────
let leaderboard = [];
let localLeaderboard = [];
const LB_KEY = 'nom_lb_local';
const LB_MAX = 10;

// Simple hash for nicknames (bcrypt-style prefix for future compatibility)
function simpleHash(nick) {
  // Encode nick as UTF-8 then base64, prepend bcrypt-style prefix
  try {
    const enc = new TextEncoder();
    const data = enc.encode(nick.toUpperCase());
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = ((hash << 5) - hash) + data[i];
      hash = hash & hash; // keep as 32bit int
    }
    // Generate a simple base64-ish string from hash
    const h1 = (hash >>> 16) & 0xFFFF;
    const h2 = hash & 0xFFFF;
    const b64 = btoa(String.fromCharCode(h1 & 0xFF, (h1 >> 8) & 0xFF, h2 & 0xFF, (h2 >> 8) & 0xFF));
    return '$2a$10$' + b64.replace(/=/g, '').substring(0, 16);
  } catch (e) {
    return '$2a$10$' + nick.toUpperCase().split('').map(c => c.charCodeAt(0).toString(16).padStart(2,'0')).join('').substring(0, 16);
  }
}

// Encode score data for localStorage (simple XOR encoding)
function encodeScoreData(data) {
  const json = JSON.stringify(data);
  try {
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    return btoa(json);
  }
}

// Decode score data from localStorage
function decodeScoreData(encoded) {
  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Load leaderboard from localStorage
function loadLeaderboard() {
  try {
    const raw = localStorage.getItem(LB_KEY);
    if (!raw) return [];
    const decoded = decodeScoreData(raw);
    if (!Array.isArray(decoded)) return [];
    // Validate and sanitize entries
    return decoded.filter(e => e && typeof e.nick === 'string' && typeof e.score === 'number').slice(0, LB_MAX);
  } catch (e) {
    return [];
  }
}

// Save leaderboard to localStorage
function saveLeaderboard(lb) {
  try {
    const encoded = encodeScoreData(lb);
    localStorage.setItem(LB_KEY, encoded);
  } catch (e) {
    console.warn('Failed to save leaderboard:', e);
  }
}

// Add a score to leaderboard, returns rank (1-based) or 0 if not in top 10
function addToLeaderboard(nick, score, lvl) {
  if (score <= 0) return 0;
  const hashedNick = simpleHash(nick);
  const entry = { nick: hashedNick, nickRaw: nick.toUpperCase().substring(0, 3), score, level: lvl, date: Date.now() };
  localLeaderboard.push(entry);
  // Sort by score descending, then by date ascending (older first for ties)
  localLeaderboard.sort((a, b) => b.score - a.score || a.date - b.date);
  localLeaderboard = localLeaderboard.slice(0, LB_MAX);
  saveLeaderboard(localLeaderboard);
  // Find rank of new entry
  const rank = localLeaderboard.findIndex(e => e.date === entry.date && e.nick === entry.nick);
  return rank >= 0 ? rank + 1 : 0;
}

// Check if score qualifies for leaderboard
function qualifiesForLeaderboard(score) {
  if (score <= 0) return false;
  if (localLeaderboard.length < LB_MAX) return true;
  return score > localLeaderboard[localLeaderboard.length - 1].score;
}

// Render leaderboard table
function renderLeaderboard(highlightNick = null) {
  const tbody = $('lb-tbody');
  if (!tbody) return;
  if (localLeaderboard.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="color:var(--col-dim);font-size:12px;padding:20px">NO SCORES YET</td></tr>';
    return;
  }
  let html = '';
  for (let i = 0; i < localLeaderboard.length; i++) {
    const e = localLeaderboard[i];
    const isCurrent = highlightNick && e.nickRaw === highlightNick;
    html += `<tr class="${isCurrent ? 'current-player' : ''}">
      <td class="lb-rank">${i + 1}</td>
      <td class="lb-name">${e.nickRaw || '???'}</td>
      <td class="lb-score">${e.score}</td>
      <td class="lb-level">${e.level}</td>
    </tr>`;
  }
  tbody.innerHTML = html;
}

// Initialize leaderboard on load
localLeaderboard = loadLeaderboard();

// ── Screen ─────────────────────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([k,el])=>el.classList.toggle('active',k===name));
  document.body.classList.toggle('game-active',name==='game');
  state=name;
  // Render canvas bg so there's no black flash
  if(canvas.width>0) render();
}

// ── Map ────────────────────────────────────────────────────────────────────
function initMap(lvl) {
  const raw = LEVEL_MAPS[(lvl-1)%LEVELS];
  mapRows=raw.length; mapCols=raw[0].length;
  map=raw.map(r=>[...r]);
  dotsTotal=0; dotsEaten=0;
  for(let y=0;y<mapRows;y++) for(let x=0;x<mapCols;x++)
    if(map[y][x]===T_DOT||map[y][x]===T_PWR) dotsTotal++;
  mapCacheDirty = true;
}

function tileWalkable(x,y) {
  if(y<0||y>=mapRows) return false;
  const xw=((x%mapCols)+mapCols)%mapCols;
  const t=map[y][xw];
  return t!==T_WALL;
}

// Find a random valid path tile for fruit spawn (not near ghost house)
function findFruitSpawnPos() {
  const hx=Math.floor(mapCols/2), hy=Math.floor(mapRows/2);
  const candidates=[];
  for(let y=0;y<mapRows;y++) {
    for(let x=0;x<mapCols;x++) {
      if(!tileWalkable(x,y)) continue;
      // Skip if near ghost house (within 3 tiles)
      if(Math.abs(x-hx)<=3&&Math.abs(y-hy)<=2) continue;
      // Prefer outer areas
      if(y<2||y>mapRows-3) continue;
      candidates.push({x,y});
    }
  }
  if(!candidates.length) return null;
  return candidates[Math.floor(Math.random()*candidates.length)];
}

// Pick a random fruit type based on probability
function pickFruitType() {
  let r=Math.random(), cum=0;
  for(const f of FRUITS) { cum+=f.prob; if(r<cum) return f; }
  return FRUITS[0];
}

function tileAt(x,y) {
  if(y<0||y>=mapRows) return T_WALL;
  return map[y][((x%mapCols)+mapCols)%mapCols];
}

function wrapX(x) { return ((x%mapCols)+mapCols)%mapCols; }

// ── Canvas Sizing ───────────────────────────────────────────────────────────
function resizeCanvas() {
  const wrap=$('canvas-wrap');
  const ww=wrap.clientWidth-4, wh=wrap.clientHeight-4;
  const maxW=Math.floor(ww/mapCols), maxH=Math.floor(wh/mapRows);
  const ts=Math.min(maxW,maxH,56);
  canvas.width=mapCols*ts; canvas.height=mapRows*ts;
  canvas.style.width=canvas.width+'px'; canvas.style.height=canvas.height+'px';
  return ts;
}

// ── Entity Init ─────────────────────────────────────────────────────────────
function findSpawn() {
  // Spawn: bottom-center, walkable
  for(let y=mapRows-1;y>=0;y--)
    for(let x=Math.floor(mapCols/2)-1;x<=Math.floor(mapCols/2)+1;x++)
      if(x>=0&&x<mapCols&&tileWalkable(x,y)) return {x,y};
  for(let y=mapRows-1;y>=0;y--)
    for(let x=0;x<mapCols;x++)
      if(tileWalkable(x,y)) return {x,y};
  return {x:Math.floor(mapCols/2),y:mapRows-2};
}

function initPlayer() {
  const sp=findSpawn();
  player={x:sp.x,y:sp.y,dir:'left',nextDir:'left',mouth:0};
}

function initEnemies() {
  const house=[];
  for(let y=0;y<mapRows;y++) for(let x=0;x<mapCols;x++)
    if(map[y][x]===T_HOUS) house.push({x,y});
  if(!house.length) house.push({x:Math.floor(mapCols/2),y:Math.floor(mapRows/2)});
  const count=Math.min(2+level,6);
  const names=['Blinky','Pinky','Inky','Clyde'];
  enemies=[];
  for(let i=0;i<count;i++) {
    const h=house[i%house.length];
    enemies.push({
      x:h.x,y:h.y,
      dir:'up',
      name: names[i%names.length],
      color:C.pw[i%C.pw.length],
      mode: i===0?'chase':'house',
      releaseDelay: i*160,
      frightenedTimer:0,
    });
  }
}

// ── Game Control ───────────────────────────────────────────────────────────
function startGame() {
  score=0; lives=START_LIVES; level=1; powerMode=false; powerTimer=0;
  lastMoveTime=0; // reset so first move is immediate
  ghostEatCombo=0;
  currentFruit=null; fruitActive=false; fruitTimer=Math.floor(30+Math.random()*30)*60; // 30-60 sec
  createMuteButton();
  initAudio(); // Initialize/resume AudioContext on user interaction
  loadLevel();
  showScreen('game');
  startBackgroundMusic();
  if(animID) cancelAnimationFrame(animID);
  animID=requestAnimationFrame(loop);
}

function loadLevel() {
  const ts=resizeCanvas();
  initMap(level);
  initPlayer();
  initEnemies();
  updateHUD(); updateLivesDisplay();
}

function nextLevel() {
  level++;
  SFX.levelUp();
  showOverlay(`LEVEL ${level}`,'GET READY!',1600);
  setTimeout(loadLevel,1700);
}

function playerDied() {
  lives--;
  updateLivesDisplay();
  SFX.die();
  if(lives<=0) { gameOver(); return; }
  showOverlay('OUCH!',`${lives} ${lives===1?'LIFE':'LIVES'} LEFT`,1300);
  setTimeout(initPlayer,1350);
}

function gameOver() {
  cancelAnimationFrame(animID);
  pauseBackgroundMusic();
  const hi=getHigh(), isNew=score>hi;
  if(isNew) setHigh(score);
  $('go-score').textContent=score;
  $('go-high').textContent=isNew?score:hi;
  $('new-record').classList.toggle('hidden',!isNew);
  // Show submit score option if qualifies
  const canSubmit = score > 0 && (isNew || qualifiesForLeaderboard(score));
  $('submit-score-wrap').classList.toggle('hidden', !canSubmit);
  if (canSubmit) {
    $('lb-nick').value = '';
  }
  showScreen('gameover');
}

// ── HUD ────────────────────────────────────────────────────────────────────
function updateHUD() {
  $('score').textContent=score;
  $('highscore').textContent=getHigh();
  $('level-num').textContent=level;
  $('hs-start').textContent=getHigh();
  const dbg=$('debug-speed');
  if(dbg) dbg.textContent=PLAYER_MS_PER_TILE;
}
function updateLivesDisplay() {
  for(let i=1;i<=START_LIVES;i++) {
    const el=$(`life-${i}`);
    if(el) el.classList.toggle('lost',i>lives);
  }
}
function showOverlay(title,sub,ms=2000) {
  const el=$('overlay-msg');
  el.innerHTML=`<div>${title}</div>${sub?`<div style="font-size:.55em;color:var(--col-dim);margin-top:6px">${sub}</div>`:''}`;
  el.classList.remove('hidden');
  clearTimeout(el._tid);
  el._tid=setTimeout(()=>el.classList.add('hidden'),ms);
}

// ── Movement ────────────────────────────────────────────────────────────────
const DIRS=['up','down','left','right'];
const DX={up:0,down:0,left:-1,right:1};
const DY={up:-1,down:1,left:0,right:0};
const OPP={up:'down',down:'up',left:'right',right:'left'};

function tryBufferedTurn(ent) {
  const nx=ent.x+DX[ent.nextDir], ny=ent.y+DY[ent.nextDir];
  if(tileWalkable(nx,ny)) {
    ent.dir=ent.nextDir;
    return true;
  }
  return false;
}

function movePlayer(now) {
  // Move exactly every PLAYER_MS_PER_TILE ms
  if(now - lastMoveTime < PLAYER_MS_PER_TILE) return;
  lastMoveTime = now;

  // Try buffered direction first
  tryBufferedTurn(player);

  // Move in current direction
  const nx=player.x+DX[player.dir], ny=player.y+DY[player.dir];
  if(tileWalkable(nx,ny)) {
    player.x=wrapX(nx); player.y=ny;
  }
  // Tunnel wrap
  if(player.x<0) player.x=mapCols-1;
  if(player.x>=mapCols) player.x=0;
}

function moveEnemy(en, now) {
  if(en.mode==='house') {
    en.releaseDelay--;
    if(en.releaseDelay<=0) {
      // Move out of house
      en.x=Math.floor(mapCols/2); en.y=Math.floor(mapRows/2)-1;
      en.mode='chase'; en.dir='up';
    }
    return;
  }
  if(en.mode==='eaten') {
    // Return to house
    const hx=Math.floor(mapCols/2), hy=Math.floor(mapRows/2);
    if(Math.abs(en.x-hx)<=1&&Math.abs(en.y-hy)<=1) {
      en.mode='house'; en.releaseDelay=100;
    } else {
      // Move toward house
      const dx=Math.sign(hx-en.x), dy=Math.sign(hy-en.y);
      if(dx!==0&&tileWalkable(en.x+dx,en.y)) en.x+=dx;
      else if(dy!==0&&tileWalkable(en.x,en.y+dy)) en.y+=dy;
    }
    return;
  }

  // Time-based: enemies per-tile timing
  const enSpd = en.mode === 'frightened' ? ENEMY_FRIGHT_MS : ENEMY_MS_PER_TILE;
  if(now - (en._lastMove || 0) < enSpd) return;
  en._lastMove = now;

  // Choose direction
  if(en.mode==='frightened') {
    // Random turn at intersections
    const opts=[];
    for(const d of DIRS) {
      if(d===OPP[en.dir]) continue;
      if(tileWalkable(en.x+DX[d],en.y+DY[d])) opts.push(d);
    }
    if(opts.length>0) en.dir=opts[Math.floor(Math.random()*opts.length)];
  } else {
    // Get target based on ghost personality
    let tx, ty;
    const name = en.name || 'Blinky';
    switch(name) {
      case 'Blinky':
        // Blinky: Direct chase - always targets player position
        tx = player.x;
        ty = player.y;
        break;
      case 'Pinky':
        // Pinky: Ambush - targets 4 tiles ahead of player's current direction
        tx = player.x + DX[player.dir] * 4;
        ty = player.y + DY[player.dir] * 4;
        break;
      case 'Inky':
        // Inky: Unpredictable - periodically uses scatter mode with random targets
        if(!en._inkyScatter) en._inkyScatter = Math.floor(Math.random() * 30) + 20;
        en._inkyScatter--;
        if(en._inkyScatter <= 0) {
          en._inkyScatter = Math.floor(Math.random() * 30) + 20;
          tx = Math.floor(Math.random() * mapCols);
          ty = Math.floor(Math.random() * mapRows);
        } else {
          tx = player.x; ty = player.y;
        }
        break;
      case 'Clyde':
        // Clyde: Shy - chases when far (>8 tiles), scatters when close
        const distToPlayer = Math.hypot(en.x - player.x, en.y - player.y);
        if(distToPlayer > 8) {
          tx = player.x; ty = player.y;
        } else {
          // Scatter to bottom-left corner
          tx = 0; ty = mapRows - 1;
        }
        break;
      default:
        tx = player.x; ty = player.y;
    }
    
    // Pick direction that minimizes distance to target
    const opp=OPP[en.dir];
    let best=null, bestD=Infinity;
    for(const d of DIRS) {
      if(d===opp) continue;
      const nx=en.x+DX[d], ny=en.y+DY[d];
      if(!tileWalkable(nx,ny)) continue;
      const dist=Math.hypot(nx-tx,ny-ty);
      if(dist<bestD) { bestD=dist; best=d; }
    }
    if(best) en.dir=best;
  }

  const nx=en.x+DX[en.dir], ny=en.y+DY[en.dir];
  if(tileWalkable(nx,ny)) {
    en.x=wrapX(nx); en.y=ny;
  }
  if(en.x<0) en.x=mapCols-1;
  if(en.x>=mapCols) en.x=0;
}

// ── Collision ───────────────────────────────────────────────────────────────
function checkCollisions() {
  const tile=tileAt(player.x,player.y);
  if(tile===T_DOT) {
    map[player.y][player.x]=T_PATH;
    score+=10; dotsEaten++; SFX.eat();
    mapCacheDirty = true;
    checkComplete();
  } else if(tile===T_PWR) {
    map[player.y][player.x]=T_PATH;
    score+=50; dotsEaten++; powerMode=true; powerTimer=Math.round(5*60);
    enemies.forEach(e=>{ if(e.mode!=='eaten') e.mode='frightened'; });
    SFX.power();
    mapCacheDirty = true;
    checkComplete();
  }
  // Fruit collision
  if(fruitActive&&currentFruit&&player.x===currentFruit.x&&player.y===currentFruit.y) {
    score+=currentFruit.type.pts;
    SFX.fruitEat();
    fruitActive=false; currentFruit=null;
    updateHUD();
  }
  // Extra life every 1000 points
  if(Math.floor(score/1000)>Math.floor(lastExtraLifeScore/1000)) {
    lives++; updateLivesDisplay(); SFX.extraLife();
  }
  lastExtraLifeScore=score;
  updateHUD();
  for(const en of enemies) {
    if(en.x===player.x&&en.y===player.y) {
      if(en.mode==='frightened') { en.mode='eaten'; score+=200; SFX.eatGhost(); updateHUD(); }
      else if(en.mode==='chase') { playerDied(); return; }
    }
  }
}

function checkComplete() {
  if(dotsEaten>=dotsTotal) nextLevel();
}

// ── Update ─────────────────────────────────────────────────────────────────
function update() {
  if(state!=='game') return;
  tick++;
  if(powerMode) {
    powerTimer--;
    if(powerTimer<=0) {
      powerMode=false;
      enemies.forEach(e=>{ if(e.mode==='frightened') e.mode='chase'; });
    }
  }
  // Fruit spawn timer
  if(!fruitActive) {
    fruitTimer--;
    if(fruitTimer<=0) {
      const pos=findFruitSpawnPos();
      if(pos) {
        currentFruit={x:pos.x, y:pos.y, type:pickFruitType(), spawnTime:tick};
        fruitActive=true;
      }
      fruitTimer=Math.floor(30+Math.random()*30)*60; // next 30-60 sec
    }
  } else {
    // Despawn fruit after 10 seconds (600 frames)
    if(tick-currentFruit.spawnTime>600) {
      fruitActive=false; currentFruit=null;
    }
  }
  const now=performance.now();
  movePlayer(now);
  enemies.forEach(en=>moveEnemy(en,now));
  checkCollisions();
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const ts=Math.floor(canvas.width/mapCols);
  const pw=powerMode&&powerTimer<120&&tick%14<7;

  ctx.fillStyle=C.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Map (cached - only redraw when dirty)
  if(mapCacheDirty) {
    mapCanvas.width = canvas.width;
    mapCanvas.height = canvas.height;
    const mctx = mapCanvas.getContext('2d');
    mctx.imageSmoothingEnabled = false;
    mctx.fillStyle=C.bg;
    mctx.fillRect(0,0,mapCanvas.width,mapCanvas.height);
    for(let y=0;y<mapRows;y++) {
      for(let x=0;x<mapCols;x++) {
        const tile=map[y][x];
        const px=x*ts, py=y*ts;
        if(tile===T_WALL) {
          // Wall — bright purple, always visible
          mctx.fillStyle=C.wall;
          mctx.fillRect(px,py,ts,ts);
          mctx.fillStyle=C.wallD;
          mctx.fillRect(px+3,py+3,ts-6,ts-6);
        } else if(tile===T_DOT) {
          // Path bg — dark blue so corridors are visible
          mctx.fillStyle='#1e1e3a';
          mctx.fillRect(px,py,ts,ts);
          // Dot
          mctx.fillStyle=C.dot;
          mctx.beginPath();
          mctx.arc(px+ts/2,py+ts/2,DOT_R*(ts/40),0,Math.PI*2);
          mctx.fill();
        } else if(tile===T_PWR) {
          // Path bg
          mctx.fillStyle='#1e1e3a';
          mctx.fillRect(px,py,ts,ts);
          // Power pellet (static, no animation in cache)
          mctx.fillStyle=C.power;
          mctx.shadowBlur=12; mctx.shadowColor=C.power;
          mctx.beginPath();
          mctx.arc(px+ts/2,py+ts/2,POWER_R*(ts/40),0,Math.PI*2);
          mctx.fill();
          mctx.shadowBlur=0;
        } else if(tile===T_HOUS) {
          mctx.fillStyle=C.house;
          mctx.fillRect(px,py,ts,ts);
        } else {
          // Empty path — visible dark blue
          mctx.fillStyle='#1e1e3a';
          mctx.fillRect(px,py,ts,ts);
        }
      }
    }
    mapCacheDirty = false;
  }
  ctx.drawImage(mapCanvas, 0, 0);

  // Fruit rendering (drawn over path tiles, before player/ghosts)
  if(fruitActive&&currentFruit) {
    const fx=currentFruit.x*ts+ts/2, fy=currentFruit.y*ts+ts/2;
    const pulse=Math.sin(tick*.15)*.15+.85; // pulsing scale
    const fr=ts*.35*pulse;
    ctx.shadowBlur=10; ctx.shadowColor=currentFruit.type.col;

    if(currentFruit.type.type==='cherry') {
      // Two red circles with stem
      ctx.fillStyle=currentFruit.type.col;
      ctx.beginPath(); ctx.arc(fx-fr*.5,fy+fr*.2,fr*.55,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(fx+fr*.5,fy+fr*.2,fr*.55,0,Math.PI*2); ctx.fill();
      // Stem
      ctx.strokeStyle='#44aa44'; ctx.lineWidth=2*(ts/40);
      ctx.beginPath(); ctx.moveTo(fx-fr*.3,fy-fr*.1); ctx.quadraticCurveTo(fx,fy-fr*.7,fx+fr*.2,fy-fr*.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx+fr*.2,fy-fr*.5); ctx.lineTo(fx+fr*.4,fy-fr*.7); ctx.stroke();
      // Highlight
      ctx.fillStyle='rgba(255,255,255,.35)';
      ctx.beginPath(); ctx.arc(fx-fr*.65,fy+fr*.05,fr*.15,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(fx+fr*.35,fy+fr*.05,fr*.15,0,Math.PI*2); ctx.fill();
    } else if(currentFruit.type.type==='strawberry') {
      // Strawberry: heart-ish shape
      ctx.fillStyle=currentFruit.type.col;
      ctx.beginPath();
      ctx.moveTo(fx,fy+fr*.7);
      ctx.bezierCurveTo(fx-fr*.8,fy+fr*.3,fx-fr*.6,fy-fr*.5,fx,fy-fr*.3);
      ctx.bezierCurveTo(fx+fr*.6,fy-fr*.5,fx+fr*.8,fy+fr*.3,fx,fy+fr*.7);
      ctx.fill();
      // Seeds
      ctx.fillStyle='#ffcc00';
      for(let i=0;i<5;i++) {
        const sx=fx+(Math.sin(i*1.3+tick*.05)*fr*.35);
        const sy=fy+(Math.cos(i*2.1)*fr*.3)+fr*.1;
        ctx.beginPath(); ctx.ellipse(sx,sy,fr*.06,fr*.1,0,0,Math.PI*2); ctx.fill();
      }
      // Leaves
      ctx.fillStyle='#44aa44';
      ctx.beginPath();
      ctx.ellipse(fx-fr*.25,fy-fr*.35,fr*.2,fr*.1,-.4,false); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx+fr*.25,fy-fr*.35,fr*.2,fr*.1,.4,false); ctx.fill();
      ctx.beginPath();
      ctx.ellipse(fx,fy-fr*.45,fr*.15,fr*.08,0,false); ctx.fill();
    } else {
      // Orange: circle with leaf
      ctx.fillStyle=currentFruit.type.col;
      ctx.beginPath(); ctx.arc(fx,fy,fr*.65,0,Math.PI*2); ctx.fill();
      // Texture dots
      ctx.fillStyle='rgba(255,180,0,.4)';
      for(let i=0;i<6;i++) {
        const a=(i/6)*Math.PI*2;
        ctx.beginPath(); ctx.arc(fx+Math.cos(a)*fr*.35,fy+Math.sin(a)*fr*.35,fr*.1,0,Math.PI*2); ctx.fill();
      }
      // Leaf
      ctx.fillStyle='#44aa44';
      ctx.beginPath(); ctx.ellipse(fx+fr*.15,fy-fr*.55,fr*.25,fr*.12,.3,false); ctx.fill();
      // Highlight
      ctx.fillStyle='rgba(255,255,255,.3)';
      ctx.beginPath(); ctx.arc(fx-fr*.2,fy-fr*.2,fr*.18,0,Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur=0;
  }

  // Ghosts
  for(const en of enemies) {
    const ex=en.x*ts+ts/2, ey=en.y*ts+ts/2, r=GHOST_R*(ts/40);
    if(en.mode==='eaten') { drawGEyes(ex,ey,r*.6,en.dir); continue; }
    let col=en.color;
    if(en.mode==='frightened') col=pw?'#eee':'#2244ff';
    ctx.fillStyle=col;
    ctx.shadowBlur=6; ctx.shadowColor=col;
    ctx.beginPath();
    ctx.arc(ex,ey-r*.1,r,Math.PI,0,false);
    ctx.lineTo(ex+r,ey+r*.5);
    const wv=Math.sin(tick*.25)*r*.1;
    for(let i=3;i>=-3;i--) ctx.lineTo(ex+i*(r*.32),ey+r*.5+(i%2===0?r*.35+wv:0));
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0;
    if(en.mode==='frightened') {
      ctx.fillStyle='#fff';
      ctx.fillRect(ex-r*.5,ey-r*.2,r*.18,r*.18);
      ctx.fillRect(ex+r*.3,ey-r*.2,r*.18,r*.18);
      ctx.fillRect(ex-r*.35,ey+r*.12,r*.7,r*.15);
      // Show ghost name during frighten mode
      if(en.name) {
        ctx.fillStyle='#fff';
        ctx.font=`bold ${Math.max(8, ts*0.28)}px sans-serif`;
        ctx.textAlign='center';
        ctx.textBaseline='bottom';
        ctx.fillText(en.name, ex, ey - r - 2);
      }
    } else {
      drawGEyes(ex,ey,r,en.dir);
    }
  }

  // Player
  const px=player.x*ts+ts/2, py=player.y*ts+ts/2, pr=PLAYER_R*(ts/40);
  const ma=Math.abs(Math.sin(player.mouth))*.3;
  player.mouth=(player.mouth+.22)%Math.PI;
  ctx.fillStyle=C.player;
  ctx.shadowBlur=12; ctx.shadowColor=C.player;
  ctx.beginPath();
  const ba={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[player.dir]||0;
  ctx.arc(px,py,pr,ba+ma,ba+Math.PI*2-ma); ctx.lineTo(px,py); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0;
  const eo={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[player.dir]||[0,0];
  ctx.fillStyle='#222';
  ctx.beginPath(); ctx.arc(px+eo[0]*pr*.28,py+eo[1]*pr*.28-pr*.12,pr*.12,0,Math.PI*2); ctx.fill();
}

function drawGEyes(ex,ey,r,dir) {
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(ex-r*.28,ey-r*.18,r*.24,r*.28,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(ex+r*.28,ey-r*.18,r*.24,r*.28,0,0,Math.PI*2); ctx.fill();
  const o={up:[0,-.18],down:[0,.1],left:[-.18,0],right:[.18,0]}[dir]||[0,0];
  ctx.fillStyle='#0044cc';
  ctx.beginPath(); ctx.arc(ex-r*.28+o[0]*r,ey-r*.18+o[1]*r,r*.12,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex+r*.28+o[0]*r,ey-r*.18+o[1]*r,r*.12,0,Math.PI*2); ctx.fill();
}

// ── Game Loop ───────────────────────────────────────────────────────────────
function loop() {
  update(); render();
  animID=requestAnimationFrame(loop);
}

// ── Input ───────────────────────────────────────────────────────────────────
// Keyboard
document.addEventListener('keydown',e=>{
  const m={'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
           'w':'up','s':'down','a':'left','d':'right'};
  if(m[e.key]) { e.preventDefault(); player.nextDir=m[e.key]; }
  if(state==='start'&&(e.key===' '||e.key==='Enter')) { e.preventDefault(); startGame(); }
  if(state==='game'&&(e.key==='Escape'||e.key==='p'||e.key==='P')) togglePause();
});

// Double-tap zoom prevention
let lastTap=0;
document.addEventListener('touchend',function(e){
  const now=Date.now();
  if(now-lastTap<350) e.preventDefault();
  lastTap=now;
},{passive:false});

// Canvas swipe
let tx=0,ty=0;
canvas.addEventListener('touchstart',e=>{ e.preventDefault(); tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:false});
canvas.addEventListener('touchend',e=>{
  e.preventDefault();
  const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)<12&&Math.abs(dy)<12) return;
  player.nextDir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  if(state==='start') startGame();
},{passive:false});

$('btn-pause').addEventListener('click',()=>{ if(state==='game') togglePause(); });
$('btn-pause').addEventListener('touchstart',e=>{ e.preventDefault(); if(state==='game') togglePause(); },{passive:false});

// ── Virtual Joystick ───────────────────────────────────────────────────────
const isTouchDevice = () => ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
const joystickContainer = $('joystick-container');
const joystickBase = $('joystick-base');
const joystickKnob = $('joystick-knob');

const JOYSTICK_RADIUS = 60; // Half of the 120px base
const KNOB_RADIUS = 28;
const DEAD_ZONE = 12;

let joyActive = false;
let joyOriginX = 0, joyOriginY = 0;

function showJoystick() {
  if (isTouchDevice()) {
    joystickContainer.style.display = 'block';
  }
}

function hideJoystick() {
  joystickContainer.style.display = 'none';
}

function getJoystickDir(dx, dy) {
  if (Math.abs(dx) < DEAD_ZONE && Math.abs(dy) < DEAD_ZONE) return null;
  const angle = Math.atan2(dy, dx); // -π to π
  // up=(-π/2), down=π/2, left=π or -π, right=0
  if (angle > -Math.PI/4 && angle <= Math.PI/4) return 'right';
  if (angle > Math.PI/4 && angle <= 3*Math.PI/4) return 'down';
  if (angle > 3*Math.PI/4 || angle <= -3*Math.PI/4) return 'left';
  return 'up';
}

joystickContainer.addEventListener('touchstart', e => {
  e.preventDefault();
  joyActive = true;
  const t = e.changedTouches[0];
  const rect = joystickBase.getBoundingClientRect();
  joyOriginX = rect.left + rect.width / 2;
  joyOriginY = rect.top + rect.height / 2;
  joystickKnob.classList.add('active');
  joystickKnob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
  if (state === 'start') startGame();
}, { passive: false });

joystickContainer.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!joyActive) return;
  const t = e.changedTouches[0];
  let dx = t.clientX - joyOriginX;
  let dy = t.clientY - joyOriginY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  // Clamp knob to base radius
  if (dist > JOYSTICK_RADIUS - KNOB_RADIUS) {
    const scale = (JOYSTICK_RADIUS - KNOB_RADIUS) / dist;
    dx *= scale;
    dy *= scale;
  }
  joystickKnob.style.transform = `translate(-50%, -50%) translate(${dx}px, ${dy}px)`;
  const dir = getJoystickDir(dx, dy);
  if (dir) player.nextDir = dir;
}, { passive: false });

joystickContainer.addEventListener('touchend', e => {
  e.preventDefault();
  joyActive = false;
  joystickKnob.classList.remove('active');
  joystickKnob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
}, { passive: false });

joystickContainer.addEventListener('touchcancel', e => {
  e.preventDefault();
  joyActive = false;
  joystickKnob.classList.remove('active');
  joystickKnob.style.transform = `translate(-50%, -50%) translate(0px, 0px)`;
}, { passive: false });

// Show joystick when game starts on touch devices
const origShowScreen = showScreen;
showScreen = function(name) {
  origShowScreen(name);
  if (name === 'game') showJoystick();
  else hideJoystick();
};

$('overlay-msg').addEventListener('click',()=>$('overlay-msg').classList.add('hidden'));

function togglePause() {
  if(state==='game') { showScreen('pause'); pauseBackgroundMusic(); }
  else if(state==='pause') { initAudio(); showScreen('game'); resumeBackgroundMusic(); }
}

// ── Menu Buttons ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click',startGame);
$('btn-start').addEventListener('touchstart',e=>{ e.preventDefault(); startGame(); },{passive:false});
$('btn-howto').addEventListener('click',()=>showScreen('howto'));
$('btn-back').addEventListener('click',()=>showScreen('start'));
$('btn-resume').addEventListener('click',()=>showScreen('game'));
$('btn-retry').addEventListener('click',startGame);
$('btn-menu').addEventListener('click',()=>{ updateHUD(); showScreen('start'); });
$('btn-leaderboard').addEventListener('click',()=>{ renderLeaderboard(); showScreen('leaderboard'); });
$('btn-lb-menu').addEventListener('click',()=>{ renderLeaderboard(); showScreen('leaderboard'); });
$('btn-lb-back').addEventListener('click',()=>showScreen('start'));

// Submit score button
$('btn-submit-score').addEventListener('click',()=>{
  const nick = ($('lb-nick').value || 'AAA').toUpperCase().substring(0, 3).padEnd(3, 'A');
  const rank = addToLeaderboard(nick, score, level);
  $('submit-score-wrap').classList.add('hidden');
  renderLeaderboard(nick);
  showScreen('leaderboard');
});

// ── Init ────────────────────────────────────────────────────────────────────
initMap(1);
resizeCanvas();
updateHUD();
showScreen('start');
