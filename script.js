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
const LEVELS      = 4;

const T_WALL = 1, T_PATH = 0, T_DOT = 2, T_PWR = 3, T_HOUS = 4;

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
];

// ── DOM ────────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const screens = {
  start:    $('start-screen'),
  howto:    $('howto-screen'),
  game:     $('game-screen'),
  pause:    $('pause-screen'),
  gameover: $('gameover-screen'),
};
const canvas = $('game-canvas');
const ctx    = canvas.getContext('2d');

// ── Game State ─────────────────────────────────────────────────────────────
let score=0, lives=START_LIVES, level=1;
let map=[], mapRows=0, mapCols=0;
let dotsTotal=0, dotsEaten=0;
let player={}, enemies=[];
let powerMode=false, powerTimer=0;
let lastMoveTime=0;
let animID=null, tick=0;
let state='start';

// ── Audio ──────────────────────────────────────────────────────────────────
let _ac=null;
const ac = () => { if(!_ac) try{ _ac=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){} return _ac; };
function tone(f,d,t='square',v=.10) {
  try { const a=ac(); if(!a) return;
    const o=a.createOscillator(),g=a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type=t; o.frequency.value=f;
    g.gain.value=v;
    g.gain.exponentialRampToValueAtTime(.001,a.currentTime+d);
    o.start(a.currentTime); o.stop(a.currentTime+d);
  } catch(e){}
}
const SFX = {
  eat:    ()=>tone(620,.04,.08),
  power:  ()=>{ tone(380,.08,'sawtooth',.12); setTimeout(()=>tone(700,.12,'sawtooth',.12),70); },
  eatGhost:()=>{ tone(900,.07,.12); setTimeout(()=>tone(1200,.1,.12),55); },
  die:    ()=>{ tone(300,.1,'sawtooth',.15); setTimeout(()=>tone(200,.18,'sawtooth',.12),110); setTimeout(()=>tone(150,.28,'sawtooth',.1),260); },
  levelUp:()=>{ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.13,.12),i*90)); },
};

// ── Storage ────────────────────────────────────────────────────────────────
const getHigh = () => parseInt(localStorage.getItem('nom_hi')||'0');
const setHigh = v => { if(v>getHigh()) localStorage.setItem('nom_hi',String(v)); };

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
}

function tileWalkable(x,y) {
  if(y<0||y>=mapRows) return false;
  const xw=((x%mapCols)+mapCols)%mapCols;
  const t=map[y][xw];
  return t!==T_WALL;
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
  const ts=Math.min(maxW,maxH,44);
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
  enemies=[];
  for(let i=0;i<count;i++) {
    const h=house[i%house.length];
    enemies.push({
      x:h.x,y:h.y,
      dir:'up',
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
  loadLevel();
  showScreen('game');
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
  const hi=getHigh(), isNew=score>hi;
  if(isNew) setHigh(score);
  $('go-score').textContent=score;
  $('go-high').textContent=isNew?score:hi;
  $('new-record').classList.toggle('hidden',!isNew);
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
    // Chase — pick direction that minimizes distance to player
    const opp=OPP[en.dir];
    let best=null, bestD=Infinity;
    const variation=(Math.random()-.5)*(level*.5);
    const tx=player.x+DX[player.dir]*3+variation;
    const ty=player.y+DY[player.dir]*3+variation;
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
    checkComplete();
  } else if(tile===T_PWR) {
    map[player.y][player.x]=T_PATH;
    score+=50; dotsEaten++; powerMode=true; powerTimer=Math.round(5*60);
    enemies.forEach(e=>{ if(e.mode!=='eaten') e.mode='frightened'; });
    SFX.power();
    checkComplete();
  }
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

  // Map
  for(let y=0;y<mapRows;y++) {
    for(let x=0;x<mapCols;x++) {
      const tile=map[y][x];
      const px=x*ts, py=y*ts;
      if(tile===T_WALL) {
        // Wall — bright purple, always visible
        ctx.fillStyle=C.wall;
        ctx.fillRect(px,py,ts,ts);
        ctx.fillStyle=C.wallD;
        ctx.fillRect(px+3,py+3,ts-6,ts-6);
      } else if(tile===T_DOT) {
        // Path bg — dark blue so corridors are visible
        ctx.fillStyle='#1e1e3a';
        ctx.fillRect(px,py,ts,ts);
        // Dot
        ctx.fillStyle=C.dot;
        ctx.beginPath();
        ctx.arc(px+ts/2,py+ts/2,DOT_R*(ts/40),0,Math.PI*2);
        ctx.fill();
      } else if(tile===T_PWR) {
        // Path bg
        ctx.fillStyle='#1e1e3a';
        ctx.fillRect(px,py,ts,ts);
        // Power pellet
        const pl=Math.sin(tick*.12)*.2+.8;
        ctx.fillStyle=C.power;
        ctx.shadowBlur=12; ctx.shadowColor=C.power;
        ctx.beginPath();
        ctx.arc(px+ts/2,py+ts/2,POWER_R*(ts/40)*pl,0,Math.PI*2);
        ctx.fill();
        ctx.shadowBlur=0;
      } else if(tile===T_HOUS) {
        ctx.fillStyle=C.house;
        ctx.fillRect(px,py,ts,ts);
      } else {
        // Empty path — visible dark blue
        ctx.fillStyle='#1e1e3a';
        ctx.fillRect(px,py,ts,ts);
      }
    }
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

$('overlay-msg').addEventListener('click',()=>$('overlay-msg').classList.add('hidden'));

function togglePause() {
  if(state==='game') showScreen('pause');
  else if(state==='pause') showScreen('game');
}

// ── Menu Buttons ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click',startGame);
$('btn-start').addEventListener('touchstart',e=>{ e.preventDefault(); startGame(); },{passive:false});
$('btn-howto').addEventListener('click',()=>showScreen('howto'));
$('btn-back').addEventListener('click',()=>showScreen('start'));
$('btn-resume').addEventListener('click',()=>showScreen('game'));
$('btn-retry').addEventListener('click',startGame);
$('btn-menu').addEventListener('click',()=>{ updateHUD(); showScreen('start'); });

// ── Init ────────────────────────────────────────────────────────────────────
initMap(1);
resizeCanvas();
updateHUD();
showScreen('start');
