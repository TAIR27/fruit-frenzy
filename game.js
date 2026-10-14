'use strict';
(() => {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const $ = id => document.getElementById(id);
  const fruits = [ ['🍊', '#ffac47'], ['🍉', '#ff668a'], ['🍓', '#ff5279'], ['🥝', '#b5ee66'], ['🍋', '#ffe466'], ['🍎', '#ff6962'], ['🍑', '#ffb997'] ];
  let width, height, running = false, score = 0, lives = 3, elapsed = 0, spawnIn = 0;
  let objects = [], particles = [], halves = [], labels = [], trail = [], pointer = null;
  let lastTime = 0, shake = 0, flash = 0, best = 0, soundOn = false, audio;
  try { best = Number(localStorage.getItem('fruit-frenzy-best')) || 0; } catch (_) { /* Storage is optional. */ }
  const random = (a, b) => a + Math.random() * (b - a);
  const fruitRadius = () => Math.max(24, Math.min(34, width * .055));
  function resize() {
    const oldWidth = width || canvas.clientWidth, oldHeight = height || canvas.clientHeight;
    width = canvas.clientWidth; height = canvas.clientHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    if (!oldWidth || !oldHeight || !width || !height) return;
    // Scale position, speed, and gravity together so flying fruit keep the same path on the resized screen.
    const sx = width / oldWidth, sy = height / oldHeight, r = fruitRadius();
    for (const obj of [...objects, ...halves]) { obj.x *= sx; obj.vx *= sx; obj.y *= sy; obj.vy *= sy; obj.gravity *= sy; obj.r = r; }
    for (const p of [pointer, ...trail]) if (p) { p.x *= sx; p.y *= sy; }
  }
  window.addEventListener('resize', resize); resize();
  function tone(bomb = false) {
    if (!soundOn) return;
    try {
      audio ||= new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === 'suspended') audio.resume();
      const osc = audio.createOscillator(), gain = audio.createGain();
      osc.connect(gain); gain.connect(audio.destination);
      osc.type = bomb ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(bomb ? 110 : random(650, 950), audio.currentTime);
      osc.frequency.exponentialRampToValueAtTime(bomb ? 25 : 180, audio.currentTime + .15);
      gain.gain.setValueAtTime(.07, audio.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + .2);
      osc.start(); osc.stop(audio.currentTime + .21);
    } catch (_) { /* Play normally when audio is unavailable. */ }
  }
  $('sound').addEventListener('click', () => {
    soundOn = !soundOn; $('sound').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
    $('sound').setAttribute('aria-label', soundOn ? 'Disable sound' : 'Enable sound');
    $('sound').setAttribute('aria-pressed', String(soundOn)); if (soundOn) tone();
  });
  let hudState = '';
  function updateHud() {
    // Only touch the DOM when a shown value changes, not on every frame.
    const seconds = Math.max(0, Math.ceil(60 - elapsed)), state = [score, seconds, lives].join();
    if (state === hudState) return;
    hudState = state;
    $('score').textContent = score;
    $('timer').innerHTML = seconds + '<span>s</span>';
    $('timer').parentElement.classList.toggle('urgent', seconds <= 10);
    $('lives').innerHTML = Array.from({length:3}, (_, i) => i < lives ? '♥' : '<span class="lost">♥</span>').join(' ');
    $('lives').setAttribute('aria-label', lives + ' lives');
  }
  function start() {
    running = true; score = 0; lives = 3; elapsed = 0; spawnIn = .4;
    objects = []; particles = []; halves = []; labels = []; trail = []; pointer = null; shake = 0; flash = 0; hudState = '';
    $('start').hidden = true; $('end').hidden = true; $('hud').hidden = false;
    $('announcement').textContent = 'Game started. Slice fruit and avoid bombs.'; updateHud();
    lastTime = performance.now();
  }
  $('play').addEventListener('click', start); $('restart').addEventListener('click', start);
  function end(reason) {
    if (!running) return;
    // Clear leftover fruit so faded copies don't linger behind the game-over screen.
    running = false; pointer = null; objects = [];
    const record = score > best; best = Math.max(best, score);
    try { localStorage.setItem('fruit-frenzy-best', best); } catch (_) { /* Optional persistence. */ }
    $('end-title').textContent = reason === 'bomb' ? 'Oh, snap!' : score >= 300 ? 'Juice legend!' : 'Nice slicing!';
    $('end-reason').textContent = reason === 'bomb' ? 'You sliced a bomb. The fruit wants a rematch.' : reason === 'lives' ? 'Three fruits got away. Let’s catch the next batch.' : 'Time’s up! That was 60 seconds of juicy fun.';
    $('final-score').textContent = score; $('best').textContent = (record ? '✦ NEW BEST! ' : 'PERSONAL BEST: ') + best;
    $('end').hidden = false; $('hud').hidden = true;
    $('announcement').textContent = 'Game over. ' + $('end-reason').textContent + ' Score: ' + score;
    $('restart').focus();
  }
  function spawn() {
    const difficulty = elapsed / 60;
    const count = Math.random() < .25 + difficulty * .35 ? 3 : 2;
    for (let i = 0; i < count; i++) {
      const bomb = elapsed > 3 && Math.random() < .1 + difficulty * .1;
      const fruit = fruits[Math.floor(Math.random() * fruits.length)];
      const r = fruitRadius();
      const x = random(width * .16, width * .84);
      const gravity = Math.max(650, height * 1.25);
      const peak = random(height * .23, height * .49);
      objects.push({x, y:height + r + i * 14, vx:(width / 2 - x) * random(.2,.65), vy:-Math.sqrt(2 * gravity * (height + r - peak)), gravity, r, angle:random(-.5,.5), spin:random(-2,2), emoji:bomb ? '💣' : fruit[0], color:bomb ? '#ff9b5c' : fruit[1], bomb, dead:false});
    }
    spawnIn = random(.95, 1.4) * (1 - difficulty * .48);
  }
  function burst(obj, bomb) {
    for (let i = 0; i < (bomb ? 55 : 22); i++) {
      const angle = random(0, Math.PI * 2), speed = random(75, bomb ? 500 : 280);
      particles.push({x:obj.x,y:obj.y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,r:random(2,7),life:random(.35,.85),max:.85,color:i % 3 === 0 ? '#fff6c8' : obj.color});
    }
  }
  function cut(obj) {
    obj.dead = true; burst(obj, obj.bomb); tone(obj.bomb);
    if (obj.bomb) { shake = .45; flash = .35; end('bomb'); return; }
    score += 10; updateHud();
    labels.push({x:obj.x,y:obj.y,text:'+10',life:.75,color:obj.color});
    for (const side of [-1, 1]) halves.push({...obj,side,vx:obj.vx + side * 110,vy:-100,life:.65});
  }
  // The part of the canvas the player can see. On short windows the canvas runs past the bottom of the browser window.
  function visibleArea() {
    const rect = canvas.getBoundingClientRect();
    return {left:Math.max(0,-rect.left), top:Math.max(0,-rect.top), right:Math.min(width,window.innerWidth-rect.left), bottom:Math.min(height,window.innerHeight-rect.top)};
  }
  const inside = (p, area) => p.x >= area.left && p.x <= area.right && p.y >= area.top && p.y <= area.bottom;
  function segmentHits(a, b, obj, area) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((obj.x-a.x)*dx+(obj.y-a.y)*dy)/length)) : 0;
    const hit = {x:a.x+t*dx, y:a.y+t*dy};
    // Only slice fruit the player can see, at a point of the swipe the player can see.
    return inside(obj, area) && inside(hit, area) && Math.hypot(obj.x-hit.x,obj.y-hit.y) <= obj.r + 3;
  }
  function point(event) { const rect = canvas.getBoundingClientRect(); return {x:event.clientX-rect.left,y:event.clientY-rect.top,life:.18}; }
  canvas.addEventListener('pointerdown', event => {
    if (!running || pointer || (event.pointerType === 'mouse' && event.button !== 0)) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId); pointer = {id:event.pointerId, ...point(event)}; trail = [point(event)];
  });
  canvas.addEventListener('pointermove', event => {
    if (!running || !pointer || pointer.id !== event.pointerId) return;
    const next = point(event), area = visibleArea();
    // Pointer capture keeps reporting drags outside the canvas and the window, so segmentHits ignores anything out of sight.
    for (const obj of objects) if (!obj.dead && segmentHits(pointer,next,obj,area)) { cut(obj); if (!running) break; }
    if (running) { pointer = {id:event.pointerId,...next}; trail.push(next); if (trail.length > 40) trail.shift(); }
  });
  const release = event => { if (pointer?.id === event.pointerId) pointer = null; };
  canvas.addEventListener('pointerup',release); canvas.addEventListener('pointercancel',release); canvas.addEventListener('lostpointercapture',release);
  document.addEventListener('visibilitychange', () => { lastTime = performance.now(); pointer = null; trail = []; });
  function drawFruit(obj, half = false) {
    ctx.save(); ctx.translate(obj.x,obj.y); ctx.rotate(obj.angle); ctx.globalAlpha = half ? Math.min(1,obj.life * 2) : 1;
    if (half) { ctx.beginPath(); ctx.rect(obj.side < 0 ? -obj.r*1.4 : 0,-obj.r*1.5,obj.r*1.4,obj.r*3); ctx.clip(); }
    ctx.shadowColor = obj.color + '55'; ctx.shadowBlur = 20;
    ctx.font = `${obj.r * 1.95}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(obj.emoji,0,3); ctx.restore();
  }
  function update(dt) {
    if (shake > 0) shake -= dt;
    if (flash > 0) flash -= dt;
    if (running) {
      elapsed = Math.min(60,elapsed + dt); spawnIn -= dt;
      if (elapsed >= 60) end('time'); else if (spawnIn <= 0) spawn();
    }
    for (const obj of objects) {
      if (!running) break;
      obj.vy += obj.gravity * dt; obj.x += obj.vx * dt; obj.y += obj.vy * dt; obj.angle += obj.spin * dt;
      if (!obj.dead && obj.y > height + obj.r * 2 && obj.vy > 0) {
        obj.dead = true;
        if (!obj.bomb) { lives--; labels.push({x:Math.max(40,Math.min(width-40,obj.x)),y:height-70,text:'MISSED',life:.9,color:'#ff819b'}); if (lives === 0) end('lives'); }
      }
    }
    objects = objects.filter(obj => !obj.dead);
    for (const obj of halves) { obj.life -= dt; obj.x += obj.vx*dt; obj.y += obj.vy*dt; obj.vy += 700*dt; obj.angle += obj.side * dt * 3; }
    halves = halves.filter(obj => obj.life > 0);
    for (const p of particles) { p.life -= dt; p.x += p.vx*dt; p.y += p.vy*dt; p.vy += 550*dt; }
    particles = particles.filter(p=>p.life>0);
    for (const label of labels) { label.life -= dt; label.y -= 55*dt; }
    labels=labels.filter(label=>label.life>0);
    trail.forEach(p=>p.life-=dt); trail=trail.filter(p=>p.life>0);
  }
  function draw() {
    ctx.clearRect(0,0,width,height); ctx.save();
    if (shake > 0) ctx.translate(random(-7,7)*shake*2,random(-7,7)*shake*2);
    for (const obj of objects) drawFruit(obj);
    for (const obj of halves) drawFruit(obj,true);
    for (const p of particles) { ctx.globalAlpha = Math.max(0,p.life/p.max); ctx.fillStyle=p.color; ctx.beginPath(); ctx.ellipse(p.x,p.y,p.r,p.r*.7,Math.atan2(p.vy,p.vx),0,Math.PI*2); ctx.fill(); }
    ctx.globalAlpha=1;
    for (const label of labels) { ctx.globalAlpha=Math.max(0,Math.min(1,label.life*3)); ctx.fillStyle=label.color; ctx.font='bold 22px Arial'; ctx.textAlign='center'; ctx.fillText(label.text,label.x,label.y); }
    ctx.globalAlpha=1;
    if(trail.length>1) { ctx.lineCap='round'; ctx.lineJoin='round'; for(let i=1;i<trail.length;i++){ctx.globalAlpha=trail[i].life/.18;ctx.strokeStyle=i%2?'#b5ee66':'#80f6e7';ctx.shadowColor='#b5ee66';ctx.shadowBlur=15;ctx.lineWidth=2+7*i/trail.length;ctx.beginPath();ctx.moveTo(trail[i-1].x,trail[i-1].y);ctx.lineTo(trail[i].x,trail[i].y);ctx.stroke();} }
    ctx.restore();
    if(flash>0){ctx.fillStyle=`rgba(255,115,80,${flash})`;ctx.fillRect(0,0,width,height);}
  }
  function frame(time) {
    // Advance by real elapsed time (never negative, capped after long stalls) so the 60-second timer stays accurate on slow devices.
    let dt = document.hidden ? 0 : Math.max(0, Math.min((time - (lastTime || time)) / 1000, .25)); lastTime = time;
    // Small fixed steps keep the physics stable when a slow frame covers a lot of time.
    while (dt > 1e-6) { const step = Math.min(dt, 1 / 60); update(step); dt -= step; }
    if (running) updateHud();
    draw();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
