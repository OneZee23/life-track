import { useState, useRef, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════
   LifeTrack MVP — v5
   Theme toggle, fixed tab bar
   ═══════════════════════════════════════════════════════ */

const lightTheme = {
  bg:"#F2F2F7",white:"#FFFFFF",card:"#FFFFFF",
  text0:"#000000",text1:"#1C1C1E",text2:"#3C3C43",
  text3:"#8E8E93",text4:"#AEAEB2",text5:"#C7C7CC",
  sep:"#E5E5EA",trackBg:"#EDEDF0",emptyCell:"#ECECEC",
  green:"#34C759",greenLight:"#E8F9ED",
  yellow:"#FF9F0A",yellowLight:"#FFF5E0",
  red:"#FF3B30",redLight:"#FFE5E3",
  blue:"#007AFF",
  segBg:"rgba(118,118,128,0.12)",segActive:"#FFFFFF",segShadow:"0 1px 3px rgba(0,0,0,0.06)",
  cardShadow:"0 0.5px 0 rgba(0,0,0,0.04)",
  tabBg:"rgba(242,242,247,0.92)",
  phoneBorder:"#E0E0E4",phoneShadow:"0 24px 80px rgba(0,0,0,0.12)",
  thumbBg:"#FFFFFF",thumbBorder0:"#D8D8DC",
  labelDim:"#B8B8BC",
  island:"#1C1C1E",islandDot:"#2C2C2E",
  pageBg:"linear-gradient(180deg, #F8F8FC 0%, #EEEEF3 100%)",
};

const darkTheme = {
  bg:"#000000",white:"#1C1C1E",card:"#1C1C1E",
  text0:"#FFFFFF",text1:"#F2F2F7",text2:"#D1D1D6",
  text3:"#8E8E93",text4:"#636366",text5:"#48484A",
  sep:"#2C2C2E",trackBg:"#2C2C2E",emptyCell:"#2C2C2E",
  green:"#30D158",greenLight:"rgba(48,209,88,0.15)",
  yellow:"#FFD60A",yellowLight:"rgba(255,214,10,0.12)",
  red:"#FF453A",redLight:"rgba(255,69,58,0.12)",
  blue:"#0A84FF",
  segBg:"rgba(118,118,128,0.24)",segActive:"#2C2C2E",segShadow:"0 1px 3px rgba(0,0,0,0.3)",
  cardShadow:"0 0.5px 0 rgba(255,255,255,0.04)",
  tabBg:"rgba(0,0,0,0.92)",
  phoneBorder:"#2C2C2E",phoneShadow:"0 24px 80px rgba(0,0,0,0.4)",
  thumbBg:"#3A3A3C",thumbBorder0:"#48484A",
  labelDim:"#636366",
  island:"#000000",islandDot:"#1C1C1E",
  pageBg:"linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
};

const ThemeCtx = createContext();
function useTheme(){ return useContext(ThemeCtx); }

const MRU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const MF=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WD=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const WDF=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const EMOJIS=["🛌","🚴","🥗","🧠","💻","📖","💪","🧘","💊","🎯","🎨","🎵","✍️","🏃","🧹","💧","☀️","🤝","📵","🌿"];
const LIMIT=20;
const DH=[{id:"h1",emoji:"🛌",name:"Сон"},{id:"h2",emoji:"🚴",name:"Активность"},{id:"h3",emoji:"🥗",name:"Питание"},{id:"h4",emoji:"🧠",name:"Ментальное"},{id:"h5",emoji:"💻",name:"Проекты"}];

function v2c(v,C){if(v==null)return C.sep;const t=v/10;let r,g,b;if(t<=0.5){const p=t/0.5;r=255;g=59+100*p;b=48-38*p}else{const p=(t-0.5)/0.5;r=255-203*p;g=159+40*p;b=10+79*p}return`rgb(${Math.round(r)},${Math.round(g)},${Math.round(b)})`}
function v2bg(v,C){if(v==null)return C.emptyCell;if(v<=3)return C.redLight;if(v<=6)return C.yellowLight;return C.greenLight}
function seed(date,hid){const now=new Date();if(date>now)return null;const hs=hid?hid.split("").reduce((a,c)=>a+c.charCodeAt(0),0)*7919:0;const h=(date.getFullYear()*366+date.getMonth()*31+date.getDate()+hs)*2654435761;return((h>>>0)%1000)/1000*10|0}
function seedAvg(date){const vs=DH.map(h=>seed(date,h.id)).filter(v=>v!=null);return vs.length?Math.round(vs.reduce((a,b)=>a+b,0)/vs.length):null}
function yday(){const d=new Date();d.setDate(d.getDate()-1);return d}
function fmtDate(d){return`${WDF[(d.getDay()+6)%7]}, ${d.getDate()} ${MF[d.getMonth()].toLowerCase()}`}
function dow(d){return(d.getDay()+6)%7}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function weekStart(d){const r=new Date(d);r.setDate(r.getDate()-dow(r));return r}

/* ─── Confetti ─── */
function Confetti({active}){
  if(!active)return null;
  const ps=Array.from({length:50},(_,i)=>({i,l:Math.random()*100,dl:Math.random()*0.5,dur:2+Math.random()*1.5,sz:5+Math.random()*6,col:["#34C759","#FF9F0A","#FF3B30","#007AFF","#AF52DE","#5AC8FA","#FFD60A"][i%7],rot:Math.random()*360,sh:i%3}));
  return(<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:200}}>{ps.map(p=>(<div key={p.i} style={{position:"absolute",left:`${p.l}%`,top:-20,width:p.sh===2?0:p.sz,height:p.sh===2?0:(p.sh===1?p.sz*2.5:p.sz),borderRadius:p.sh===0?1:p.sh===1?p.sz/2:0,borderLeft:p.sh===2?`${p.sz/2}px solid transparent`:undefined,borderRight:p.sh===2?`${p.sz/2}px solid transparent`:undefined,borderBottom:p.sh===2?`${p.sz}px solid ${p.col}`:undefined,background:p.sh!==2?p.col:undefined,animation:`cf ${p.dur}s ${p.dl}s ease-in forwards`,transform:`rotate(${p.rot}deg)`,opacity:0}}/>))}<style>{`@keyframes cf{0%{opacity:1;transform:translateY(0) rotate(0deg)}15%{opacity:1}100%{opacity:0;transform:translateY(800px) rotate(720deg) translateX(40px)}}`}</style></div>);
}

/* ─── Phone ─── */
function Phone({children}){
  const C=useTheme();
  return(
    <div style={{width:375,minHeight:812,maxHeight:812,borderRadius:48,background:C.bg,border:`3px solid ${C.phoneBorder}`,boxShadow:C.phoneShadow,overflow:"hidden",position:"relative",flexShrink:0,display:"flex",flexDirection:"column"}}>
      <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",width:120,height:34,background:C.island,borderRadius:20,zIndex:100}}><div style={{width:10,height:10,borderRadius:"50%",background:C.islandDot,position:"absolute",top:12,left:28}}/></div>
      <div style={{height:56,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 30px 6px",fontSize:14,fontWeight:600,color:C.text0,zIndex:99,flexShrink:0}}>
        <span style={{fontVariantNumeric:"tabular-nums"}}>9:41</span>
        <div style={{display:"flex",gap:5,alignItems:"center"}}><svg width="16" height="11" viewBox="0 0 16 11"><path d="M1 4h2v7H1zM5 2.5h2V11H5zM9 1h2v10H9zM13 0h2v11h-2z" fill={C.text0}/></svg><div style={{width:24,height:11,borderRadius:3,border:`1px solid ${C.text4}`,position:"relative",padding:1.5}}><div style={{width:"72%",height:"100%",borderRadius:1.5,background:C.green}}/></div></div>
      </div>
      {children}
      {/* Home indicator */}
      <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:134,height:5,borderRadius:3,background:C.text5}}/></div>
    </div>
  );
}

/* ─── TabBar — fixed at bottom ─── */
function TabBar({active,onChange}){
  const C=useTheme();
  const tabs=[
    {id:"checkin",label:"Чек-ин",d:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"},
    {id:"progress",label:"Прогресс",d:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"},
    {id:"habits",label:"Привычки",d:"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 0V6m0 0a2 2 0 100-4m0 4a2 2 0 110-4m12 10a2 2 0 100-4m0 4a2 2 0 110-4m0 0V10"},
  ];
  return(<div style={{display:"flex",borderTop:`0.5px solid ${C.sep}`,background:C.tabBg,backdropFilter:"blur(20px)",padding:"6px 0 2px",flexShrink:0}}>
    {tabs.map(t=>{const a=active===t.id;return(<button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"2px 0",fontFamily:"inherit"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?C.green:C.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg><span style={{fontSize:10,fontWeight:500,color:a?C.green:C.text3}}>{t.label}</span></button>)})}
  </div>);
}

function BackBtn({label,onClick}){const C=useTheme();return(<button onClick={onClick} style={{display:"flex",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:"inherit"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg><span style={{color:C.blue,fontSize:16,fontWeight:500}}>{label}</span></button>)}

function NavHeader({title,onPrev,onNext,sub}){
  const C=useTheme();
  return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
    <button onClick={onPrev} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text0} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg></button>
    <div style={{textAlign:"center"}}><div style={{color:C.text0,fontSize:17,fontWeight:700}}>{title}</div>{sub&&<div style={{color:C.text3,fontSize:12,marginTop:1}}>{sub}</div>}</div>
    <button onClick={onNext} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text0} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg></button>
  </div>);
}

function Chip({label,active,onClick}){const C=useTheme();return <button onClick={onClick} style={{padding:"6px 14px",borderRadius:100,border:"none",background:active?C.green:C.segBg,color:active?"#fff":C.text2,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>{label}</button>}

/* ─── Slider ─── */
function Slider({value,onChange}){
  const C=useTheme();
  const ref=useRef(null);const dr=useRef(false);
  const[dragging,setDragging]=useState(false);
  const calc=useCallback((cx)=>{if(!ref.current)return 0;const r=ref.current.getBoundingClientRect();return Math.round(Math.max(0,Math.min(1,(cx-r.left)/r.width))*10)},[]);
  const s=(e)=>{dr.current=true;setDragging(true);onChange(calc(e.touches?e.touches[0].clientX:e.clientX))};
  const m=(e)=>{if(!dr.current)return;e.preventDefault();onChange(calc(e.touches?e.touches[0].clientX:e.clientX))};
  const u=()=>{dr.current=false;setDragging(false)};
  const pct=(value/10)*100;const color=v2c(value,C);
  const ease=dragging?"none":"all 0.18s cubic-bezier(0.25,0.1,0.25,1)";
  const trackH=32;const thumbD=trackH-4;const thumbR=thumbD/2;
  return(<div style={{padding:"6px 0 4px"}}><div ref={ref} onMouseDown={s} onMouseMove={m} onMouseUp={u} onMouseLeave={u} onTouchStart={s} onTouchMove={m} onTouchEnd={u} style={{height:trackH,borderRadius:trackH/2,background:C.trackBg,position:"relative",cursor:"pointer",touchAction:"none",overflow:"hidden"}}>
    {/* Gradient fill */}
    <div style={{position:"absolute",top:0,left:0,bottom:0,width:`${Math.max(pct,0.1)}%`,borderRadius:trackH/2,background:value===0?"transparent":`linear-gradient(90deg, ${C.red}, ${C.yellow} 50%, ${C.green})`,backgroundSize:`${10000/Math.max(pct,1)}% 100%`,transition:ease}}/>
    {/* Label */}
    <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:value<7?10:40,pointerEvents:"none",zIndex:1}}>
      <span style={{fontSize:12,fontWeight:700,color:value===0?C.labelDim:value<4?C.text3:"rgba(255,255,255,0.9)",fontVariantNumeric:"tabular-nums",transition:"color 0.15s"}}>{value}/10</span>
    </div>
    {/* Thumb — inside overflow:hidden container */}
    <div style={{position:"absolute",top:2,left:`clamp(2px, calc(${pct}% - ${thumbR}px), calc(100% - ${thumbD+2}px))`,width:thumbD,height:thumbD,borderRadius:thumbR,background:C.thumbBg,border:value===0?`2px solid ${C.thumbBorder0}`:`2px solid ${color}`,boxShadow:dragging?"0 0 8px rgba(0,0,0,0.15)":"0 1px 3px rgba(0,0,0,0.1)",transition:ease,zIndex:2,boxSizing:"border-box"}}/>
  </div></div>);
}

/* ═══════════════════════════════════════════════════════
   CHECK-IN
   ═══════════════════════════════════════════════════════ */
function CheckInScreen({habits}){
  const C=useTheme();
  const[vals,setVals]=useState(()=>{const o={};habits.forEach(h=>{o[h.id]=0});return o});
  const[saved,setSaved]=useState(false);
  const[conf,setConf]=useState(false);
  const y=yday();
  const save=()=>{setSaved(true);setConf(true);setTimeout(()=>setConf(false),3500)};
  const avg=Math.round(Object.values(vals).reduce((a,b)=>a+b,0)/habits.length);

  return(
    <div style={{padding:"0 16px 20px",position:"relative"}}>
      <Confetti active={conf}/>
      <div style={{padding:"4px 4px 14px"}}><h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 4px",letterSpacing:-0.5}}>Чек-ин</h1><p style={{color:C.text3,fontSize:15,margin:0,textTransform:"capitalize"}}>{fmtDate(y)}</p></div>
      {saved?(
        <div style={{textAlign:"center",padding:"28px 16px",animation:"pop 0.45s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{width:80,height:80,borderRadius:40,margin:"0 auto 18px",background:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🎉</div>
          <h2 style={{color:C.text0,fontSize:24,fontWeight:700,margin:"0 0 6px"}}>День затрекан!</h2>
          <p style={{color:C.text2,fontSize:16,margin:"0 0 4px"}}>🔥 12 дней подряд — так держать!</p>
          <p style={{color:C.text4,fontSize:13,margin:"0 0 24px"}}>Возвращайся завтра утром</p>
          <div style={{background:C.bg,borderRadius:16,padding:"18px 20px",marginBottom:16}}>
            <div style={{color:C.text3,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Средняя оценка</div>
            <div style={{fontSize:48,fontWeight:800,color:v2c(avg,C),fontVariantNumeric:"tabular-nums",lineHeight:1}}>{avg}<span style={{fontSize:18,color:C.text4,fontWeight:600}}>/10</span></div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6,justifyContent:"center"}}>
            {habits.map(h=>{const v=vals[h.id];return(<div key={h.id} style={{padding:"6px 12px",borderRadius:100,background:v2bg(v,C),display:"flex",alignItems:"center",gap:5}}><span style={{fontSize:13}}>{h.emoji}</span><span style={{color:v2c(v,C),fontSize:14,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{v}</span></div>)})}
          </div>
          <button onClick={()=>{setSaved(false);setConf(false)}} style={{marginTop:24,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:C.text4,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:4,margin:"24px auto 0"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Переоценить день
          </button>
        </div>
      ):(
        <>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {habits.map((h,i)=>{const v=vals[h.id];const color=v2c(v,C);return(
              <div key={h.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",boxShadow:C.cardShadow,animation:`su 0.3s ease ${i*0.04}s both`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:36,height:36,borderRadius:10,background:v>0?v2bg(v,C):C.trackBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,transition:"background 0.2s"}}>{h.emoji}</div>
                    <span style={{color:C.text1,fontSize:16,fontWeight:600}}>{h.name}</span>
                  </div>
                  <span style={{color:v===0?C.text5:color,fontSize:22,fontWeight:700,fontVariantNumeric:"tabular-nums",minWidth:30,textAlign:"right",transition:"color 0.15s"}}>{v}</span>
                </div>
                <Slider value={v} onChange={(val)=>!saved&&setVals(p=>({...p,[h.id]:val}))}/>
              </div>
            )})}
          </div>
          <button onClick={save} style={{width:"100%",marginTop:20,padding:"14px 0",borderRadius:12,border:"none",background:C.green,color:"#fff",fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:"inherit",letterSpacing:-0.3,transition:"transform 0.1s"}} onMouseDown={e=>e.target.style.transform="scale(0.97)"} onMouseUp={e=>e.target.style.transform="scale(1)"}>Затрекать ✓</button>
        </>
      )}
      <style>{`@keyframes su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROGRESS
   ═══════════════════════════════════════════════════════ */
function ProgressScreen({habits}){
  const C=useTheme();const now=new Date();
  const[fh,setFh]=useState(null);
  const[level,setLevel]=useState("year");
  const[navYear,setNavYear]=useState(now.getFullYear());
  const[navMonth,setNavMonth]=useState(now.getMonth());
  const[navWS,setNavWS]=useState(weekStart(now));
  const[navDay,setNavDay]=useState(null);
  const goMonth=(m,y)=>{setNavMonth(m);setNavYear(y||navYear);setLevel("month")};
  const goWeek=(d)=>{setNavWS(weekStart(d));setLevel("week")};
  const goDay=(d)=>{setNavDay(d);setLevel("day")};
  const goBack=()=>{if(level==="day")setLevel("week");else if(level==="week")setLevel("month");else if(level==="month")setLevel("year")};
  return(
    <div style={{padding:"0 16px 20px"}}>
      {level==="year"&&<div style={{padding:"4px 4px 10px"}}><h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 2px",letterSpacing:-0.5}}>Прогресс</h1></div>}
      {level!=="year"&&<div style={{padding:"4px 4px 0"}}><BackBtn label={level==="month"?"Год":level==="week"?MF[navMonth]:"Неделя"} onClick={goBack}/></div>}
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
        <Chip label="Все" active={!fh} onClick={()=>setFh(null)}/>
        {habits.map(h=><Chip key={h.id} label={`${h.emoji} ${h.name}`} active={fh===h.id} onClick={()=>setFh(fh===h.id?null:h.id)}/>)}
      </div>
      {level==="year"&&<YearView year={navYear} setYear={setNavYear} hid={fh} goMonth={goMonth}/>}
      {level==="month"&&<MonthView year={navYear} month={navMonth} setMonth={(m)=>{if(m<0){setNavMonth(11);setNavYear(navYear-1)}else if(m>11){setNavMonth(0);setNavYear(navYear+1)}else setNavMonth(m)}} hid={fh} goWeek={goWeek}/>}
      {level==="week"&&<WeekView ws={navWS} setWs={setNavWS} habits={habits} hid={fh} goDay={goDay}/>}
      {level==="day"&&<DayView date={navDay} habits={habits} hid={fh}/>}
    </div>
  );
}

function YearView({year,setYear,hid,goMonth}){
  const C=useTheme();const now=new Date();
  return(<div>
    <NavHeader title={`${year}`} onPrev={()=>setYear(year-1)} onNext={()=>setYear(year+1)}/>
    {(()=>{let tS=0,tC=0;for(let m=0;m<12;m++){const dim=new Date(year,m+1,0).getDate();for(let d=1;d<=dim;d++){const dt=new Date(year,m,d);const v=hid?seed(dt,hid):seedAvg(dt);if(v!=null){tS+=v;tC++}}}const avg=tC>0?Math.round(tS/tC/10*100):0;return(
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1,background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}><div style={{color:C.text4,fontSize:11,fontWeight:600,marginBottom:4}}>Затрекано</div><div style={{color:C.text0,fontSize:24,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{tC} <span style={{fontSize:12,color:C.text4,fontWeight:500}}>дней</span></div></div>
        <div style={{flex:1,background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}><div style={{color:C.text4,fontSize:11,fontWeight:600,marginBottom:4}}>Средний балл</div><div style={{color:C.green,fontSize:24,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{avg}%</div></div>
      </div>);
    })()}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(m=>{
        const dim=new Date(year,m+1,0).getDate();const fd=dow(new Date(year,m,1));const cells=Array(fd).fill(null);let mS=0,mC=0;
        for(let d=1;d<=dim;d++){const dt=new Date(year,m,d);const v=hid?seed(dt,hid):seedAvg(dt);cells.push({day:d,value:v});if(v!=null){mS+=v;mC++}}
        while(cells.length%7!==0)cells.push(undefined);
        const mAvg=mC>0?Math.round(mS/mC/10*100):null;const isCur=year===now.getFullYear()&&m===now.getMonth();const isPast=year<now.getFullYear()||(year===now.getFullYear()&&m<=now.getMonth());
        return(<div key={m} onClick={()=>goMonth(m,year)} style={{background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow,cursor:"pointer",transition:"transform 0.1s",border:isCur?`2px solid ${C.green}`:"2px solid transparent",opacity:isPast?1:0.5}}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:isCur?C.green:C.text0,fontSize:15,fontWeight:700}}>{MF[m]}</span>
              {mAvg!=null&&<span style={{fontSize:12,fontWeight:700,color:mAvg>70?C.green:mAvg>40?C.yellow:C.red,background:mAvg>70?C.greenLight:mAvg>40?C.yellowLight:C.redLight,padding:"2px 8px",borderRadius:6}}>{mAvg}%</span>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {WD.map(d=><div key={d} style={{textAlign:"center",fontSize:8,color:C.text5,fontWeight:600,paddingBottom:2}}>{d[0]}</div>)}
            {cells.map((c,i)=>{if(c===null||c===undefined)return <div key={i}/>;const isToday=year===now.getFullYear()&&m===now.getMonth()&&c.day===now.getDate();return <div key={i} style={{aspectRatio:"1",borderRadius:3,background:c.value!=null?v2c(c.value,C):C.emptyCell,border:isToday?`1.5px solid ${C.text0}`:"none",boxSizing:"border-box",maxHeight:18}}/>})}
          </div>
        </div>);
      })}
    </div>
    <div style={{display:"flex",gap:14,marginTop:12,justifyContent:"center"}}>
      {[{l:"0–3",c:C.red},{l:"4–6",c:C.yellow},{l:"7–10",c:C.green}].map(x=>(<div key={x.l} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:x.c}}/><span style={{color:C.text3,fontSize:11}}>{x.l}</span></div>))}
    </div>
  </div>);
}

function MonthView({year,month,setMonth,hid,goWeek}){
  const C=useTheme();const now=new Date();const dim=new Date(year,month+1,0).getDate();const fd=dow(new Date(year,month,1));
  const cells=[];for(let i=0;i<fd;i++)cells.push(null);let best=0,cur=0;
  for(let d=1;d<=dim;d++){const dt=new Date(year,month,d);const v=hid?seed(dt,hid):seedAvg(dt);cells.push({day:d,value:v,date:dt});if(v!=null&&v>=4){cur++;best=Math.max(best,cur)}else cur=0}
  const rows=[];for(let i=0;i<cells.length;i+=7)rows.push(cells.slice(i,i+7));while(rows.length&&rows[rows.length-1].length<7)rows[rows.length-1].push(null);
  return(<div>
    <NavHeader title={`${MF[month]} ${year}`} onPrev={()=>setMonth(month-1)} onNext={()=>setMonth(month+1)}/>
    <div style={{background:C.card,borderRadius:14,padding:12,marginBottom:10,boxShadow:C.cardShadow}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{WD.map(d=><div key={d} style={{textAlign:"center",color:C.text4,fontSize:11,fontWeight:500}}>{d}</div>)}</div>
      {rows.map((row,ri)=>(<div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {row.map((c,ci)=>{if(!c)return <div key={ci}/>;const isT=sameDay(c.date,now);const color=c.value!=null?v2c(c.value,C):C.emptyCell;return <div key={ci} onClick={e=>{e.stopPropagation();goWeek(c.date)}} style={{aspectRatio:"1",borderRadius:10,background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:isT?700:500,color:c.value!=null?"#fff":C.text4,border:isT?`2px solid ${C.text0}`:"none",boxSizing:"border-box",cursor:"pointer",transition:"transform 0.1s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>{c.day}</div>})}
      </div>))}
    </div>
    <p style={{color:C.text4,fontSize:12,textAlign:"center",margin:"0 0 12px"}}>Нажми на день → подробности недели</p>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <SC label="Лучшая серия" value={best} unit="дней" color={C.green}/><SC label="Текущая серия" value={cur} unit="дней" color={C.yellow}/>
    </div>
  </div>);
}
function SC({label,value,unit,color}){const C=useTheme();return(<div style={{background:C.card,borderRadius:14,padding:"14px 16px",boxShadow:C.cardShadow}}><div style={{color:C.text3,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{label}</div><div style={{display:"flex",alignItems:"baseline",gap:4}}><span style={{color,fontSize:28,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{value}</span><span style={{fontSize:13,color:C.text4}}>{unit}</span></div></div>)}

function WeekView({ws,setWs,habits,hid,goDay}){
  const C=useTheme();const now=new Date();
  const days=Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d});
  const vh=hid?habits.filter(h=>h.id===hid):habits;
  const prevW=()=>{const d=new Date(ws);d.setDate(d.getDate()-7);setWs(d)};const nextW=()=>{const d=new Date(ws);d.setDate(d.getDate()+7);setWs(d)};
  const d0=days[0],d6=days[6];const title=d0.getMonth()===d6.getMonth()?`${d0.getDate()}–${d6.getDate()} ${MF[d0.getMonth()]}`:`${d0.getDate()} ${MRU[d0.getMonth()]} – ${d6.getDate()} ${MRU[d6.getMonth()]}`;
  return(<div>
    <NavHeader title={title} sub={`${d0.getFullYear()}`} onPrev={prevW} onNext={nextW}/>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {days.map((d,i)=>{const isT=sameDay(d,now);const v=hid?seed(d,hid):seedAvg(d);return(
        <div key={i} onClick={()=>goDay(d)} style={{flex:1,textAlign:"center",background:isT?C.green:C.card,borderRadius:14,padding:"8px 0",boxShadow:isT?`0 2px 8px ${C.green}33`:C.cardShadow,cursor:"pointer",transition:"transform 0.1s"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{color:isT?"#fff":C.text4,fontSize:10,fontWeight:600,marginBottom:4}}>{WD[i]}</div>
          <div style={{width:26,height:26,borderRadius:8,margin:"0 auto",background:isT?"rgba(255,255,255,0.25)":(v!=null?v2bg(v,C):C.trackBg),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:isT?"#fff":C.text2,fontWeight:600}}>{d.getDate()}</div>
        </div>)})}
    </div>
    <p style={{color:C.text4,fontSize:12,textAlign:"center",margin:"0 0 10px"}}>Нажми на день → подробности</p>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {vh.map(h=>{const wv=days.map(d=>seed(d,h.id));const valid=wv.filter(v=>v!=null);const pct=valid.length>0?Math.round(valid.reduce((a,b)=>a+b,0)/valid.length/10*100):0;return(
        <div key={h.id} style={{background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{h.emoji}</span><span style={{color:C.text1,fontSize:14,fontWeight:600}}>{h.name}</span></div><span style={{color:pct>70?C.green:pct>40?C.yellow:C.red,fontSize:15,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{pct}%</span></div>
          <div style={{display:"flex",gap:3}}>{wv.map((v,i)=><div key={i} style={{flex:1,height:5,borderRadius:3,background:v!=null?v2c(v,C):C.emptyCell}}/>)}</div>
        </div>)})}
    </div>
    {(()=>{const all=days.map(d=>hid?seed(d,hid):seedAvg(d)).filter(v=>v!=null);const ws2=all.length>0?Math.round(all.reduce((a,b)=>a+b,0)/all.length/10*100):0;return(<div style={{background:C.card,borderRadius:14,padding:"14px 18px",boxShadow:C.cardShadow,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:C.text2,fontSize:14}}>Итог недели</span><span style={{color:C.green,fontSize:28,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{ws2}%</span></div>)})()}
  </div>);
}

function DayView({date,habits,hid}){
  const C=useTheme();if(!date)return null;
  const vh=hid?habits.filter(h=>h.id===hid):habits;const vals=vh.map(h=>({...h,value:seed(date,h.id)}));
  const validVals=vals.filter(v=>v.value!=null);const avg=validVals.length>0?Math.round(validVals.reduce((a,b)=>a+b.value,0)/validVals.length):null;
  return(<div>
    <div style={{textAlign:"center",marginBottom:16}}><div style={{color:C.text0,fontSize:20,fontWeight:700,marginBottom:2,textTransform:"capitalize"}}>{WDF[(date.getDay()+6)%7]}</div><div style={{color:C.text3,fontSize:14}}>{date.getDate()} {MF[date.getMonth()].toLowerCase()} {date.getFullYear()}</div></div>
    {avg!=null&&(<div style={{textAlign:"center",marginBottom:16}}><div style={{width:72,height:72,borderRadius:36,margin:"0 auto 8px",background:v2bg(avg,C),display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:32,fontWeight:800,color:v2c(avg,C),fontVariantNumeric:"tabular-nums"}}>{avg}</span></div><div style={{color:C.text4,fontSize:12,fontWeight:500}}>средняя оценка</div></div>)}
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {vals.map(h=>{const v=h.value;const color=v2c(v,C);const pct=v!=null?(v/10)*100:0;return(
        <div key={h.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",boxShadow:C.cardShadow}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:36,height:36,borderRadius:10,background:v!=null?v2bg(v,C):C.trackBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{h.emoji}</div><span style={{color:C.text1,fontSize:15,fontWeight:600}}>{h.name}</span></div><span style={{color:v!=null?color:C.text5,fontSize:24,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{v!=null?v:"–"}</span></div>
          {v!=null&&<div style={{height:4,borderRadius:2,background:C.trackBg,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",borderRadius:2,background:color,transition:"width 0.3s"}}/></div>}
        </div>)})}
    </div>
  </div>);
}

/* ═══════════════════════════════════════════════════════
   HABITS
   ═══════════════════════════════════════════════════════ */
function HabitsScreen({habits,setHabits}){
  const C=useTheme();
  const[adding,setAdding]=useState(false);const[ne,setNe]=useState("🎯");const[nn,setNn]=useState("");const[sep,setSep]=useState(false);
  const[eid,setEid]=useState(null);const[en,setEn]=useState("");const[ee,setEe]=useState("");const[seep,setSeep]=useState(false);
  const[dragIdx,setDragIdx]=useState(null);const[overIdx,setOverIdx]=useState(null);
  const add=()=>{if(!nn.trim()||habits.length>=10)return;setHabits([...habits,{id:"h"+Date.now(),emoji:ne,name:nn.trim().slice(0,LIMIT)}]);setNn("");setNe("🎯");setAdding(false);setSep(false)};
  const rm=(id)=>setHabits(habits.filter(h=>h.id!==id));const se=(h)=>{setEid(h.id);setEn(h.name);setEe(h.emoji);setSeep(false)};
  const sv=()=>{if(!en.trim())return;setHabits(habits.map(h=>h.id===eid?{...h,name:en.trim().slice(0,LIMIT),emoji:ee}:h));setEid(null)};
  const hds=(idx)=>(e)=>{setDragIdx(idx);e.dataTransfer.effectAllowed="move"};const hdo=(idx)=>(e)=>{e.preventDefault();setOverIdx(idx)};
  const hdp=(idx)=>(e)=>{e.preventDefault();if(dragIdx==null||dragIdx===idx){setDragIdx(null);setOverIdx(null);return}const a=[...habits];const item=a.splice(dragIdx,1)[0];a.splice(idx,0,item);setHabits(a);setDragIdx(null);setOverIdx(null)};
  const hde=()=>{setDragIdx(null);setOverIdx(null)};
  const iStyle={width:"100%",padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.sep}`,color:C.text1,fontSize:16,fontWeight:500,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const EG=({sel,onSel})=>(<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10,animation:"su 0.15s ease"}}>{EMOJIS.map(e=><button key={e} onClick={()=>onSel(e)} style={{width:40,height:40,borderRadius:10,border:sel===e?`2px solid ${C.green}`:`1px solid ${C.sep}`,background:sel===e?C.greenLight:C.card,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>)}</div>);
  return(
    <div style={{padding:"0 16px 20px"}}>
      <div style={{padding:"4px 4px 10px"}}><h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 2px",letterSpacing:-0.5}}>Привычки</h1><p style={{color:C.text3,fontSize:15,margin:0}}>{habits.length} из 10</p></div>
      <div style={{background:C.card,borderRadius:14,overflow:"hidden",boxShadow:C.cardShadow,marginBottom:12}}>
        {habits.map((h,idx)=>(<div key={h.id}>
          {eid===h.id?(
            <div style={{padding:14,background:C.greenLight}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
                <button onClick={()=>setSeep(!seep)} style={{width:44,height:44,borderRadius:12,background:C.card,border:`1px solid ${C.sep}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ee}</button>
                <div style={{flex:1,position:"relative"}}><input value={en} onChange={e=>setEn(e.target.value.slice(0,LIMIT))} style={iStyle}/><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>{en.length}/{LIMIT}</span></div>
              </div>
              {seep&&<EG sel={ee} onSel={e=>{setEe(e);setSeep(false)}}/>}
              <div style={{display:"flex",gap:8}}>
                <button onClick={sv} style={{flex:1,padding:12,borderRadius:10,border:"none",background:C.green,color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Сохранить</button>
                <button onClick={()=>setEid(null)} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.sep}`,background:C.card,color:C.text2,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Отмена</button>
              </div>
            </div>
          ):(
            <div draggable onDragStart={hds(idx)} onDragOver={hdo(idx)} onDrop={hdp(idx)} onDragEnd={hde} style={{display:"flex",alignItems:"center",padding:"11px 12px 11px 6px",gap:8,borderBottom:idx<habits.length-1?`0.5px solid ${C.sep}`:"none",background:overIdx===idx&&dragIdx!==idx?C.greenLight:"transparent",opacity:dragIdx===idx?0.5:1,transition:"background 0.15s",cursor:"grab"}}>
              <div style={{display:"flex",flexDirection:"column",gap:1.5,padding:"0 4px",cursor:"grab",flexShrink:0}}>{[0,1,2].map(r=><div key={r} style={{display:"flex",gap:2.5}}><div style={{width:3,height:3,borderRadius:1.5,background:C.text4}}/><div style={{width:3,height:3,borderRadius:1.5,background:C.text4}}/></div>)}</div>
              <div style={{width:40,height:40,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.emoji}</div>
              <span style={{flex:1,color:C.text1,fontSize:16,fontWeight:500}}>{h.name}</span>
              <button onClick={e=>{e.stopPropagation();se(h)}} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>
              <button onClick={e=>{e.stopPropagation();rm(h.id)}} style={{width:32,height:32,borderRadius:8,background:C.redLight,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
          )}
        </div>))}
      </div>
      {adding?(
        <div style={{background:C.card,borderRadius:14,padding:14,boxShadow:C.cardShadow,animation:"su 0.2s ease"}}>
          <div style={{color:C.green,fontSize:13,fontWeight:600,marginBottom:10}}>Новая привычка</div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
            <button onClick={()=>setSep(!sep)} style={{width:44,height:44,borderRadius:12,background:C.bg,border:`1px solid ${C.sep}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ne}</button>
            <div style={{flex:1,position:"relative"}}><input value={nn} onChange={e=>setNn(e.target.value.slice(0,LIMIT))} placeholder="Название" autoFocus style={iStyle}/><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>{nn.length}/{LIMIT}</span></div>
          </div>
          {sep&&<EG sel={ne} onSel={e=>{setNe(e);setSep(false)}}/>}
          <div style={{display:"flex",gap:8}}>
            <button onClick={add} disabled={!nn.trim()} style={{flex:1,padding:12,borderRadius:10,border:"none",background:nn.trim()?C.green:C.sep,color:nn.trim()?"#fff":C.text4,fontSize:15,fontWeight:600,cursor:nn.trim()?"pointer":"default",fontFamily:"inherit"}}>Добавить</button>
            <button onClick={()=>{setAdding(false);setSep(false);setNn("")}} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.sep}`,background:C.card,color:C.text2,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Отмена</button>
          </div>
        </div>
      ):habits.length<10?(
        <button onClick={()=>setAdding(true)} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:C.greenLight,color:C.green,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>+ Добавить привычку</button>
      ):<div style={{textAlign:"center",color:C.text4,fontSize:13,padding:8}}>Максимум 10 привычек</div>}
      <style>{`@keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   THEME TOGGLE
   ═══════════════════════════════════════════════════════ */
function ThemeToggle({dark,setDark}){
  return(
    <button onClick={()=>setDark(!dark)} style={{
      width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",
      background:dark?"#30D158":"#E5E5EA",
      position:"relative",transition:"background 0.3s ease",padding:0,
    }}>
      <div style={{
        width:24,height:24,borderRadius:12,
        background:"#fff",
        position:"absolute",top:2,
        left:dark?26:2,
        transition:"left 0.3s cubic-bezier(0.25,0.1,0.25,1)",
        boxShadow:"0 1px 3px rgba(0,0,0,0.15)",
        display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:14,
      }}>{dark?"🌙":"☀️"}</div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
export default function LifeTrackMVP(){
  const[tab,setTab]=useState("checkin");
  const[habits,setHabits]=useState(DH);
  const[dark,setDark]=useState(false);
  const C=dark?darkTheme:lightTheme;

  return(
    <ThemeCtx.Provider value={C}>
    <div style={{minHeight:"100vh",background:C.pageBg,display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 20px 48px",fontFamily:"-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",transition:"background 0.3s ease"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:12,marginBottom:12}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,background:C.greenLight,borderRadius:100,padding:"5px 14px"}}><span style={{width:6,height:6,borderRadius:"50%",background:C.green}}/><span style={{color:C.green,fontSize:12,fontWeight:600,letterSpacing:0.5}}>MVP · React Native</span></div>
          <ThemeToggle dark={dark} setDark={setDark}/>
        </div>
        <h1 style={{color:C.text0,fontSize:36,fontWeight:800,margin:"0 0 4px",letterSpacing:-1,transition:"color 0.3s"}}>LifeTrack</h1>
        <p style={{color:C.text3,fontSize:14,margin:0,fontWeight:500}}>Слайдер 0–10 · GitHub-style прогресс · 30 секунд в день</p>
      </div>
      <div style={{display:"flex",background:C.segBg,borderRadius:10,padding:2,marginBottom:24}}>
        {["checkin","progress","habits"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:tab===t?C.segActive:"transparent",color:tab===t?C.text0:C.text3,fontSize:13,fontWeight:tab===t?600:500,cursor:"pointer",fontFamily:"inherit",boxShadow:tab===t?C.segShadow:"none",transition:"all 0.2s"}}>{{checkin:"Чек-ин",progress:"Прогресс",habits:"Привычки"}[t]}</button>))}
      </div>
      <Phone>
        {/* Fixed layout: scroll area + pinned tab bar */}
        <div style={{flex:1,overflow:"auto",background:C.bg}}>
          {tab==="checkin"&&<CheckInScreen habits={habits}/>}
          {tab==="progress"&&<ProgressScreen habits={habits}/>}
          {tab==="habits"&&<HabitsScreen habits={habits} setHabits={setHabits}/>}
        </div>
        <TabBar active={tab} onChange={setTab}/>
      </Phone>
    </div>
    </ThemeCtx.Provider>
  );
}
