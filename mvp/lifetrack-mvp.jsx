import { useState, useRef, useCallback, createContext, useContext } from "react";

/* ═══════════════════════════════════════════════════════
   LifeTrack MVP — v9  ·  Актуализирован под текущее приложение (React Native + Expo)
   Чек-ин за вчера · Месяц/Год по умолчанию · Настройки как в проде
   ═══════════════════════════════════════════════════════ */

const DONE_COLOR = "#34C759";       // iOS green
const DONE_BG    = "#E8F9ED";
const DONE_DARK  = "rgba(52,199,89,0.18)";
const SKIP_COLOR = "#C7C7CC";
const LIMIT = 20;
const MAX_HABITS = 10;

const lightTheme = {
  bg:"#F2F2F7",card:"#FFFFFF",
  text0:"#000000",text1:"#1C1C1E",text2:"#3C3C43",text3:"#8E8E93",text4:"#AEAEB2",text5:"#C7C7CC",
  sep:"#E5E5EA",emptyCell:"#EBEBF0",
  green:DONE_COLOR,greenLight:"#E8F9ED",greenSoft:"rgba(52,199,89,0.10)",
  blue:"#007AFF",
  segBg:"rgba(118,118,128,0.12)",segActive:"#FFFFFF",segShadow:"0 1px 3px rgba(0,0,0,0.06)",
  cardShadow:"0 0.5px 1px rgba(0,0,0,0.04)",
  tabBg:"rgba(242,242,247,0.94)",
  phoneBorder:"#E0E0E4",phoneShadow:"0 24px 80px rgba(0,0,0,0.12)",
  island:"#1C1C1E",islandDot:"#2C2C2E",
  pageBg:"linear-gradient(180deg, #F8F8FC 0%, #EEEEF3 100%)",
  overlay:"rgba(0,0,0,0.32)",
  doneBg:DONE_BG,doneGlow:"0 0 0 1px rgba(52,199,89,0.15)",
};
const darkTheme = {
  bg:"#000000",card:"#1C1C1E",
  text0:"#FFFFFF",text1:"#F2F2F7",text2:"#D1D1D6",text3:"#8E8E93",text4:"#636366",text5:"#48484A",
  sep:"#2C2C2E",emptyCell:"#2C2C2E",
  green:DONE_COLOR,greenLight:"rgba(52,199,89,0.15)",greenSoft:"rgba(52,199,89,0.08)",
  blue:"#0A84FF",
  segBg:"rgba(118,118,128,0.24)",segActive:"#2C2C2E",segShadow:"0 1px 3px rgba(0,0,0,0.3)",
  cardShadow:"0 0.5px 1px rgba(255,255,255,0.03)",
  tabBg:"rgba(0,0,0,0.94)",
  phoneBorder:"#2C2C2E",phoneShadow:"0 24px 80px rgba(0,0,0,0.4)",
  island:"#000000",islandDot:"#1C1C1E",
  pageBg:"linear-gradient(180deg, #0A0A0A 0%, #111111 100%)",
  overlay:"rgba(0,0,0,0.6)",
  doneBg:DONE_DARK,doneGlow:"0 0 0 1px rgba(52,199,89,0.25)",
};
const ThemeCtx=createContext();function useTheme(){return useContext(ThemeCtx)}

const MRU=["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
const MF=["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const WD=["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
const WDF=["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const EMOJIS=["🛌","🚴","🥗","🧠","💻","📖","💪","🧘","💊","🎯","🎨","🎵","✍️","🏃","🧹","💧","☀️","🤝","📵","🌿"];
const DH=[{id:"h1",emoji:"🛌",name:"Сон"},{id:"h2",emoji:"🚴",name:"Активность"},{id:"h3",emoji:"🥗",name:"Питание"},{id:"h4",emoji:"🧠",name:"Ментальное"},{id:"h5",emoji:"💻",name:"Проекты"}];

function pluralDays(n){const mod10=n%10;const mod100=n%100;if(mod10===1&&mod100!==11)return"день";if(mod10>=2&&mod10<=4&&(mod100<12||mod100>14))return"дня";return"дней";}

/* ─── Helpers ─── */
function seed(date,hid){const now=new Date();if(date>now)return null;if(sameDay(date,now))return null;const hs=hid?hid.split("").reduce((a,c)=>a+c.charCodeAt(0),0)*7919:0;const h=(date.getFullYear()*366+date.getMonth()*31+date.getDate()+hs)*2654435761;return((h>>>0)%1000)/1000>0.35?1:0}
function seedPct(date){const vs=DH.map(h=>seed(date,h.id)).filter(v=>v!=null);return vs.length?Math.round(vs.reduce((a,b)=>a+b,0)/vs.length*100):null}
function seedDone(date){const vs=DH.map(h=>seed(date,h.id)).filter(v=>v!=null);if(!vs.length)return null;return vs.every(v=>v===1)?2:vs.some(v=>v===1)?1:0} // 2=all,1=some,0=none
function yday(){const d=new Date();d.setDate(d.getDate()-1);return d}
function dow(d){return(d.getDay()+6)%7}
function sameDay(a,b){return a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate()}
function isToday(d){return sameDay(d,new Date())}
function weekStart(d){const r=new Date(d);r.setDate(r.getDate()-dow(r));return r}
function mGen(m){return["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"][m]}
function cellColor(val,C){if(val===null||val===undefined)return C.emptyCell;if(val===2)return DONE_COLOR;if(val===1)return C.green+"88";return C.emptyCell}

/* ─── Confetti ─── */
function Confetti({active}){
  if(!active)return null;
  const greens=["#34C759","#30B350","#2AA147","#48D66A","#5EDD7E"];
  const ps=Array.from({length:40},(_,i)=>({i,l:Math.random()*100,dl:Math.random()*0.4,dur:1.8+Math.random()*1.2,sz:4+Math.random()*5,col:greens[i%5],rot:Math.random()*360,sh:i%3}));
  return(<div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none",zIndex:200}}>{ps.map(p=>(<div key={p.i} style={{position:"absolute",left:`${p.l}%`,top:-16,width:p.sh===2?0:p.sz,height:p.sh===2?0:(p.sh===1?p.sz*2:p.sz),borderRadius:p.sh===0?1:p.sh===1?p.sz/2:0,borderLeft:p.sh===2?`${p.sz/2}px solid transparent`:undefined,borderRight:p.sh===2?`${p.sz/2}px solid transparent`:undefined,borderBottom:p.sh===2?`${p.sz}px solid ${p.col}`:undefined,background:p.sh!==2?p.col:undefined,animation:`cf ${p.dur}s ${p.dl}s ease-in forwards`,transform:`rotate(${p.rot}deg)`,opacity:0}}/>))}<style>{`@keyframes cf{0%{opacity:1;transform:translateY(0) rotate(0deg)}15%{opacity:1}100%{opacity:0;transform:translateY(700px) rotate(540deg) translateX(30px)}}`}</style></div>);
}

/* ─── Phone ─── */
function Phone({children}){const C=useTheme();return(
  <div style={{width:375,minHeight:812,maxHeight:812,borderRadius:48,background:C.bg,border:`3px solid ${C.phoneBorder}`,boxShadow:C.phoneShadow,overflow:"hidden",position:"relative",flexShrink:0,display:"flex",flexDirection:"column"}}>
    <div style={{position:"absolute",top:10,left:"50%",transform:"translateX(-50%)",width:120,height:34,background:C.island,borderRadius:20,zIndex:100}}><div style={{width:10,height:10,borderRadius:"50%",background:C.islandDot,position:"absolute",top:12,left:28}}/></div>
    <div style={{height:56,display:"flex",alignItems:"flex-end",justifyContent:"space-between",padding:"0 30px 6px",fontSize:14,fontWeight:600,color:C.text0,zIndex:99,flexShrink:0}}>
      <span style={{fontVariantNumeric:"tabular-nums"}}>9:41</span>
      <div style={{display:"flex",gap:5,alignItems:"center"}}><svg width="16" height="11" viewBox="0 0 16 11"><path d="M1 4h2v7H1zM5 2.5h2V11H5zM9 1h2v10H9zM13 0h2v11h-2z" fill={C.text0}/></svg><div style={{width:24,height:11,borderRadius:3,border:`1px solid ${C.text4}`,position:"relative",padding:1.5}}><div style={{width:"72%",height:"100%",borderRadius:1.5,background:C.green}}/></div></div>
    </div>
    {children}
    <div style={{height:34,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><div style={{width:134,height:5,borderRadius:3,background:C.text5}}/></div>
  </div>
)}
function TabBar({active,onChange}){const C=useTheme();
  const tabs=[{id:"checkin",label:"Чек-ин",d:"M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"},{id:"progress",label:"Прогресс",d:"M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"},{id:"habits",label:"Привычки",d:"M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 0V6m0 0a2 2 0 100-4m0 4a2 2 0 110-4m12 10a2 2 0 100-4m0 4a2 2 0 110-4m0 0V10"}];
  return(<div style={{display:"flex",borderTop:`0.5px solid ${C.sep}`,background:C.tabBg,backdropFilter:"blur(20px)",padding:"6px 0 2px",flexShrink:0}}>
    {tabs.map(t=>{const a=active===t.id;return(<button key={t.id} onClick={()=>onChange(t.id)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"2px 0",fontFamily:"inherit"}}><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a?C.green:C.text3} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg><span style={{fontSize:10,fontWeight:500,color:a?C.green:C.text3}}>{t.label}</span></button>)})}</div>);
}

/* ─── Shared UI ─── */
function BackBtn({label,onClick}){const C=useTheme();return(<button onClick={onClick} style={{display:"flex",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",padding:"0 0 8px",fontFamily:"inherit"}}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg><span style={{color:C.blue,fontSize:16,fontWeight:500}}>{label}</span></button>)}
function NavHeader({title,onPrev,onNext,sub}){const C=useTheme();return(<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><button onClick={onPrev} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text0} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 19l-7-7 7-7"/></svg></button><div style={{textAlign:"center"}}><div style={{color:C.text0,fontSize:17,fontWeight:700}}>{title}</div>{sub&&<div style={{color:C.text3,fontSize:12,marginTop:1}}>{sub}</div>}</div><button onClick={onNext} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text0} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg></button></div>)}
function Chip({label,active,onClick}){const C=useTheme();return <button onClick={onClick} style={{padding:"6px 14px",borderRadius:100,border:"none",background:active?C.green:C.segBg,color:active?"#fff":C.text2,fontSize:13,fontWeight:500,cursor:"pointer",fontFamily:"inherit",whiteSpace:"nowrap",flexShrink:0,transition:"all 0.15s"}}>{label}</button>}

/* ═══════════════════════════════════════════════════════
   SETTINGS — bottom sheet (контент как в приложении)
   ═══════════════════════════════════════════════════════ */
function Settings({open,onClose,dark,setDark}){
  const C=useTheme();
  if(!open)return null;
  const Row=({icon,label,right,last})=>(<div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:last?"none":`0.5px solid ${C.sep}`}}>
    <span style={{fontSize:18,marginRight:12}}>{icon}</span>
    <span style={{flex:1,color:C.text1,fontSize:15,fontWeight:500}}>{label}</span>
    {right}
  </div>);
  const LinkRow=({icon,title,sub,last})=>(<div style={{display:"flex",alignItems:"center",padding:"14px 0",borderBottom:last?"none":`0.5px solid ${C.sep}`,cursor:"pointer"}}>
    <span style={{fontSize:18,marginRight:12}}>{icon}</span>
    <div style={{flex:1}}><div style={{color:C.text1,fontSize:15,fontWeight:500}}>{title}</div><div style={{color:C.text4,fontSize:12}}>{sub}</div></div>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
  </div>);
  return(<div onClick={onClose} style={{position:"absolute",inset:0,background:C.overlay,zIndex:150,display:"flex",alignItems:"flex-end",animation:"fadeIn 0.2s ease"}}>
    <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxHeight:"85vh",overflow:"auto",background:C.card,borderRadius:"20px 20px 0 0",padding:"8px 20px 40px",animation:"slideUp 0.3s cubic-bezier(0.25,0.1,0.25,1)"}}>
      <div style={{width:36,height:4,borderRadius:2,background:C.text5,margin:"0 auto 18px"}}/>
      <h3 style={{color:C.text0,fontSize:20,fontWeight:700,margin:"0 0 16px"}}>Настройки</h3>
      <Row icon={dark?"🌙":"☀️"} label="Тёмная тема" right={
        <button onClick={()=>setDark(!dark)} style={{width:52,height:28,borderRadius:14,border:"none",cursor:"pointer",background:dark?C.green:"#E5E5EA",position:"relative",transition:"background 0.3s",padding:0}}>
          <div style={{width:24,height:24,borderRadius:12,background:"#fff",position:"absolute",top:2,left:dark?26:2,transition:"left 0.3s cubic-bezier(0.25,0.1,0.25,1)",boxShadow:"0 1px 3px rgba(0,0,0,0.15)"}}/>
        </button>
      }/>
      <div style={{marginTop:20,color:C.text3,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>О проекте</div>
      <div style={{background:C.segBg,borderRadius:12,padding:14,marginBottom:4}}>
        <div style={{color:C.text1,fontSize:14,lineHeight:20}}>LifeTrack — минималистичный трекер привычек. Отмечай вчерашний день за 5 секунд, смотри свой прогресс на тепловой карте. Без оценок, без стресса — просто делал или не делал.</div>
        <div style={{color:C.text2,fontSize:14,lineHeight:20,marginTop:8}}>Это MVP — приложение создаётся открыто, вместе с сообществом. Весь процесс разработки идёт в Telegram-канале.</div>
        <div style={{color:C.text2,fontSize:14,lineHeight:20,marginTop:8}}>Автор — OneZee, инди-разработчик. Делаю то, что нужно мне самому, и делюсь этим с вами.</div>
      </div>
      <div style={{marginTop:24,color:C.text3,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Обратная связь</div>
      <LinkRow icon="✈️" title="Написать автору" sub="Баги, идеи, предложения — всё читаю" last={false}/>
      <div style={{marginTop:24,color:C.text3,fontSize:12,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:4}}>Ссылки</div>
      <LinkRow icon="✈️" title="Telegram-канал" sub="Разработка LifeTrack в реальном времени" last={false}/>
      <LinkRow icon="📷" title="YouTube" sub="Канал автора" last/>
      <div style={{marginTop:32,textAlign:"center"}}><span style={{color:C.text5,fontSize:12}}>LifeTrack MVP v0.1.0 — сделано с душой</span></div>
    </div>
    <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
  </div>);
}

/* ═══════════════════════════════════════════════════════
   BINARY HABIT CARD — tap to toggle ✓ / —
   ═══════════════════════════════════════════════════════ */
function HabitToggle({habit,done,onToggle,delay}){
  const C=useTheme();
  const[pressed,setPressed]=useState(false);
  return(
    <button
      onClick={onToggle}
      onMouseDown={()=>setPressed(true)} onMouseUp={()=>setPressed(false)} onMouseLeave={()=>setPressed(false)}
      style={{
        width:"100%",display:"flex",alignItems:"center",gap:14,
        padding:"14px 16px",
        borderRadius:16,border:"none",cursor:"pointer",fontFamily:"inherit",textAlign:"left",
        background:done?C.doneBg:C.card,
        boxShadow:done?C.doneGlow:C.cardShadow,
        transform:pressed?"scale(0.97)":"scale(1)",
        transition:"all 0.25s cubic-bezier(0.25,0.1,0.25,1)",
        animation:`su 0.3s ease ${delay}s both`,
      }}>
      {/* Emoji */}
      <div style={{
        width:42,height:42,borderRadius:12,
        background:done?`${C.green}18`:C.segBg,
        display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,
        transition:"background 0.3s",
      }}>{habit.emoji}</div>
      {/* Name */}
      <span style={{flex:1,color:C.text1,fontSize:16,fontWeight:600}}>{habit.name}</span>
      {/* Toggle indicator */}
      <div style={{
        width:36,height:36,borderRadius:18,
        background:done?C.green:"transparent",
        border:done?"none":`2px solid ${C.text5}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        transition:"all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
        transform:done?"scale(1)":"scale(0.9)",
        boxSizing:"border-box",
      }}>
        {done?(
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{animation:"pop 0.3s cubic-bezier(0.34,1.56,0.64,1)"}}>
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        ):(
          <span style={{color:C.text5,fontSize:18,fontWeight:300,lineHeight:1}}>—</span>
        )}
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   CHECK-IN SCREEN
   ═══════════════════════════════════════════════════════ */
function CheckInScreen({habits,onOpenSettings}){
  const C=useTheme();
  const[vals,setVals]=useState(()=>{const o={};habits.forEach(h=>{o[h.id]=false});return o});
  const[saved,setSaved]=useState(false);
  const[conf,setConf]=useState(false);
  const y=yday();
  const dayLabel=`Вчера, ${y.getDate()} ${mGen(y.getMonth())}, ${WDF[(y.getDay()+6)%7].toLowerCase()}`;
  const toggle=(id)=>setVals(p=>({...p,[id]:!p[id]}));
  const save=()=>{setSaved(true);setConf(true);setTimeout(()=>setConf(false),3000)};
  const doneCount=Object.values(vals).filter(Boolean).length;
  const total=habits.length;

  return(
    <div style={{padding:"0 16px 20px",position:"relative"}}>
      <Confetti active={conf}/>
      {/* Header */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",padding:"4px 4px 18px"}}>
        <div>
          <h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 4px",letterSpacing:-0.5}}>Чек-ин</h1>
          <p style={{color:C.text3,fontSize:15,margin:0}}>{dayLabel}</p>
        </div>
        <button onClick={onOpenSettings} style={{width:36,height:36,borderRadius:10,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",marginTop:4}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text3} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
      </div>
      {saved?(
        <div style={{textAlign:"center",padding:"28px 16px",animation:"pop 0.45s cubic-bezier(0.34,1.56,0.64,1)"}}>
          <div style={{width:80,height:80,borderRadius:40,margin:"0 auto 18px",background:C.greenLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>🎉</div>
          <h2 style={{color:C.text0,fontSize:24,fontWeight:700,margin:"0 0 6px"}}>День записан!</h2>
          <p style={{color:C.text4,fontSize:13,margin:"0 0 28px"}}>Возвращайся завтра</p>
          {/* Summary */}
          <div style={{background:C.bg,borderRadius:16,padding:"20px",marginBottom:16}}>
            <div style={{fontSize:52,fontWeight:800,color:C.green,fontVariantNumeric:"tabular-nums",lineHeight:1}}>{doneCount}<span style={{fontSize:20,color:C.text4,fontWeight:600}}>/{total}</span></div>
            <div style={{color:C.text3,fontSize:14,marginTop:6}}>привычек выполнено</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {habits.map(h=>{const d=vals[h.id];return(<div key={h.id} style={{padding:"6px 14px",borderRadius:100,background:d?C.greenLight:C.segBg,display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:14}}>{h.emoji}</span><span style={{color:d?C.green:C.text4,fontSize:14,fontWeight:600}}>{d?"✓":"—"}</span></div>)})}
          </div>
          <button onClick={()=>{setSaved(false);setConf(false)}} style={{marginTop:24,background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",color:C.text4,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:4,margin:"24px auto 0"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>
            Изменить
          </button>
          {/* UpdateBanner placeholder */}
          <div style={{marginTop:20,width:"100%",display:"flex",justifyContent:"center"}}>
            <button style={{display:"flex",alignItems:"center",gap:8,padding:"12px 20px",borderRadius:12,border:"none",background:C.blue+"18",color:C.blue,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>☁️ Доступно обновление</button>
          </div>
        </div>
      ):(
        <>
          {/* Habit toggle cards */}
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {habits.map((h,i)=>(
              <HabitToggle key={h.id} habit={h} done={vals[h.id]} onToggle={()=>toggle(h.id)} delay={i*0.04}/>
            ))}
          </div>
          {/* Progress indicator */}
          <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 14px",padding:"0 4px"}}>
            <div style={{flex:1,height:4,borderRadius:2,background:C.segBg,overflow:"hidden"}}>
              <div style={{width:`${(doneCount/total)*100}%`,height:"100%",borderRadius:2,background:C.green,transition:"width 0.4s cubic-bezier(0.25,0.1,0.25,1)"}}/>
            </div>
            <span style={{color:doneCount===total?C.green:C.text3,fontSize:13,fontWeight:600,fontVariantNumeric:"tabular-nums",minWidth:32,textAlign:"right"}}>{doneCount}/{total}</span>
          </div>
          <button onClick={save} style={{width:"100%",padding:"15px 0",borderRadius:14,border:"none",background:C.green,color:"#fff",fontSize:17,fontWeight:600,cursor:"pointer",fontFamily:"inherit",letterSpacing:-0.3,transition:"transform 0.1s"}} onMouseDown={e=>e.target.style.transform="scale(0.97)"} onMouseUp={e=>e.target.style.transform="scale(1)"}>Готово ✓</button>
          <div style={{marginTop:10}}><button style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8,margin:"0 auto",padding:"12px 20px",borderRadius:12,border:"none",background:C.blue+"18",color:C.blue,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>☁️ Доступно обновление</button></div>
        </>
      )}
      <style>{`@keyframes su{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pop{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   PROGRESS — binary heatmap (green / gray)
   ═══════════════════════════════════════════════════════ */
function ProgressScreen({habits}){
  const C=useTheme();const now=new Date();
  const[fh,setFh]=useState(null);const[topLevel,setTopLevel]=useState("month");const[level,setLevel]=useState("month");
  const[navYear,setNavYear]=useState(now.getFullYear());const[navMonth,setNavMonth]=useState(now.getMonth());
  const[navWS,setNavWS]=useState(weekStart(now));const[navDay,setNavDay]=useState(null);
  const goMonth=(m,y)=>{setNavMonth(m);setNavYear(y||navYear);setLevel("month");setTopLevel("month")};
  const goWeek=(d)=>{setNavWS(weekStart(d));setLevel("week")};
  const goDay=(d)=>{setNavDay(d);setLevel("day")};
  const goBack=()=>{if(level==="day")setLevel("week");else if(level==="week")setLevel("month")};
  const switchTopLevel=(t)=>{setTopLevel(t);setLevel(t)};
  return(
    <div style={{padding:"0 16px 20px"}}>
      {(level==="month"||level==="year")?(
        <div style={{padding:"4px 4px 10px"}}>
          <h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 12px",letterSpacing:-0.5}}>Прогресс</h1>
          <div style={{display:"flex",gap:2,borderRadius:8,padding:2,background:C.segBg}}>
            <button onClick={()=>switchTopLevel("month")} style={{flex:1,padding:"6px 0",borderRadius:7,border:"none",background:topLevel==="month"?C.segActive:"transparent",color:topLevel==="month"?C.text0:C.text3,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Месяц</button>
            <button onClick={()=>switchTopLevel("year")} style={{flex:1,padding:"6px 0",borderRadius:7,border:"none",background:topLevel==="year"?C.segActive:"transparent",color:topLevel==="year"?C.text0:C.text3,fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Год</button>
          </div>
        </div>
      ):(
        <div style={{padding:"4px 4px 0"}}><BackBtn label={level==="week"?MF[navMonth]:"Неделя"} onClick={goBack}/></div>
      )}
      <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto",scrollbarWidth:"none",paddingBottom:2}}>
        <Chip label="Все" active={!fh} onClick={()=>setFh(null)}/>
        {habits.map(h=><Chip key={h.id} label={`${h.emoji} ${h.name}`} active={fh===h.id} onClick={()=>setFh(fh===h.id?null:h.id)}/>)}
      </div>
      {level==="year"&&<YearView year={navYear} setYear={setNavYear} hid={fh} goMonth={goMonth}/>}
      {level==="month"&&<MonthView year={navYear} month={navMonth} setMonth={(m)=>{if(m<0){setNavMonth(11);setNavYear(navYear-1)}else if(m>11){setNavMonth(0);setNavYear(navYear+1)}else setNavMonth(m)}} hid={fh} goWeek={goWeek}/>}
      {level==="week"&&<WeekView ws={navWS} setWs={setNavWS} habits={habits} hid={fh} goDay={goDay}/>}
      {level==="day"&&<DayView date={navDay} habits={habits} hid={fh}/>}
      <style>{`@keyframes pulse{0%,100%{border-color:${C.green};opacity:1}50%{border-color:${C.green}66;opacity:0.7}}`}</style>
    </div>
  );
}

function YearView({year,setYear,hid,goMonth}){
  const C=useTheme();const now=new Date();
  return(<div>
    <NavHeader title={`${year}`} onPrev={()=>setYear(year-1)} onNext={()=>setYear(year+1)}/>
    {(()=>{let tD=0,tC=0;for(let m=0;m<12;m++){const dim=new Date(year,m+1,0).getDate();for(let d=1;d<=dim;d++){const dt=new Date(year,m,d);const v=hid?seed(dt,hid):seedDone(dt);if(v!=null){tC++;if(hid?(v===1):(v>=1))tD++}}}return(
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        <div style={{flex:1,background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}><div style={{color:C.text4,fontSize:11,fontWeight:600,marginBottom:4}}>Выполнено</div><div style={{color:C.green,fontSize:24,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{tD} <span style={{fontSize:12,color:C.text4,fontWeight:500}}>{pluralDays(tD)}</span></div></div>
        <div style={{flex:1,background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}><div style={{color:C.text4,fontSize:11,fontWeight:600,marginBottom:4}}>Затрекано</div><div style={{color:C.text0,fontSize:24,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{tC} <span style={{fontSize:12,color:C.text4,fontWeight:500}}>{pluralDays(tC)}</span></div></div>
      </div>);
    })()}
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {[0,1,2,3,4,5,6,7,8,9,10,11].map(m=>{
        const dim=new Date(year,m+1,0).getDate();const fd=dow(new Date(year,m,1));const cells=Array(fd).fill(null);let mD=0,mC=0;
        for(let d=1;d<=dim;d++){const dt=new Date(year,m,d);let v;if(hid){const sv=seed(dt,hid);v=sv;if(sv===1){mD++;mC++}else if(sv===0){mC++}}else{const sv=seedDone(dt);v=sv;if(sv!=null){mC++;if(sv>=1)mD++}}cells.push({day:d,value:v,date:dt})}
        while(cells.length%7!==0)cells.push(undefined);
        const pct=mC>0?Math.round(mD/mC*100):null;
        const isCur=year===now.getFullYear()&&m===now.getMonth();const isPast=year<now.getFullYear()||(year===now.getFullYear()&&m<=now.getMonth());
        return(<div key={m} onClick={()=>goMonth(m,year)} style={{background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow,cursor:"pointer",transition:"transform 0.1s",border:isCur?`2px solid ${C.green}`:"2px solid transparent",opacity:isPast?1:0.4}}
          onMouseDown={e=>e.currentTarget.style.transform="scale(0.98)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <span style={{color:isCur?C.green:C.text0,fontSize:15,fontWeight:700}}>{MF[m]}</span>
              {pct!=null&&<span style={{fontSize:12,fontWeight:700,color:pct>=70?C.green:pct>=40?"#E8C94A":"#AEAEB2",background:pct>=70?C.greenLight:pct>=40?"rgba(232,201,74,0.12)":C.segBg,padding:"2px 8px",borderRadius:6}}>{pct}%</span>}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.text4} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5l7 7-7 7"/></svg>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:2}}>
            {WD.map(d=><div key={d} style={{textAlign:"center",fontSize:8,color:C.text5,fontWeight:600,paddingBottom:2}}>{d[0]}</div>)}
            {cells.map((c,i)=>{if(c===null||c===undefined)return <div key={i}/>;const today=isToday(c.date);
              let bg=C.emptyCell;
              if(!today&&c.value!=null){if(hid){bg=c.value===1?C.green:C.emptyCell}else{bg=c.value===2?C.green:c.value===1?C.green+"70":C.emptyCell}}
              return <div key={i} style={{aspectRatio:"1",borderRadius:3,background:today?"transparent":bg,border:today?`1.5px solid ${C.green}`:"none",boxSizing:"border-box",maxHeight:18,animation:today?"pulse 2s ease-in-out infinite":"none"}}/>})}
          </div>
        </div>);
      })}
    </div>
    <div style={{display:"flex",gap:12,marginTop:12,justifyContent:"center"}}>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:C.green}}/><span style={{color:C.text3,fontSize:10}}>Выполнено</span></div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,background:C.emptyCell}}/><span style={{color:C.text3,fontSize:10}}>Пропуск</span></div>
      <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:8,height:8,borderRadius:2,border:`1.5px solid ${C.green}`,boxSizing:"border-box"}}/><span style={{color:C.text3,fontSize:10}}>Сегодня</span></div>
    </div>
  </div>);
}

function MonthView({year,month,setMonth,hid,goWeek}){
  const C=useTheme();const now=new Date();const dim=new Date(year,month+1,0).getDate();const fd=dow(new Date(year,month,1));
  const cells=[];for(let i=0;i<fd;i++)cells.push(null);let best=0,cur=0;
  for(let d=1;d<=dim;d++){const dt=new Date(year,month,d);let v;if(hid){v=seed(dt,hid)}else{v=seedDone(dt)}cells.push({day:d,value:v,date:dt});const isDone=hid?(v===1):(v!=null&&v>=1);if(isDone){cur++;best=Math.max(best,cur)}else if(!isToday(dt))cur=0}
  const rows=[];for(let i=0;i<cells.length;i+=7)rows.push(cells.slice(i,i+7));while(rows.length&&rows[rows.length-1].length<7)rows[rows.length-1].push(null);
  return(<div>
    <NavHeader title={`${MF[month]} ${year}`} onPrev={()=>setMonth(month-1)} onNext={()=>setMonth(month+1)}/>
    <div style={{background:C.card,borderRadius:14,padding:12,marginBottom:10,boxShadow:C.cardShadow}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:6}}>{WD.map(d=><div key={d} style={{textAlign:"center",color:C.text4,fontSize:11,fontWeight:500}}>{d}</div>)}</div>
      {rows.map((row,ri)=>(<div key={ri} style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:4,marginBottom:4}}>
        {row.map((c,ci)=>{if(!c)return <div key={ci}/>;const today=isToday(c.date);
          const isDone=hid?(c.value===1):(c.value!=null&&c.value>=1);
          return <div key={ci} onClick={e=>{e.stopPropagation();goWeek(c.date)}} style={{aspectRatio:"1",borderRadius:10,background:today?"transparent":(isDone?C.green:C.emptyCell),display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:today?700:500,color:isDone&&!today?"#fff":C.text4,border:today?`2px solid ${C.green}`:"none",boxSizing:"border-box",cursor:"pointer",transition:"transform 0.1s",animation:today?"pulse 2s ease-in-out infinite":"none"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.9)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>{c.day}</div>})}
      </div>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      <SC label="Лучшая серия" value={best} unit={pluralDays(best)} color={C.green}/><SC label="Текущая серия" value={cur} unit={pluralDays(cur)} color={C.green}/>
    </div>
  </div>);
}
function SC({label,value,unit,color}){const C=useTheme();return(<div style={{background:C.card,borderRadius:14,padding:"14px 16px",boxShadow:C.cardShadow}}><div style={{color:C.text3,fontSize:11,fontWeight:600,textTransform:"uppercase",letterSpacing:0.5,marginBottom:6}}>{label}</div><div style={{display:"flex",alignItems:"baseline",gap:4}}><span style={{color,fontSize:28,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{value}</span><span style={{fontSize:13,color:C.text4}}>{unit}</span></div></div>)}

function WeekView({ws,setWs,habits,hid,goDay}){
  const C=useTheme();
  const days=Array.from({length:7},(_,i)=>{const d=new Date(ws);d.setDate(ws.getDate()+i);return d});
  const vh=hid?habits.filter(h=>h.id===hid):habits;
  const prevW=()=>{const d=new Date(ws);d.setDate(d.getDate()-7);setWs(d)};const nextW=()=>{const d=new Date(ws);d.setDate(d.getDate()+7);setWs(d)};
  const d0=days[0],d6=days[6];const title=d0.getMonth()===d6.getMonth()?`${d0.getDate()}–${d6.getDate()} ${MF[d0.getMonth()]}`:`${d0.getDate()} ${MRU[d0.getMonth()]} – ${d6.getDate()} ${MRU[d6.getMonth()]}`;
  return(<div>
    <NavHeader title={title} sub={`${d0.getFullYear()}`} onPrev={prevW} onNext={nextW}/>
    <div style={{display:"flex",gap:4,marginBottom:14}}>
      {days.map((d,i)=>{const today=isToday(d);const v=hid?seed(d,hid):(seedDone(d)!=null&&seedDone(d)>=1?1:seed(d,"avg"));const isDone=hid?(v===1):(seedDone(d)!=null&&seedDone(d)>=1);return(
        <div key={i} onClick={()=>goDay(d)} style={{flex:1,textAlign:"center",background:C.card,borderRadius:14,padding:"8px 0",border:today?`2px solid ${C.green}`:"2px solid transparent",boxShadow:C.cardShadow,cursor:"pointer",transition:"transform 0.1s",animation:today?"pulse 2s ease-in-out infinite":"none"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.93)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
          <div style={{color:today?C.green:C.text4,fontSize:10,fontWeight:600,marginBottom:4}}>{WD[i]}</div>
          <div style={{width:26,height:26,borderRadius:13,margin:"0 auto",background:today?"transparent":(isDone?C.greenLight:C.segBg),display:"flex",alignItems:"center",justifyContent:"center"}}>
            {isDone&&!today?<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            :<span style={{fontSize:11,color:today?C.green:C.text4,fontWeight:600}}>{d.getDate()}</span>}
          </div>
        </div>)})}
    </div>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {vh.map(h=>{const wv=days.map(d=>seed(d,h.id));const done=wv.filter(v=>v===1).length;const total=wv.filter(v=>v!=null).length;return(
        <div key={h.id} style={{background:C.card,borderRadius:14,padding:"12px 14px",boxShadow:C.cardShadow}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:18}}>{h.emoji}</span><span style={{color:C.text1,fontSize:14,fontWeight:600}}>{h.name}</span></div>
            <span style={{color:done===total&&total>0?C.green:C.text3,fontSize:14,fontWeight:700,fontVariantNumeric:"tabular-nums"}}>{done}/{total}</span>
          </div>
          <div style={{display:"flex",gap:3}}>{wv.map((v,i)=>{const today=isToday(days[i]);return <div key={i} style={{flex:1,height:6,borderRadius:3,background:today?"transparent":(v===1?C.green:C.emptyCell),border:today?`1.5px solid ${C.green}`:"none",boxSizing:"border-box"}}/>})}</div>
        </div>)})}
    </div>
    {(()=>{const totalDone=days.reduce((acc,d)=>{const v=seedDone(d);return acc+(v!=null&&v>=1?1:0)},0);const totalDays=days.filter(d=>!isToday(d)&&seedDone(d)!=null).length;return(<div style={{background:C.card,borderRadius:14,padding:"14px 18px",boxShadow:C.cardShadow,marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{color:C.text2,fontSize:14}}>Итог недели</span><span style={{color:C.green,fontSize:28,fontWeight:800,fontVariantNumeric:"tabular-nums"}}>{totalDone}<span style={{fontSize:14,color:C.text4,fontWeight:500}}>/{totalDays}</span></span></div>)})()}
  </div>);
}

function DayView({date,habits,hid}){
  const C=useTheme();if(!date)return null;
  const vh=hid?habits.filter(h=>h.id===hid):habits;const vals=vh.map(h=>({...h,value:seed(date,h.id)}));
  const doneCount=vals.filter(v=>v.value===1).length;const total=vals.filter(v=>v.value!=null).length;
  const today=isToday(date);
  return(<div>
    <div style={{textAlign:"center",marginBottom:16}}>
      <div style={{color:C.text0,fontSize:20,fontWeight:700,marginBottom:2,textTransform:"capitalize"}}>{WDF[(date.getDay()+6)%7]}</div>
      <div style={{color:C.text3,fontSize:14}}>{date.getDate()} {mGen(date.getMonth())} {date.getFullYear()}</div>
      {today&&<div style={{color:C.green,fontSize:12,fontWeight:600,marginTop:4}}>Сегодня — ещё не затрекан</div>}
    </div>
    {!today&&total>0&&(<div style={{textAlign:"center",marginBottom:16}}>
      <div style={{width:72,height:72,borderRadius:36,margin:"0 auto 8px",background:doneCount===total?C.greenLight:C.segBg,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:28,fontWeight:800,color:doneCount===total?C.green:C.text3,fontVariantNumeric:"tabular-nums"}}>{doneCount}/{total}</span>
      </div>
      <div style={{color:doneCount===total?C.green:C.text3,fontSize:13,fontWeight:600}}>{doneCount===total?"Все выполнено!":"Частично"}</div>
    </div>)}
    {today&&(<div style={{textAlign:"center",marginBottom:16}}><div style={{width:72,height:72,borderRadius:36,margin:"0 auto 8px",background:C.emptyCell,border:`2px solid ${C.green}`,display:"flex",alignItems:"center",justifyContent:"center",animation:"pulse 2s ease-in-out infinite"}}><span style={{fontSize:24,color:C.text4}}>?</span></div><div style={{color:C.text4,fontSize:13}}>Ожидает чек-ина</div></div>)}
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {vals.map(h=>{const done=h.value===1;return(
        <div key={h.id} style={{background:C.card,borderRadius:14,padding:"14px 16px",boxShadow:C.cardShadow,display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:40,height:40,borderRadius:10,background:done?C.greenLight:C.segBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{h.emoji}</div>
          <span style={{flex:1,color:C.text1,fontSize:15,fontWeight:600}}>{h.name}</span>
          {h.value!=null?(
            <div style={{width:32,height:32,borderRadius:16,background:done?C.green:C.emptyCell,display:"flex",alignItems:"center",justifyContent:"center"}}>
              {done?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
              :<span style={{color:C.text4,fontSize:14}}>—</span>}
            </div>
          ):<span style={{color:C.text5,fontSize:13}}>—</span>}
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
  const add=()=>{if(!nn.trim()||habits.length>=MAX_HABITS)return;setHabits([...habits,{id:"h"+Date.now(),emoji:ne,name:nn.trim().slice(0,LIMIT)}]);setNn("");setNe("🎯");setAdding(false);setSep(false)};
  const rm=(id)=>setHabits(habits.filter(h=>h.id!==id));const se=(h)=>{setEid(h.id);setEn(h.name);setEe(h.emoji);setSeep(false)};
  const sv=()=>{if(!en.trim())return;setHabits(habits.map(h=>h.id===eid?{...h,name:en.trim().slice(0,LIMIT),emoji:ee}:h));setEid(null)};
  const hds=(idx)=>(e)=>{setDragIdx(idx);e.dataTransfer.effectAllowed="move"};const hdo=(idx)=>(e)=>{e.preventDefault();setOverIdx(idx)};
  const hdp=(idx)=>(e)=>{e.preventDefault();if(dragIdx==null||dragIdx===idx){setDragIdx(null);setOverIdx(null);return}const a=[...habits];const item=a.splice(dragIdx,1)[0];a.splice(idx,0,item);setHabits(a);setDragIdx(null);setOverIdx(null)};
  const hde=()=>{setDragIdx(null);setOverIdx(null)};
  const iStyle={width:"100%",padding:"12px 14px",borderRadius:10,background:C.bg,border:`1px solid ${C.sep}`,color:C.text1,fontSize:16,fontWeight:500,fontFamily:"inherit",outline:"none",boxSizing:"border-box"};
  const EG=({sel,onSel})=>(<div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10,animation:"su 0.15s ease"}}>{EMOJIS.map(e=><button key={e} onClick={()=>onSel(e)} style={{width:40,height:40,borderRadius:10,border:sel===e?`2px solid ${C.green}`:`1px solid ${C.sep}`,background:sel===e?C.greenLight:C.card,fontSize:20,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{e}</button>)}</div>);
  return(
    <div style={{padding:"0 16px 20px"}}>
      <div style={{padding:"4px 4px 10px"}}><h1 style={{color:C.text0,fontSize:32,fontWeight:700,margin:"0 0 2px",letterSpacing:-0.5}}>Привычки</h1><p style={{color:C.text3,fontSize:15,margin:0}}>{habits.length} из {MAX_HABITS}</p></div>
      <div style={{background:C.card,borderRadius:14,overflow:"hidden",boxShadow:C.cardShadow,marginBottom:12}}>
        {habits.map((h,idx)=>(<div key={h.id}>
          {eid===h.id?(
            <div style={{padding:14,background:C.greenLight}}>
              <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><button onClick={()=>setSeep(!seep)} style={{width:44,height:44,borderRadius:12,background:C.card,border:`1px solid ${C.sep}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ee}</button><div style={{flex:1,position:"relative"}}><input value={en} onChange={e=>setEn(e.target.value.slice(0,LIMIT))} style={iStyle}/><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>{en.length}/{LIMIT}</span></div></div>
              {seep&&<EG sel={ee} onSel={e=>{setEe(e);setSeep(false)}}/>}
              <div style={{display:"flex",gap:8}}><button onClick={sv} style={{flex:1,padding:12,borderRadius:10,border:"none",background:C.green,color:"#fff",fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Сохранить</button><button onClick={()=>setEid(null)} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.sep}`,background:C.card,color:C.text2,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Отмена</button></div>
            </div>
          ):(
            <div draggable onDragStart={hds(idx)} onDragOver={hdo(idx)} onDrop={hdp(idx)} onDragEnd={hde} style={{display:"flex",alignItems:"center",padding:"11px 12px 11px 6px",gap:8,borderBottom:idx<habits.length-1?`0.5px solid ${C.sep}`:"none",background:overIdx===idx&&dragIdx!==idx?C.greenLight:"transparent",opacity:dragIdx===idx?0.5:1,transition:"background 0.15s",cursor:"grab"}}>
              <div style={{display:"flex",flexDirection:"column",gap:2,padding:"0 4px",flexShrink:0}}>
                <div style={{width:14,height:2,borderRadius:1,background:C.text5}}/><div style={{width:14,height:2,borderRadius:1,background:C.text5}}/><div style={{width:14,height:2,borderRadius:1,background:C.text5}}/>
              </div>
              <div style={{width:40,height:40,borderRadius:10,background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.emoji}</div>
              <span style={{flex:1,color:C.text1,fontSize:16,fontWeight:500}}>{h.name}</span>
              <button onClick={e=>{e.stopPropagation();se(h)}} style={{width:32,height:32,borderRadius:8,background:C.segBg,border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.85 0 114 4L7.5 20.5 2 22l1.5-5.5z"/></svg></button>
              <button onClick={e=>{e.stopPropagation();rm(h.id)}} style={{width:32,height:32,borderRadius:8,background:"rgba(255,59,48,0.1)",border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
            </div>
          )}
        </div>))}
      </div>
      {adding?(
        <div style={{background:C.card,borderRadius:14,padding:14,boxShadow:C.cardShadow,animation:"su 0.2s ease"}}>
          <div style={{color:C.green,fontSize:13,fontWeight:600,marginBottom:10}}>Новая привычка</div>
          <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}><button onClick={()=>setSep(!sep)} style={{width:44,height:44,borderRadius:12,background:C.bg,border:`1px solid ${C.sep}`,fontSize:22,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>{ne}</button><div style={{flex:1,position:"relative"}}><input value={nn} onChange={e=>setNn(e.target.value.slice(0,LIMIT))} placeholder="Название" autoFocus style={iStyle}/><span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",fontSize:11,color:C.text4}}>{nn.length}/{LIMIT}</span></div></div>
          {sep&&<EG sel={ne} onSel={e=>{setNe(e);setSep(false)}}/>}
          <div style={{display:"flex",gap:8}}><button onClick={add} disabled={!nn.trim()} style={{flex:1,padding:12,borderRadius:10,border:"none",background:nn.trim()?C.green:C.sep,color:nn.trim()?"#fff":C.text4,fontSize:15,fontWeight:600,cursor:nn.trim()?"pointer":"default",fontFamily:"inherit"}}>Добавить</button><button onClick={()=>{setAdding(false);setSep(false);setNn("")}} style={{flex:1,padding:12,borderRadius:10,border:`1px solid ${C.sep}`,background:C.card,color:C.text2,fontSize:15,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Отмена</button></div>
        </div>
      ):habits.length<MAX_HABITS?(
        <button onClick={()=>setAdding(true)} style={{width:"100%",padding:14,borderRadius:14,border:"none",background:C.greenLight,color:C.green,fontSize:16,fontWeight:600,cursor:"pointer",fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>+ Добавить привычку</button>
      ):<div style={{textAlign:"center",color:C.text4,fontSize:13,padding:8}}>Максимум {MAX_HABITS} привычек</div>}
      <style>{`@keyframes su{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════ */
export default function LifeTrackMVP(){
  const[tab,setTab]=useState("checkin");const[habits,setHabits]=useState(DH);
  const[dark,setDark]=useState(false);const[settings,setSettings]=useState(false);
  const C=dark?darkTheme:lightTheme;
  return(
    <ThemeCtx.Provider value={C}>
    <div style={{minHeight:"100vh",background:C.pageBg,display:"flex",flexDirection:"column",alignItems:"center",padding:"32px 20px 48px",fontFamily:"-apple-system, 'SF Pro Display', 'SF Pro Text', system-ui, sans-serif",transition:"background 0.3s"}}>
      <div style={{textAlign:"center",marginBottom:28}}>
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:C.greenLight,borderRadius:100,padding:"5px 14px",marginBottom:12}}><span style={{width:6,height:6,borderRadius:"50%",background:C.green}}/><span style={{color:C.green,fontSize:12,fontWeight:600,letterSpacing:0.5}}>MVP · React Native + Expo</span></div>
        <h1 style={{color:C.text0,fontSize:36,fontWeight:800,margin:"0 0 4px",letterSpacing:-1,transition:"color 0.3s"}}>LifeTrack</h1>
        <p style={{color:C.text3,fontSize:14,margin:0,fontWeight:500}}>Делал или нет · Прогресс · 5 секунд</p>
      </div>
      <div style={{display:"flex",background:C.segBg,borderRadius:10,padding:2,marginBottom:24}}>
        {["checkin","progress","habits"].map(t=>(<button key={t} onClick={()=>setTab(t)} style={{padding:"8px 20px",borderRadius:8,border:"none",background:tab===t?C.segActive:"transparent",color:tab===t?C.text0:C.text3,fontSize:13,fontWeight:tab===t?600:500,cursor:"pointer",fontFamily:"inherit",boxShadow:tab===t?C.segShadow:"none",transition:"all 0.2s"}}>{{checkin:"Чек-ин",progress:"Прогресс",habits:"Привычки"}[t]}</button>))}
      </div>
      <Phone>
        <div style={{flex:1,overflow:"auto",background:C.bg}}>
          {tab==="checkin"&&<CheckInScreen habits={habits} onOpenSettings={()=>setSettings(true)}/>}
          {tab==="progress"&&<ProgressScreen habits={habits}/>}
          {tab==="habits"&&<HabitsScreen habits={habits} setHabits={setHabits}/>}
        </div>
        <TabBar active={tab} onChange={setTab}/>
        <Settings open={settings} onClose={()=>setSettings(false)} dark={dark} setDark={setDark}/>
      </Phone>
    </div>
    </ThemeCtx.Provider>
  );
}
