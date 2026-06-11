/* battle-live.jsx — live battle scene using the real cut-out AI sprites */
const { useState, useEffect, useRef } = React;

const ENEMY = {
  walker: { src: 'sprites/enemy_0.png', size: 52, hp: 0.7, speed: 0.55 },
  drone: { src: 'sprites/enemy_1.png', size: 58, hp: 0.55, speed: 0.9 },
  tank: { src: 'sprites/enemy_2.png', size: 70, hp: 1.0, speed: 0.4 },
  brute: { src: 'sprites/enemy_3.png', size: 92, hp: 1.0, speed: 0.3 },
  mites: { src: 'sprites/enemy_4.png', size: 60, hp: 0.5, speed: 0.75 }
};
const TURRET_BASE = 'sprites/turret_base.png'; // round top-down base (static)
const TURRET_GUN = 'sprites/turret_gun.png';   // twin-barrel gun (swivels)
const TOWER_SRC = TURRET_GUN; // used for the upgrades preview

const STORE_ITEMS = [
  { g: '⟫', name: 'Fire Rate', sub: '+15% rate of fire', cost: 120, cur: 'money' },
  { g: '✦', name: 'Damage', sub: '+8 damage per hit', cost: 150, cur: 'money' },
  { g: '⋔', name: 'Multishot', sub: '+1 simultaneous beam', cost: 320, cur: 'money' },
  { g: '✚', name: 'Repair Hull', sub: 'restore +25% integrity', cost: 200, cur: 'money' },
  { g: '❄', name: 'Cryo Field', sub: 'slow all enemies 20%', cost: 280, cur: 'money' },
  { g: '✺', name: 'Overcharge Core', sub: 'permanent +1 core slot', cost: 450, cur: 'money' },
];

// skill tree: 3 branches × tiers. state: owned / available / locked
const SKILL_TREE = [
  { branch: 'OFFENSE', color: '#ff7a64', nodes: [
    { id: 'o1', g: '✦', name: 'Piercing Beam', tier: 0, state: 'owned' },
    { id: 'o2', g: '⟫', name: 'Rapid Fire', tier: 1, state: 'owned' },
    { id: 'o3', g: '✸', name: 'Plasma Burst', tier: 2, state: 'available' },
    { id: 'o4', g: '☄', name: 'Annihilation', tier: 3, state: 'locked' },
  ]},
  { branch: 'DEFENSE', color: '#7fe8ff', nodes: [
    { id: 'd1', g: '✚', name: 'Reinforced Hull', tier: 0, state: 'owned' },
    { id: 'd2', g: '❄', name: 'Cryo Shield', tier: 1, state: 'available' },
    { id: 'd3', g: '⛨', name: 'Aegis Barrier', tier: 2, state: 'locked' },
    { id: 'd4', g: '✺', name: 'Fortress Mode', tier: 3, state: 'locked' },
  ]},
  { branch: 'UTILITY', color: '#46e39a', nodes: [
    { id: 'u1', g: '◈', name: 'Core Magnet', tier: 0, state: 'owned' },
    { id: 'u2', g: '⏃', name: 'Bounty Hunter', tier: 1, state: 'available' },
    { id: 'u3', g: '⟳', name: 'Time Dilation', tier: 2, state: 'locked' },
    { id: 'u4', g: '✦', name: 'Singularity', tier: 3, state: 'locked' },
  ]},
];
const WAVE = [
{ a: -90, r: 360, t: 'brute' },
{ a: -52, r: 300, t: 'walker' },
{ a: -18, r: 340, t: 'tank' },
{ a: 20, r: 300, t: 'drone' },
{ a: 55, r: 350, t: 'mites' },
{ a: 92, r: 300, t: 'walker' },
{ a: 128, r: 345, t: 'drone' },
{ a: 162, r: 300, t: 'tank' },
{ a: 200, r: 355, t: 'brute' },
{ a: 232, r: 300, t: 'mites' },
{ a: 268, r: 340, t: 'walker' },
{ a: 305, r: 310, t: 'drone' }];


function BattleLive() {
  const CX = 640,CY = 410;
  const [enemies, setEnemies] = useState(() =>
  WAVE.map((w, i) => ({ id: i, ...w, r: w.r + Math.random() * 30 }))
  );
  const [bullets, setBullets] = useState([]);
  const [muzzle, setMuzzle] = useState(0); // muzzle-flash pulse timestamp
  const bid = useRef(0);
  const enemiesRef = useRef([]);
  enemiesRef.current = enemies;
  const [storeOpen, setStoreOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const paused = storeOpen || skillOpen;
  const raf = useRef();

  // Tab toggles upgrades, T toggles skill tree (both pause)
  useEffect(() => {
    const onKey = (ev) => {
      if (ev.key === 'Tab') { ev.preventDefault(); setStoreOpen((s) => !s); setSkillOpen(false); }
      if (ev.key === 't' || ev.key === 'T') { setSkillOpen((s) => !s); setStoreOpen(false); }
      if (ev.key === 'Escape') { setStoreOpen(false); setSkillOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (paused) return; // paused while a panel is open
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(40, now - last) / 16.7;last = now;
      setEnemies((prev) => prev.map((e) => {
        const sp = ENEMY[e.t].speed;
        let r = e.r - sp * dt;
        if (r < 95) r = 360 + Math.random() * 30; // recycle outward
        return { ...e, r };
      }));
      setBullets((prev) => prev
        .map((b) => ({ ...b, r: b.r + 2.5 * dt }))
        .filter((b) => b.r < b.max));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [paused]);

  // fire bullets at the nearest enemy (gun tracks it)
  useEffect(() => {
    if (paused) return; // paused
    const iv = setInterval(() => {
      const cur = enemiesRef.current;
      if (!cur.length) return;
      const t = cur.reduce((m, e) => (e.r < m.r ? e : m), cur[0]);
      const side = (bid.current % 2) ? 1 : -1; // alternate barrels
      setBullets((bs) => [...bs, { id: bid.current++, a: t.a, r: 40, max: 640, side }]);
      setMuzzle(performance.now());
    }, 333);
    return () => clearInterval(iv);
  }, [paused]);

  const pos = (a, r) => {
    const rad = a * Math.PI / 180;
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
  };

  // gun aims at the nearest enemy; muzzle flashes briefly after each shot
  const target = enemies.length ? enemies.reduce((m, e) => (e.r < m.r ? e : m), enemies[0]) : null;
  const gunAngle = target ? target.a : -90;
  const firing = performance.now() - muzzle < 70;

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(120% 120% at 50% 50%, #0e1b30 0%, #081120 55%, #04080f 100%)',
      fontFamily: "'Chakra Petch', sans-serif", color: '#e7f0ff', userSelect: 'none' }}>

      {/* grid */}
      <div style={{ position: 'absolute', inset: -2,
        backgroundImage: 'linear-gradient(rgba(96,150,230,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(96,150,230,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        WebkitMaskImage: 'radial-gradient(120% 100% at 50% 50%, #000 40%, transparent 80%)' }} />
      {/* concentric range rings — expand outward, fading with distance */}
      {[260, 520, 820, 1180].map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: CX, top: CY, width: d, height: d,
          transform: 'translate(-50%,-50%)', borderRadius: '50%',
          border: `1px solid rgba(95,182,255,${0.26 - i * 0.06})`,
          boxShadow: i === 0 ? 'inset 0 0 80px rgba(59,157,255,0.06)' : 'none' }} />
      ))}
      {/* turret base — static, top-down, on the ground */}
      <img src={TURRET_BASE} alt="" draggable="false"
        style={{ position: 'absolute', left: CX, top: CY, width: 156, height: 156,
          transform: 'translate(-50%,-43%)',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' }} />

      {/* enemies */}
      {enemies.map((e) => {
        const p = pos(e.a, e.r);
        const cfg = ENEMY[e.t];
        // sprite drawn facing UP; rotate so its "up" points toward centre
        const face = e.a + 90 + 180; // point top of sprite toward center
        const scale = e.r > 330 ? 0.82 : 1; // slightly smaller when far
        return (
          <div key={e.id} style={{ position: 'absolute', left: p.x, top: p.y,
            transform: `translate(-50%,-50%)`, width: cfg.size, height: cfg.size,
            display: 'grid', placeItems: 'center' }}>
            <div style={{ position: 'absolute', top: -10, width: cfg.size * 0.6, height: 3.5,
              borderRadius: 2, background: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: cfg.hp * 100 + '%',
                background: cfg.hp > 0.6 ? '#46e39a' : '#ff5238', boxShadow: '0 0 6px currentColor' }} />
            </div>
            <img src={cfg.src} alt={e.t} draggable="false"
            style={{ width: cfg.size * scale, height: 'auto',
              transform: `rotate(${face}deg)`,
              filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' }} />
          </div>);

      })}

      {/* bullets — warm tracers travelling along the gun's aim */}
      {bullets.map((b) => {
        const p = pos(b.a, b.r);
        const perp = (b.a + 90) * Math.PI / 180;
        const ox = Math.cos(perp) * 5 * b.side, oy = Math.sin(perp) * 5 * b.side;
        return (
          <div key={b.id} style={{ position: 'absolute', left: p.x + ox, top: p.y + oy,
            width: 13, height: 4, borderRadius: 3,
            transform: `translate(-50%,-50%) rotate(${b.a}deg)`,
            background: 'linear-gradient(90deg, rgba(255,214,110,0), #ffe9a8)',
            boxShadow: '0 0 7px 1px rgba(255,196,90,0.85)' }} />
        );
      })}

      {/* gun — swivels around its base mount to aim at the target */}
      <img src={TURRET_GUN} alt="tower" draggable="false"
        style={{ position: 'absolute', left: CX, top: CY, height: 108, width: 'auto',
          transformOrigin: '50% 79%',
          transform: `translate(-50%,-79%) rotate(${gunAngle + 90}deg)`,
          filter: 'drop-shadow(0 5px 9px rgba(0,0,0,0.6))' }} />

      {/* muzzle flash at the barrel tips */}
      {firing && (() => {
        const m = pos(gunAngle, 83);
        return <div style={{ position: 'absolute', left: m.x, top: m.y, width: 26, height: 26,
          transform: 'translate(-50%,-50%)', borderRadius: '50%',
          background: 'radial-gradient(circle, #fff6da, rgba(255,180,70,0.6) 45%, transparent 70%)',
          filter: 'blur(1px)' }} />;
      })()}

      {/* HUD */}
      <div style={{ position: 'absolute', top: 18, left: 22, display: 'flex', alignItems: 'flex-end', gap: 18 }}>
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, letterSpacing: '.28em', color: '#6f86b6' }}>LEVEL</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: '#7fe8ff', textShadow: '0 0 14px rgba(127,232,255,0.45)' }}>3</div>
        </div>
        <div style={{ width: 1, height: 40, background: 'rgba(120,160,230,0.25)', marginBottom: 4 }} />
        <div style={{ lineHeight: 1.1 }}>
          <div style={{ fontSize: 12, letterSpacing: '.28em', color: '#6f86b6' }}>WAVE</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: '#ff7a64', textShadow: '0 0 14px rgba(255,82,56,0.5)' }}>1</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 320,
        padding: '10px 14px', borderRadius: 12, background: 'rgba(8,14,28,0.7)', border: '1px solid rgba(120,160,230,0.16)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6, color: '#8294b8' }}>
          <span style={{ letterSpacing: '.12em', whiteSpace: 'nowrap' }}>TOWER INTEGRITY</span><span style={{ color: '#7fe8ff', whiteSpace: 'nowrap' }}>640 / 1000</span>
        </div>
        <div style={{ height: 14, borderRadius: 7, background: 'rgba(8,14,28,0.85)', border: '1px solid rgba(120,160,230,0.16)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '64%', background: 'linear-gradient(90deg,#2ee6a0,#46e39a)', boxShadow: '0 0 12px rgba(70,227,154,0.5)' }} />
        </div>
      </div>
      <div style={{ position: 'absolute', top: 20, right: 22, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffe79a, #f2a93a)', boxShadow: '0 0 10px rgba(255,201,74,0.5)' }} />
          <span style={{ fontSize: 24, fontWeight: 700, color: '#ffc94a', textShadow: '0 0 12px rgba(255,201,74,0.4)' }}>1,240</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(120,160,230,0.25)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 18, height: 18, transform: 'rotate(45deg)', borderRadius: 4, background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)', boxShadow: '0 0 10px rgba(127,232,255,0.6)' }} />
          <span style={{ fontSize: 24, fontWeight: 700, color: '#7fe8ff', textShadow: '0 0 12px rgba(127,232,255,0.45)' }}>18</span>
        </div>
        <div style={{ width: 1, height: 26, background: 'rgba(120,160,230,0.25)' }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setSettingsOpen((s) => !s)} title="Settings"
            style={{ width: 38, height: 38, borderRadius: 11, display: 'grid', placeItems: 'center', cursor: 'pointer',
              background: settingsOpen ? 'rgba(127,232,255,0.16)' : 'rgba(8,14,28,0.7)',
              border: `1px solid ${settingsOpen ? 'rgba(127,232,255,0.5)' : 'rgba(120,160,230,0.25)'}`,
              color: '#c4d3ee', fontSize: 19, lineHeight: 1 }}>⚙</button>
          {settingsOpen &&
          <div style={{ position: 'absolute', top: 48, right: 0, width: 230, padding: 14, borderRadius: 14, zIndex: 30,
            background: 'linear-gradient(180deg, #0e1b30, #0a1424)', border: '1px solid rgba(120,160,230,0.25)',
            boxShadow: '0 18px 50px rgba(0,0,0,0.6)', fontFamily: "'Chakra Petch', sans-serif" }}>
            <div style={{ fontSize: 12, letterSpacing: '.2em', color: '#8294b8', marginBottom: 12 }}>SETTINGS</div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14.5, color: '#e7f0ff' }}>Sound</span>
              <button onClick={() => setSoundOn((s) => !s)}
                style={{ width: 48, height: 26, borderRadius: 13, cursor: 'pointer', position: 'relative',
                  background: soundOn ? 'linear-gradient(90deg,#2bb47a,#46e39a)' : 'rgba(120,160,230,0.18)',
                  border: '1px solid ' + (soundOn ? 'rgba(70,227,154,0.6)' : 'rgba(120,160,230,0.3)'),
                  transition: 'background .15s' }}>
                <span style={{ position: 'absolute', top: 2, left: soundOn ? 24 : 2, width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.4)', transition: 'left .15s' }} />
              </button>
            </div>
          </div>}
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        fontSize: 12.5, color: '#56668c', letterSpacing: '.04em' }}>
        ⟳ enemies rotate to face the tower as they advance — proving the top-down sprites read at every angle
      </div>

      {/* STORE button — bottom-right, with Tab shortcut hint */}
      <button onClick={() => setStoreOpen(true)}
        style={{ position: 'absolute', right: 22, bottom: 22, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', borderRadius: 14, cursor: 'pointer',
          background: 'linear-gradient(180deg, rgba(20,40,72,0.95), rgba(12,24,46,0.95))',
          border: '1px solid rgba(127,232,255,0.4)', color: '#e7f0ff',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 22px rgba(59,157,255,0.25)',
          fontFamily: "'Chakra Petch', sans-serif" }}>
        <span style={{ fontSize: 24, color: '#7fe8ff', filter: 'drop-shadow(0 0 8px rgba(127,232,255,0.6))' }}>▲</span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.06em' }}>UPGRADES</span>
          <span style={{ fontSize: 10.5, color: '#8294b8' }}>spend money & cores</span>
        </span>
        <span style={{ marginLeft: 4, padding: '3px 9px', borderRadius: 7, fontSize: 12, fontWeight: 700,
          background: 'rgba(127,232,255,0.14)', border: '1px solid rgba(127,232,255,0.35)', color: '#7fe8ff' }}>TAB</span>
      </button>

      {/* SKILL TREE button — bottom-left, mirrors Upgrades */}
      <button onClick={() => setSkillOpen(true)}
        style={{ position: 'absolute', left: 22, bottom: 22, display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', borderRadius: 14, cursor: 'pointer',
          background: 'linear-gradient(180deg, rgba(20,40,72,0.95), rgba(12,24,46,0.95))',
          border: '1px solid rgba(70,227,154,0.4)', color: '#e7f0ff',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5), 0 0 22px rgba(70,227,154,0.22)',
          fontFamily: "'Chakra Petch', sans-serif" }}>
        <span style={{ marginRight: 4, padding: '3px 9px', borderRadius: 7, fontSize: 12, fontWeight: 700,
          background: 'rgba(70,227,154,0.14)', border: '1px solid rgba(70,227,154,0.35)', color: '#46e39a' }}>T</span>
        <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '.06em' }}>SKILL TREE</span>
          <span style={{ fontSize: 10.5, color: '#8294b8' }}>unlock new abilities</span>
        </span>
        <span style={{ fontSize: 24, color: '#46e39a', filter: 'drop-shadow(0 0 8px rgba(70,227,154,0.6))' }}>⏣</span>
      </button>

      {/* SKILL TREE overlay — pauses the battle */}
      {skillOpen &&
      <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center',
        background: 'rgba(4,8,16,0.72)', backdropFilter: 'blur(6px)' }}>
        <div style={{ width: 840, maxWidth: '94%', borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e1b30, #0a1424)', border: '1px solid rgba(70,227,154,0.28)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(70,227,154,0.14)' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid rgba(120,160,230,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '.08em', color: '#e7f0ff' }}>SKILL TREE</span>
              <span style={{ fontSize: 13, color: '#7fc7a0' }}>❚❚ battle paused</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, letterSpacing: '.14em', color: '#8294b8' }}>CORES</span>
                <span style={{ width: 16, height: 16, transform: 'rotate(45deg)', borderRadius: 4, background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)', boxShadow: '0 0 10px rgba(127,232,255,0.6)' }} />
                <span style={{ fontSize: 19, fontWeight: 700, color: '#7fe8ff' }}>18</span>
              </div>
              <button onClick={() => setSkillOpen(false)}
                style={{ padding: '6px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif",
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(120,160,230,0.25)', color: '#c4d3ee',
                  fontSize: 13, fontWeight: 600 }}>Close · ESC</button>
            </div>
          </div>
          {/* branches */}
          <div style={{ padding: '26px 24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {SKILL_TREE.map((br) => (
              <div key={br.branch} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.2em', color: br.color,
                  textShadow: `0 0 12px ${br.color}66`, marginBottom: 18 }}>{br.branch}</div>
                {br.nodes.map((n, i) => {
                  const owned = n.state === 'owned', avail = n.state === 'available';
                  return (
                    <div key={n.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {i > 0 &&
                        <div style={{ width: 3, height: 22, borderRadius: 2,
                          background: owned ? br.color : 'rgba(120,160,230,0.18)',
                          boxShadow: owned ? `0 0 8px ${br.color}` : 'none' }} />}
                      <div style={{ position: 'relative', width: 200, display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 14px', borderRadius: 13,
                        background: owned ? `${br.color}1f` : avail ? 'rgba(8,14,28,0.7)' : 'rgba(8,14,28,0.4)',
                        border: `1px solid ${owned ? br.color + 'aa' : avail ? br.color + '66' : 'rgba(120,160,230,0.14)'}`,
                        boxShadow: avail ? `0 0 16px ${br.color}33` : 'none',
                        opacity: n.state === 'locked' ? 0.5 : 1, cursor: avail ? 'pointer' : 'default' }}>
                        <span style={{ width: 36, height: 36, borderRadius: 10, flex: '0 0 auto', display: 'grid', placeItems: 'center',
                          fontSize: 18, color: n.state === 'locked' ? '#56668c' : br.color,
                          background: n.state === 'locked' ? 'rgba(255,255,255,0.03)' : `${br.color}18`,
                          border: `1px solid ${n.state === 'locked' ? 'rgba(120,160,230,0.2)' : br.color + '55'}` }}>
                          {n.state === 'locked' ? '🔒' : n.g}
                        </span>
                        <div style={{ lineHeight: 1.15 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: n.state === 'locked' ? '#8294b8' : '#e7f0ff' }}>{n.name}</div>
                          <div style={{ fontSize: 11, color: owned ? br.color : '#7488ad', display: 'flex', alignItems: 'center', gap: 5 }}>
                            {owned ? '✓ unlocked' : avail ?
                              <React.Fragment>
                                <span style={{ width: 11, height: 11, transform: 'rotate(45deg)', borderRadius: 3, background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)' }} />
                                {n.tier + 2} cores
                              </React.Fragment> : 'locked'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      }

      {/* STORE overlay — pauses the battle */}
      {storeOpen &&
      <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'grid', placeItems: 'center',
        background: 'rgba(4,8,16,0.72)', backdropFilter: 'blur(6px)' }}>
        <div style={{ width: 760, maxWidth: '92%', borderRadius: 20, overflow: 'hidden',
          background: 'linear-gradient(180deg, #0e1b30, #0a1424)', border: '1px solid rgba(127,232,255,0.28)',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 40px rgba(59,157,255,0.18)' }}>
          {/* header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '18px 24px', borderBottom: '1px solid rgba(120,160,230,0.16)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '.08em', color: '#e7f0ff' }}>UPGRADES</span>
              <span style={{ fontSize: 13, color: '#7fc7a0' }}>❚❚ battle paused</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffe79a, #f2a93a)' }} />
                <span style={{ fontSize: 19, fontWeight: 700, color: '#ffc94a' }}>1,240</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 16, height: 16, transform: 'rotate(45deg)', borderRadius: 4, background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)' }} />
                <span style={{ fontSize: 19, fontWeight: 700, color: '#7fe8ff' }}>18</span>
              </div>
              <button onClick={() => setStoreOpen(false)}
                style={{ padding: '6px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif",
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(120,160,230,0.25)', color: '#c4d3ee',
                  fontSize: 13, fontWeight: 600 }}>Close · ESC</button>
            </div>
          </div>
          {/* hero: Tower Level upgrade */}
          <div style={{ margin: '20px 22px 0', padding: '18px 22px', borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 20,
            background: 'linear-gradient(110deg, rgba(127,232,255,0.16), rgba(59,157,255,0.10) 55%, rgba(20,40,72,0.2))',
            border: '1px solid rgba(127,232,255,0.5)', boxShadow: '0 0 30px rgba(59,157,255,0.2), inset 0 0 30px rgba(127,232,255,0.06)' }}>
            <div style={{ position: 'relative', flex: '0 0 auto' }}>
              <img src={TOWER_SRC} alt="tower" style={{ height: 88, width: 'auto', filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5)) drop-shadow(0 0 16px rgba(127,232,255,0.5))' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <span style={{ fontSize: 12, letterSpacing: '.24em', color: '#9fc7ee' }}>TOWER LEVEL</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
                  color: '#46e39a', padding: '3px 9px', borderRadius: 20, background: 'rgba(70,227,154,0.12)',
                  border: '1px solid rgba(70,227,154,0.45)' }}>✦ PERMANENT</span>
                <span style={{ fontSize: 30, fontWeight: 800, color: '#7fe8ff', textShadow: '0 0 16px rgba(127,232,255,0.55)' }}>4</span>
                <span style={{ fontSize: 14, color: '#56668c' }}>→</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#cdeeff' }}>5</span>
              </div>
              {/* level progress pips */}
              <div style={{ display: 'flex', gap: 5, marginTop: 9 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <span key={i} style={{ flex: 1, height: 7, borderRadius: 3,
                    background: i < 4 ? 'linear-gradient(90deg,#3fc8e6,#7fe8ff)' : 'rgba(120,160,230,0.16)',
                    boxShadow: i < 4 ? '0 0 8px rgba(127,232,255,0.5)' : 'none' }} />
                ))}
              </div>
              <div style={{ fontSize: 12.5, color: '#8294b8', marginTop: 8 }}>
                Boosts every stat — <span style={{ color: '#cdeeff' }}>+12% damage</span>, <span style={{ color: '#cdeeff' }}>+10% range</span>, <span style={{ color: '#cdeeff' }}>+200 max integrity</span>
              </div>
            </div>
            <button style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '14px 26px', borderRadius: 13, cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif",
              background: 'linear-gradient(180deg, #2bb4e0, #1d83c8)', border: '1px solid rgba(180,240,255,0.6)',
              color: '#04121f', boxShadow: '0 6px 18px rgba(43,180,224,0.4), inset 0 1px 0 rgba(255,255,255,0.4)' }}>
              <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.05em' }}>LEVEL UP</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700 }}>
                <span style={{ width: 14, height: 14, transform: 'rotate(45deg)', borderRadius: 3, background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)' }} />
                8 cores
              </span>
            </button>
          </div>

          {/* divider: this-level-only purchases */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 24px 0' }}>
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.16em', color: '#ffb56b', whiteSpace: 'nowrap' }}>FIELD UPGRADES</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#c79a6a', whiteSpace: 'nowrap' }}>↺ reset at end of level</span>
            <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,181,107,0.4), transparent)' }} />
          </div>

          {/* grid of upgrades */}
          <div style={{ padding: '14px 22px 22px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {STORE_ITEMS.map((it, i) => {
              const gold = it.cur === 'money';
              const accent = gold ? '#ffc94a' : '#7fe8ff';
              return (
                <div key={i} style={{ padding: 16, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12,
                  background: 'rgba(8,14,28,0.6)', border: '1px solid rgba(120,160,230,0.16)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ lineHeight: 1.15 }}>
                      <div style={{ fontWeight: 700, fontSize: 15.5, color: '#e7f0ff' }}>{it.name}</div>
                      <div style={{ fontSize: 12, color: '#7488ad' }}>{it.sub}</div>
                    </div>
                  </div>
                  <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    padding: '9px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Chakra Petch', sans-serif",
                    background: `${accent}1a`, border: `1px solid ${accent}55`, color: accent, fontWeight: 700, fontSize: 14 }}>
                    <span style={{ width: 14, height: 14, borderRadius: gold ? '50%' : 3,
                      transform: gold ? 'none' : 'rotate(45deg)',
                      background: gold ? 'radial-gradient(circle at 35% 30%, #ffe79a, #f2a93a)' : 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)' }} />
                    {it.cost} {it.cur === 'cores' ? 'cores' : ''}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      }
    </div>);

}

/* roster of the cut-out sprites */
function SpriteRoster() {
  const items = [
  { src: 'sprites/enemy_0.png', label: 'Skitter Walker', sub: 'top-down · grunt', h: 80 },
  { src: 'sprites/enemy_1.png', label: 'Strike Drone', sub: 'top-down · fast', h: 80 },
  { src: 'sprites/enemy_2.png', label: 'Siege Tank', sub: 'top-down · armored', h: 100 },
  { src: 'sprites/enemy_3.png', label: 'Brute', sub: 'top-down · mini-boss', h: 110 },
  { src: 'sprites/enemy_4.png', label: 'Swarm Mites', sub: 'top-down · cluster', h: 80 },
  { src: 'sprites/turret_base.png', label: 'Turret Base', sub: 'top-down · static', h: 130 },
  { src: 'sprites/turret_gun.png', label: 'Turret Gun', sub: 'swivels · fires', h: 150 }];

  return (
    <div style={{ display: 'flex', gap: 14, padding: 24, alignItems: 'flex-end', flexWrap: 'wrap',
      background: '#0b1322', fontFamily: "'Space Grotesk', sans-serif" }}>
      {items.map((it, i) =>
      <div key={i} style={{ width: 168, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ height: 170, display: 'grid', placeItems: 'center', alignSelf: 'stretch',
          borderRadius: 14, background: 'radial-gradient(circle at 50% 40%, #16233a, #0c1426)', border: '1px solid #1f2e48' }}>
            <img src={it.src} alt={it.label} style={{ height: it.h, width: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' }} />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: '#e7f0ff' }}>{it.label}</div>
            <div style={{ fontSize: 12, color: '#7488ad' }}>{it.sub}</div>
          </div>
        </div>
      )}
    </div>);

}

Object.assign(window, { BattleLive, SpriteRoster });