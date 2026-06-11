/* home.jsx — Home screen, two versions (new player / continue) */
const { useState: useHS } = React;
const HBASE = 'sprites/turret_base.png';
const HGUN = 'sprites/turret_gun.png';
const HFONT = "'Chakra Petch', sans-serif";
const { Coin: HCoin, Core: HCore } = window;

/* shared menu chrome */
function HomeShell({ children, badge }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', fontFamily: HFONT, color: '#e7f0ff', userSelect: 'none',
      background: 'radial-gradient(130% 120% at 50% 18%, #12203a 0%, #0a1424 52%, #050a14 100%)' }}>
      {/* faint grid + vignette */}
      <div style={{ position: 'absolute', inset: -2,
        backgroundImage: 'linear-gradient(rgba(96,150,230,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(96,150,230,0.05) 1px, transparent 1px)',
        backgroundSize: '52px 52px', WebkitMaskImage: 'radial-gradient(120% 90% at 50% 30%, #000 50%, transparent 85%)' }} />
      {/* hero turret */}
      <div style={{ position: 'absolute', top: 84, left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
        <div style={{ position: 'relative', display: 'inline-block', width: 240, height: 240 }}>
          <div style={{ position: 'absolute', left: '50%', bottom: 18, width: 220, height: 60, transform: 'translateX(-50%)',
            borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(95,182,255,0.4), transparent 70%)', filter: 'blur(9px)' }} />
          <img src={HBASE} alt="" draggable="false" style={{ position: 'absolute', left: '50%', top: '50%',
            width: 200, height: 200, transform: 'translate(-50%,-43%)',
            filter: 'drop-shadow(0 10px 18px rgba(0,0,0,0.6))' }} />
          <img src={HGUN} alt="" draggable="false" style={{ position: 'absolute', left: '50%', top: '50%',
            height: 138, width: 'auto', transformOrigin: '50% 79%',
            transform: 'translate(-50%,-79%) rotate(-16deg)',
            filter: 'drop-shadow(0 8px 14px rgba(0,0,0,0.6))' }} />
        </div>
      </div>
      {/* title */}
      <div style={{ position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: 14, letterSpacing: '.5em', color: '#7fc7a0', marginBottom: 6 }}>{badge}</div>
        <h1 style={{ margin: 0, fontSize: 60, fontWeight: 800, letterSpacing: '.02em', lineHeight: 1,
          color: '#eaf4ff', textShadow: '0 0 40px rgba(95,182,255,0.4)' }}>CORE DEFENDER</h1>
      </div>
      {children}
    </div>
  );
}

function MenuButton({ primary, icon, title, sub, accent = '#7fe8ff', w = 320 }) {
  return (
    <button style={{ width: w, display: 'flex', alignItems: 'center', gap: 14, padding: '15px 22px', borderRadius: 14,
      cursor: 'pointer', fontFamily: HFONT, textAlign: 'left',
      background: primary ? 'linear-gradient(180deg, #2bb4e0, #1d83c8)' : 'rgba(14,27,48,0.85)',
      border: primary ? '1px solid rgba(180,240,255,0.6)' : `1px solid ${accent}44`,
      color: primary ? '#04121f' : '#e7f0ff',
      boxShadow: primary ? '0 8px 22px rgba(43,180,224,0.4)' : '0 4px 14px rgba(0,0,0,0.4)' }}>
      <span style={{ fontSize: 22, color: primary ? '#04121f' : accent, flex: '0 0 auto' }}>{icon}</span>
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{title}</span>
        <span style={{ fontSize: 12, opacity: 0.8, color: primary ? '#0a2436' : '#8294b8', whiteSpace: 'nowrap' }}>{sub}</span>
      </span>
    </button>
  );
}

/* top-right resource + settings cluster */
function HomeTopBar({ showResources }) {
  return (
    <div style={{ position: 'absolute', top: 20, right: 22, display: 'flex', alignItems: 'center', gap: 14 }}>
      {showResources &&
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 11,
          background: 'rgba(8,14,28,0.7)', border: '1px solid rgba(120,160,230,0.22)' }}>
          <HCore s={17} /><span style={{ fontSize: 19, fontWeight: 700, color: '#7fe8ff' }}>30</span>
        </div>}
      <button title="Settings" style={{ width: 40, height: 40, borderRadius: 11, cursor: 'pointer',
        background: 'rgba(8,14,28,0.7)', border: '1px solid rgba(120,160,230,0.22)', color: '#c4d3ee', fontSize: 20 }}>⚙</button>
    </div>
  );
}

/* ---- NEW PLAYER ---- */
function HomeNew() {
  return (
    <HomeShell badge="A 360° SURVIVAL DEFENSE">
      <HomeTopBar showResources={false} />
      <div style={{ position: 'absolute', top: 400, left: 0, right: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 14 }}>
        <MenuButton primary icon="▸" title="NEW GAME" sub="Begin at Level 1 · Wave 1" w={340} />
        <div style={{ display: 'flex', gap: 14 }}>
          <MenuButton icon="⏣" title="SKILL TREE" sub="Spend cores" accent="#46e39a" w={196} />
          <MenuButton icon="⚙" title="SETTINGS" sub="Sound & more" w={196} />
        </div>
        <div style={{ marginTop: 10, fontSize: 13, color: '#56668c', maxWidth: 420, textAlign: 'center', lineHeight: 1.5 }}>
          Defend the core from robots closing in on every side. Survive waves, earn money, and salvage it into permanent cores when you fall.
        </div>
      </div>
    </HomeShell>
  );
}

/* ---- CONTINUE (returning player) ---- */
function HomeContinue() {
  return (
    <HomeShell badge="WELCOME BACK, DEFENDER">
      <HomeTopBar showResources={true} />
      <div style={{ position: 'absolute', top: 392, left: 0, right: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 16 }}>
        {/* progress strip */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { l: 'REACHED', v: 'Level 3', c: '#cdeeff' },
            { l: 'CORES', v: '30', c: '#7fe8ff', core: true },
            { l: 'TOWER LVL', v: '4', c: '#7fe8ff' },
            { l: 'SKILLS', v: '5 / 12', c: '#46e39a' },
          ].map((s, i) => (
            <div key={i} style={{ minWidth: 110, padding: '10px 16px', borderRadius: 12, textAlign: 'center',
              background: 'rgba(14,27,48,0.8)', border: '1px solid rgba(120,160,230,0.18)' }}>
              <div style={{ fontSize: 10.5, letterSpacing: '.16em', color: '#7488ad', marginBottom: 5 }}>{s.l}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                {s.core && <HCore s={14} />}
                <span style={{ fontSize: 20, fontWeight: 800, color: s.c }}>{s.v}</span>
              </div>
            </div>
          ))}
        </div>

        <MenuButton primary icon="▸" title="CONTINUE" sub="Jump back in · Level 3 · Wave 1" w={360} />
        <div style={{ display: 'flex', gap: 14 }}>
          <MenuButton icon="⏣" title="SKILL TREE" sub="3 cores ready to spend" accent="#46e39a" w={206} />
          <MenuButton icon="⚙" title="SETTINGS" sub="Sound & more" w={206} />
        </div>
        <button style={{ margintop: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: HFONT,
          fontSize: 12.5, color: '#56668c', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          Restart from Level 1 (cores &amp; skills kept)
        </button>
      </div>
    </HomeShell>
  );
}

Object.assign(window, { HomeNew, HomeContinue });
