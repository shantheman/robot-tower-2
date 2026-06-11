/* screens.jsx — Wave intro, Death, and Home screens built on the battle system */
const { useState: useS, useEffect: useE, useRef: useR } = React;

const TURRET_BASE = 'sprites/turret_base.png';
const TURRET_GUN = 'sprites/turret_gun.png';
const ENEMY_SRCS = ['sprites/enemy_0.png','sprites/enemy_1.png','sprites/enemy_2.png','sprites/enemy_3.png','sprites/enemy_4.png'];
const FONT = "'Chakra Petch', sans-serif";

/* static battle backdrop (no HUD) — shared by wave-intro & death screens */
function Backdrop({ dim = 0, blur = 0 }) {
  const CX = 640, CY = 410;
  const decor = [
    { x: 16, y: 20, s: 50, i: 0 }, { x: 35, y: 11, s: 52, i: 1 }, { x: 72, y: 14, s: 66, i: 2 },
    { x: 88, y: 30, s: 88, i: 3 }, { x: 90, y: 58, s: 58, i: 4 }, { x: 80, y: 80, s: 50, i: 0 },
    { x: 60, y: 89, s: 56, i: 1 }, { x: 40, y: 90, s: 66, i: 2 }, { x: 20, y: 82, s: 88, i: 3 },
    { x: 9, y: 58, s: 58, i: 4 }, { x: 10, y: 36, s: 50, i: 1 }, { x: 52, y: 8, s: 56, i: 4 },
  ];
  const ang = (x, y) => Math.atan2(50 - y, 50 - x) * 180 / Math.PI + 270;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden',
      background: 'radial-gradient(120% 120% at 50% 50%, #0e1b30 0%, #081120 55%, #04080f 100%)',
      filter: blur ? `blur(${blur}px)` : 'none' }}>
      <div style={{ position: 'absolute', inset: -2,
        backgroundImage: 'linear-gradient(rgba(96,150,230,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(96,150,230,0.06) 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        WebkitMaskImage: 'radial-gradient(120% 100% at 50% 50%, #000 40%, transparent 80%)' }} />
      {[260, 520, 820, 1180].map((d, i) => (
        <div key={i} style={{ position: 'absolute', left: CX, top: CY, width: d, height: d,
          transform: 'translate(-50%,-50%)', borderRadius: '50%',
          border: `1px solid rgba(95,182,255,${0.26 - i * 0.06})` }} />
      ))}
      {decor.map((e, k) => (
        <img key={k} src={ENEMY_SRCS[e.i]} alt="" draggable="false"
          style={{ position: 'absolute', left: e.x + '%', top: e.y + '%', width: e.s,
            transform: `translate(-50%,-50%) rotate(${ang(e.x, e.y)}deg)`,
            filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.5))' }} />
      ))}
      <img src={TURRET_BASE} alt="" draggable="false"
        style={{ position: 'absolute', left: CX, top: CY, width: 150, height: 150, transform: 'translate(-50%,-43%)',
          filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.55))' }} />
      <img src={TURRET_GUN} alt="" draggable="false"
        style={{ position: 'absolute', left: CX, top: CY, height: 104, width: 'auto',
          transformOrigin: '50% 79%', transform: 'translate(-50%,-79%) rotate(18deg)',
          filter: 'drop-shadow(0 5px 9px rgba(0,0,0,0.6))' }} />
      {dim > 0 && <div style={{ position: 'absolute', inset: 0, background: `rgba(2,6,14,${dim})` }} />}
    </div>
  );
}

/* tiny shared bits */
const Coin = ({ s = 20 }) => <span style={{ width: s, height: s, borderRadius: '50%', flex: '0 0 auto',
  background: 'radial-gradient(circle at 35% 30%, #ffe79a, #f2a93a)', boxShadow: `0 0 ${s/2}px rgba(255,201,74,0.5)` }} />;
const Core = ({ s = 18 }) => <span style={{ width: s, height: s, transform: 'rotate(45deg)', borderRadius: s/4, flex: '0 0 auto',
  background: 'radial-gradient(circle at 35% 30%, #b6f0ff, #3fc8e6)', boxShadow: `0 0 ${s/2}px rgba(127,232,255,0.6)` }} />;
const fmt = (n) => Math.round(n).toLocaleString('en-US');

/* ============ 1 · WAVE INTRO ============ */
function WaveIntro() {
  const [count, setCount] = useS(3);
  useE(() => {
    const iv = setInterval(() => setCount((c) => (c <= 1 ? 3 : c - 1)), 1100);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, color: '#e7f0ff', userSelect: 'none' }}
      data-screen-label="Wave Intro">
      <Backdrop dim={0.45} blur={1.5} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <div style={{ fontSize: 13, letterSpacing: '.5em', color: '#7fc7a0', textTransform: 'uppercase' }}>Level 3 · Incoming</div>
        <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: '#ff7a64', whiteSpace: 'nowrap',
          textShadow: '0 0 30px rgba(255,82,56,0.5)', letterSpacing: '.02em' }}>WAVE 7</div>
        <div style={{ marginTop: 6, fontSize: 16, color: '#9fb3d6' }}>12 hostiles · 1 brute detected</div>
        {/* countdown ring */}
        <div style={{ marginTop: 26, position: 'relative', width: 96, height: 96, display: 'grid', placeItems: 'center' }}>
          <svg width="96" height="96" style={{ position: 'absolute', transform: 'rotate(-90deg)' }}>
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(120,160,230,0.18)" strokeWidth="4" />
            <circle cx="48" cy="48" r="44" fill="none" stroke="#7fe8ff" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 44} strokeDashoffset={2 * Math.PI * 44 * (1 - count / 3)}
              style={{ transition: 'stroke-dashoffset 1s linear', filter: 'drop-shadow(0 0 6px #7fe8ff)' }} />
          </svg>
          <span style={{ fontSize: 44, fontWeight: 800, color: '#7fe8ff' }}>{count}</span>
        </div>
        <button style={{ marginTop: 24, padding: '11px 30px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
          fontSize: 15, fontWeight: 700, letterSpacing: '.08em', color: '#04121f',
          background: 'linear-gradient(180deg, #2bb4e0, #1d83c8)', border: '1px solid rgba(180,240,255,0.6)',
          boxShadow: '0 6px 18px rgba(43,180,224,0.4)' }}>START NOW ▸</button>
      </div>
    </div>
  );
}

/* ============ 2 · DEATH SCREEN (money → cores) ============ */
function DeathScreen() {
  const START_MONEY = 1240, START_CORES = 18, RATIO = 100;
  const earned = Math.floor(START_MONEY / RATIO); // 12
  const [money, setMoney] = useS(START_MONEY);
  const [cores, setCores] = useS(START_CORES);
  const [phase, setPhase] = useS('idle'); // idle -> converting -> done
  const [flies, setFlies] = useS([]);

  const run = () => {
    if (phase !== 'idle') return;
    setPhase('converting');
    const dur = 1800, t0 = performance.now();
    // spawn flying diamonds
    setFlies(Array.from({ length: earned }, (_, i) => ({ id: i, d: i * (dur * 0.6 / earned) })));
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 2);
      setMoney(START_MONEY * (1 - eased));
      setCores(START_CORES + earned * eased);
      if (p < 1) requestAnimationFrame(step);
      else { setMoney(0); setCores(START_CORES + earned); setPhase('done'); }
    };
    requestAnimationFrame(step);
  };
  useE(() => { const t = setTimeout(run, 700); return () => clearTimeout(t); }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, fontFamily: FONT, color: '#e7f0ff', userSelect: 'none' }}
      data-screen-label="You Died">
      <Backdrop dim={0.7} blur={3} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, letterSpacing: '.5em', color: '#ff7a64', marginBottom: 4 }}>TOWER DESTROYED</div>
        <div style={{ fontSize: 88, fontWeight: 800, lineHeight: 1, color: '#ff5238', whiteSpace: 'nowrap',
          textShadow: '0 0 40px rgba(255,82,56,0.55)', marginBottom: 4 }}>YOU DIED</div>
        <div style={{ fontSize: 15, color: '#8294b8', marginBottom: 34, whiteSpace: 'nowrap' }}>You fell on <b style={{ color: '#cdeeff' }}>Level 3</b> · Wave 7</div>

        {/* conversion card */}
        <div style={{ width: 560, padding: '24px 28px', borderRadius: 18,
          background: 'linear-gradient(180deg, rgba(14,27,48,0.9), rgba(10,20,36,0.9))',
          border: '1px solid rgba(127,232,255,0.25)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ fontSize: 12, letterSpacing: '.22em', color: '#8294b8', textAlign: 'center', marginBottom: 20 }}>
            SALVAGE · MONEY CONVERTS TO CORES @ 100:1
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 18 }}>
            {/* money */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#8294b8', marginBottom: 8 }}>MONEY</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <Coin s={22} />
                <span style={{ fontSize: 30, fontWeight: 800, color: '#ffc94a' }}>{fmt(money)}</span>
              </div>
            </div>
            {/* arrow w/ flying diamonds */}
            <div style={{ position: 'relative', width: 120, height: 50, flex: '0 0 auto' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                fontSize: 26, color: '#56668c' }}>⟶</div>
              {flies.map((f) => (
                <span key={f.id} style={{ position: 'absolute', left: 0, top: 15,
                  animation: phase === 'converting' ? `fly 0.7s ${f.d}ms ease-in forwards` : 'none', opacity: 0 }}>
                  <Core s={16} />
                </span>
              ))}
            </div>
            {/* cores */}
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#8294b8', marginBottom: 8 }}>CORES</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9 }}>
                <Core s={20} />
                <span style={{ fontSize: 30, fontWeight: 800, color: '#7fe8ff',
                  textShadow: phase === 'done' ? '0 0 18px rgba(127,232,255,0.6)' : 'none' }}>{fmt(cores)}</span>
                {phase === 'done' && <span style={{ fontSize: 15, color: '#46e39a', fontWeight: 700 }}>+{earned}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* what resets / what keeps */}
        <div style={{ display: 'flex', gap: 28, marginTop: 22, fontSize: 13 }}>
          <div style={{ color: '#7488ad' }}>↺ resets: <span style={{ color: '#ff9a87' }}>Money · Upgrades</span></div>
          <div style={{ color: '#7488ad' }}>✓ kept: <span style={{ color: '#7fe8ff' }}>Cores · Tower Level · Skills</span></div>
        </div>

        <div style={{ display: 'flex', gap: 14, marginTop: 30 }}>
          <button style={{ padding: '13px 30px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
            fontSize: 15, fontWeight: 700, letterSpacing: '.06em', color: '#04121f',
            background: 'linear-gradient(180deg, #2bb4e0, #1d83c8)', border: '1px solid rgba(180,240,255,0.6)',
            boxShadow: '0 6px 18px rgba(43,180,224,0.4)' }}>RETRY LEVEL 3 ▸</button>
          <button style={{ padding: '13px 26px', borderRadius: 12, cursor: 'pointer', fontFamily: FONT,
            fontSize: 15, fontWeight: 600, color: '#c4d3ee',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(120,160,230,0.25)' }}>HOME</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Backdrop, WaveIntro, DeathScreen, Coin, Core, fmt });
