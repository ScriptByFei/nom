'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  NOM — Maze Chase  |  Complete game script
// ═══════════════════════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────────────────────
const TILE       = 32;
const MOVE_SPEED = 0.18;
const DOT_PTS    = 10;
const POWER_PTS  = 50;
const EAT_PTS    = 200;
const START_LIVES = 3;
const POWER_DUR   = 5; // seconds
const LEVELS      = 4;

const T_WALL = 0, T_DOT = 1, T_PWR = 2, T_PATH = 3, T_HOUS = 9;

const C = {
  bg:    '#0a0a12',
  wall:  '#6633ff',
  wallHi:'#8855ff',
  dot:   '#ffdd44',
  power: '#00ffcc',
  player:'#ffee00',
  pw: ['#ff3366','#ff66ff','#33ccff','#ffaa33','#44ff88','#ff8844'],
};

const DIR = {
  up:    { dx:  0, dy: -1 },
  down:  { dx:  0, dy:  1 },
  left:  { dx: -1, dy:  0 },
  right: { dx:  1, dy:  0 },
};

// ── Level Maps ─────────────────────────────────────────────────────────────
const LEVEL_MAPS = [
  // Level 1 — Intro
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,1,0,0,0,0,0,1,0],
    [0,2,0,0,0,1,0,0,0,0,0,2,0],
    [0,1,0,0,0,1,1,1,1,1,0,1,0],
    [0,1,1,1,0,3,3,3,3,1,0,1,0],
    [0,0,0,1,0,1,9,9,1,1,0,1,0],
    [0,0,0,1,0,1,9,9,1,1,0,1,0],
    [0,1,1,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,1,1,1,1,1,0,1,0],
    [0,1,0,0,0,1,0,0,0,0,0,1,0],
    [0,2,0,0,0,1,0,0,0,0,0,2,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 2 — Corridors
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,0,0,1,0],
    [0,1,0,1,1,1,0,1,0,1,0,1,1,1,0],
    [0,2,0,1,0,0,0,3,0,0,0,1,0,2,0],
    [0,1,0,1,0,1,1,1,1,1,0,1,0,1,0],
    [0,1,1,1,0,1,9,9,9,1,0,1,1,1,0],
    [0,1,0,1,0,1,9,9,9,1,0,1,0,1,0],
    [0,1,0,1,0,1,1,1,1,1,0,1,0,1,0],
    [0,2,0,1,0,0,0,3,0,0,0,1,0,2,0],
    [0,1,0,1,1,1,0,1,0,1,1,1,0,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 3 — Classic
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
    [0,2,0,0,0,0,0,1,0,1,0,0,0,0,0,2,0],
    [0,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,1,0,1,3,1,0,1,0,0,0,0,0],
    [0,1,1,1,0,1,0,1,9,1,0,1,0,1,1,1,0],
    [0,0,0,1,0,1,0,1,9,1,0,1,0,1,0,0,0],
    [0,1,1,1,0,1,0,1,1,1,0,1,0,1,1,1,0],
    [0,0,0,0,0,1,0,1,3,1,0,1,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,0,0,0,0,1,0],
    [0,2,0,0,0,0,0,1,0,1,0,0,0,0,0,2,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ],
  // Level 4 — Challenge
  [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0],
    [0,2,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,2,0],
    [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0],
    [0,1,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,1,0],
    [0,0,0,1,0,1,9,9,9,9,9,9,9,1,0,1,0,0,0],
    [0,1,1,1,0,1,9,9,9,9,9,9,9,1,0,1,1,1,0],
    [0,1,0,1,0,1,1,1,0,1,0,1,1,1,0,1,0,1,0],
    [0,1,0,1,0,0,0,0,0,1,0,0,0,0,0,1,0,1,0],
    [0,1,0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,1,0],
    [0,2,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,2,0],
    [0,1,0,0,0,0,0,1,0,1,0,1,0,0,0,0,0,1,0],
    [0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
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
const dpad   = $('dpad');
const $hsStart = $('hs-start');

// ── Game State ─────────────────────────────────────────────────────────────
let score=0, lives=START_LIVES, level=1;
let map=[], mapRows=0, mapCols=0, tileSize=TILE;
let dotsTotal=0, dotsEaten=0;
let player={}, enemies=[];
let powerMode=false, powerTimer=0;
let animID=null, tick=0;
let state='start';

// ── Audio ──────────────────────────────────────────────────────────────────
let _ac=null;
const ac = () => { if(!_ac) try{ _ac=new(window.AudioContext||window.webkitAudioContext)(); }catch(e){} return _ac; };

function tone(f,d,t='square',v=.12) {
  try {
    const a=ac(); if(!a) return;
    const o=a.createOscillator(), g=a.createGain();
    o.connect(g); g.connect(a.destination);
    o.type=t; o.frequency.value=f;
    g.gain.value=v;
    g.gain.exponentialRampToValueAtTime(.001, a.currentTime+d);
    o.start(a.currentTime); o.stop(a.currentTime+d);
  } catch(e){}
}

const SFX = {
  eat:    () => tone(620,.05,.08),
  power:  () => { tone(380,.1,'sawtooth',.13); setTimeout(()=>tone(700,.15,'sawtooth',.13),80); },
  eatGhost:()=>{ tone(900,.08,.12); setTimeout(()=>tone(1200,.12,.12),60); },
  die:    ()=>{ tone(300,.12,'sawtooth',.15); setTimeout(()=>tone(200,.2,'sawtooth',.12),120); setTimeout(()=>tone(150,.3,'sawtooth',.1),280); },
  levelUp:()=>{ [523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.15,.12),i*100)); },
};

// ── Storage ────────────────────────────────────────────────────────────────
const getHigh = () => parseInt(localStorage.getItem('nom_hi')||'0');
const setHigh = v => { if(v>getHigh()) localStorage.setItem('nom_hi',String(v)); };

// ── Screen Management ─────────────────────────────────────────────────────
function showScreen(name) {
  Object.entries(screens).forEach(([k,el]) => el.classList.toggle('active', k===name));
  state = name;
}

// ── Map Helpers ────────────────────────────────────────────────────────────
function initMap(lvl) {
  const raw = LEVEL_MAPS[(lvl-1)%LEVELS];
  mapRows = raw.length; mapCols = raw[0].length;
  map = raw.map(r=>[...r]);
  dotsTotal=0; dotsEaten=0;
  for(let y=0;y<mapRows;y++) for(let x=0;x<mapCols;x++)
    if(map[y][x]===T_DOT||map[y][x]===T_PWR) dotsTotal++;
}

const wrapX = cx => ((cx%mapCols)+mapCols)%mapCols;

function tileAt(x,y) {
  if(y<0||y>=mapRows) return T_WALL;
  return map[y][wrapX(x)];
}

function walkable(x,y,ghost) {
  const t=tileAt(Math.round(x),Math.round(y));
  if(t===T_WALL) return false;
  if(!ghost && t===T_HOUS) return false;
  return true;
}

// ── Canvas Sizing ───────────────────────────────────────────────────────────
function resizeCanvas() {
  const wrap = $('canvas-wrap');
  const ww=wrap.clientWidth-8, wh=wrap.clientHeight-8;
  const tW=Math.floor(ww/mapCols), tH=Math.floor(wh/mapRows);
  tileSize=Math.min(tW,tH,42);
  canvas.width=mapCols*tileSize; canvas.height=mapRows*tileSize;
  canvas.style.width=canvas.width+'px'; canvas.style.height=canvas.height+'px';
}

// ── Entity Init ─────────────────────────────────────────────────────────────
function findSpawn() {
  for(let y=mapRows-1;y>=0;y--) for(let x=0;x<mapCols;x++)
    if(map[y][x]===T_PATH||map[y][x]===T_DOT||map[y][x]===T_PWR) return {x,y};
  return {x:Math.floor(mapCols/2),y:mapRows-2};
}

function initPlayer() {
  const sp=findSpawn();
  player={x:sp.x,y:sp.y,fx:sp.x,fy:sp.y,dir:'left',nextDir:'left',mouth:0};
}

function initEnemies() {
  const house=[];
  for(let y=0;y<mapRows;y++) for(let x=0;x<mapCols;x++) if(map[y][x]===T_HOUS) house.push({x,y});
  if(!house.length) house.push({x:Math.floor(mapCols/2),y:Math.floor(mapRows/2)});
  const count=Math.min(2+level,6);
  enemies=[];
  for(let i=0;i<count;i++) {
    const h=house[i%house.length];
    enemies.push({
      x:h.x,y:h.y,fx:h.x,fy:h.y,
      dir:'up', color:C.pw[i%C.pw.length],
      mode: i===0?'chase':'house',
      releaseDelay: i*130,
      frightenedTimer:0,
      speed: 0.10+i*0.012,
    });
  }
}

// ── Game Control ───────────────────────────────────────────────────────────
function startGame() {
  score=0; lives=START_LIVES; level=1; powerMode=false; powerTimer=0;
  loadLevel();
  showScreen('game');
  if(animID) cancelAnimationFrame(animID);
  animID=requestAnimationFrame(loop);
}

function loadLevel() {
  initMap(level);
  resizeCanvas();
  initPlayer();
  initEnemies();
  updateHUD();
  updateLivesDisplay();
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
  powerMode=false; powerTimer=0;
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
  $hsStart.textContent=getHigh();
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

// ── Power ──────────────────────────────────────────────────────────────────
function setPowerMode(on) {
  powerMode=on;
  if(on) {
    powerTimer=Math.round(POWER_DUR*60);
    enemies.forEach(e=>{ if(e.mode!=='eaten') e.mode='frightened'; });
  }
}

// ── Movement ────────────────────────────────────────────────────────────────
function tryTurn(ent,ghost) {
  const d=DIR[ent.nextDir];
  const nx=wrapX(Math.round(ent.fx)+d.dx), ny=Math.round(ent.fy)+d.dy;
  if(walkable(nx,ny,ghost)) { ent.dir=ent.nextDir; return true; }
  return false;
}

function moveEnt(ent,ghost,spd) {
  const d=DIR[ent.dir];
  const nx=ent.fx+d.dx*spd, ny=ent.fy+d.dy*spd;
  const rx=wrapX(Math.round(nx)), ry=Math.round(ny);
  if(!walkable(rx,ry,ghost)) {
    ent.fx=Math.round(ent.fx); ent.fy=Math.round(ent.fy);
    tryTurn(ent,ghost); return false;
  }
  ent.fx=nx; ent.fy=ny;
  if(ent.fx<-.5) ent.fx=mapCols-.5;
  if(ent.fx>mapCols-.5) ent.fx=-.5;
  return true;
}

// ── Enemy AI ────────────────────────────────────────────────────────────────
function pickDir(en) {
  const opp={up:'down',down:'up',left:'right',right:'left'};
  const dirs=['up','down','left','right'];
  let best=null, bestD=Infinity;
  for(const d of dirs) {
    if(d===opp[en.dir]) continue;
    const dx=DIR[d].dx, dy=DIR[d].dy;
    const nx=wrapX(Math.round(en.fx)+dx), ny=Math.round(en.fy)+dy;
    if(!walkable(nx,ny,true)) continue;
    let tx,ty;
    if(en.mode==='frightened') {
      tx=en.fx+Math.random()*20-10; ty=en.fy+Math.random()*20-10;
    } else {
      const vr=(Math.random()-.5)*(level*.7);
      tx=player.fx+DIR[player.dir].dx*4+vr;
      ty=player.fy+DIR[player.dir].dy*4+vr;
    }
    const dist=Math.hypot(nx-tx,ny-ty);
    if(dist<bestD) { bestD=dist; best=d; }
  }
  return best||en.dir;
}

// ── Collision ───────────────────────────────────────────────────────────────
function checkCollisions() {
  const px=Math.round(player.fx), py=Math.round(player.fy);
  const tile=tileAt(px,py);
  if(tile===T_DOT) {
    map[py][wrapX(px)]=T_PATH;
    score+=DOT_PTS; dotsEaten++; SFX.eat();
    checkComplete();
  } else if(tile===T_PWR) {
    map[py][wrapX(px)]=T_PATH;
    score+=POWER_PTS; dotsEaten++; setPowerMode(true); SFX.power();
    checkComplete();
  }
  updateHUD();
  for(const en of enemies) {
    if(Math.abs(en.fx-player.fx)<.9 && Math.abs(en.fy-player.fy)<.9) {
      if(en.mode==='frightened') { en.mode='eaten'; score+=EAT_PTS; SFX.eatGhost(); updateHUD(); }
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
  enemies.forEach(en=>{
    if(en.mode==='house') {
      en.releaseDelay--;
      if(en.releaseDelay<=0) {
        en.x=Math.round(mapCols/2); en.y=Math.floor(mapRows/2);
        en.fx=en.x; en.fy=en.y; en.mode='chase'; en.dir='up';
      }
    }
  });
  tryTurn(player,false);
  moveEnt(player,false,MOVE_SPEED);
  if(tick%2===0) {
    enemies.forEach(en=>{
      if(en.mode==='house') return;
      if(en.mode==='eaten') {
        const hx=Math.floor(mapCols/2), hy=Math.floor(mapRows/2);
        if(Math.abs(en.fx-hx)<1&&Math.abs(en.fy-hy)<1) {
          en.mode='house'; en.releaseDelay=120;
          en.fx=hx; en.fy=hy; en.x=hx; en.y=hy;
        } else {
          en.dir=(en.fx<hx)?'right':(en.fx>hx)?'left':(en.fy<hy)?'down':'up';
          moveEnt(en,true,MOVE_SPEED*1.5);
        }
        return;
      }
      const spd=en.mode==='frightened'?en.speed*.5:en.speed;
      en.dir=pickDir(en);
      moveEnt(en,true,spd);
    });
  }
  checkCollisions();
}

// ── Render ─────────────────────────────────────────────────────────────────
function render() {
  const ts=tileSize;
  const pw=powerMode&&powerTimer<120&&tick%14<7;

  ctx.fillStyle=C.bg;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // Map
  for(let y=0;y<mapRows;y++) {
    for(let x=0;x<mapCols;x++) {
      const t=map[y][x];
      const px=x*ts, py=y*ts;
      if(t===T_WALL) {
        ctx.fillStyle=C.wall;
        ctx.fillRect(px+1,py+1,ts-2,ts-2);
        ctx.fillStyle=C.wallHi;
        ctx.fillRect(px+3,py+3,ts-6,ts-6);
      } else if(t===T_DOT) {
        ctx.fillStyle=C.dot;
        ctx.beginPath(); ctx.arc(px+ts/2,py+ts/2,ts*.13,0,Math.PI*2); ctx.fill();
      } else if(t===T_PWR) {
        const pl=Math.sin(tick*.12)*.22+.78;
        ctx.fillStyle=C.power;
        ctx.shadowBlur=10; ctx.shadowColor=C.power;
        ctx.beginPath(); ctx.arc(px+ts/2,py+ts/2,ts*.26*pl,0,Math.PI*2); ctx.fill();
        ctx.shadowBlur=0;
      } else if(t===T_HOUS) {
        ctx.fillStyle='#150a28'; ctx.fillRect(px,py,ts,ts);
      }
    }
  }

  // Enemies
  for(const en of enemies) {
    const ex=en.fx*ts+ts/2, ey=en.fy*ts+ts/2, r=ts*.36;
    if(en.mode==='eaten') { drawEyes(ex,ey,r*.65,en.dir); continue; }
    let col=en.color;
    if(en.mode==='frightened') col=pw?'#eee':'#2244ff';
    ctx.fillStyle=col;
    ctx.shadowBlur=8; ctx.shadowColor=col;
    ctx.beginPath();
    ctx.arc(ex,ey-r*.12,r,Math.PI,0,false);
    ctx.lineTo(ex+r,ey+r*.55);
    const wv=Math.sin(tick*.22)*r*.12;
    for(let i=3;i>=-3;i--) ctx.lineTo(ex+i*(r*.32),ey+r*.55+(i%2===0?r*.38+wv:0));
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur=0;
    if(en.mode==='frightened') {
      ctx.fillStyle='#fff';
      ctx.fillRect(ex-r*.52,ey-r*.22,r*.22,r*.22);
      ctx.fillRect(ex+r*.3,ey-r*.22,r*.22,r*.22);
      ctx.fillRect(ex-r*.38,ey+r*.12,r*.76,r*.18);
    } else {
      drawEyes(ex,ey,r,en.dir);
    }
  }

  // Player
  const px=player.fx*ts+ts/2, py=player.fy*ts+ts/2, pr=ts*.38;
  const ma=Math.abs(Math.sin(player.mouth))*.32;
  player.mouth=(player.mouth+.22)%Math.PI;
  ctx.fillStyle=C.player;
  ctx.shadowBlur=14; ctx.shadowColor=C.player;
  ctx.beginPath();
  const ba={right:0,down:Math.PI/2,left:Math.PI,up:-Math.PI/2}[player.dir]||0;
  ctx.arc(px,py,pr,ba+ma,ba+Math.PI*2-ma); ctx.lineTo(px,py); ctx.closePath(); ctx.fill();
  ctx.shadowBlur=0;
  const eo=DIR[player.dir];
  ctx.fillStyle='#222';
  ctx.beginPath(); ctx.arc(px+eo.dx*pr*.28,py+eo.dy*pr*.28-pr*.14,pr*.13,0,Math.PI*2); ctx.fill();
}

function drawEyes(ex,ey,r,dir) {
  ctx.fillStyle='#fff';
  ctx.beginPath(); ctx.ellipse(ex-r*.3,ey-r*.18,r*.26,r*.3,0,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(ex+r*.3,ey-r*.18,r*.26,r*.3,0,0,Math.PI*2); ctx.fill();
  const o={up:[0,-.2],down:[0,.1],left:[-.2,0],right:[.2,0]}[dir]||[0,0];
  ctx.fillStyle='#0055ff';
  ctx.beginPath(); ctx.arc(ex-r*.3+o[0]*r,ey-r*.18+o[1]*r,r*.14,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex+r*.3+o[0]*r,ey-r*.18+o[1]*r,r*.14,0,Math.PI*2); ctx.fill();
}

// ── Game Loop ───────────────────────────────────────────────────────────────
function loop() {
  update();
  render();
  animID=requestAnimationFrame(loop);
}

// ── Input ───────────────────────────────────────────────────────────────────
// Keyboard
document.addEventListener('keydown', e => {
  const m={'ArrowUp':'up','ArrowDown':'down','ArrowLeft':'left','ArrowRight':'right',
           'w':'up','s':'down','a':'left','d':'right'};
  const dir=m[e.key];
  if(dir) { e.preventDefault(); player.nextDir=dir; }
  if(state==='start'&&(e.key===' '||e.key==='Enter')) { e.preventDefault(); startGame(); }
  if(state==='game'&&(e.key==='Escape'||e.key==='p'||e.key==='P')) togglePause();
});

// Touch detection (force show dpad)
(function() {
  if('ontouchstart' in window||navigator.maxTouchPoints>0) {
    dpad.classList.add('touch-active');
    actionRow.classList.add('touch-active');
  }
})();

// Double-tap zoom prevention
let lastTap=0;
document.addEventListener('touchend', function(e) {
  const now=Date.now();
  if(now-lastTap<350) e.preventDefault();
  lastTap=now;
}, {passive:false});

// Canvas swipe
let tx=0, ty=0;
canvas.addEventListener('touchstart', e=>{ e.preventDefault(); tx=e.touches[0].clientX; ty=e.touches[0].clientY; },{passive:false});
canvas.addEventListener('touchend', e=>{
  e.preventDefault();
  const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
  if(Math.abs(dx)<12&&Math.abs(dy)<12) {
    if(state==='game') {
      // Tap canvas = nothing (overlay handles start)
    }
    return;
  }
  player.nextDir=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up');
  if(state==='game') showOverlay('','');
},{passive:false});

// D-Pad buttons
document.querySelectorAll('[data-dir]').forEach(btn=>{
  const h=(e)=>{ e.preventDefault(); player.nextDir=btn.dataset.dir; btn.classList.add('active'); };
  const rh=()=>btn.classList.remove('active');
  btn.addEventListener('touchstart',h,{passive:false});
  btn.addEventListener('mousedown',h);
  btn.addEventListener('touchend',rh);
  btn.addEventListener('mouseup',rh);
  btn.addEventListener('mouseleave',rh);
});

// Action buttons
$('btn-pause').addEventListener('click',()=>{ if(state==='game') togglePause(); });
$('btn-pause').addEventListener('touchstart',e=>{ e.preventDefault(); if(state==='game') togglePause(); },{passive:false});

// Overlay click to resume from level-start overlay
$('overlay-msg').addEventListener('click',()=>{
  $('overlay-msg').classList.add('hidden');
});

function togglePause() {
  if(state==='game') { showScreen('pause'); }
  else if(state==='pause') { showScreen('game'); }
}

// ── Menu Buttons ────────────────────────────────────────────────────────────
$('btn-start').addEventListener('click', startGame);
$('btn-start').addEventListener('touchstart',e=>{ e.preventDefault(); startGame(); },{passive:false});

$('btn-howto').addEventListener('click', ()=>showScreen('howto'));
$('btn-back').addEventListener('click', ()=>showScreen('start'));

$('btn-resume').addEventListener('click',()=>showScreen('game'));
$('btn-restart').addEventListener('click',()=>{ showScreen('game'); startGame(); });
$('btn-retry').addEventListener('click',()=>startGame());
$('btn-menu').addEventListener('click',()=>{ updateHUD(); showScreen('start'); });

// ── Init ────────────────────────────────────────────────────────────────────
updateHUD();
showScreen('start');
