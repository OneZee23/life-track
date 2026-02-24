import { useState, useRef, useEffect } from "react";

/* ═══════════════════════════════════════════════
   LifeTrack v5 — Things3 DNA
   Opens on Today. Hub = minimal sidebar.
   ═══════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --bg: #FFFFFF;
  --bg-deep: #F5F5F7;
  --card: #FFFFFF;
  --accent: #3478F6;
  --accent-light: rgba(52,120,246,0.06);
  --done: #34C759;
  --done-light: rgba(52,199,89,0.06);
  --warn: #FF3B30;
  --orange: #FF9F0A;
  --purple: #AF52DE;
  --t1: #000000;
  --t2: #3C3C43;
  --t3: #8E8E93;
  --t4: #C7C7CC;
  --t5: #E5E5EA;
  --sep: rgba(60,60,67,0.08);
  --shadow-1: 0 0.5px 1px rgba(0,0,0,0.03);
  --shadow-2: 0 1px 4px rgba(0,0,0,0.04), 0 0.5px 1px rgba(0,0,0,0.06);
  --shadow-3: 0 8px 28px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.04);
  --r: 12px;
  --r-sm: 10px;
  --r-xs: 8px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
button { font-family: inherit; -webkit-user-select: none; user-select: none; }

@keyframes check-pop { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.15); } 100% { transform: scale(1); opacity: 1; } }
@keyframes expand { from { opacity: 0; max-height: 0; padding-top: 0; } to { opacity: 1; max-height: 500px; padding-top: 14px; } }
@keyframes rise { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
@keyframes page-in { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes page-back { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sheet-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
@keyframes collapse { to { max-height: 0; opacity: 0; margin-bottom: 0; overflow: hidden; } }
@keyframes banner-pop { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }

input[type=number]::-webkit-inner-spin-button,
input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
input[type=number] { -moz-appearance: textfield; }
textarea:focus, input:focus { outline: none; }
div::-webkit-scrollbar { display: none; }
`;

const GREEN = "#34C759";
const HABITS = [
  { id: "h1", name: "Сон", emoji: "😴", color: null, fields: { numeric: { unit: "ч", label: "Часов" }, rating: true, note: true } },
  { id: "h2", name: "Питание", emoji: "🥗", color: null, fields: { rating: true, note: true } },
  { id: "h3", name: "Разминка", emoji: "🏋️", color: "#AF52DE", fields: { numeric: { unit: "мин", label: "Минут" } } },
  { id: "h4", name: "Чтение", emoji: "📖", color: "#3478F6", fields: { numeric: { unit: "стр", label: "Страниц" }, note: true } },
  { id: "h5", name: "Без сахара", emoji: "🍬", color: null, fields: {} },
];

const clr = h => h.color || GREEN;
const hasF = h => !!(h.fields.numeric || h.fields.rating || h.fields.note);

/* ═══════════ STATUS BAR ═══════════ */
const StatusBar = () => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 26px 0", fontSize:16, fontWeight:600, letterSpacing:"-0.3px", color:"var(--t1)", flexShrink:0, userSelect:"none" }}>
    <span style={{ width:54 }}>9:41</span>
    <div style={{ width:126, height:37, background:"#000", borderRadius:20 }} />
    <div style={{ width:54, display:"flex", justifyContent:"flex-end", gap:6, alignItems:"center" }}>
      <svg width="17" height="12" viewBox="0 0 17 12"><rect x="0" y="3" width="3" height="9" rx="1" fill="#000"/><rect x="4.5" y="1.5" width="3" height="10.5" rx="1" fill="#000"/><rect x="9" y="0" width="3" height="12" rx="1" fill="#000"/><rect x="13" y="0" width="3" height="12" rx="1" fill="#000" opacity=".25"/></svg>
      <svg width="28" height="13" viewBox="0 0 28 13"><rect x=".5" y=".5" width="23" height="12" rx="3.5" stroke="#000" strokeWidth="1" fill="none" opacity=".35"/><rect x="24.5" y="4" width="2.5" height="5" rx="1.2" fill="#000" opacity=".4"/><rect x="2" y="2" width="17" height="9" rx="2" fill="#34C759"/></svg>
    </div>
  </div>
);

/* ═══════════ HOME INDICATOR ═══════════ */
const HomeBar = () => (
  <div style={{ display:"flex", justifyContent:"center", paddingBottom:8, paddingTop:4, flexShrink:0 }}>
    <div style={{ width:134, height:5, borderRadius:3, background:"rgba(0,0,0,0.18)" }} />
  </div>
);

/* ═══════════ PROFILE AVATAR (mock) ═══════════ */
const ProfileBtn = ({ onClick }) => (
  <button onClick={onClick} style={{ width:32, height:32, borderRadius:"50%", border:"none", cursor:"pointer", background:"linear-gradient(135deg, #a8b8d8, #c4b5d4)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
  </button>
);

/* ═══════════ RATING DOTS ═══════════ */
const Dots = ({ value=0, onChange, color="var(--accent)" }) => (
  <div style={{ display:"flex", gap:9, alignItems:"center" }}>
    {[1,2,3,4,5].map(n => (
      <button key={n} onClick={() => onChange(value===n?0:n)} style={{
        width:26, height:26, borderRadius:"50%", border:"none", cursor:"pointer",
        background: n<=value ? color : "var(--bg-deep)",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform: n<=value ? "scale(1.08)" : "scale(1)",
        boxShadow: n<=value ? `0 2px 6px ${color}35` : "none",
      }} />
    ))}
    {value>0 && <span style={{ fontSize:14, color:"var(--t3)", fontWeight:600, fontFamily:"'JetBrains Mono'", marginLeft:2 }}>{value}/5</span>}
  </div>
);

/* ═══════════ HABIT ROW ═══════════ */
const HabitRow = ({ habit, done, onCheck, isOpen, onOpen, ext, onExt, onDel, dragH, dragging }) => {
  const c = clr(habit);
  const show = hasF(habit);
  const [pop, setPop] = useState(false);
  const [swX, setSwX] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [dying, setDying] = useState(false);
  const sx = useRef(0), sy = useRef(0), horiz = useRef(null), wasOpen = useRef(false);

  const check = () => {
    if (swX < -20) { setSwX(0); return; }
    if (!done) { setPop(true); setTimeout(() => setPop(false), 450); }
    onCheck(habit.id);
  };

  const ts = (x,y) => { sx.current=x; sy.current=y; horiz.current=null; wasOpen.current=swX<-40; };
  const tm = (x,y) => {
    const dx=x-sx.current, dy=y-sy.current;
    if (horiz.current===null) horiz.current=Math.abs(dx)>Math.abs(dy)&&Math.abs(dx)>8;
    if (!horiz.current) return;
    setSwX(Math.min(0,Math.max(-110,dx+(wasOpen.current?-82:0))));
  };
  const te = () => { setSwX(p => p<-44?-82:0); horiz.current=null; };

  if (dying) return <div style={{ animation:"collapse 0.3s ease forwards" }} />;

  return (
    <>
      <div style={{ position:"relative", borderRadius:"var(--r)", overflow:"hidden", boxShadow:dragging?"var(--shadow-3)":"var(--shadow-2)", transform:dragging?"scale(1.02)":"scale(1)", transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)", opacity:dragging?0.88:1, zIndex:dragging?50:1 }}>
        {/* Delete behind */}
        <div style={{ position:"absolute", right:0, top:0, bottom:0, width:84, background:"var(--warn)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <button onClick={() => setConfirm(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#fff", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M3 6h18M8 6V4c0-1.1.9-2 2-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            <span style={{ fontSize:10, fontWeight:700 }}>Удалить</span>
          </button>
        </div>

        <div
          onTouchStart={e => { const t=e.touches[0]; ts(t.clientX,t.clientY); }}
          onTouchMove={e => { const t=e.touches[0]; tm(t.clientX,t.clientY); if(horiz.current) e.preventDefault(); }}
          onTouchEnd={te}
          onMouseDown={e => { ts(e.clientX,e.clientY); const mm=ev=>tm(ev.clientX,ev.clientY); const mu=()=>{te();window.removeEventListener("mousemove",mm);window.removeEventListener("mouseup",mu);}; window.addEventListener("mousemove",mm);window.addEventListener("mouseup",mu); }}
          style={{ background:"var(--card)", borderRadius:"var(--r)", transform:`translateX(${swX}px)`, transition:swX===0||swX===-82?"transform 0.35s cubic-bezier(0.34,1.56,0.64,1)":"none", position:"relative", zIndex:2 }}>
          
          <div style={{ display:"flex", alignItems:"center", padding:"13px 16px", gap:0 }}>
            {dragH && (
              <div {...dragH} style={{ cursor:"grab", padding:"6px 12px 6px 0", touchAction:"none", flexShrink:0 }}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="var(--t5)"><circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/><circle cx="2" cy="7" r="1.2"/><circle cx="6" cy="7" r="1.2"/><circle cx="2" cy="12" r="1.2"/><circle cx="6" cy="12" r="1.2"/></svg>
              </div>
            )}

            <span style={{ fontSize:22, marginRight:12, flexShrink:0, lineHeight:1 }}>{habit.emoji}</span>

            <div style={{ flex:1, minWidth:0 }}>
              <span style={{ fontSize:16, fontWeight:600, color:"var(--t1)", letterSpacing:"-0.2px", opacity:done?0.4:1, transition:"opacity 0.3s" }}>{habit.name}</span>
            </div>

            {show && done && (
              <button onClick={e => { e.stopPropagation(); onOpen(habit.id); }} style={{
                background:isOpen?`${c}0C`:"transparent", border:"none", cursor:"pointer",
                padding:"5px 10px", borderRadius:"var(--r-xs)", marginRight:10,
                color:isOpen?c:"var(--t4)", fontSize:12, fontWeight:600,
                display:"flex", alignItems:"center", gap:5, flexShrink:0, transition:"all 0.25s",
              }}>
                Детали
                <svg width="8" height="8" viewBox="0 0 8 8" style={{ transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)", transform:isOpen?"rotate(180deg)":"" }}>
                  <path d="M1 2.5L4 5.5L7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                </svg>
              </button>
            )}

            <button onClick={check} style={{
              width:28, height:28, borderRadius:"50%", flexShrink:0, border:"none", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center",
              background:done?c:"transparent",
              boxShadow:done?`0 2px 8px ${c}30`:"none",
              outline:done?"none":`2px solid ${c}25`, outlineOffset:-2,
              transition:"all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
              transform:pop?"scale(1.35)":"scale(1)",
            }}>
              {done && <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ animation:"check-pop 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </button>
          </div>

          {isOpen && done && show && (
            <div style={{ padding:"0 16px 16px", animation:"expand 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards", borderTop:"0.5px solid var(--sep)" }}>
              <div style={{ display:"flex", flexDirection:"column", gap:16, paddingTop:14 }}>
                {habit.fields.numeric && (
                  <div style={{ animation:"rise 0.3s 0.05s both" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8, display:"block" }}>{habit.fields.numeric.label}</label>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <button onClick={() => onExt(habit.id,"num",Math.max(0,(ext?.num||0)-1))} style={{ width:36, height:36, borderRadius:"var(--r-xs)", border:"none", background:"var(--bg-deep)", cursor:"pointer", fontSize:20, color:"var(--t3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}>−</button>
                      <input type="number" value={ext?.num||""} placeholder="0" onChange={e => onExt(habit.id,"num",parseFloat(e.target.value)||0)}
                        style={{ flex:1, height:36, border:"none", borderRadius:"var(--r-xs)", padding:"0 14px", fontSize:18, fontWeight:600, textAlign:"center", fontFamily:"'JetBrains Mono'", color:"var(--t1)", background:"var(--bg-deep)" }} />
                      <button onClick={() => onExt(habit.id,"num",(ext?.num||0)+1)} style={{ width:36, height:36, borderRadius:"var(--r-xs)", border:"none", background:"var(--bg-deep)", cursor:"pointer", fontSize:20, color:"var(--t3)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:300 }}>+</button>
                      <span style={{ fontSize:14, color:"var(--t4)", fontWeight:600, minWidth:24 }}>{habit.fields.numeric.unit}</span>
                    </div>
                  </div>
                )}
                {habit.fields.rating && (
                  <div style={{ animation:"rise 0.3s 0.1s both" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10, display:"block" }}>Оценка</label>
                    <Dots value={ext?.rating||0} onChange={v => onExt(habit.id,"rating",v)} color={c} />
                  </div>
                )}
                {habit.fields.note && (
                  <div style={{ animation:"rise 0.3s 0.15s both" }}>
                    <label style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8, display:"block" }}>Заметка</label>
                    <textarea value={ext?.note||""} placeholder="Что запомнилось…" rows={2}
                      onChange={e => { if(e.target.value.length<=200) onExt(habit.id,"note",e.target.value); }}
                      style={{ width:"100%", border:"none", borderRadius:"var(--r-xs)", padding:"10px 14px", fontSize:15, fontFamily:"Inter", color:"var(--t1)", background:"var(--bg-deep)", resize:"none", lineHeight:1.5 }} />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* iOS action sheet */}
      {confirm && (
        <div onClick={() => { setConfirm(false); setSwX(0); }} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.25)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", zIndex:9999, display:"flex", alignItems:"flex-end", justifyContent:"center", animation:"fade-in 0.15s", padding:"0 10px 10px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width:"100%", maxWidth:370, animation:"sheet-up 0.35s cubic-bezier(0.34,1.56,0.64,1)" }}>
            <div style={{ background:"rgba(255,255,255,0.94)", backdropFilter:"blur(40px)", borderRadius:14, overflow:"hidden", marginBottom:8 }}>
              <div style={{ padding:"18px 16px 14px", textAlign:"center" }}>
                <div style={{ fontSize:13, color:"var(--t3)", lineHeight:1.5 }}>Удалить «{habit.name}»?<br/>Вся история будет потеряна.</div>
              </div>
              <div style={{ height:0.5, background:"var(--sep)" }} />
              <button onClick={() => { setDying(true); setTimeout(() => onDel(habit.id),300); }} style={{ width:"100%", padding:16, border:"none", background:"none", cursor:"pointer", fontSize:20, fontWeight:600, color:"var(--warn)", fontFamily:"Inter" }}>Удалить</button>
            </div>
            <button onClick={() => { setConfirm(false); setSwX(0); }} style={{ width:"100%", padding:16, border:"none", background:"rgba(255,255,255,0.94)", backdropFilter:"blur(40px)", borderRadius:14, cursor:"pointer", fontSize:20, fontWeight:600, color:"var(--accent)", fontFamily:"Inter" }}>Отмена</button>
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════ REORDER ═══════════ */
const Reorder = ({ items, onReorder, children }) => {
  const [di,setDi]=useState(null);
  const [oi,setOi]=useState(null);
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      {items.map((it,i) => (
        <div key={it.id} draggable={di===i}
          onDragStart={() => setDi(i)}
          onDragOver={e => { e.preventDefault(); if(di!==null&&i!==di) setOi(i); }}
          onDragEnd={() => { if(di!==null&&oi!==null&&di!==oi) onReorder(di,oi); setDi(null); setOi(null); }}
          style={{ animation:`rise 0.4s ${i*0.04}s both`, transition:"transform 0.3s cubic-bezier(0.34,1.56,0.64,1)", transform:oi===i&&di!==null?(di<i?"translateY(-3px)":"translateY(3px)"):"none" }}>
          {children(it,i,{ dragging:di===i, dragH:{ onMouseDown:e=>{e.preventDefault();setDi(i);} } })}
        </div>
      ))}
    </div>
  );
};

/* ═══════════ HEATMAP ═══════════ */
const Heatmap = ({ color="var(--done)" }) => {
  const data = useRef(Array.from({length:182},()=>{ const r=Math.random(); return r>0.35?(r>0.6?(r>0.85?3:2):1):0; })).current;
  const weeks=[]; for(let i=0;i<data.length;i+=7) weeks.push(data.slice(i,i+7));
  const pal=["rgba(0,0,0,0.025)",`${color}22`,`${color}50`,color];
  return (
    <div style={{ display:"flex", gap:2.5, overflowX:"auto" }}>
      {weeks.map((w,i) => <div key={i} style={{ display:"flex", flexDirection:"column", gap:2.5 }}>{w.map((v,j) => <div key={j} style={{ width:10, height:10, borderRadius:2.5, background:pal[v] }} />)}</div>)}
    </div>
  );
};

/* ═══════════════════════════════════════
   SCREENS
   ═══════════════════════════════════════ */

/* ── HUB — Things3 sidebar style ── */
const Hub = ({ nav, habits, tC, yC }) => {
  const td = Object.values(tC).filter(Boolean).length;
  const yd = Object.values(yC).filter(Boolean).length;
  const n = habits.length;

  const Row = ({ icon, label, count, countColor, onClick, sep }) => (
    <button onClick={onClick} style={{
      width:"100%", display:"flex", alignItems:"center", padding:"14px 0",
      background:"none", border:"none", cursor:"pointer", gap:14,
      fontFamily:"Inter", borderBottom: sep ? "0.5px solid var(--sep)" : "none",
    }}>
      <span style={{ fontSize:22, width:30, textAlign:"center", lineHeight:1 }}>{icon}</span>
      <span style={{ flex:1, fontSize:18, fontWeight:700, color:"var(--t1)", textAlign:"left", letterSpacing:"-0.3px" }}>{label}</span>
      {count !== undefined && (
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {count > 0 && count < n && (
            <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", minWidth:22, height:22, borderRadius:11, background:countColor, color:"#fff", fontSize:13, fontWeight:700, fontFamily:"'JetBrains Mono'", padding:"0 6px" }}>{count}</span>
          )}
          {count === 0 && <span style={{ fontSize:15, color:"var(--t4)", fontFamily:"'JetBrains Mono'", fontWeight:500 }}>0</span>}
          {count === n && n > 0 && <span style={{ fontSize:15, color:"var(--done)", fontFamily:"'JetBrains Mono'", fontWeight:600 }}>✓</span>}
          <span style={{ fontSize:15, color:"var(--t4)", fontFamily:"'JetBrains Mono'", fontWeight:400 }}>{count < n ? n : ""}</span>
        </div>
      )}
    </button>
  );

  return (
    <div style={{ padding:"0 24px", animation:"page-back 0.3s", display:"flex", flexDirection:"column", minHeight:"100%" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"flex-end", padding:"10px 0 0" }}>
        <ProfileBtn onClick={() => nav("profile")} />
      </div>

      <div style={{ flex:1, paddingTop: 10 }}>
        {/* Main items */}
        <Row icon="⭐" label="Сегодня" count={td} countColor={td>0?"var(--accent)":"var(--t4)"} onClick={() => nav("today")} />
        <Row icon="🌙" label="Вчера" count={yd} countColor={yd>0?"var(--t3)":"var(--warn)"} onClick={() => nav("yesterday")} sep />

        <div style={{ height: 12 }} />

        <Row icon="📊" label="Прогресс" onClick={() => nav("stats")} />
        <Row icon="✏️" label="Привычки" onClick={() => nav("habits")} />
      </div>

      {/* Settings — pinned bottom, small */}
      <button onClick={() => nav("settings")} style={{
        display:"flex", alignItems:"center", gap:8, padding:"14px 0 6px",
        background:"none", border:"none", cursor:"pointer",
        color:"var(--t4)", fontSize:13, fontWeight:500, fontFamily:"Inter",
        borderTop:"0.5px solid var(--sep)",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--t4)" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42m12.72-12.72l1.42-1.42"/></svg>
        Настройки
      </button>
    </div>
  );
};

/* ── CHECKIN (Today & Yesterday) ── */
const Checkin = ({ isToday, habits, checks, onCheck, open, onOpen, ext, onExt, onDel, onReorder, onBack }) => {
  const done = Object.values(checks).filter(Boolean).length;
  const total = habits.length;
  const allDone = done===total && total>0;

  return (
    <div style={{ animation:"page-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", padding:"10px 20px 0" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px 8px 0", color:"var(--accent)", display:"flex", alignItems:"center", gap:3 }}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <div style={{ flex:1 }} />
        <ProfileBtn onClick={() => {}} />
      </div>

      <div style={{ padding:"0 22px 30px" }}>
        {/* Title row */}
        <div style={{ display:"flex", alignItems:"baseline", gap:10, padding:"16px 0 0" }}>
          <span style={{ fontSize:28 }}>{isToday ? "⭐" : "🌙"}</span>
          <span style={{ fontSize:32, fontWeight:800, color:"var(--t1)", letterSpacing:"-1px" }}>
            {isToday ? "Сегодня" : "Вчера"}
          </span>
          <span style={{ fontSize:16, color:"var(--t4)", fontWeight:500, fontFamily:"'JetBrains Mono'", marginLeft:"auto" }}>
            {done}<span style={{ color:"var(--t5)" }}>/{total}</span>
          </span>
        </div>

        {/* Banner */}
        {allDone && (
          <div style={{
            padding:"12px 16px", borderRadius:"var(--r-sm)", marginTop:16,
            background:"var(--done)", color:"#fff",
            boxShadow:"0 4px 14px rgba(52,199,89,0.25)",
            fontSize:14, fontWeight:600, letterSpacing:"-0.1px",
            animation:"banner-pop 0.4s cubic-bezier(0.34,1.56,0.64,1)",
          }}>
            🎯 {isToday ? "Всё выполнено! Отличный день." : "Вчера — идеально!"}
          </div>
        )}

        <div style={{ height: allDone ? 16 : 20 }} />

        {/* Habits */}
        <Reorder items={habits} onReorder={onReorder}>
          {(h,i,{dragging,dragH}) => (
            <HabitRow habit={h} done={!!checks[h.id]} onCheck={onCheck}
              isOpen={open===h.id} onOpen={onOpen}
              ext={ext[h.id]} onExt={onExt}
              onDel={onDel} dragging={dragging} dragH={dragH} />
          )}
        </Reorder>
      </div>
    </div>
  );
};

/* ── STATS ── */
const Stats = ({ habits, onBack }) => {
  const [sel,setSel]=useState(habits[0]);
  const week=[{d:"Пн",v:85},{d:"Вт",v:100},{d:"Ср",v:72},{d:"Чт",v:100},{d:"Пт",v:57},{d:"Сб",v:100},{d:"Вс",v:85}];
  const c=sel?clr(sel):"var(--done)";
  useEffect(()=>{if(habits.length&&!habits.find(h=>h.id===sel?.id))setSel(habits[0]);},[habits]);

  return (
    <div style={{ animation:"page-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 20px 0" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px 8px 0", color:"var(--accent)", display:"flex", alignItems:"center" }}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div style={{ padding:"0 22px 30px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, padding:"16px 0 20px" }}>
          <span style={{ fontSize:28 }}>📊</span>
          <span style={{ fontSize:32, fontWeight:800, letterSpacing:"-1px" }}>Прогресс</span>
        </div>

        <div style={{ background:"var(--bg-deep)", borderRadius:"var(--r)", padding:"18px", marginBottom:14 }}>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Эта неделя</div>
          <div style={{ display:"flex", alignItems:"flex-end", gap:7, height:72 }}>
            {week.map((d,i) => (
              <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
                <div style={{ width:"100%", borderRadius:5, height:`${d.v*0.85}%`, minHeight:3, background:d.v===100?"var(--done)":d.v>=70?"var(--done)55":"var(--sep)", animation:`rise 0.5s ${i*0.05}s both` }} />
                <span style={{ fontSize:11, color:"var(--t3)", fontWeight:600 }}>{d.d}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", gap:7, overflowX:"auto", paddingBottom:12 }}>
          {habits.map(h => (
            <button key={h.id} onClick={() => setSel(h)} style={{
              padding:"7px 13px", borderRadius:20, border:"none", cursor:"pointer",
              background:sel?.id===h.id?clr(h):"var(--bg-deep)",
              color:sel?.id===h.id?"#fff":"var(--t1)",
              fontSize:13, fontWeight:600, whiteSpace:"nowrap", fontFamily:"Inter",
              transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              transform:sel?.id===h.id?"scale(1.05)":"scale(1)",
            }}>{h.emoji} {h.name}</button>
          ))}
        </div>

        <div style={{ background:"var(--bg-deep)", borderRadius:"var(--r)", padding:18 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, marginBottom:20 }}>
            {[{v:"92%",l:"Импульс",cl:c},{v:"12",l:"Серия",cl:"var(--t1)"},{v:"28",l:"Рекорд",cl:"var(--t1)"}].map((s,i) => (
              <div key={i} style={{ textAlign:"center", padding:"12px 0", background:"var(--card)", borderRadius:"var(--r-xs)" }}>
                <div style={{ fontSize:24, fontWeight:700, color:s.cl, fontFamily:"'JetBrains Mono'", letterSpacing:"-0.5px" }}>{s.v}</div>
                <div style={{ fontSize:10, color:"var(--t4)", fontWeight:700, textTransform:"uppercase", letterSpacing:0.5, marginTop:3 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>6 месяцев</div>
          <Heatmap color={c} />
        </div>
      </div>
    </div>
  );
};

/* ── HABITS ── */
const HabitsManage = ({ habits, onColor, onBack }) => {
  const COLORS=[GREEN,"#3478F6","#AF52DE","#FF9F0A","#FF3B30","#5E5CE6","#FF375F","#64D2FF"];
  return (
    <div style={{ animation:"page-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 20px 0" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px 8px 0", color:"var(--accent)", display:"flex", alignItems:"center" }}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div style={{ padding:"0 22px 30px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, padding:"16px 0 20px" }}>
          <span style={{ fontSize:28 }}>✏️</span>
          <span style={{ fontSize:32, fontWeight:800, letterSpacing:"-1px" }}>Привычки</span>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {habits.map((h,i) => {
            const ac=h.color||GREEN;
            return (
              <div key={h.id} style={{ background:"var(--bg-deep)", borderRadius:"var(--r)", padding:"16px 18px", animation:`rise 0.4s ${i*0.05}s both` }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                  <span style={{ fontSize:24 }}>{h.emoji}</span>
                  <span style={{ fontSize:17, fontWeight:600, letterSpacing:"-0.2px" }}>{h.name}</span>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--t4)", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Цвет</div>
                  <div style={{ display:"flex", gap:10 }}>
                    {COLORS.map(c => (
                      <button key={c} onClick={() => onColor(h.id,c===GREEN?null:c)} style={{
                        width:22, height:22, borderRadius:"50%", border:"none", cursor:"pointer", background:c,
                        outline:ac===c?`2.5px solid ${c}`:"none", outlineOffset:3.5,
                        transform:ac===c?"scale(1.2)":"scale(1)", transition:"all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      }} />
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {h.fields.numeric && <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:6, background:"var(--accent-light)", color:"var(--accent)" }}>🔢 {h.fields.numeric.label}</span>}
                  {h.fields.note && <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:6, background:"var(--accent-light)", color:"var(--accent)" }}>📝 Заметка</span>}
                  {h.fields.rating && <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:6, background:"var(--accent-light)", color:"var(--accent)" }}>⭐ Оценка</span>}
                  {!h.fields.numeric&&!h.fields.note&&!h.fields.rating && <span style={{ fontSize:11, fontWeight:600, padding:"3px 9px", borderRadius:6, background:"var(--sep)", color:"var(--t4)" }}>Только ✓/✗</span>}
                </div>
              </div>
            );
          })}
        </div>
        <button style={{ width:"100%", padding:15, marginTop:14, borderRadius:"var(--r)", border:"1.5px dashed var(--t5)", background:"transparent", cursor:"pointer", fontSize:16, fontWeight:600, color:"var(--accent)", fontFamily:"Inter" }}>+ Новая привычка</button>
      </div>
    </div>
  );
};

/* ── SETTINGS ── */
const Settings = ({ onBack }) => {
  const Item = ({ icon, label, value }) => (
    <div style={{ display:"flex", alignItems:"center", padding:"13px 0", gap:14, borderBottom:"0.5px solid var(--sep)" }}>
      <span style={{ fontSize:18, width:26, textAlign:"center" }}>{icon}</span>
      <span style={{ flex:1, fontSize:16, fontWeight:500, color:"var(--t1)", letterSpacing:"-0.1px" }}>{label}</span>
      {value && <span style={{ fontSize:15, color:"var(--t3)" }}>{value}</span>}
      <svg width="7" height="12" viewBox="0 0 7 12" fill="none"><path d="M1 1L6 6L1 11" stroke="var(--t4)" strokeWidth="1.5" strokeLinecap="round"/></svg>
    </div>
  );
  return (
    <div style={{ animation:"page-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
      <div style={{ display:"flex", alignItems:"center", padding:"10px 20px 0" }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px 8px 0", color:"var(--accent)", display:"flex", alignItems:"center" }}>
          <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>
      <div style={{ padding:"0 22px 30px" }}>
        <div style={{ display:"flex", alignItems:"baseline", gap:10, padding:"16px 0 20px" }}>
          <span style={{ fontSize:28 }}>⚙️</span>
          <span style={{ fontSize:32, fontWeight:800, letterSpacing:"-1px" }}>Настройки</span>
        </div>
        <div style={{ background:"var(--bg-deep)", borderRadius:"var(--r)", padding:"2px 18px", marginBottom:16 }}>
          <Item icon="🎨" label="Тема" value="Системная" />
          <Item icon="🔔" label="Напоминания" />
          <Item icon="🌐" label="Язык" value="Русский" />
          <div style={{ display:"flex", alignItems:"center", padding:"13px 0", gap:14 }}>
            <span style={{ fontSize:18, width:26, textAlign:"center" }}>💾</span>
            <span style={{ flex:1, fontSize:16, fontWeight:500, letterSpacing:"-0.1px" }}>Экспорт данных</span>
          </div>
        </div>
        <div style={{ padding:"22px 20px", background:"linear-gradient(145deg, #1C1C1E, #2C2C2E)", borderRadius:"var(--r)", color:"#fff" }}>
          <div style={{ fontSize:11, fontWeight:700, opacity:0.4, textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>LifeTrack Pro</div>
          <div style={{ fontSize:18, fontWeight:700, marginBottom:4, letterSpacing:"-0.3px" }}>Безлимит привычек</div>
          <div style={{ fontSize:13, opacity:0.5, marginBottom:16, lineHeight:1.5 }}>Аналитика · Темы · Виджеты · Экспорт</div>
          <div style={{ display:"flex", gap:8 }}>
            <button style={{ padding:"10px 18px", borderRadius:"var(--r-sm)", background:"var(--accent)", border:"none", color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"Inter" }}>₽349/мес</button>
            <button style={{ padding:"10px 18px", borderRadius:"var(--r-sm)", background:"rgba(255,255,255,0.1)", border:"none", color:"#fff", fontSize:15, fontWeight:600, cursor:"pointer", fontFamily:"Inter" }}>₽1 990/год</button>
          </div>
        </div>
        <div style={{ textAlign:"center", padding:"24px 0 8px", fontSize:13, color:"var(--t4)", fontWeight:500 }}>LifeTrack v1.0</div>
      </div>
    </div>
  );
};

/* ── PROFILE (mock) ── */
const Profile = ({ onBack }) => (
  <div style={{ animation:"page-in 0.3s cubic-bezier(0.34,1.56,0.64,1)" }}>
    <div style={{ display:"flex", alignItems:"center", padding:"10px 20px 0" }}>
      <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer", padding:"8px 4px 8px 0", color:"var(--accent)", display:"flex", alignItems:"center" }}>
        <svg width="10" height="18" viewBox="0 0 10 18" fill="none"><path d="M9 1L1 9L9 17" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
    <div style={{ padding:"0 22px", textAlign:"center" }}>
      <div style={{ width:80, height:80, borderRadius:"50%", background:"linear-gradient(135deg, #a8b8d8, #c4b5d4)", margin:"40px auto 16px", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
      </div>
      <div style={{ fontSize:22, fontWeight:700, letterSpacing:"-0.5px" }}>Профиль</div>
      <div style={{ fontSize:14, color:"var(--t3)", marginTop:6 }}>Скоро здесь появятся<br/>статистика и достижения</div>
    </div>
  </div>
);

/* ═══════════ APP ═══════════ */
export default function App() {
  const [scr,setScr]=useState("today"); // ← opens on Today
  const [habits,setHabits]=useState(HABITS);
  const [tC,setTC]=useState({});
  const [yC,setYC]=useState({h2:true,h3:true});
  const [open,setOpen]=useState(null);
  const [ext,setExt]=useState({});

  const nav=s=>{setOpen(null);setScr(s);};
  const hub=()=>nav("hub");

  const checkT=id=>setTC(p=>{const n={...p,[id]:!p[id]};if(!n[id])setOpen(null);return n;});
  const checkY=id=>setYC(p=>{const n={...p,[id]:!p[id]};if(!n[id])setOpen(null);return n;});
  const toggle=id=>setOpen(p=>p===id?null:id);
  const setE=(id,f,v)=>setExt(p=>({...p,[id]:{...(p[id]||{}),[f]:v}}));
  const del=id=>{setHabits(p=>p.filter(h=>h.id!==id));setTC(p=>{const n={...p};delete n[id];return n;});setYC(p=>{const n={...p};delete n[id];return n;});if(open===id)setOpen(null);};
  const reorder=(a,b)=>setHabits(p=>{const n=[...p];const[x]=n.splice(a,1);n.splice(b,0,x);return n;});
  const color=(id,c)=>setHabits(p=>p.map(h=>h.id===id?{...h,color:c}:h));

  const R=()=>{
    switch(scr){
      case "hub": return <Hub nav={nav} habits={habits} tC={tC} yC={yC} />;
      case "today": return <Checkin isToday habits={habits} checks={tC} onCheck={checkT} open={open} onOpen={toggle} ext={ext} onExt={setE} onDel={del} onReorder={reorder} onBack={hub} />;
      case "yesterday": return <Checkin isToday={false} habits={habits} checks={yC} onCheck={checkY} open={open} onOpen={toggle} ext={ext} onExt={setE} onDel={del} onReorder={reorder} onBack={hub} />;
      case "stats": return <Stats habits={habits} onBack={hub} />;
      case "habits": return <HabitsManage habits={habits} onColor={color} onBack={hub} />;
      case "settings": return <Settings onBack={hub} />;
      case "profile": return <Profile onBack={() => nav(scr === "profile" ? "today" : "hub")} />;
      default: return <Checkin isToday habits={habits} checks={tC} onCheck={checkT} open={open} onOpen={toggle} ext={ext} onExt={setE} onDel={del} onReorder={reorder} onBack={hub} />;
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div style={{
        maxWidth:393, margin:"24px auto", background:"var(--bg)", borderRadius:47, overflow:"hidden",
        boxShadow:"0 0 0 0.5px rgba(0,0,0,0.08), 0 24px 68px rgba(0,0,0,0.14)",
        fontFamily:"Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight:852, display:"flex", flexDirection:"column",
        letterSpacing:"-0.1px", WebkitFontSmoothing:"antialiased",
      }}>
        <StatusBar />
        <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", scrollbarWidth:"none" }}>{R()}</div>
        <HomeBar />
      </div>
    </>
  );
}
