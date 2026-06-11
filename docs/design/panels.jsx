/* panels.jsx — cleaned-up Skill Tree + Upgrades store, real game content,
   matched to the Real-Art visual system. */
const CHK = "'Chakra Petch', sans-serif";   // HUD / numbers / labels
const SPG = "'Space Grotesk', sans-serif";   // menu / reading text
const TBASE = 'sprites/turret_base.png';
const TGUN = 'sprites/turret_gun.png';

const Diamond = ({ s = 16, dim }) => (
  <span style={{ width: s, height: s, transform: 'rotate(45deg)', borderRadius: s / 4, flex: '0 0 auto',
    background: dim ? '#3a4a63' : 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)',
    boxShadow: dim ? 'none' : `0 0 ${s / 2}px rgba(127,232,255,0.5)` }} />
);
const CoinDot = ({ s = 16, dim }) => (
  <span style={{ width: s, height: s, borderRadius: '50%', flex: '0 0 auto',
    background: dim ? '#5a5238' : 'radial-gradient(circle at 35% 30%, #ffe79a, #f2a93a)',
    boxShadow: dim ? 'none' : `0 0 ${s / 2}px rgba(255,201,74,0.45)` }} />
);

/* composed turret thumbnail (base + angled gun) */
function TurretThumb({ base = 96, angle = -18 }) {
  return (
    <div style={{ position: 'relative', width: base, height: base, flex: '0 0 auto' }}>
      <div style={{ position: 'absolute', left: '50%', bottom: '6%', width: base * 0.74, height: base * 0.22,
        transform: 'translateX(-50%)', borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(95,182,255,0.4), transparent 70%)', filter: 'blur(4px)' }} />
      <img src={TBASE} alt="" draggable="false" style={{ position: 'absolute', left: '50%', top: '50%',
        width: base, height: base, transform: 'translate(-50%,-43%)',
        filter: 'drop-shadow(0 5px 9px rgba(0,0,0,0.55))' }} />
      <img src={TGUN} alt="" draggable="false" style={{ position: 'absolute', left: '50%', top: '50%',
        height: base * 0.69, width: 'auto', transformOrigin: '50% 79%',
        transform: `translate(-50%,-79%) rotate(${angle}deg)`,
        filter: 'drop-shadow(0 4px 7px rgba(0,0,0,0.6)) drop-shadow(0 0 14px rgba(127,232,255,0.4))' }} />
    </div>
  );
}

/* shared back button */
const BackBtn = () => (
  <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 11,
    cursor: 'pointer', fontFamily: CHK, fontSize: 15, fontWeight: 600, color: '#c4d3ee',
    background: 'rgba(14,27,48,0.85)', border: '1px solid rgba(120,160,230,0.25)' }}>
    <span style={{ fontSize: 13 }}>‹</span> Back
  </button>
);

/* ============================ SKILL TREE ============================ */
const TREE = [
  { col: 'CANNON', accent: '#7fe8ff', nodes: [
    { name: 'Multi-Shot', desc: 'More bullets per shot', cost: 90, state: 'owned' },
    { name: 'Piercing Shots', desc: 'Bullets pierce through enemies', cost: 140, state: 'available' },
    { name: 'Explosive Rounds', desc: 'Hits blast nearby enemies', cost: 220, state: 'locked', need: 'Piercing Shots' },
    { name: 'Guided Rounds', desc: 'Bullets bend toward enemies', cost: 300, state: 'locked', need: 'Explosive Rounds' },
  ] },
  { col: 'DEFENSE', accent: '#7fe8ff', nodes: [
    { name: 'Repair Bay', desc: 'Buy hull repairs in battle', cost: 80, state: 'owned' },
    { name: 'Reinforced Plating', desc: 'Buy +max HP in battle', cost: 160, state: 'available' },
    { name: 'Shield Generator', desc: 'Recharging hit shield', cost: 260, state: 'locked', need: 'Reinforced Plating' },
  ] },
  { col: 'DRONE', accent: '#7fe8ff', nodes: [
    { name: 'Twin Targeting', desc: 'Drone hits 2 enemies at once', cost: 200, state: 'available' },
  ] },
  { col: 'ULTIMATES', accent: '#7fe8ff', nodes: [
    { name: 'EMP Burst', desc: 'Zap + stun everything', cost: 80, state: 'owned' },
    { name: 'Freeze Bomb', desc: 'Freezes all enemies', cost: 180, state: 'available' },
    { name: 'Time Warp', desc: 'Slow-motion for enemies', cost: 320, state: 'locked', need: 'Freeze Bomb' },
    { name: 'Laser Beam', desc: 'The mega-beam', cost: 500, state: 'locked', need: 'Time Warp' },
  ] },
];

function SkillNode({ node, accent }) {
  const owned = node.state === 'owned';
  const avail = node.state === 'available';
  const border = owned ? 'rgba(70,227,154,0.7)' : avail ? `${accent}` : 'rgba(120,160,230,0.16)';
  const fill = owned
    ? 'linear-gradient(160deg, rgba(70,227,154,0.14), rgba(10,30,24,0.5))'
    : avail
      ? `linear-gradient(160deg, ${accent}22, rgba(10,20,36,0.55))`
      : 'rgba(8,14,28,0.5)';
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: fill,
      border: `1px solid ${border}`,
      boxShadow: avail ? `0 0 18px ${accent}33` : owned ? '0 0 16px rgba(70,227,154,0.18)' : 'none',
      opacity: node.state === 'locked' ? 0.66 : 1 }}>
      <div style={{ fontFamily: SPG, fontWeight: 700, fontSize: 18, color: '#eaf4ff', marginBottom: 3 }}>{node.name}</div>
      <div style={{ fontFamily: SPG, fontSize: 13, color: '#8294b8', lineHeight: 1.35, marginBottom: 11 }}>{node.desc}</div>
      {owned ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: CHK, fontSize: 12.5,
          fontWeight: 700, letterSpacing: '.12em', color: '#46e39a' }}>✓ OWNED</div>
      ) : avail ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 13px', borderRadius: 9,
          background: `${accent}1f`, border: `1px solid ${accent}66`, fontFamily: CHK, fontWeight: 700, fontSize: 14, color: accent }}>
          <Diamond s={13} /> {node.cost}
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: CHK, fontSize: 12, color: '#56668c' }}>
          <span style={{ fontSize: 13 }}>🔒</span>
          <span style={{ fontFamily: SPG }}>needs <span style={{ color: '#9fb3d6' }}>{node.need}</span></span>
        </div>
      )}
    </div>
  );
}

function SkillTreeScreen() {
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: CHK, color: '#e7f0ff', userSelect: 'none',
      background: 'radial-gradient(130% 120% at 50% 0%, #12203a 0%, #0a1424 55%, #050a14 100%)',
      padding: '28px 40px 24px', display: 'flex', flexDirection: 'column' }}
      data-screen-label="Skill Tree (cleaned)">
      {/* header (normal flow so it reserves height) */}
      <div style={{ position: 'relative', textAlign: 'center', marginBottom: 24 }}>
        <div style={{ position: 'absolute', left: 0, top: 2 }}><BackBtn /></div>
        <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: '.06em', color: '#7fe8ff',
          textShadow: '0 0 26px rgba(127,232,255,0.45)' }}>SKILL TREE</h1>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 9 }}>
          <Diamond s={18} /><span style={{ fontSize: 24, fontWeight: 700, color: '#7fe8ff' }}>146</span>
          <span style={{ fontFamily: CHK, fontSize: 12, letterSpacing: '.16em', color: '#56668c', marginLeft: 4 }}>CORES</span>
        </div>
        <div style={{ fontFamily: SPG, fontSize: 14, color: '#8294b8', marginTop: 9 }}>
          Unlock a node to let that power appear in your in-round Upgrades panel.
        </div>
        {/* legend: color = state */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginTop: 14,
          fontFamily: CHK, fontSize: 12, letterSpacing: '.08em' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#46e39a' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#46e39a', boxShadow: '0 0 7px #46e39a' }} />OWNED</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#7fe8ff' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: '#7fe8ff', boxShadow: '0 0 7px #7fe8ff' }} />AVAILABLE</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#56668c' }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, border: '1px solid #56668c' }} />LOCKED</span>
        </div>
      </div>
      {/* columns */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22, alignItems: 'start', marginTop: 8 }}>
        {TREE.map((col, ci) => (
          <div key={ci} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid rgba(120,160,230,0.16)' }}>
              <CatIcon type={col.col} />
              <span style={{ fontFamily: CHK, fontSize: 13, fontWeight: 600, letterSpacing: '.22em', color: '#9fb3d6' }}>{col.col}</span>
            </div>
            {col.nodes.map((n, ni) => (
              <React.Fragment key={ni}>
                {ni > 0 && (
                  <div style={{ alignSelf: 'center', width: 2, height: 26,
                    background: col.nodes[ni - 1].state === 'owned'
                      ? `linear-gradient(${col.accent}, ${col.accent}88)` : 'rgba(120,160,230,0.22)',
                    boxShadow: col.nodes[ni - 1].state === 'owned' ? `0 0 7px ${col.accent}` : 'none' }} />
                )}
                <SkillNode node={n} accent={col.accent} />
              </React.Fragment>
            ))}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', fontFamily: SPG, fontSize: 13.5, color: '#56668c', marginTop: 18 }}>
        Click a node to unlock it.
      </div>
    </div>
  );
}

/* ============================ UPGRADES STORE ============================ */
// state: 'buy' (affordable), 'poor' (too expensive), 'owned', 'equipped'
const FIELD_GROUPS = [
  { cat: 'CANNON', items: [
    { name: 'Main Turret', desc: 'Lv 1 · +dmg, rate, size', cost: 96, state: 'buy' },
    { name: 'Multi-Shot', desc: 'Lv 0 · +1 bullet / lvl', cost: 220, state: 'buy' },
    { name: 'Piercing', desc: 'Lv 0 · pass through', cost: 150, state: 'buy' },
    { name: 'Explosive', desc: 'Lv 2 · hits blast', cost: 810, state: 'poor' },
    { name: 'Guided', desc: 'bullets bend to foes', cost: 0, state: 'owned' },
  ] },
  { cat: 'DEFENSE', items: [
    { name: 'Repair', desc: 'restore +30 HP', cost: 60, state: 'buy' },
    { name: 'Plating', desc: '+25 max HP', cost: 90, state: 'buy' },
    { name: 'Shield', desc: 'Lv 1 · +1 hit absorbed', cost: 595, state: 'poor' },
  ] },
  { cat: 'DRONE', items: [
    { name: 'Drone', desc: 'deploy · auto-hunts', cost: 100, state: 'buy' },
    { name: 'Auto-Shooter', desc: 'Lv 1 · fires faster', cost: 80, state: 'buy' },
  ] },
  { cat: 'ECONOMY', items: [
    { name: 'Generator', desc: 'Lv 4 · +15 cash/sec', cost: 327, state: 'buy' },
  ] },
];

function CatIcon({ type, c = '#9fb3d6' }) {
  const p = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: c, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };
  if (type === 'CANNON') return (<svg {...p}><circle cx="12" cy="12" r="7" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>);
  if (type === 'DEFENSE') return (<svg {...p}><path d="M12 3l7 3v5c0 4-3 7-7 9-4-2-7-5-7-9V6z" /></svg>);
  if (type === 'DRONE') return (<svg {...p}><circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="18" r="2.4" /><path d="M8 8l3 3M16 8l-3 3M8 16l3-3M16 16l-3-3" /></svg>);
  if (type === 'ECONOMY') return (<svg {...p}><circle cx="12" cy="12" r="8" /><path d="M12 8v8M9.6 9.6h3.4a2 2 0 010 4H9.6" /></svg>);
  if (type === 'ULTIMATES' || type === 'ULTIMATE') return (<svg {...p} fill={c} stroke="none"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" /></svg>);
  return null;
}
const ULT = [
  { name: 'EMP Burst', desc: 'Zap + stun everything', cost: 400, state: 'buy' },
  { name: 'Freeze Bomb', desc: 'Freezes all enemies', cost: 0, state: 'equipped' },
  { name: 'Time Warp', desc: 'Slow-motion for enemies', cost: 500, state: 'poor' },
  { name: 'Laser Beam', desc: 'The mega-beam', cost: 1000, state: 'poor' },
];

function StoreCard({ it, wide }) {
  const { state } = it;
  const owned = state === 'owned', equipped = state === 'equipped', poor = state === 'poor';
  const green = owned || equipped;
  const border = green ? 'rgba(70,227,154,0.7)' : poor ? 'rgba(120,160,230,0.14)' : 'rgba(127,232,255,0.42)';
  const fill = green
    ? 'linear-gradient(160deg, rgba(70,227,154,0.13), rgba(10,30,24,0.5))'
    : poor ? 'rgba(8,14,28,0.45)' : 'linear-gradient(160deg, rgba(127,232,255,0.08), rgba(10,20,36,0.5))';
  return (
    <div style={{ padding: '12px 14px', borderRadius: 13, background: fill, border: `1px solid ${border}`,
      boxShadow: !green && !poor ? '0 0 14px rgba(127,232,255,0.12)' : 'none',
      opacity: poor ? 0.62 : 1, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ lineHeight: 1.12 }}>
        <div style={{ fontFamily: SPG, fontWeight: 700, fontSize: 16, color: '#eaf4ff' }}>{it.name}</div>
        <div style={{ fontFamily: SPG, fontSize: 12, color: '#7488ad', marginTop: 2 }}>{it.desc}</div>
      </div>
      {green ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: CHK, fontSize: 13, fontWeight: 700,
          letterSpacing: '.1em', color: '#46e39a' }}>✓ {equipped ? 'EQUIPPED' : 'OWNED'}</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '8px',
          borderRadius: 9, fontFamily: CHK, fontWeight: 700, fontSize: 14,
          background: poor ? 'rgba(120,160,230,0.06)' : 'rgba(255,201,74,0.12)',
          border: `1px solid ${poor ? 'rgba(120,160,230,0.18)' : 'rgba(255,201,74,0.4)'}`,
          color: poor ? '#56668c' : '#ffc94a' }}>
          <CoinDot s={14} dim={poor} /> {it.cost.toLocaleString('en-US')}
        </div>
      )}
    </div>
  );
}

function UpgradesStoreScreen({ status = 'paused' }) {
  const cleared = status === 'cleared';
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: CHK, color: '#e7f0ff', userSelect: 'none',
      background: 'radial-gradient(130% 120% at 50% 0%, #0e1b30 0%, #0a1424 55%, #050a14 100%)',
      padding: '24px 40px', display: 'flex', flexDirection: 'column' }}
      data-screen-label={`Upgrades Store (${status})`}>
      {/* header */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <BackBtn />
        <div style={{ position: 'absolute', left: 0, right: 0, textAlign: 'center', pointerEvents: 'none',
          display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 14 }}>
          <h1 style={{ margin: 0, fontSize: 40, fontWeight: 800, letterSpacing: '.05em', color: '#7fe8ff',
            textShadow: '0 0 26px rgba(127,232,255,0.45)' }}>UPGRADES</h1>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontFamily: CHK, fontSize: 14, fontWeight: 700,
            letterSpacing: '.08em', color: '#46e39a', whiteSpace: 'nowrap' }}>
            {cleared ? '✓ WAVE CLEARED' : '❚❚ BATTLE PAUSED'}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
          <CoinDot s={20} /><span style={{ fontSize: 24, fontWeight: 800, color: '#ffc94a' }}>425</span>
        </div>
      </div>

      {/* tower level hero */}
      <div style={{ padding: '16px 22px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 22,
        background: 'linear-gradient(110deg, rgba(127,232,255,0.15), rgba(59,157,255,0.09) 55%, rgba(20,40,72,0.2))',
        border: '1px solid rgba(127,232,255,0.5)', boxShadow: '0 0 30px rgba(59,157,255,0.18), inset 0 0 30px rgba(127,232,255,0.05)' }}>
        <TurretThumb base={92} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <span style={{ fontSize: 12, letterSpacing: '.24em', color: '#9fc7ee', whiteSpace: 'nowrap' }}>TOWER LEVEL</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 700, letterSpacing: '.12em',
              color: '#46e39a', padding: '3px 9px', borderRadius: 20, background: 'rgba(70,227,154,0.12)',
              border: '1px solid rgba(70,227,154,0.45)', whiteSpace: 'nowrap' }}>✦ PERMANENT</span>
            <span style={{ fontSize: 30, fontWeight: 800, color: '#7fe8ff', textShadow: '0 0 16px rgba(127,232,255,0.55)' }}>7</span>
            <span style={{ fontSize: 14, color: '#56668c' }}>→</span>
            <span style={{ fontSize: 24, fontWeight: 800, color: '#cdeeff' }}>8</span>
          </div>
          <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} style={{ flex: 1, height: 7, borderRadius: 3,
                background: i < 7 ? 'linear-gradient(90deg,#3fc8e6,#7fe8ff)' : 'rgba(120,160,230,0.16)',
                boxShadow: i < 7 ? '0 0 8px rgba(127,232,255,0.5)' : 'none' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 22, marginTop: 10, fontFamily: SPG, fontSize: 13, color: '#8294b8' }}>
            <span>+10% earnings</span><span>+20 max HP</span><span>+30 start cash</span>
          </div>
        </div>
        <button style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '13px 24px', borderRadius: 13, cursor: 'pointer', fontFamily: CHK, whiteSpace: 'nowrap',
          background: 'linear-gradient(180deg, #2bb4e0, #1d83c8)', border: '1px solid rgba(180,240,255,0.6)',
          color: '#04121f', boxShadow: '0 6px 18px rgba(43,180,224,0.4), inset 0 1px 0 rgba(255,255,255,0.4)' }}>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '.05em' }}>LEVEL UP</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
            <Diamond s={13} /> 1,025 cores
          </span>
        </button>
      </div>

      {/* field upgrades — clustered by type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 6px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.16em', color: '#ffb56b', whiteSpace: 'nowrap' }}>FIELD UPGRADES</span>
        <span style={{ fontFamily: SPG, fontSize: 12, color: '#c79a6a', whiteSpace: 'nowrap' }}>↺ reset at end of level</span>
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(255,181,107,0.4), transparent)' }} />
      </div>
      {FIELD_GROUPS.map((g, gi) => (
        <div key={gi} style={{ marginTop: 13 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
            <CatIcon type={g.cat} />
            <span style={{ fontFamily: CHK, fontSize: 11.5, fontWeight: 600, letterSpacing: '.18em', color: '#9fb3d6', whiteSpace: 'nowrap' }}>{g.cat}</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(120,160,230,0.1)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {g.items.map((it, i) => <StoreCard key={i} it={it} />)}
          </div>
        </div>
      ))}

      {/* ultimates */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 13px' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: '.16em', color: '#b48cff', whiteSpace: 'nowrap' }}>ULTIMATES</span>
        <span style={{ fontFamily: SPG, fontSize: 12, color: '#9a86c7', whiteSpace: 'nowrap' }}>own many · click to equip · [Space] fires it</span>
        <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(180,140,255,0.4), transparent)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {ULT.map((it, i) => <StoreCard key={i} it={it} />)}
      </div>

      {/* footer */}
      <div style={{ marginTop: 'auto', paddingTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {cleared ? (
          <button style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 32px', borderRadius: 13,
            cursor: 'pointer', fontFamily: CHK, background: 'linear-gradient(180deg, #2bb4e0, #1d83c8)',
            border: '1px solid rgba(180,240,255,0.6)', color: '#04121f',
            boxShadow: '0 6px 18px rgba(43,180,224,0.4)' }}>
            <span style={{ fontSize: 18 }}>▶</span>
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
              <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '.05em' }}>START NEXT WAVE</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#0a2436' }}>Wave 7 of 30 · [Space]</span>
            </span>
          </button>
        ) : (
          <span style={{ fontFamily: CHK, fontSize: 14, color: '#56668c', letterSpacing: '.06em' }}>[Tab / Esc] Close &amp; resume</span>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SkillTreeScreen, UpgradesStoreScreen });
