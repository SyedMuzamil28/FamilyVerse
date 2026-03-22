"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://familyverse-backend.onrender.com";

const apiFetch = async (method, path, body, token) => {
  const res = await fetch(`${API}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const LS = {
  get: (k, d) => { try { if (typeof window === "undefined") return d; const v = localStorage.getItem("fv4_" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set: (k, v) => { try { if (typeof window === "undefined") return; localStorage.setItem("fv4_" + k, JSON.stringify(v)); } catch {} },
  clear: () => { try { if (typeof window === "undefined") return; Object.keys(localStorage).filter(k => k.startsWith("fv4_")).forEach(k => localStorage.removeItem(k)); } catch {} },
};

const ROLES = ["Father","Mother","Son","Daughter","Brother","Sister","Grandfather","Grandmother","Uncle","Aunt","Other"];
const ROLE_EMOJI = { Father:"👨‍💼",Mother:"👩‍🦱",Son:"👦",Daughter:"👧",Brother:"👦",Sister:"👧",Grandfather:"👴",Grandmother:"👵",Uncle:"👨",Aunt:"👩",Other:"👤" };
const MOODS = [{id:"happy",e:"😊",l:"Happy",c:"#22C55E"},{id:"loved",e:"🥰",l:"Loved",c:"#EC4899"},{id:"okay",e:"😐",l:"Okay",c:"#F59E0B"},{id:"tired",e:"😴",l:"Tired",c:"#8B5CF6"},{id:"stressed",e:"😔",l:"Stressed",c:"#EF4444"}];
const PRAYER_NAMES = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];
const PRAYER_ICONS = ["🌙","☀️","🌤️","🌅","🌃"];
const DUAS = [
  {t:"Morning Dua",ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ",tr:"Asbahna wa asbahal mulku lillah",en:"We have reached morning and sovereignty belongs to Allah"},
  {t:"Before Eating",ar:"بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ",tr:"Bismillahi wa ala barakatillah",en:"In the name of Allah and with His blessings"},
  {t:"After Eating",ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا",tr:"Alhamdulillahilladhi at'amana wa saqana",en:"Praise Allah Who fed us and gave us drink"},
  {t:"Before Sleep",ar:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",tr:"Bismika Allahumma amootu wa ahya",en:"In Your name O Allah, I die and I live"},
  {t:"For Anxiety",ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",tr:"Allahumma inni a'udhu bika minal hammi wal hazan",en:"O Allah I seek refuge from worry and grief"},
  {t:"Ayatul Kursi",ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",tr:"Allahu la ilaha illa huwal hayyul qayyum",en:"Allah - there is no god except Him, the Ever-Living"},
  {t:"For Parents",ar:"رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",tr:"Rabbir hamhuma kama rabbayani sagheera",en:"My Lord have mercy on them as they raised me small"},
  {t:"Leaving Home",ar:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ",tr:"Bismillahi tawakkaltu alallah",en:"In the name of Allah I place my trust in Allah"},
];
const genMath = () => {
  const a=Math.floor(Math.random()*12)+1,b=Math.floor(Math.random()*10)+1;
  const op=Math.random()>.5?"+":"×";const ans=op==="+"?a+b:a*b;
  const opts=[ans];while(opts.length<4){const r=ans+(Math.floor(Math.random()*8)-4);if(r>0&&!opts.includes(r))opts.push(r);}
  return {q:`${a} ${op} ${b} = ?`,answer:ans,opts:opts.sort(()=>Math.random()-.5)};
};

function DrawingBoard({dark}){
  const ref=useRef(null);const[drawing,setDrawing]=useState(false);const[color,setColor]=useState("#6366F1");const[size,setSize]=useState(4);const last=useRef(null);
  const COLORS=["#6366F1","#EF4444","#F59E0B","#22C55E","#EC4899","#0EA5E9","#000","#fff"];
  useEffect(()=>{const c=ref.current;if(!c)return;const dpr=window.devicePixelRatio||1;c.width=c.offsetWidth*dpr;c.height=220*dpr;const ctx=c.getContext("2d");ctx.scale(dpr,dpr);ctx.fillStyle=dark?"#1a1a2e":"white";ctx.fillRect(0,0,c.offsetWidth,220);},[dark]);
  const getPos=(e,c)=>{const r=c.getBoundingClientRect(),dpr=window.devicePixelRatio||1;const src=e.touches?e.touches[0]:e;return{x:(src.clientX-r.left)*(c.width/r.width/dpr),y:(src.clientY-r.top)*(c.height/r.height/dpr)};};
  const start=useCallback((e)=>{e.preventDefault();last.current=getPos(e,ref.current);setDrawing(true);},[]);
  const move=useCallback((e)=>{e.preventDefault();if(!drawing)return;const c=ref.current,ctx=c.getContext("2d"),pos=getPos(e,c);ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(pos.x,pos.y);ctx.strokeStyle=color;ctx.lineWidth=size;ctx.lineCap="round";ctx.stroke();last.current=pos;},[drawing,color,size]);
  const stop=useCallback(()=>setDrawing(false),[]);
  const clear=()=>{const c=ref.current,ctx=c.getContext("2d");ctx.fillStyle=dark?"#1a1a2e":"white";ctx.fillRect(0,0,c.offsetWidth,220);};
  return(<div style={{background:"var(--card)",borderRadius:12,overflow:"hidden",border:"1px solid var(--border)"}}>
    <div style={{display:"flex",gap:6,alignItems:"center",padding:"8px 10px",borderBottom:"1px solid var(--border)",flexWrap:"wrap"}}>
      {COLORS.map(cl=><div key={cl} onClick={()=>setColor(cl)} style={{width:20,height:20,borderRadius:"50%",background:cl,cursor:"pointer",border:color===cl?"3px solid var(--primary)":"2px solid var(--border)",flexShrink:0}}/>)}
      <select value={size} onChange={e=>setSize(+e.target.value)} style={{marginLeft:"auto",padding:"2px 6px",borderRadius:6,border:"1px solid var(--border)",background:"var(--card)",color:"var(--text)",fontSize:11}}>
        <option value={2}>Thin</option><option value={4}>Medium</option><option value={8}>Thick</option>
      </select>
      <button onClick={clear} style={{padding:"2px 10px",borderRadius:6,border:"1px solid var(--border)",background:"var(--card)",color:"var(--muted)",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>Clear</button>
    </div>
    <canvas ref={ref} style={{display:"block",width:"100%",height:220,touchAction:"none"}} onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchMove={move} onTouchEnd={stop}/>
  </div>);
}


// ── ONBOARDING ───────────────────────────────────────────────────────────────
function OnboardingSlides({ onDone }) {
  const [slide, setSlide] = useState(0);
  const SLIDES = [
    {
      bg:"linear-gradient(135deg,#1E3A5F,#0D9488)",
      icon:"🏠",title:"Welcome to FamilyVerse",
      sub:"Your private family universe",
      desc:"One app for your whole family — health, chat, faith, memories and safety. All in one private place. Only your family can access it.",
    },
    {
      bg:"linear-gradient(135deg,#6366F1,#8B5CF6)",
      icon:"✨",title:"Everything In One Place",
      sub:"6 powerful features",
      features:[{e:"💬",t:"Real-time Family Chat"},{e:"❤️",t:"Health & Medicine"},{e:"☪️",t:"Prayer Times & Qibla"},{e:"🤖",t:"AI Health Assistant"},{e:"📸",t:"Memory Capsule"},{e:"🆘",t:"Emergency SOS"}],
    },
    {
      bg:"linear-gradient(135deg,#0D9488,#22C55E)",
      icon:"🔒",title:"100% Private & Secure",
      sub:"Only your family can join",
      desc:"Your family gets a secret invite code. No strangers. No ads. No one reads your data. More private than WhatsApp.",
    },
    {
      bg:"linear-gradient(135deg,#F59E0B,#EF4444)",
      icon:"🚀",title:"Ready to Connect!",
      sub:"Takes 1 minute to set up",
      steps:[{n:"1",t:"Create your family"},{n:"2",t:"Share the invite code"},{n:"3",t:"Family joins instantly"},{n:"4",t:"Start using together! 🎉"}],
    },
  ];
  const s=SLIDES[slide];
  const isLast=slide===SLIDES.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:s.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"30px 24px",zIndex:2000}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}} .ob-anim{animation:fadeUp .35s ease;}`}</style>
      <button onClick={onDone} style={{position:"absolute",top:50,right:20,background:"rgba(255,255,255,.2)",border:"none",color:"white",padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Skip</button>
      <div className="ob-anim" key={slide} style={{textAlign:"center",maxWidth:340,width:"100%"}}>
        <div style={{fontSize:72,marginBottom:16,lineHeight:1}}>{s.icon}</div>
        <div style={{fontSize:24,fontWeight:800,color:"white",marginBottom:6,lineHeight:1.2}}>{s.title}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:24}}>{s.sub}</div>
        {s.desc&&<div style={{fontSize:14,color:"rgba(255,255,255,.9)",lineHeight:1.8,background:"rgba(255,255,255,.12)",borderRadius:16,padding:"16px 20px"}}>{s.desc}</div>}
        {s.features&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {s.features.map((f,i)=><div key={i} style={{background:"rgba(255,255,255,.15)",borderRadius:14,padding:"12px 10px",display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:22}}>{f.e}</span><span style={{fontSize:12,fontWeight:600,color:"white",textAlign:"left"}}>{f.t}</span>
          </div>)}
        </div>}
        {s.steps&&<div style={{display:"flex",flexDirection:"column",gap:10}}>
          {s.steps.map((st,i)=><div key={i} style={{background:"rgba(255,255,255,.15)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"white",flexShrink:0}}>{st.n}</div>
            <span style={{fontSize:14,fontWeight:600,color:"white"}}>{st.t}</span>
          </div>)}
        </div>}
      </div>
      <div style={{position:"absolute",bottom:50,left:24,right:24}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>
          {SLIDES.map((_,i)=><div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?24:8,height:8,borderRadius:4,background:i===slide?"white":"rgba(255,255,255,.35)",transition:"all .3s",cursor:"pointer"}}/>)}
        </div>
        <button onClick={()=>isLast?onDone():setSlide(s=>s+1)} style={{width:"100%",padding:"15px 20px",borderRadius:14,border:"none",background:"white",color:"#1E3A5F",fontFamily:"inherit",fontWeight:800,fontSize:16,cursor:"pointer",boxShadow:"0 4px 20px rgba(0,0,0,.2)"}}>
          {isLast?"Let's Get Started! 🚀":"Next →"}
        </button>
      </div>
    </div>
  );
}

export default function FamilyVerse(){
  const[mounted,setMounted]=useState(false);
  const[showOnboarding,setShowOnboarding]=useState(false);
  const[dark,setDark]=useState(false);
  const[session,setSession]=useState(null);
  const[obMode,setObMode]=useState("create");
  const[obStep,setObStep]=useState(1);
  const[obData,setObData]=useState({familyName:"",userName:"",role:"Father",city:"Hyderabad",password:"",joinCode:""});
  const[obLoading,setObLoading]=useState(false);
  const[page,setPage]=useState("dashboard");
  const[openChat,setOpenChat]=useState(null);
  const[showEmoji,setShowEmoji]=useState(false);
  const[kidsTab,setKidsTab]=useState("abc");
  const[mathQ,setMathQ]=useState(()=>genMath());
  const[mathRes,setMathRes]=useState(null);
  const[sosActive,setSosActive]=useState(false);
  const[showAddMed,setShowAddMed]=useState(false);
  const[showAddMem,setShowAddMem]=useState(false);
  const[showAddLog,setShowAddLog]=useState(false);
  const[fmMed,setFmMed]=useState({name:"",time:"",member:""});
  const[fmMem,setFmMem]=useState({title:"",emoji:"⭐",lockedUntil:""});
  const[fmLog,setFmLog]=useState({text:"",bloodSugar:"",bloodPressure:""});
  // AI input - local ref to avoid focus loss
  const[aiQuery,setAiQuery]=useState("");
  const[aiResponse,setAiResponse]=useState("");
  const[aiLoading,setAiLoading]=useState(false);
  const[chatInput,setChatInput]=useState("");
  const[members,setMembers]=useState([]);
  const[chatMessages,setChatMessages]=useState({}); // key: chatId, value: messages[]
  const[medicines,setMedicines]=useState([]);
  const[memories,setMemories]=useState([]);
  const[healthLogs,setHealthLogs]=useState([]);
  const[prayerTimes,setPrayerTimes]=useState([]);
  const[qiblaDir,setQiblaDir]=useState(null);
  const[compassHeading,setCompassHeading]=useState(0);
  const[myMood,setMyMood]=useState("happy");
  const[water,setWater]=useState(0);
  const[tasbeeh,setTasbeeh]=useState(0);
  const[ramadan,setRamadan]=useState(()=>Array(30).fill("unfasted"));
  const[challenges,setChallenges]=useState([{id:1,t:"Hydration Hero",d:"Drink 8 glasses",e:"💧",pts:10,done:false},{id:2,t:"Prayer Champion",d:"All 5 prayers",e:"🕌",pts:20,done:false},{id:3,t:"Helper of Day",d:"Help someone",e:"🤝",pts:15,done:false},{id:4,t:"Gratitude",d:"Say thank you",e:"💝",pts:10,done:false},{id:5,t:"Learning Star",d:"20 mins study",e:"📚",pts:15,done:false}]);
  const[typingUser,setTypingUser]=useState(null);
  const[socketConnected,setSocketConnected]=useState(false);
  const[incomingCall,setIncomingCall]=useState(null);
  const[activeCall,setActiveCall]=useState(null);
  const[notifications,setNotifications]=useState([]);
  const[showNotif,setShowNotif]=useState(false);
  const socketRef=useRef(null);
  const msgsEndRef=useRef(null);
  const typingTimeout=useRef(null);
  const dataLoadedRef=useRef(false);

  useEffect(()=>{
    setMounted(true);
    const sess=LS.get("session",null);
    setDark(LS.get("dark",false));
    setWater(LS.get("water",0));
    setRamadan(LS.get("ramadan",Array(30).fill("unfasted")));
    const sc=LS.get("challenges",null);if(sc)setChallenges(sc);
    if(sess)setSession(sess);
    if(!LS.get("ob_done",false))setShowOnboarding(true);
  },[]);

  useEffect(()=>{if(mounted)LS.set("dark",dark);},[dark,mounted]);
  useEffect(()=>{if(mounted)LS.set("water",water);},[water,mounted]);
  useEffect(()=>{if(mounted)LS.set("ramadan",ramadan);},[ramadan,mounted]);
  useEffect(()=>{if(mounted)LS.set("challenges",challenges);},[challenges,mounted]);

  // Scroll chat to bottom
  useEffect(()=>{
    if(openChat)setTimeout(()=>msgsEndRef.current?.scrollIntoView({behavior:"smooth"}),100);
  },[chatMessages,openChat]);

  // Compass for Qibla
  useEffect(()=>{
    const handler=(e)=>{
      if(e.webkitCompassHeading!=null)setCompassHeading(e.webkitCompassHeading);
      else if(e.alpha!=null)setCompassHeading(360-e.alpha);
    };
    window.addEventListener("deviceorientationabsolute",handler,true);
    window.addEventListener("deviceorientation",handler,true);
    return()=>{window.removeEventListener("deviceorientationabsolute",handler,true);window.removeEventListener("deviceorientation",handler,true);};
  },[]);

  const loadPrayerTimes=useCallback(async(city)=>{
    try{
      const resp=await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city||"Hyderabad")}&country=IN&method=1`);
      const data=await resp.json();
      if(data.code===200){
        const t=data.data.timings;const now=new Date();const nowMins=now.getHours()*60+now.getMinutes();
        setPrayerTimes(PRAYER_NAMES.map((n,i)=>{const[h,m]=t[n].split(":").map(Number);const ampm=h>=12?"PM":"AM";const h12=h>12?h-12:h===0?12:h;return{name:n,icon:PRAYER_ICONS[i],time:`${h12}:${String(m).padStart(2,"0")} ${ampm}`,passed:nowMins>h*60+m};}));
      }
    }catch{const h=new Date().getHours();setPrayerTimes([{name:"Fajr",icon:"🌙",time:"05:12 AM",passed:h>=5},{name:"Dhuhr",icon:"☀️",time:"12:30 PM",passed:h>=12},{name:"Asr",icon:"🌤️",time:"03:45 PM",passed:h>=15},{name:"Maghrib",icon:"🌅",time:"06:28 PM",passed:h>=18},{name:"Isha",icon:"🌃",time:"07:55 PM",passed:h>=20}]);}
  },[]);

  const loadQibla=useCallback(()=>{
    if(!navigator.geolocation){setQiblaDir(290);return;}
    navigator.geolocation.getCurrentPosition(async(pos)=>{
      try{
        const r=await fetch(`https://api.aladhan.com/v1/qibla/${pos.coords.latitude}/${pos.coords.longitude}`);
        const d=await r.json();
        if(d.code===200)setQiblaDir(Math.round(d.data.direction));
        else setQiblaDir(290);
      }catch{setQiblaDir(290);}
    },()=>setQiblaDir(290));
  },[]);

  // Request iOS permission for compass
  const requestCompassPermission=async()=>{
    if(typeof DeviceOrientationEvent!=="undefined"&&typeof DeviceOrientationEvent.requestPermission==="function"){
      try{const p=await DeviceOrientationEvent.requestPermission();if(p==="granted")console.log("Compass granted");}
      catch(e){console.log("Compass permission denied");}
    }
    loadQibla();
  };

  // Add notification helper
  const addNotif=(text,icon="🔔")=>{
    setNotifications(p=>[{id:Date.now(),text,icon,time:new Date()},...p].slice(0,20));
  };

  const connectSocket=useCallback(async(token)=>{
    if(socketRef.current?.connected)return;
    try{
      const{io}=await import("socket.io-client");
      const socket=io(API,{auth:{token},transports:["websocket","polling"],reconnection:true,reconnectionDelay:3000});
      socket.on("connect",()=>setSocketConnected(true));
      socket.on("disconnect",()=>setSocketConnected(false));
      socket.on("newMessage",(msg)=>{
        setChatMessages(prev=>{
          const cid=msg.chatId||"group";
          const existing=prev[cid]||[];
          if(existing.find(m=>m._id===msg._id))return prev;
          return{...prev,[cid]:[...existing,msg]};
        });
        addNotif(`New message from ${msg.sender}`,msg.senderEmoji||"💬");
      });
      socket.on("userTyping",({name,typing})=>setTypingUser(typing?name:null));
      socket.on("memberOnline",({name})=>{setMembers(p=>p.map(m=>m.name===name?{...m,online:true}:m));addNotif(`${name} is online`,"🟢");});
      socket.on("memberOffline",({name})=>setMembers(p=>p.map(m=>m.name===name?{...m,online:false}:m)));
      socket.on("memberMoodUpdated",({name,mood})=>setMembers(p=>p.map(m=>m.name===name?{...m,mood}:m)));
      socket.on("sosReceived",({from})=>{addNotif(`🚨 SOS from ${from}!`,"🚨");alert(`🚨 SOS ALERT!\n\n${from} needs urgent help!\nCheck on them immediately!`);});
      socket.on("incomingCall",(data)=>{setIncomingCall(data);addNotif(`📞 Call from ${data.from}`,"📞");});
      socket.on("callEnded",()=>{setActiveCall(null);setIncomingCall(null);});
      socket.on("callRejected",()=>{setActiveCall(null);alert("Call declined.");});
      socketRef.current=socket;
    }catch(e){console.log("Socket:",e.message);}
  },[]);

  // Register device for push notifications
  const registerForPush = useCallback(async (token) => {
    try {
      if (typeof window === "undefined") return;
      // Wait for OneSignal to be ready
      const tryRegister = async () => {
        try {
          if (!window.OneSignal) return;
          // Request permission
          await window.OneSignal.Notifications.requestPermission();
          // Wait a moment for subscription to be ready
          await new Promise(r => setTimeout(r, 2000));
          // Get player ID
          const playerId = window.OneSignal.User?.PushSubscription?.id;
          if (playerId) {
            await apiFetch("POST", "/notifications/register", { playerId }, token);
            console.log("✅ Push registered! Player:", playerId);
          } else {
            console.log("⚠️ No player ID yet, retrying...");
            setTimeout(() => tryRegister(), 3000);
          }
        } catch (e) { console.log("Push reg error:", e.message); }
      };
      // Wait for page to fully load
      setTimeout(tryRegister, 3000);
    } catch (e) { console.log("OneSignal skipped:", e.message); }
  }, []);

  const loadData=useCallback(async(token,city)=>{
    if(dataLoadedRef.current)return;
    dataLoadedRef.current=true;
    try{
      const[fam,meds,mems,logs]=await Promise.allSettled([apiFetch("GET","/family/members",null,token),apiFetch("GET","/health/medicines",null,token),apiFetch("GET","/memories",null,token),apiFetch("GET","/health/logs",null,token)]);
      if(fam.status==="fulfilled")setMembers(fam.value.members||[]);
      if(meds.status==="fulfilled")setMedicines(meds.value||[]);
      if(mems.status==="fulfilled")setMemories(mems.value||[]);
      if(logs.status==="fulfilled")setHealthLogs(logs.value||[]);
      await loadPrayerTimes(city);loadQibla();
    }catch(e){console.error(e);}
  },[loadPrayerTimes,loadQibla]);

  // Load messages for a chat - persists across refreshes
  const loadMessages=useCallback(async(chatId,token)=>{
    try{
      const msgs=await apiFetch("GET",`/messages/${chatId}`,null,token);
      setChatMessages(prev=>({...prev,[chatId]:msgs||[]}));
    }catch{}
  },[]);

  useEffect(()=>{
    if(session?.token&&!dataLoadedRef.current){
      loadData(session.token,session.city);
      connectSocket(session.token);
      // Load group messages on startup
      loadMessages("group",session.token);
      registerForPush(session.token);
    }
    return()=>{if(socketRef.current){socketRef.current.disconnect();socketRef.current=null;}};
  },[session?.token]);

  if(!mounted)return null;

  const theme={"--bg":dark?"#0f0f17":"#F8FAFC","--card":dark?"#1a1a2e":"#FFFFFF","--card2":dark?"#16213e":"#F1F5F9","--border":dark?"#2a2a4a":"#E2E8F0","--text":dark?"#E2E8F0":"#0F172A","--text2":dark?"#94A3B8":"#475569","--muted":dark?"#64748B":"#94A3B8","--primary":"#6366F1","--primary2":"#8B5CF6","--accent":"#F59E0B","--teal":"#0D9488","--danger":"#EF4444","--input":dark?"#1e1e2e":"#F8FAFC"};

  const T=session?.token,me=session?.member,family=session?.family;
  const now=new Date(),h=now.getHours();
  const greeting=h<5?"Good Night":h<12?"Good Morning":h<17?"Good Afternoon":h<20?"Good Evening":"Good Night";
  const nextPrayer=prayerTimes.find(p=>!p.passed);
  const doneCount=challenges.filter(c=>c.done).length;
  const happiness=Math.round((doneCount/challenges.length)*100);
  const allMessages=Object.values(chatMessages).flat();
  const unreadMsgs=allMessages.filter(m=>m.sender!==me?.name&&!m.read).length;
  // Qibla arrow direction = qiblaDir - compassHeading
  const qiblaArrow=qiblaDir!=null?(qiblaDir-compassHeading+360)%360:0;

  const sendMsg=()=>{
    if(!chatInput.trim()||!openChat)return;
    const chatId=openChat.id==="group"?"group":[me.name,openChat.name].sort().join("-");
    const msgData={chatId,text:chatInput.trim(),senderEmoji:me.emoji,type:"text"};
    if(socketRef.current?.connected){
      socketRef.current.emit("sendMessage",msgData);
    }else{
      apiFetch("POST","/messages",msgData,T).then(msg=>{
        setChatMessages(prev=>({...prev,[chatId]:[...(prev[chatId]||[]),msg]}));
      }).catch(()=>{});
    }
    setChatInput("");setShowEmoji(false);
    socketRef.current?.emit("typing",{chatId,typing:false});
    clearTimeout(typingTimeout.current);
  };

  const handleTyping=(val)=>{
    setChatInput(val);
    if(!openChat)return;
    const chatId=openChat.id==="group"?"group":[me.name,openChat.name].sort().join("-");
    socketRef.current?.emit("typing",{chatId,typing:true});
    clearTimeout(typingTimeout.current);
    typingTimeout.current=setTimeout(()=>socketRef.current?.emit("typing",{chatId,typing:false}),2000);
  };

  const startCall=(member,type)=>{
    setActiveCall({to:member.name,toEmoji:member.emoji||"👤",type,status:"calling"});
    socketRef.current?.emit("callOffer",{to:member.name,fromEmoji:me.emoji,type});
  };

  const endCall=()=>{
    if(activeCall)socketRef.current?.emit("endCall",{to:activeCall.to});
    if(incomingCall)socketRef.current?.emit("callReject",{to:incomingCall.from});
    setActiveCall(null);setIncomingCall(null);
  };

  const askAI=async()=>{
    if(!aiQuery.trim())return;
    setAiLoading(true);
    try{
      const d=await apiFetch("POST","/health/ai-advice",{note:aiQuery,member:me.name},T);
      setAiResponse(d.advice);
    }catch{setAiResponse("AI unavailable. Make sure ANTHROPIC_API_KEY is set in Railway variables.");}
    finally{setAiLoading(false);}
  };

  const finishOnboarding=()=>{LS.set("ob_done",true);setShowOnboarding(false);};

  const EMOJIS=["❤️","😊","🥰","😂","🙏","🌙","✨","🎉","💪","👍","🤲","🌹","💝","🍕","🏠","⭐"];
  const NAV=[{id:"dashboard",icon:"🏠",l:"Home"},{id:"health",icon:"❤️",l:"Health"},{id:"faith",icon:"☪️",l:"Faith"},{id:"kids",icon:"⭐",l:"Kids"},{id:"chat",icon:"💬",l:"Chat",badge:unreadMsgs},{id:"memories",icon:"📸",l:"Memories"},{id:"emergency",icon:"🆘",l:"SOS"},{id:"settings",icon:"⚙️",l:"More"}];

  const S={
    root:{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden",...theme,background:"var(--bg)",color:"var(--text)",fontFamily:"'Inter',-apple-system,sans-serif"},
    topbar:{height:56,minHeight:56,display:"flex",alignItems:"center",gap:12,padding:"0 16px",background:"var(--card)",borderBottom:"1px solid var(--border)",flexShrink:0},
    scroll:{flex:1,overflowY:"auto",overflowX:"hidden",WebkitOverflowScrolling:"touch"},
    page:{padding:"12px 14px 80px"},
    bnav:{height:60,minHeight:60,display:"flex",background:"var(--card)",borderTop:"1px solid var(--border)",flexShrink:0},
    nb:(a)=>({flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,border:"none",background:"none",cursor:"pointer",fontSize:9,fontWeight:700,color:a?"var(--primary)":"var(--muted)",padding:"4px 2px",position:"relative",fontFamily:"inherit"}),
    card:{background:"var(--card)",borderRadius:14,padding:"14px",border:"1px solid var(--border)",marginBottom:10},
    cardHd:{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10},
    cardT:{fontSize:13,fontWeight:700,color:"var(--text)"},
    lnk:{fontSize:12,color:"var(--primary)",fontWeight:600,border:"none",background:"none",cursor:"pointer",fontFamily:"inherit"},
    inp:{width:"100%",padding:"11px 13px",borderRadius:10,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontFamily:"inherit",fontSize:14,outline:"none",marginBottom:10},
    btn:()=>({padding:"12px 20px",borderRadius:10,border:"none",background:"var(--primary)",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:14,cursor:"pointer",width:"100%"}),
    modal:{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:500,display:"flex",alignItems:"flex-end",justifyContent:"center"},
    modalBox:{background:"var(--card)",borderRadius:"18px 18px 0 0",padding:20,width:"100%",maxWidth:480,maxHeight:"85vh",overflowY:"auto"},
  };

  // INCOMING CALL SCREEN
  if(incomingCall)return(
    <div style={{...S.root,background:"linear-gradient(135deg,#1E3A5F,#0D9488)",alignItems:"center",justifyContent:"center",color:"white"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{fontSize:70,marginBottom:12}}>{incomingCall.fromEmoji||"👤"}</div>
      <div style={{fontSize:24,fontWeight:800,marginBottom:6}}>{incomingCall.from}</div>
      <div style={{fontSize:14,opacity:.7,marginBottom:40}}>Incoming {incomingCall.type||"voice"} call...</div>
      <div style={{display:"flex",gap:30}}>
        <button onClick={endCall} style={{width:64,height:64,borderRadius:"50%",background:"#EF4444",border:"none",fontSize:26,cursor:"pointer"}}>📵</button>
        <button onClick={()=>{setActiveCall(incomingCall);setIncomingCall(null);}} style={{width:64,height:64,borderRadius:"50%",background:"#22C55E",border:"none",fontSize:26,cursor:"pointer"}}>📞</button>
      </div>
    </div>
  );

  // ACTIVE CALL SCREEN
  if(activeCall)return(
    <div style={{...S.root,background:"linear-gradient(135deg,#1E3A5F,#0D9488)",alignItems:"center",justifyContent:"center",color:"white"}}>
      <style>{`*{box-sizing:border-box;margin:0;padding:0;}`}</style>
      <div style={{fontSize:70,marginBottom:12}}>{activeCall.toEmoji||"👤"}</div>
      <div style={{fontSize:24,fontWeight:800,marginBottom:6}}>{activeCall.to||activeCall.from}</div>
      <div style={{fontSize:14,opacity:.7,marginBottom:6}}>{activeCall.status==="calling"?"Calling...":"● Connected"}</div>
      <div style={{fontSize:12,opacity:.4,marginBottom:40}}>{activeCall.type==="video"?"📹 Video Call":"📞 Voice Call"}</div>
      <div style={{display:"flex",gap:20}}>
        <button style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"none",fontSize:22,cursor:"pointer"}}>🔇</button>
        <button onClick={endCall} style={{width:64,height:64,borderRadius:"50%",background:"#EF4444",border:"none",fontSize:26,cursor:"pointer"}}>📵</button>
        {activeCall.type==="video"&&<button style={{width:56,height:56,borderRadius:"50%",background:"rgba(255,255,255,.2)",border:"none",fontSize:22,cursor:"pointer"}}>📷</button>}
      </div>
    </div>
  );

  // ONBOARDING
  if(!session){
    return(<div style={{...S.root,background:"linear-gradient(135deg,#1E3A5F,#0D9488)",alignItems:"center",justifyContent:"center",padding:20,overflowY:"auto"}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;}input,select{-webkit-appearance:none;}`}</style>
      <div style={{fontSize:48,marginBottom:8}}>🏠</div>
      <div style={{fontSize:26,fontWeight:800,color:"white",marginBottom:4}}>FamilyVerse</div>
      <div style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:24}}>Your private family universe ✨</div>
      <div style={{background:"white",borderRadius:20,padding:22,width:"100%",maxWidth:380}}>
        {obMode==="create"&&obStep===1&&(<>
          <div style={{fontSize:16,fontWeight:800,color:"#0F172A",marginBottom:16}}>Create Your Family 👨‍👩‍👧‍👦</div>
          {[["Family Name *","familyName","e.g. Al-Rashid Family","text"],["Your Name *","userName","e.g. Ahmad","text"],["City","city","e.g. Hyderabad","text"],["Password *","password","Create a password","password"]].map(([lbl,key,ph,type])=>(
            <div key={key}><div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>{lbl}</div>
            <input style={{width:"100%",padding:"11px 13px",borderRadius:10,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#0F172A",fontFamily:"inherit",fontSize:14,outline:"none",marginBottom:10}} type={type} placeholder={ph} value={obData[key]} onChange={e=>setObData({...obData,[key]:e.target.value})}/></div>
          ))}
          <button style={{width:"100%",padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:10}} onClick={()=>{if(!obData.familyName.trim()||!obData.userName.trim()||!obData.password.trim())return alert("Fill all fields!");setObStep(2);}}>Next → Choose Role</button>
          <div style={{textAlign:"center",color:"#94A3B8",fontSize:12,margin:"10px 0"}}>— or —</div>
          <button style={{width:"100%",padding:11,borderRadius:12,border:"2px solid #6366F1",background:"transparent",color:"#6366F1",fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer"}} onClick={()=>setObMode("join")}>Join Existing Family 🔑</button>
        </>)}
        {obMode==="create"&&obStep===2&&(<>
          <div style={{fontSize:16,fontWeight:800,color:"#0F172A",marginBottom:14}}>Your Role</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:7,marginBottom:14}}>
            {ROLES.map(r=><button key={r} onClick={()=>setObData({...obData,role:r})} style={{padding:"10px 4px",borderRadius:10,border:`2px solid ${obData.role===r?"#6366F1":"#E2E8F0"}`,background:obData.role===r?"#EEF2FF":"white",cursor:"pointer",fontSize:11,fontWeight:700,color:obData.role===r?"#6366F1":"#475569",fontFamily:"inherit"}}>
              <div style={{fontSize:20,marginBottom:3}}>{ROLE_EMOJI[r]}</div>{r}
            </button>)}
          </div>
          <button style={{width:"100%",padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:8}} onClick={async()=>{setObLoading(true);try{const d=await apiFetch("POST","/family/create",{familyName:obData.familyName,userName:obData.userName,role:obData.role,password:obData.password,city:obData.city});const sess={token:d.token,member:d.member,family:d.family,city:d.family.city};LS.set("session",sess);setSession(sess);}catch(e){alert("Error: "+e.message);}finally{setObLoading(false);}}} disabled={obLoading}>{obLoading?"Creating...":"Create Family 🚀"}</button>
          <button onClick={()=>setObStep(1)} style={{width:"100%",background:"none",border:"none",color:"#94A3B8",fontSize:12,cursor:"pointer",padding:6,fontFamily:"inherit"}}>← Back</button>
        </>)}
        {obMode==="join"&&(<>
          <div style={{fontSize:16,fontWeight:800,color:"#0F172A",marginBottom:16}}>Join Your Family 🔑</div>
          <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>Invite Code *</div>
          <input style={{width:"100%",padding:"11px 13px",borderRadius:10,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#0F172A",fontFamily:"inherit",fontSize:16,outline:"none",marginBottom:10,textTransform:"uppercase",letterSpacing:2,fontWeight:700}} placeholder="FAM-XXXXX" value={obData.joinCode} onChange={e=>setObData({...obData,joinCode:e.target.value})}/>
          {[["Your Name *","userName","e.g. Fatima","text"],["Password *","password","Your password","password"]].map(([lbl,key,ph,type])=>(
            <div key={key}><div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:4}}>{lbl}</div>
            <input style={{width:"100%",padding:"11px 13px",borderRadius:10,border:"1.5px solid #E2E8F0",background:"#F8FAFC",color:"#0F172A",fontFamily:"inherit",fontSize:14,outline:"none",marginBottom:10}} type={type} placeholder={ph} value={obData[key]} onChange={e=>setObData({...obData,[key]:e.target.value})}/></div>
          ))}
          <div style={{fontSize:11,fontWeight:600,color:"#475569",marginBottom:8}}>Your Role</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
            {ROLES.slice(0,6).map(r=><button key={r} onClick={()=>setObData({...obData,role:r})} style={{padding:"8px 4px",borderRadius:10,border:`2px solid ${obData.role===r?"#6366F1":"#E2E8F0"}`,background:obData.role===r?"#EEF2FF":"white",cursor:"pointer",fontSize:11,fontWeight:700,color:obData.role===r?"#6366F1":"#475569",fontFamily:"inherit"}}>
              <div style={{fontSize:18,marginBottom:2}}>{ROLE_EMOJI[r]}</div>{r}
            </button>)}
          </div>
          <button style={{width:"100%",padding:12,borderRadius:12,border:"none",background:"linear-gradient(135deg,#6366F1,#8B5CF6)",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:15,cursor:"pointer",marginBottom:8}} onClick={async()=>{setObLoading(true);try{const d=await apiFetch("POST","/family/join",{inviteCode:obData.joinCode.trim().toUpperCase(),userName:obData.userName,role:obData.role,password:obData.password});const sess={token:d.token,member:d.member,family:d.family,city:d.family.city};LS.set("session",sess);setSession(sess);}catch(e){alert("❌ "+e.message);}finally{setObLoading(false);}}} disabled={obLoading}>{obLoading?"Joining...":"Join Family ✅"}</button>
          <button onClick={()=>setObMode("create")} style={{width:"100%",background:"none",border:"none",color:"#94A3B8",fontSize:12,cursor:"pointer",padding:6,fontFamily:"inherit"}}>← Create New Family</button>
        </>)}
      </div>
      <div style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:14}}>Crafted with ❤️ by Syed Muzamil</div>
    </div>);
  }

  // CHAT WINDOW - full screen
  if(page==="chat"&&openChat){
    const chatId=openChat.id==="group"?"group":[me.name,openChat.name].sort().join("-");
    const chatMsgs=chatMessages[chatId]||[];
    const chatMember=members.find(m=>m.name===openChat.name);
    return(<div style={S.root}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}::-webkit-scrollbar{display:none;}`}</style>
      {/* Chat header */}
      <div style={{height:60,minHeight:60,display:"flex",alignItems:"center",gap:10,padding:"0 14px",background:"var(--primary)",color:"white",flexShrink:0}}>
        <button onClick={()=>{setOpenChat(null);}} style={{background:"none",border:"none",color:"white",fontSize:22,cursor:"pointer",padding:"0 6px 0 0",lineHeight:1}}>←</button>
        <div style={{width:38,height:38,borderRadius:"50%",background:"rgba(255,255,255,.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{openChat.avatar||openChat.emoji||"👥"}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontWeight:700,fontSize:14}}>{openChat.name}</div>
          <div style={{fontSize:10,opacity:.7}}>{openChat.id==="group"?`${members.length} members · ${socketConnected?"🟢 Live":"⚫ Offline"}`:chatMember?.online?"🟢 Online":"⚫ Offline"}</div>
        </div>
        {/* Call buttons for private chats */}
        {openChat.id!=="group"&&<>
          <button onClick={()=>startCall(openChat,"audio")} style={{width:36,height:36,borderRadius:10,border:"none",background:"rgba(255,255,255,.15)",color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>📞</button>
          <button onClick={()=>startCall(openChat,"video")} style={{width:36,height:36,borderRadius:10,border:"none",background:"rgba(255,255,255,.15)",color:"white",fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>📹</button>
        </>}
      </div>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:12,display:"flex",flexDirection:"column",gap:8,background:"var(--bg)",WebkitOverflowScrolling:"touch"}}>
        {chatMsgs.length===0&&<div style={{textAlign:"center",padding:"40px 0",color:"var(--muted)"}}><div style={{fontSize:40,marginBottom:8}}>{openChat.avatar||"💬"}</div><div style={{fontSize:13}}>No messages yet. Say salaam! 👋</div></div>}
        {chatMsgs.map((msg,i)=>{
          const isSelf=msg.sender===me.name;
          return(<div key={msg._id||i} style={{display:"flex",flexDirection:"column",maxWidth:"78%",alignSelf:isSelf?"flex-end":"flex-start",alignItems:isSelf?"flex-end":"flex-start"}}>
            {!isSelf&&<div style={{fontSize:10,fontWeight:600,color:"var(--muted)",marginBottom:2,paddingLeft:4}}>{msg.senderEmoji} {msg.sender}</div>}
            <div style={{padding:"9px 13px",borderRadius:isSelf?"16px 16px 4px 16px":"16px 16px 16px 4px",background:isSelf?"var(--primary)":"var(--card)",color:isSelf?"white":"var(--text)",fontSize:14,lineHeight:1.5,wordBreak:"break-word",border:isSelf?"none":"1px solid var(--border)"}}>{msg.text}</div>
            <div style={{fontSize:9,color:"var(--muted)",marginTop:2,paddingLeft:4}}>{msg.timestamp?new Date(msg.timestamp).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}):"Now"}{isSelf&&" ✓✓"}</div>
          </div>);
        })}
        {typingUser&&typingUser!==me.name&&<div style={{fontSize:11,color:"var(--muted)",fontStyle:"italic",paddingLeft:4}}>{typingUser} is typing...</div>}
        <div ref={msgsEndRef}/>
      </div>
      {/* Emoji picker */}
      {showEmoji&&<div style={{padding:"8px 12px",background:"var(--card)",display:"flex",flexWrap:"wrap",gap:8,borderTop:"1px solid var(--border)",flexShrink:0}}>{EMOJIS.map(e=><span key={e} style={{fontSize:22,cursor:"pointer"}} onClick={()=>setChatInput(p=>p+e)}>{e}</span>)}</div>}
      {/* Input */}
      <div style={{flexShrink:0,background:"var(--card)",borderTop:"1px solid var(--border)",padding:"8px 12px",display:"flex",alignItems:"flex-end",gap:8}}>
        <button style={{background:"none",border:"none",fontSize:22,cursor:"pointer",lineHeight:1,color:"var(--muted)",flexShrink:0,padding:"8px 4px"}} onClick={()=>setShowEmoji(e=>!e)}>😊</button>
        <textarea value={chatInput} onChange={e=>handleTyping(e.target.value)} placeholder="Type a message..." rows={1}
          style={{flex:1,padding:"10px 14px",borderRadius:22,border:"1.5px solid var(--border)",background:"var(--input)",color:"var(--text)",fontFamily:"inherit",fontSize:14,outline:"none",resize:"none",minHeight:42,maxHeight:120,lineHeight:1.4,overflowY:"auto"}}
          onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}}}/>
        <button onClick={sendMsg} style={{width:42,height:42,borderRadius:"50%",background:"var(--primary)",border:"none",cursor:"pointer",fontSize:16,color:"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>➤</button>
      </div>
    </div>);
  }

  // MAIN APP PAGES
  const Dashboard=()=>(<div style={S.page}>
    <div style={{background:"linear-gradient(135deg,var(--primary),var(--primary2))",borderRadius:16,padding:"18px 18px 16px",color:"white",marginBottom:10,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:100,height:100,borderRadius:"50%",background:"rgba(255,255,255,.08)"}}/>
      <div style={{fontSize:11,opacity:.7,marginBottom:2}}>{greeting}, {me.name}! 👋</div>
      <div style={{fontSize:22,fontWeight:800,marginBottom:2}}>{family.familyName}</div>
      <div style={{fontSize:11,opacity:.5}}>{now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginTop:14}}>
        {[{n:members.length,l:"Members"},{n:doneCount,l:"Done"},{n:`${happiness}%`,l:"Happy"},{n:water,l:"Water"}].map(s=>(
          <div key={s.l} style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:"8px 4px",textAlign:"center"}}>
            <div style={{fontSize:18,fontWeight:800,color:"#FCD34D"}}>{s.n}</div>
            <div style={{fontSize:9,opacity:.6,textTransform:"uppercase"}}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      {[{l:"Health",s:`${medicines.filter(m=>!m.taken).length} due`,e:"❤️",g:"linear-gradient(135deg,#EF4444,#DC2626)",pg:"health"},{l:"Prayer",s:nextPrayer?`Next: ${nextPrayer.name}`:"All done ✓",e:"☪️",g:"linear-gradient(135deg,#0D9488,#0F766E)",pg:"faith"},{l:"Kids",s:"Learn & Play",e:"⭐",g:"linear-gradient(135deg,#F59E0B,#D97706)",pg:"kids"},{l:"Chat",s:unreadMsgs>0?`${unreadMsgs} new`:"Say salaam!",e:"💬",g:"linear-gradient(135deg,#6366F1,#7C3AED)",pg:"chat"}].map(a=>(
        <button key={a.l} onClick={()=>setPage(a.pg)} style={{background:a.g,borderRadius:14,padding:"14px 12px",border:"none",cursor:"pointer",textAlign:"left"}}>
          <div style={{fontSize:22,marginBottom:6}}>{a.e}</div>
          <div style={{fontSize:13,fontWeight:700,color:"white"}}>{a.l}</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.7)",marginTop:2}}>{a.s}</div>
        </button>
      ))}
    </div>
    <div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>👨‍👩‍👧‍👦 Family ({members.length})</div></div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:4}}>
        {members.map(m=>(<div key={m._id||m.id} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
          <div style={{width:48,height:48,borderRadius:"50%",background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,position:"relative",border:"2px solid var(--border)"}}>
            {m.emoji}{m.online&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#22C55E",border:"2px solid var(--card)"}}/>}
          </div>
          <div style={{fontSize:10,fontWeight:600,color:"var(--text)",maxWidth:50,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textAlign:"center"}}>{m.name}{m.name===me.name?" (me)":""}</div>
          <div style={{fontSize:11}}>{MOODS.find(md=>md.id===(m.mood||"happy"))?.e||"😊"}</div>
        </div>))}
      </div>
    </div>
    <div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>💝 Your Mood</div></div>
      <div style={{display:"flex",gap:6,overflowX:"auto",paddingBottom:4}}>
        {MOODS.map(m=>(<div key={m.id} onClick={()=>{setMyMood(m.id);socketRef.current?.emit("moodUpdate",{mood:m.id});apiFetch("POST","/family/mood",{mood:m.id},T).catch(()=>{});}}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"8px 12px",borderRadius:12,cursor:"pointer",flexShrink:0,background:myMood===m.id?m.c+"22":"var(--card2)",border:`2px solid ${myMood===m.id?m.c:"transparent"}`}}>
          <span style={{fontSize:22}}>{m.e}</span>
          <span style={{fontSize:10,fontWeight:700,color:myMood===m.id?m.c:"var(--muted)"}}>{m.l}</span>
        </div>))}
      </div>
    </div>
    {prayerTimes.length>0&&<div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>🕌 Prayer Times</div><button style={S.lnk} onClick={()=>setPage("faith")}>All</button></div>
      {prayerTimes.map(p=>(<div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:10,marginBottom:5,background:nextPrayer?.name===p.name?"var(--primary)":p.passed?"var(--card2)":"var(--card)",border:nextPrayer?.name===p.name?"none":"1px solid var(--border)"}}>
        <span style={{fontSize:14}}>{p.icon}</span>
        <span style={{flex:1,fontSize:12,fontWeight:600,color:nextPrayer?.name===p.name?"white":p.passed?"var(--muted)":"var(--text)"}}>{p.name}</span>
        <span style={{fontSize:11,fontWeight:700,color:nextPrayer?.name===p.name?"#FCD34D":p.passed?"var(--muted)":"var(--text2)"}}>{p.time}</span>
        {nextPrayer?.name===p.name&&<span style={{fontSize:9,background:"#F59E0B",color:"white",padding:"2px 6px",borderRadius:6,fontWeight:800}}>NEXT</span>}
      </div>))}
    </div>}
    <div style={{...S.card,background:"linear-gradient(135deg,var(--primary),var(--primary2))",color:"white",border:"none",textAlign:"center"}}>
      <div style={{fontSize:11,opacity:.7,textTransform:"uppercase",letterSpacing:1}}>Family Happiness</div>
      <div style={{fontSize:40,fontWeight:800}}>{happiness}%</div>
      <div style={{fontSize:16,marginTop:2}}>{"⭐".repeat(Math.max(1,Math.ceil(happiness/20)))}</div>
    </div>
    {challenges.map(c=>(<div key={c.id} onClick={()=>setChallenges(p=>p.map(x=>x.id===c.id?{...x,done:!x.done}:x))}
      style={{...S.card,display:"flex",alignItems:"center",gap:10,cursor:"pointer",background:c.done?"#F0FDF4":"var(--card)",borderColor:c.done?"#86EFAC":"var(--border)",marginBottom:7}}>
      <div style={{fontSize:24,flexShrink:0}}>{c.done?"✅":c.e}</div>
      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{c.t}</div><div style={{fontSize:11,color:"var(--muted)",marginTop:1}}>{c.d}</div></div>
      <div style={{fontSize:12,fontWeight:800,color:"var(--primary)",flexShrink:0}}>+{c.pts}pts</div>
    </div>))}
    <div style={{textAlign:"center",padding:"14px 0",fontSize:11,color:"var(--muted)"}}>Crafted with ❤️ by <em>Syed Muzamil</em></div>
  </div>);

  const Health=()=>(<div style={S.page}>
    {/* AI Assistant - properly controlled input */}
    <div style={{background:"linear-gradient(135deg,var(--primary),var(--primary2))",borderRadius:16,padding:16,color:"white",marginBottom:10}}>
      <div style={{fontSize:15,fontWeight:800,marginBottom:4}}>🤖 AI Health Assistant</div>
      <div style={{fontSize:12,opacity:.8,marginBottom:10}}>Ask about symptoms, medications, or health readings.</div>
      <div style={{display:"flex",gap:8}}>
        <input
          value={aiQuery}
          onChange={e=>setAiQuery(e.target.value)}
          onKeyDown={e=>{if(e.key==="Enter")askAI();}}
          placeholder="e.g. blood sugar 145, what to do?"
          style={{flex:1,padding:"11px 13px",borderRadius:10,border:"none",background:"rgba(255,255,255,.15)",color:"white",fontFamily:"inherit",fontSize:13,outline:"none"}}
        />
        <button onClick={askAI} disabled={aiLoading} style={{padding:"11px 16px",borderRadius:10,border:"none",background:"#F59E0B",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:13,cursor:"pointer",flexShrink:0}}>{aiLoading?"...":"Ask 🤖"}</button>
      </div>
      {aiResponse&&<div style={{background:"rgba(255,255,255,.12)",borderRadius:10,padding:12,marginTop:10,fontSize:13,lineHeight:1.7}}>🤖 {aiResponse}</div>}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      {[{l:"Blood Pressure",v:healthLogs.find(l=>l.bloodPressure)?.bloodPressure||"—",u:"mmHg",e:"🫀",g:"linear-gradient(135deg,#EF4444,#DC2626)",p:65},{l:"Blood Sugar",v:healthLogs.find(l=>l.bloodSugar)?.bloodSugar||"—",u:"mg/dL",e:"🩸",g:"linear-gradient(135deg,#F59E0B,#D97706)",p:55},{l:"Water Today",v:`${water}/8`,u:"Glasses",e:"💧",g:"linear-gradient(135deg,#0EA5E9,#0284C7)",p:water*12.5},{l:"Medicines",v:`${medicines.filter(m=>m.taken).length}/${medicines.length}`,u:"Taken",e:"💊",g:"linear-gradient(135deg,#22C55E,#16A34A)",p:medicines.length?(medicines.filter(m=>m.taken).length/medicines.length)*100:0}].map(hc=>(
      <div key={hc.l} style={{background:hc.g,borderRadius:14,padding:14,color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{fontSize:9,opacity:.7,textTransform:"uppercase"}}>{hc.l}</div>
        <div style={{fontSize:22,fontWeight:800,margin:"3px 0 1px"}}>{hc.v}</div>
        <div style={{fontSize:10,opacity:.6}}>{hc.u}</div>
        <div style={{position:"absolute",right:10,top:10,fontSize:20,opacity:.2}}>{hc.e}</div>
        <div style={{background:"rgba(0,0,0,.15)",borderRadius:10,height:4,marginTop:8,overflow:"hidden"}}><div style={{height:"100%",borderRadius:10,background:"rgba(255,255,255,.6)",width:`${Math.min(100,hc.p||0)}%`}}/></div>
      </div>))}
    </div>
    <div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>💧 Water Tracker</div><span style={{fontSize:11,color:"#0EA5E9",fontWeight:700}}>{water}/8</span></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:5,marginBottom:6}}>
        {Array.from({length:8}).map((_,i)=><div key={i} onClick={()=>setWater(i<water?i:i+1)} style={{aspectRatio:1,borderRadius:8,border:`2px solid ${i<water?"#0EA5E9":"var(--border)"}`,background:i<water?"#E0F2FE":"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,cursor:"pointer"}}>{i<water?"💧":"○"}</div>)}
      </div>
      <div style={{textAlign:"center",fontSize:11,color:"var(--muted)"}}>{water>=8?"🎉 Goal achieved!!":`${8-water} more to go`}</div>
    </div>
    <div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>💊 Medicines</div><button style={S.lnk} onClick={()=>setShowAddMed(true)}>+ Add</button></div>
      {medicines.length===0?<div style={{textAlign:"center",padding:"12px 0",color:"var(--muted)",fontSize:12}}>No medicines<br/><button style={{...S.btn(),width:"auto",padding:"7px 16px",fontSize:12,marginTop:8}} onClick={()=>setShowAddMed(true)}>+ Add</button></div>:
      medicines.map(m=>(<div key={m._id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
        <div style={{width:34,height:34,borderRadius:10,background:"#6366F122",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>💊</div>
        <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{m.name}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{m.member} · {m.time}</div></div>
        <button onClick={()=>!m.taken&&apiFetch("PATCH",`/health/medicines/${m._id}/taken`,{},T).then(()=>setMedicines(p=>p.map(x=>x._id===m._id?{...x,taken:true}:x))).catch(()=>{})}
          style={{fontSize:10,fontWeight:700,padding:"5px 10px",borderRadius:20,border:"none",cursor:"pointer",background:m.taken?"#DCFCE7":"#FEF3C7",color:m.taken?"#16A34A":"#92400E",flexShrink:0,fontFamily:"inherit"}}>{m.taken?"✓ Taken":"Mark Taken"}</button>
      </div>))}
    </div>
    <div style={S.card}>
      <div style={S.cardHd}><div style={S.cardT}>📋 Health Log</div><button style={S.lnk} onClick={()=>setShowAddLog(true)}>+ Add</button></div>
      {healthLogs.length===0?<div style={{textAlign:"center",padding:"10px 0",color:"var(--muted)",fontSize:12}}>No logs yet<br/><button style={{...S.btn(),width:"auto",padding:"7px 16px",fontSize:12,marginTop:8}} onClick={()=>setShowAddLog(true)}>+ Add</button></div>:
      healthLogs.slice(0,5).map(l=>(<div key={l._id} style={{padding:"8px 0",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:12,fontWeight:600,color:"var(--text)"}}>{l.text}</div>
        {(l.bloodSugar||l.bloodPressure)&&<div style={{fontSize:10,color:"var(--teal)",marginTop:2}}>{l.bloodSugar&&`Sugar: ${l.bloodSugar} `}{l.bloodPressure&&`BP: ${l.bloodPressure}`}</div>}
        <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{l.member} · {new Date(l.date).toLocaleDateString()}</div>
        {l.aiAnalysis&&<div style={{marginTop:5,background:"#EDE9FE",borderRadius:8,padding:"6px 10px",fontSize:11,color:"#5B21B6",lineHeight:1.6}}>🤖 {l.aiAnalysis}</div>}
      </div>))}
    </div>
    {showAddMed&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowAddMed(false)}>
      <div style={S.modalBox}>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:14}}>💊 Add Medicine</div>
        {[["Name *","name","e.g. Vitamin D","text"],["Time","time","e.g. 08:00 AM","text"],["Member","member",me.name,"text"]].map(([l,k,p,t])=>(<div key={k}><div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>{l}</div><input style={S.inp} type={t} placeholder={p} value={fmMed[k]} onChange={e=>setFmMed({...fmMed,[k]:e.target.value})}/></div>))}
        <button style={S.btn()} onClick={()=>{if(!fmMed.name.trim())return alert("Enter name!");apiFetch("POST","/health/medicines",{...fmMed,member:fmMed.member||me.name},T).then(m=>{setMedicines(p=>[...p,m]);setFmMed({name:"",time:"",member:""});setShowAddMed(false);}).catch(e=>alert(e.message));}}>Save ✅</button>
      </div>
    </div>}
    {showAddLog&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowAddLog(false)}>
      <div style={S.modalBox}>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:14}}>📋 Health Log</div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Note *</div>
        <input style={S.inp} placeholder="e.g. Feeling dizzy" value={fmLog.text} onChange={e=>setFmLog({...fmLog,text:e.target.value})}/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Blood Sugar</div><input style={S.inp} type="number" placeholder="mg/dL" value={fmLog.bloodSugar} onChange={e=>setFmLog({...fmLog,bloodSugar:e.target.value})}/></div>
          <div><div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Blood Pressure</div><input style={S.inp} placeholder="120/80" value={fmLog.bloodPressure} onChange={e=>setFmLog({...fmLog,bloodPressure:e.target.value})}/></div>
        </div>
        <button style={S.btn()} onClick={()=>{if(!fmLog.text.trim())return alert("Enter a note!");apiFetch("POST","/health/logs",{...fmLog,member:me.name},T).then(l=>{setHealthLogs(p=>[l,...p]);setFmLog({text:"",bloodSugar:"",bloodPressure:""});setShowAddLog(false);}).catch(e=>alert(e.message));}}>Save & AI Analysis 🤖</button>
      </div>
    </div>}
  </div>);

// ── COMPLETE QURAN COMPONENT ─────────────────────────────────────────────────
// Replace the entire Faith() component in FamilyVerse.jsx with this

const Faith=()=>{
  const[tb,setTb]=useState(tasbeeh);
  const[dailyAyah,setDailyAyah]=useState(null);
  const[view,setView]=useState("main"); // main | surahList | reading
  const[selectedSurah,setSelectedSurah]=useState(null);
  const[verses,setVerses]=useState([]);
  const[loading,setLoading]=useState(false);
  const[loadError,setLoadError]=useState(false);
  const[audioPlaying,setAudioPlaying]=useState(null); // "arabic" | "urdu" | null
  const[currentAudio,setCurrentAudio]=useState(null);
  const[searchQ,setSearchQ]=useState("");

  // ALL 114 SURAHS — Correct Arabic names and meanings
  const ALL_SURAHS=[
    {n:1,name:"Al-Fatihah",ar:"الفاتحة",eng:"The Opening",v:7,type:"Meccan"},
    {n:2,name:"Al-Baqarah",ar:"البقرة",eng:"The Cow",v:286,type:"Medinan"},
    {n:3,name:"Ali 'Imran",ar:"آل عمران",eng:"Family of Imran",v:200,type:"Medinan"},
    {n:4,name:"An-Nisa",ar:"النساء",eng:"The Women",v:176,type:"Medinan"},
    {n:5,name:"Al-Ma'idah",ar:"المائدة",eng:"The Table Spread",v:120,type:"Medinan"},
    {n:6,name:"Al-An'am",ar:"الأنعام",eng:"The Cattle",v:165,type:"Meccan"},
    {n:7,name:"Al-A'raf",ar:"الأعراف",eng:"The Heights",v:206,type:"Meccan"},
    {n:8,name:"Al-Anfal",ar:"الأنفال",eng:"The Spoils of War",v:75,type:"Medinan"},
    {n:9,name:"At-Tawbah",ar:"التوبة",eng:"The Repentance",v:129,type:"Medinan"},
    {n:10,name:"Yunus",ar:"يونس",eng:"Jonah",v:109,type:"Meccan"},
    {n:11,name:"Hud",ar:"هود",eng:"Hud",v:123,type:"Meccan"},
    {n:12,name:"Yusuf",ar:"يوسف",eng:"Joseph",v:111,type:"Meccan"},
    {n:13,name:"Ar-Ra'd",ar:"الرعد",eng:"The Thunder",v:43,type:"Medinan"},
    {n:14,name:"Ibrahim",ar:"إبراهيم",eng:"Abraham",v:52,type:"Meccan"},
    {n:15,name:"Al-Hijr",ar:"الحجر",eng:"The Rocky Tract",v:99,type:"Meccan"},
    {n:16,name:"An-Nahl",ar:"النحل",eng:"The Bee",v:128,type:"Meccan"},
    {n:17,name:"Al-Isra",ar:"الإسراء",eng:"The Night Journey",v:111,type:"Meccan"},
    {n:18,name:"Al-Kahf",ar:"الكهف",eng:"The Cave",v:110,type:"Meccan"},
    {n:19,name:"Maryam",ar:"مريم",eng:"Mary",v:98,type:"Meccan"},
    {n:20,name:"Ta-Ha",ar:"طه",eng:"Ta-Ha",v:135,type:"Meccan"},
    {n:21,name:"Al-Anbiya",ar:"الأنبياء",eng:"The Prophets",v:112,type:"Meccan"},
    {n:22,name:"Al-Hajj",ar:"الحج",eng:"The Pilgrimage",v:78,type:"Medinan"},
    {n:23,name:"Al-Mu'minun",ar:"المؤمنون",eng:"The Believers",v:118,type:"Meccan"},
    {n:24,name:"An-Nur",ar:"النور",eng:"The Light",v:64,type:"Medinan"},
    {n:25,name:"Al-Furqan",ar:"الفرقان",eng:"The Criterion",v:77,type:"Meccan"},
    {n:26,name:"Ash-Shu'ara",ar:"الشعراء",eng:"The Poets",v:227,type:"Meccan"},
    {n:27,name:"An-Naml",ar:"النمل",eng:"The Ant",v:93,type:"Meccan"},
    {n:28,name:"Al-Qasas",ar:"القصص",eng:"The Stories",v:88,type:"Meccan"},
    {n:29,name:"Al-'Ankabut",ar:"العنكبوت",eng:"The Spider",v:69,type:"Meccan"},
    {n:30,name:"Ar-Rum",ar:"الروم",eng:"The Romans",v:60,type:"Meccan"},
    {n:31,name:"Luqman",ar:"لقمان",eng:"Luqman",v:34,type:"Meccan"},
    {n:32,name:"As-Sajdah",ar:"السجدة",eng:"The Prostration",v:30,type:"Meccan"},
    {n:33,name:"Al-Ahzab",ar:"الأحزاب",eng:"The Combined Forces",v:73,type:"Medinan"},
    {n:34,name:"Saba",ar:"سبأ",eng:"Sheba",v:54,type:"Meccan"},
    {n:35,name:"Fatir",ar:"فاطر",eng:"Originator",v:45,type:"Meccan"},
    {n:36,name:"Ya-Sin",ar:"يس",eng:"Ya Sin",v:83,type:"Meccan"},
    {n:37,name:"As-Saffat",ar:"الصافات",eng:"Those Ranged in Ranks",v:182,type:"Meccan"},
    {n:38,name:"Sad",ar:"ص",eng:"The Letter Sad",v:88,type:"Meccan"},
    {n:39,name:"Az-Zumar",ar:"الزمر",eng:"The Groups",v:75,type:"Meccan"},
    {n:40,name:"Ghafir",ar:"غافر",eng:"The Forgiver",v:85,type:"Meccan"},
    {n:41,name:"Fussilat",ar:"فصلت",eng:"Explained in Detail",v:54,type:"Meccan"},
    {n:42,name:"Ash-Shura",ar:"الشورى",eng:"The Consultation",v:53,type:"Meccan"},
    {n:43,name:"Az-Zukhruf",ar:"الزخرف",eng:"The Ornaments of Gold",v:89,type:"Meccan"},
    {n:44,name:"Ad-Dukhan",ar:"الدخان",eng:"The Smoke",v:59,type:"Meccan"},
    {n:45,name:"Al-Jathiyah",ar:"الجاثية",eng:"The Crouching",v:37,type:"Meccan"},
    {n:46,name:"Al-Ahqaf",ar:"الأحقاف",eng:"The Wind-Curved Sandhills",v:35,type:"Meccan"},
    {n:47,name:"Muhammad",ar:"محمد",eng:"Muhammad",v:38,type:"Medinan"},
    {n:48,name:"Al-Fath",ar:"الفتح",eng:"The Victory",v:29,type:"Medinan"},
    {n:49,name:"Al-Hujurat",ar:"الحجرات",eng:"The Rooms",v:18,type:"Medinan"},
    {n:50,name:"Qaf",ar:"ق",eng:"The Letter Qaf",v:45,type:"Meccan"},
    {n:51,name:"Adh-Dhariyat",ar:"الذاريات",eng:"The Winnowing Winds",v:60,type:"Meccan"},
    {n:52,name:"At-Tur",ar:"الطور",eng:"The Mount",v:49,type:"Meccan"},
    {n:53,name:"An-Najm",ar:"النجم",eng:"The Star",v:62,type:"Meccan"},
    {n:54,name:"Al-Qamar",ar:"القمر",eng:"The Moon",v:55,type:"Meccan"},
    {n:55,name:"Ar-Rahman",ar:"الرحمن",eng:"The Most Gracious",v:78,type:"Medinan"},
    {n:56,name:"Al-Waqi'ah",ar:"الواقعة",eng:"The Inevitable",v:96,type:"Meccan"},
    {n:57,name:"Al-Hadid",ar:"الحديد",eng:"The Iron",v:29,type:"Medinan"},
    {n:58,name:"Al-Mujadila",ar:"المجادلة",eng:"The Pleading Woman",v:22,type:"Medinan"},
    {n:59,name:"Al-Hashr",ar:"الحشر",eng:"The Exile",v:24,type:"Medinan"},
    {n:60,name:"Al-Mumtahanah",ar:"الممتحنة",eng:"She That is to be Examined",v:13,type:"Medinan"},
    {n:61,name:"As-Saf",ar:"الصف",eng:"The Ranks",v:14,type:"Medinan"},
    {n:62,name:"Al-Jumu'ah",ar:"الجمعة",eng:"The Congregation",v:11,type:"Medinan"},
    {n:63,name:"Al-Munafiqun",ar:"المنافقون",eng:"The Hypocrites",v:11,type:"Medinan"},
    {n:64,name:"At-Taghabun",ar:"التغابن",eng:"The Mutual Disillusion",v:18,type:"Medinan"},
    {n:65,name:"At-Talaq",ar:"الطلاق",eng:"The Divorce",v:12,type:"Medinan"},
    {n:66,name:"At-Tahrim",ar:"التحريم",eng:"The Prohibition",v:12,type:"Medinan"},
    {n:67,name:"Al-Mulk",ar:"الملك",eng:"The Sovereignty",v:30,type:"Meccan"},
    {n:68,name:"Al-Qalam",ar:"القلم",eng:"The Pen",v:52,type:"Meccan"},
    {n:69,name:"Al-Haqqah",ar:"الحاقة",eng:"The Reality",v:52,type:"Meccan"},
    {n:70,name:"Al-Ma'arij",ar:"المعارج",eng:"The Ascending Stairways",v:44,type:"Meccan"},
    {n:71,name:"Nuh",ar:"نوح",eng:"Noah",v:28,type:"Meccan"},
    {n:72,name:"Al-Jinn",ar:"الجن",eng:"The Jinn",v:28,type:"Meccan"},
    {n:73,name:"Al-Muzzammil",ar:"المزمل",eng:"The Enshrouded One",v:20,type:"Meccan"},
    {n:74,name:"Al-Muddaththir",ar:"المدثر",eng:"The Cloaked One",v:56,type:"Meccan"},
    {n:75,name:"Al-Qiyamah",ar:"القيامة",eng:"The Resurrection",v:40,type:"Meccan"},
    {n:76,name:"Al-Insan",ar:"الإنسان",eng:"The Man",v:31,type:"Medinan"},
    {n:77,name:"Al-Mursalat",ar:"المرسلات",eng:"The Emissaries",v:50,type:"Meccan"},
    {n:78,name:"An-Naba",ar:"النبأ",eng:"The Tidings",v:40,type:"Meccan"},
    {n:79,name:"An-Nazi'at",ar:"النازعات",eng:"Those Who Drag Forth",v:46,type:"Meccan"},
    {n:80,name:"Abasa",ar:"عبس",eng:"He Frowned",v:42,type:"Meccan"},
    {n:81,name:"At-Takwir",ar:"التكوير",eng:"The Overthrowing",v:29,type:"Meccan"},
    {n:82,name:"Al-Infitar",ar:"الانفطار",eng:"The Cleaving",v:19,type:"Meccan"},
    {n:83,name:"Al-Mutaffifin",ar:"المطففين",eng:"The Defrauding",v:36,type:"Meccan"},
    {n:84,name:"Al-Inshiqaq",ar:"الانشقاق",eng:"The Splitting Open",v:25,type:"Meccan"},
    {n:85,name:"Al-Buruj",ar:"البروج",eng:"The Mansions of the Stars",v:22,type:"Meccan"},
    {n:86,name:"At-Tariq",ar:"الطارق",eng:"The Morning Star",v:17,type:"Meccan"},
    {n:87,name:"Al-A'la",ar:"الأعلى",eng:"The Most High",v:19,type:"Meccan"},
    {n:88,name:"Al-Ghashiyah",ar:"الغاشية",eng:"The Overwhelming",v:26,type:"Meccan"},
    {n:89,name:"Al-Fajr",ar:"الفجر",eng:"The Dawn",v:30,type:"Meccan"},
    {n:90,name:"Al-Balad",ar:"البلد",eng:"The City",v:20,type:"Meccan"},
    {n:91,name:"Ash-Shams",ar:"الشمس",eng:"The Sun",v:15,type:"Meccan"},
    {n:92,name:"Al-Layl",ar:"الليل",eng:"The Night",v:21,type:"Meccan"},
    {n:93,name:"Ad-Duha",ar:"الضحى",eng:"The Morning Hours",v:11,type:"Meccan"},
    {n:94,name:"Ash-Sharh",ar:"الشرح",eng:"The Relief",v:8,type:"Meccan"},
    {n:95,name:"At-Tin",ar:"التين",eng:"The Fig",v:8,type:"Meccan"},
    {n:96,name:"Al-'Alaq",ar:"العلق",eng:"The Clot",v:19,type:"Meccan"},
    {n:97,name:"Al-Qadr",ar:"القدر",eng:"The Power",v:5,type:"Meccan"},
    {n:98,name:"Al-Bayyinah",ar:"البينة",eng:"The Clear Proof",v:8,type:"Medinan"},
    {n:99,name:"Az-Zalzalah",ar:"الزلزلة",eng:"The Earthquake",v:8,type:"Medinan"},
    {n:100,name:"Al-'Adiyat",ar:"العاديات",eng:"The Courser",v:11,type:"Meccan"},
    {n:101,name:"Al-Qari'ah",ar:"القارعة",eng:"The Calamity",v:11,type:"Meccan"},
    {n:102,name:"At-Takathur",ar:"التكاثر",eng:"The Rivalry in World Increase",v:8,type:"Meccan"},
    {n:103,name:"Al-'Asr",ar:"العصر",eng:"The Declining Day",v:3,type:"Meccan"},
    {n:104,name:"Al-Humazah",ar:"الهمزة",eng:"The Traducer",v:9,type:"Meccan"},
    {n:105,name:"Al-Fil",ar:"الفيل",eng:"The Elephant",v:5,type:"Meccan"},
    {n:106,name:"Quraysh",ar:"قريش",eng:"Quraysh",v:4,type:"Meccan"},
    {n:107,name:"Al-Ma'un",ar:"الماعون",eng:"The Small Kindnesses",v:7,type:"Meccan"},
    {n:108,name:"Al-Kawthar",ar:"الكوثر",eng:"The Abundance",v:3,type:"Meccan"},
    {n:109,name:"Al-Kafirun",ar:"الكافرون",eng:"The Disbelievers",v:6,type:"Meccan"},
    {n:110,name:"An-Nasr",ar:"النصر",eng:"The Divine Support",v:3,type:"Medinan"},
    {n:111,name:"Al-Masad",ar:"المسد",eng:"The Palm Fibre",v:5,type:"Meccan"},
    {n:112,name:"Al-Ikhlas",ar:"الإخلاص",eng:"Sincerity",v:4,type:"Meccan"},
    {n:113,name:"Al-Falaq",ar:"الفلق",eng:"The Daybreak",v:5,type:"Meccan"},
    {n:114,name:"An-Nas",ar:"الناس",eng:"Mankind",v:6,type:"Meccan"},
  ];

  const filtered=searchQ.trim()
    ? ALL_SURAHS.filter(s=>
        s.name.toLowerCase().includes(searchQ.toLowerCase())||
        s.ar.includes(searchQ)||
        s.eng.toLowerCase().includes(searchQ.toLowerCase())||
        String(s.n).includes(searchQ)
      )
    : ALL_SURAHS;

  useEffect(()=>{
    fetch(`${API}/api/quran/today`)
      .then(r=>r.json()).then(setDailyAyah)
      .catch(()=>setDailyAyah({arabic:"إِنَّ مَعَ الْعُسْرِ يُسْرًا",urdu:"بیشک مشکل کے ساتھ آسانی ہے",english:"Indeed, with hardship comes ease.",ref:"Surah Ash-Sharh 94:6"}));
  },[]);

  const stopAudio=()=>{
    if(currentAudio){currentAudio.pause();currentAudio.src="";}
    setCurrentAudio(null);setAudioPlaying(null);
  };

  const playAudio=(url,type)=>{
    stopAudio();
    if(audioPlaying===type){return;}
    const a=new Audio(url);
    a.play().catch(()=>{alert("Audio could not play. Check your internet connection.");});
    a.onended=()=>{setAudioPlaying(null);setCurrentAudio(null);};
    a.onerror=()=>{setAudioPlaying(null);setCurrentAudio(null);};
    setCurrentAudio(a);setAudioPlaying(type);
  };

  const openSurah=async(s)=>{
    setSelectedSurah(s);setView("reading");
    setVerses([]);setLoading(true);setLoadError(false);stopAudio();
    try{
      const r=await fetch(`https://api.alquran.cloud/v1/surah/${s.n}/editions/quran-uthmani,en.sahih,ur.jalandhry`);
      const d=await r.json();
      if(d.code===200&&Array.isArray(d.data)&&d.data.length===3){
        const ar=d.data[0].ayahs,en=d.data[1].ayahs,ur=d.data[2].ayahs;
        setVerses(ar.map((a,i)=>({n:a.numberInSurah,arabic:a.text,english:en[i]?.text||"",urdu:ur[i]?.text||""})));
      }else{setLoadError(true);}
    }catch{setLoadError(true);}
    finally{setLoading(false);}
  };

  // ── READING VIEW ────────────────────────────────────────────────────────────
  if(view==="reading"&&selectedSurah){
    const arabicAudioUrl=`https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/${selectedSurah.n}.mp3`;
    const urduAudioUrl=`https://cdn.islamic.network/quran/audio-surah/128/ur.khan/${selectedSurah.n}.mp3`;
    return(
      <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 116px)",overflow:"hidden"}}>
        <style>{`@keyframes spin{to{transform:rotate(360deg);}}`}</style>
        {/* Surah Header */}
        <div style={{background:"linear-gradient(135deg,#1E3A5F,#0D9488)",padding:"12px 14px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <button onClick={()=>{setView("surahList");stopAudio();}} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"7px 14px",color:"white",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>← Back</button>
            <div style={{flex:1}}>
              <div style={{fontSize:16,fontWeight:800,color:"white"}}>{selectedSurah.name}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.6)"}}>{selectedSurah.eng} · {selectedSurah.v} verses · {selectedSurah.type}</div>
            </div>
            <div style={{fontFamily:"'Amiri',serif",fontSize:24,color:"white",direction:"rtl"}}>{selectedSurah.ar}</div>
          </div>
          {/* Audio Controls */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <button onClick={()=>audioPlaying==="arabic"?stopAudio():playAudio(arabicAudioUrl,"arabic")}
              style={{padding:"8px",borderRadius:10,border:"none",background:audioPlaying==="arabic"?"#EF4444":"rgba(255,255,255,.15)",color:"white",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {audioPlaying==="arabic"?"⏸ Stop Arabic":"▶ Arabic Recitation"}
            </button>
            <button onClick={()=>audioPlaying==="urdu"?stopAudio():playAudio(urduAudioUrl,"urdu")}
              style={{padding:"8px",borderRadius:10,border:"none",background:audioPlaying==="urdu"?"#EF4444":"rgba(255,255,255,.15)",color:"white",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
              {audioPlaying==="urdu"?"⏸ Stop Urdu":"🎧 Urdu Translation"}
            </button>
          </div>
        </div>

        {/* Verses */}
        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)"}}>
          {loading&&<div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid var(--border)",borderTopColor:"var(--primary)",animation:"spin .7s linear infinite",margin:"0 auto 12px"}}/>
            <div style={{fontSize:13,color:"var(--muted)"}}>Loading {selectedSurah.name}...</div>
          </div>}

          {loadError&&<div style={{textAlign:"center",padding:"50px 20px"}}>
            <div style={{fontSize:40,marginBottom:10}}>📡</div>
            <div style={{fontSize:13,color:"var(--muted)",marginBottom:14}}>Could not load. Please check your internet.</div>
            <button onClick={()=>openSurah(selectedSurah)} style={{padding:"10px 24px",borderRadius:10,border:"none",background:"var(--primary)",color:"white",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🔄 Try Again</button>
          </div>}

          {verses.length>0&&<>
            {/* Bismillah — except surah 9 */}
            {selectedSurah.n!==9&&<div style={{textAlign:"center",padding:"20px 16px 10px",borderBottom:"1px solid var(--border)"}}>
              <div style={{fontFamily:"'Amiri',serif",fontSize:26,color:"var(--primary)",lineHeight:2}}>بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>In the name of Allah, the Most Gracious, the Most Merciful</div>
            </div>}

            {verses.map((v)=>(
              <div key={v.n} style={{padding:"16px 14px",borderBottom:"1px solid var(--border)",background:v.n%2===0?"var(--card)":"var(--bg)"}}>
                {/* Verse number */}
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                  <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,var(--primary),var(--primary2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"white",flexShrink:0}}>{v.n}</div>
                  <div style={{flex:1,height:1,background:"var(--border)"}}/>
                  <div style={{fontSize:10,color:"var(--muted)",fontWeight:600}}>{selectedSurah.name} {v.n}:{selectedSurah.n}</div>
                </div>
                {/* Arabic verse */}
                <div style={{fontFamily:"'Amiri',serif",fontSize:24,direction:"rtl",textAlign:"right",color:"var(--text)",lineHeight:2.2,marginBottom:12}}>{v.arabic}</div>
                {/* English */}
                <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.8,fontStyle:"italic",marginBottom:10,paddingTop:10,borderTop:"1px solid var(--border)"}}>{v.english}</div>
                {/* Urdu */}
                {v.urdu&&<div style={{fontSize:14,direction:"rtl",textAlign:"right",color:"var(--primary)",lineHeight:2,fontFamily:"Georgia,serif",paddingTop:8,borderTop:"1px solid var(--border)"}}>{v.urdu}</div>}
              </div>
            ))}

            <div style={{textAlign:"center",padding:"20px",fontSize:12,color:"var(--muted)"}}>
              ✨ End of Surah {selectedSurah.name} — {verses.length} Ayahs
            </div>
          </>}
        </div>
      </div>
    );
  }

  // ── SURAH LIST VIEW ─────────────────────────────────────────────────────────
  if(view==="surahList"){
    return(
      <div style={{display:"flex",flexDirection:"column",height:"calc(100dvh - 116px)",overflow:"hidden"}}>
        <div style={{background:"linear-gradient(135deg,#1E3A5F,#0D9488)",padding:"12px 14px",flexShrink:0}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
            <button onClick={()=>setView("main")} style={{background:"rgba(255,255,255,.15)",border:"none",borderRadius:8,padding:"7px 14px",color:"white",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>← Back</button>
            <div style={{fontSize:16,fontWeight:800,color:"white"}}>📖 Holy Quran</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginLeft:"auto"}}>114 Surahs</div>
          </div>
          {/* Search */}
          <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="🔍 Search surah name or number..."
            style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"none",background:"rgba(255,255,255,.15)",color:"white",fontFamily:"inherit",fontSize:13,outline:"none"}}/>
          {searchQ&&<div style={{fontSize:11,color:"rgba(255,255,255,.6)",marginTop:6}}>{filtered.length} results</div>}
        </div>

        <div style={{flex:1,overflowY:"auto",WebkitOverflowScrolling:"touch",background:"var(--bg)"}}>
          {filtered.map(s=>(
            <div key={s.n} onClick={()=>openSurah(s)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer",background:"var(--card)",marginBottom:2,activeBackground:"var(--card2)"}}>
              <div style={{width:38,height:38,borderRadius:10,background:"linear-gradient(135deg,var(--primary),var(--primary2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"white",flexShrink:0}}>{s.n}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:4,marginBottom:2}}>
                  <div style={{fontSize:14,fontWeight:700,color:"var(--text)"}}>{s.name}</div>
                  <div style={{fontFamily:"'Amiri',serif",fontSize:18,color:"var(--primary)",flexShrink:0}}>{s.ar}</div>
                </div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:11,color:"var(--muted)"}}>{s.eng}</span>
                  <span style={{fontSize:9,background:"var(--card2)",color:"var(--muted)",padding:"1px 6px",borderRadius:6,fontWeight:600}}>{s.type}</span>
                  <span style={{fontSize:11,color:"var(--muted)",marginLeft:"auto"}}>{s.v} verses</span>
                </div>
              </div>
              <div style={{fontSize:16,color:"var(--muted)"}}>›</div>
            </div>
          ))}
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"var(--muted)",fontSize:13}}>No surahs found for "{searchQ}"</div>}
        </div>
      </div>
    );
  }

  // ── MAIN FAITH VIEW ─────────────────────────────────────────────────────────
  return(<div style={S.page}>
    {/* Daily Ayah */}
    {dailyAyah&&<div style={{background:"linear-gradient(135deg,#1E3A5F,#0D9488)",borderRadius:16,padding:18,color:"white",marginBottom:10,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-20,right:-20,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,.06)"}}/>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1,opacity:.6,marginBottom:10}}>
        🌟 Today's Ayah · {new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}
      </div>
      <div style={{fontFamily:"'Amiri',serif",fontSize:24,direction:"rtl",textAlign:"right",lineHeight:2,marginBottom:12,color:"white"}}>{dailyAyah.arabic}</div>
      <div style={{fontSize:13,lineHeight:1.7,opacity:.9,marginBottom:8,fontStyle:"italic"}}>"{dailyAyah.english}"</div>
      <div style={{fontSize:14,lineHeight:1.9,direction:"rtl",textAlign:"right",fontFamily:"Georgia,serif",marginBottom:10,opacity:.9}}>{dailyAyah.urdu}</div>
      <div style={{fontSize:10,opacity:.55,fontWeight:700}}>{dailyAyah.ref}</div>
    </div>}

    {/* Open Quran Button */}
    <button onClick={()=>setView("surahList")} style={{...S.btn(),background:"linear-gradient(135deg,#1E3A5F,#0D9488)",marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10,fontSize:15,padding:16}}>
      <span style={{fontSize:24}}>📖</span>
      <div style={{textAlign:"left"}}>
        <div style={{fontWeight:800}}>Open Holy Quran</div>
        <div style={{fontSize:11,opacity:.8,fontWeight:400}}>114 Surahs · Arabic · English · Urdu · Audio</div>
      </div>
    </button>

    {/* Prayer Times */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:10}}>
      {prayerTimes.map(p=>(<div key={p.name} style={{borderRadius:12,padding:"8px 4px",textAlign:"center",background:nextPrayer?.name===p.name?"var(--primary)":p.passed?"var(--card2)":"var(--card)",border:nextPrayer?.name===p.name?"none":"1px solid var(--border)"}}>
        <div style={{fontSize:16,marginBottom:3}}>{p.icon}</div>
        <div style={{fontSize:9,fontWeight:800,textTransform:"uppercase",color:nextPrayer?.name===p.name?"white":p.passed?"var(--muted)":"var(--text)"}}>{p.name}</div>
        <div style={{fontSize:10,fontWeight:700,marginTop:2,color:nextPrayer?.name===p.name?"#FCD34D":p.passed?"var(--muted)":"var(--text2)"}}>{p.time}</div>
      </div>))}
    </div>

    {/* Tasbeeh + Qibla */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
      <div style={S.card}>
        <div style={{...S.cardT,marginBottom:10}}>📿 Tasbeeh</div>
        <div style={{textAlign:"center"}}>
          <button onClick={()=>{const n=tb+1;setTb(n);setTasbeeh(n);}} style={{width:100,height:100,borderRadius:"50%",background:"linear-gradient(135deg,var(--primary),var(--primary2))",border:"none",cursor:"pointer",color:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto"}}>
            <div style={{fontSize:28,fontWeight:800,lineHeight:1}}>{tb}</div>
            <div style={{fontSize:10,opacity:.7}}>tap</div>
          </button>
          {tb>0&&tb%33===0&&<div style={{fontSize:11,color:"var(--teal)",fontWeight:700,marginTop:6}}>✨ {tb} SubhanAllah!</div>}
          {tb>0&&tb%99===0&&<div style={{fontSize:11,color:"var(--primary)",fontWeight:700,marginTop:4}}>🌟 Alhumdulillah!</div>}
          <button onClick={()=>{setTb(0);setTasbeeh(0);}} style={{marginTop:8,background:"none",border:"1px solid var(--border)",borderRadius:20,padding:"4px 16px",cursor:"pointer",fontSize:11,color:"var(--muted)",fontFamily:"inherit"}}>Reset</button>
        </div>
      </div>
      <div style={S.card}>
        <div style={{...S.cardT,marginBottom:10}}>🧭 Qibla</div>
        <div style={{textAlign:"center"}}>
          <div style={{width:110,height:110,borderRadius:"50%",background:"linear-gradient(135deg,#1E3A5F,#0D9488)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto",position:"relative",boxShadow:"0 6px 20px rgba(30,58,95,.3)"}}>
            <div style={{position:"absolute",inset:8,borderRadius:"50%",border:"1px solid rgba(255,255,255,.2)"}}/>
            <div style={{position:"absolute",top:6,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700}}>N</div>
            <div style={{position:"absolute",bottom:6,left:"50%",transform:"translateX(-50%)",fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700}}>S</div>
            <div style={{position:"absolute",right:6,top:"50%",transform:"translateY(-50%)",fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700}}>E</div>
            <div style={{position:"absolute",left:6,top:"50%",transform:"translateY(-50%)",fontSize:9,color:"rgba(255,255,255,.6)",fontWeight:700}}>W</div>
            <div style={{fontSize:28,transition:"transform .3s",transform:`rotate(${qiblaArrow}deg)`}}>🕋</div>
          </div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:8}}>{qiblaDir!=null?`${qiblaDir}° · Makkah`:"Tap below"}</div>
          <button onClick={requestCompassPermission} style={{...S.btn(),marginTop:6,width:"auto",padding:"6px 14px",fontSize:11}}>{qiblaDir?"🔄 Refresh":"📍 Get Qibla"}</button>
        </div>
      </div>
    </div>

    {/* Ramadan */}
    <div style={S.card}>
      <div style={S.cardHd}>
        <div style={S.cardT}>🌙 Ramadan Tracker</div>
        <span style={{fontSize:11,color:"var(--teal)",fontWeight:700}}>{ramadan.filter(d=>d==="fasted").length}/30</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(10,1fr)",gap:4}}>
        {ramadan.map((d,i)=><div key={i} onClick={()=>setRamadan(p=>{const n=[...p];n[i]=n[i]==="fasted"?"unfasted":"fasted";return n;})} style={{aspectRatio:1,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:700,cursor:"pointer",background:d==="fasted"?"var(--teal)":"var(--card2)",color:d==="fasted"?"white":"var(--muted)"}}>{i+1}</div>)}
      </div>
    </div>

    {/* Duas */}
    <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--muted)",fontWeight:700,margin:"12px 0 8px"}}>🤲 Daily Duas</div>
    {DUAS.map((d,i)=>(<div key={i} style={{...S.card,borderLeft:"3px solid var(--teal)",marginBottom:8}}>
      <div style={{fontSize:10,textTransform:"uppercase",color:"var(--teal)",fontWeight:800,marginBottom:8}}>{d.t}</div>
      <div style={{fontFamily:"'Amiri',serif",fontSize:20,direction:"rtl",textAlign:"right",color:"var(--text)",lineHeight:2,marginBottom:6}}>{d.ar}</div>
      <div style={{fontSize:11,fontStyle:"italic",color:"var(--teal)",marginBottom:4}}>{d.tr}</div>
      <div style={{fontSize:11,color:"var(--muted)"}}>{d.en}</div>
    </div>))}
  </div>);
};

    const Kids=()=>(<div style={S.page}>
    <div style={{background:"linear-gradient(135deg,#FF6B6B,#FFC93C)",borderRadius:16,padding:16,color:"white",textAlign:"center",marginBottom:10}}>
      <div style={{fontSize:22,marginBottom:4}}>🦁 🐘 🌈 ⭐ 🎨</div>
      <div style={{fontSize:20,fontWeight:800}}>Kids World</div>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:10,overflowX:"auto"}}>
      {[{id:"abc",l:"🔤 ABCs"},{id:"math",l:"🔢 Math"},{id:"draw",l:"🎨 Draw"},{id:"stories",l:"📖 Stories"}].map(t=>(<button key={t.id} onClick={()=>setKidsTab(t.id)} style={{padding:"8px 16px",borderRadius:25,border:"none",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",background:kidsTab===t.id?"var(--primary)":"var(--card)",color:kidsTab===t.id?"white":"var(--text)",boxShadow:"0 2px 8px rgba(0,0,0,.07)"}}>{t.l}</button>))}
    </div>
    {kidsTab==="abc"&&<div style={S.card}>
      <div style={{...S.cardT,marginBottom:10}}>🔤 Tap a Letter!</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:5}}>
        {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((l,i)=>{
          const c=["#6366F1","#EF4444","#F59E0B","#22C55E","#EC4899","#0EA5E9"][i%6];
          const words={A:"🍎 Apple",B:"🐝 Bee",C:"🐱 Cat",D:"🐶 Dog",E:"🐘 Elephant",F:"🐟 Fish",G:"🍇 Grape",H:"🏠 Home",I:"🍦 Ice Cream",J:"🃏 Jump",K:"🪁 Kite",L:"🦁 Lion",M:"🌙 Moon",N:"🌃 Night",O:"🍊 Orange",P:"🍕 Pizza",Q:"👸 Queen",R:"🌈 Rainbow",S:"⭐ Star",T:"🌳 Tree",U:"☂️ Umbrella",V:"🎻 Violin",W:"🌊 Water",X:"🎸 Xylophone",Y:"🟡 Yellow",Z:"🦓 Zebra"};
          return<button key={l} onClick={()=>alert(`${l} is for ${words[l]}`)} style={{aspectRatio:1,borderRadius:10,background:"var(--card2)",border:`2px solid ${c}44`,fontWeight:800,fontSize:15,cursor:"pointer",color:c,fontFamily:"inherit"}}>{l}</button>;
        })}
      </div>
    </div>}
    {kidsTab==="math"&&<div style={{background:"linear-gradient(135deg,#EDE9FE,#E0F2FE)",borderRadius:16,padding:20,textAlign:"center"}}>
      <div style={{fontSize:28,fontWeight:800,color:"#1E3A5F",marginBottom:14}}>{mathQ.q}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,maxWidth:220,margin:"0 auto"}}>
        {mathQ.opts.map(opt=><button key={opt} onClick={()=>{setMathRes(opt===mathQ.answer?"correct":"wrong");if(opt===mathQ.answer)setTimeout(()=>{setMathQ(genMath());setMathRes(null);},1200);}} style={{padding:12,borderRadius:12,border:`2px solid ${mathRes&&opt===mathQ.answer?"#22C55E":mathRes&&opt!==mathQ.answer?"#EF4444":"#E2E8F0"}`,background:mathRes&&opt===mathQ.answer?"#22C55E":mathRes&&opt!==mathQ.answer?"#EF4444":"white",fontWeight:800,fontSize:20,cursor:"pointer",color:mathRes?"white":"#1E3A5F",fontFamily:"inherit"}}>{opt}</button>)}
      </div>
      {mathRes&&<div style={{marginTop:14,fontSize:22}}>{mathRes==="correct"?"🎉 Correct!":"❌ Try again!"}</div>}
      <button onClick={()=>{setMathQ(genMath());setMathRes(null);}} style={{marginTop:14,background:"white",border:"none",borderRadius:20,padding:"7px 20px",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer",color:"#1E3A5F"}}>🔄 New</button>
    </div>}
    {kidsTab==="draw"&&<DrawingBoard dark={dark}/>}
    {kidsTab==="stories"&&[{t:"Prophet Ibrahim ﷺ",e:"🌟",d:"The brave prophet who built the Kaaba with his son Ismail. A story of courage and faith in Allah."},{t:"The Spider Web",e:"🕷️",d:"How Allah used a tiny spider to protect His beloved Prophet ﷺ in the Cave of Thawr."},{t:"Bilal & the Adhan",e:"🕌",d:"The first muezzin whose beautiful call to prayer still echoes through history."},{t:"Prophet Yusuf ﷺ",e:"👑",d:"A beautiful story of patience, forgiveness and complete trust in Allah's perfect plan."}].map((s,i)=>(<div key={i} onClick={()=>alert(`📖 "${s.t}"\n\n${s.d}\n\nFull stories coming soon InshaAllah! 🌟`)} style={{...S.card,cursor:"pointer",marginBottom:8}}>
      <div style={{fontSize:26,marginBottom:6}}>{s.e}</div>
      <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{s.t}</div>
      <div style={{fontSize:11,color:"var(--muted)",marginTop:3,lineHeight:1.5}}>{s.d}</div>
    </div>))}
  </div>);

  const ChatList=()=>{
    const contacts=[
      {id:"group",name:family.familyName,avatar:"👨‍👩‍👧‍👦",preview:(chatMessages["group"]||[]).slice(-1)[0]?.text?.substring(0,35)||"Say salaam! 👋",online:true},
      ...members.filter(m=>m.name!==me.name).map(m=>{
        const privId=[me.name,m.name].sort().join("-");
        const privMsgs=chatMessages[privId]||[];
        return{id:m._id||m.id,name:m.name,avatar:m.emoji,preview:privMsgs.slice(-1)[0]?.text?.substring(0,35)||"Tap to chat...",online:m.online};
      }),
    ];
    return(<div style={S.page}>
      <div style={{background:"#FEF3C7",borderRadius:12,padding:"10px 14px",marginBottom:12,fontSize:12,color:"#92400E",border:"1px solid #FCD34D"}}>
        🔑 Invite: <strong style={{letterSpacing:1}}>{family.inviteCode}</strong> · Share with family!
      </div>
      {contacts.map(c=>{
        const cid=c.id==="group"?"group":[me.name,c.name].sort().join("-");
        const unread=(chatMessages[cid]||[]).filter(m=>m.sender!==me.name&&!m.read).length;
        return(<div key={c.id} onClick={()=>{setOpenChat(c);loadMessages(cid,T);}} style={{...S.card,display:"flex",alignItems:"center",gap:12,cursor:"pointer",marginBottom:8}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24,flexShrink:0,position:"relative",border:"2px solid var(--border)"}}>
            {c.avatar}{c.online&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#22C55E",border:"2px solid var(--card)"}}/>}
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{c.name}</div>
            <div style={{fontSize:11,color:"var(--muted)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginTop:2}}>{c.preview}</div>
          </div>
          {unread>0&&<div style={{background:"var(--danger)",color:"white",fontSize:10,fontWeight:800,width:20,height:20,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{unread}</div>}
        </div>);
      })}
    </div>);
  };

  const Memories=()=>(<div style={S.page}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
      <div><div style={{fontSize:16,fontWeight:800,color:"var(--text)"}}>📸 Memory Capsule</div><div style={{fontSize:11,color:"var(--muted)"}}>{memories.length} memories</div></div>
      <button style={{...S.btn(),width:"auto",padding:"8px 16px",fontSize:12}} onClick={()=>setShowAddMem(true)}>+ New</button>
    </div>
    {memories.length===0?<div style={{...S.card,textAlign:"center",padding:24}}><div style={{fontSize:36,marginBottom:8}}>📸</div><button style={{...S.btn(),width:"auto",padding:"8px 16px",fontSize:12}} onClick={()=>setShowAddMem(true)}>+ First Memory</button></div>:(
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {memories.map(m=>(<div key={m._id} style={{...S.card,padding:0,overflow:"hidden",cursor:"pointer"}} onClick={()=>m.locked?alert(`🔒 Opens ${m.lockedUntil}`):alert(`📖 "${m.title}"\nBy ${m.addedBy} · ${new Date(m.date).toLocaleDateString()}`)}>
          <div style={{height:80,background:"var(--card2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,position:"relative"}}>
            {m.emoji}{m.locked&&<div style={{position:"absolute",inset:0,background:"rgba(15,23,42,.82)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"white",gap:2}}><span style={{fontSize:18}}>🔒</span><div style={{fontSize:9,fontWeight:700}}>Opens {m.lockedUntil}</div></div>}
          </div>
          <div style={{padding:8}}>
            <div style={{fontSize:9,textTransform:"uppercase",color:"var(--primary)",fontWeight:700,marginBottom:2}}>{m.type||"note"}</div>
            <div style={{fontSize:11,fontWeight:700,color:"var(--text)"}}>{m.title}</div>
            <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{new Date(m.date).toLocaleDateString()}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"5px 8px",borderTop:"1px solid var(--border)",fontSize:10}}>
            <span style={{color:"var(--danger)",fontWeight:700,cursor:"pointer"}} onClick={e=>{e.stopPropagation();apiFetch("PATCH",`/memories/${m._id}/heart`,{},T).then(u=>setMemories(p=>p.map(x=>x._id===m._id?u:x))).catch(()=>{})}}>❤️ {m.hearts}</span>
            <span style={{color:"var(--muted)"}}>{m.locked?"Locked":"View"}</span>
          </div>
        </div>))}
      </div>
    )}
    {showAddMem&&<div style={S.modal} onClick={e=>e.target===e.currentTarget&&setShowAddMem(false)}>
      <div style={S.modalBox}>
        <div style={{fontSize:16,fontWeight:800,color:"var(--text)",marginBottom:14}}>✨ New Memory</div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Title *</div>
        <input style={S.inp} placeholder="e.g. Eid 2026" value={fmMem.title} onChange={e=>setFmMem({...fmMem,title:e.target.value})}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
          {["⭐","🎉","🌙","❤️","🏠","📸","🎁","🌹","🍰","✈️","🕌","🤲"].map(e=><button key={e} onClick={()=>setFmMem({...fmMem,emoji:e})} style={{fontSize:20,background:fmMem.emoji===e?"var(--card2)":"var(--card)",border:`2px solid ${fmMem.emoji===e?"var(--primary)":"var(--border)"}`,borderRadius:8,padding:"3px 8px",cursor:"pointer"}}>{e}</button>)}
        </div>
        <div style={{fontSize:11,fontWeight:600,color:"var(--text2)",marginBottom:4}}>Lock until year (optional)</div>
        <input style={S.inp} placeholder="e.g. 2030" value={fmMem.lockedUntil} onChange={e=>setFmMem({...fmMem,lockedUntil:e.target.value})}/>
        <button style={S.btn()} onClick={()=>{if(!fmMem.title.trim())return alert("Enter title!");apiFetch("POST","/memories",{...fmMem,locked:!!fmMem.lockedUntil},T).then(m=>{setMemories(p=>[m,...p]);setFmMem({title:"",emoji:"⭐",lockedUntil:""});setShowAddMem(false);}).catch(e=>alert(e.message));}}>Save Memory 💾</button>
      </div>
    </div>}
  </div>);

  const Emergency=()=>(<div style={{...S.page,textAlign:"center"}}>
    {sosActive&&<div style={{background:"#FEE2E2",border:"2px solid #FCA5A5",borderRadius:14,padding:14,marginBottom:14,textAlign:"left",animation:"pulse 1.5s infinite"}}>
      <div style={{fontSize:14,fontWeight:800,color:"#DC2626"}}>🚨 SOS ALERT SENT!</div>
      <div style={{fontSize:12,color:"#EF4444",marginTop:4}}>All {members.length} family members alerted!</div>
      <button onClick={()=>setSosActive(false)} style={{marginTop:8,background:"white",border:"1px solid #EF4444",color:"#EF4444",padding:"5px 14px",borderRadius:8,cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700}}>Cancel</button>
    </div>}
    <div style={{padding:"20px 0 16px"}}>
      <button style={{width:150,height:150,borderRadius:"50%",background:"linear-gradient(135deg,#EF4444,#DC2626)",border:"7px solid #FEE2E2",cursor:"pointer",color:"white",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:"0 8px 35px rgba(239,68,68,.4)"}} onClick={()=>{setSosActive(true);navigator.geolocation?.getCurrentPosition(p=>socketRef.current?.emit("sosAlert",{location:{lat:p.coords.latitude,lng:p.coords.longitude}}),()=>socketRef.current?.emit("sosAlert",{}));}}>
        <div style={{fontSize:36}}>🆘</div><div style={{fontSize:11,opacity:.85,marginTop:3}}>PRESS FOR SOS</div>
      </button>
      <div style={{fontSize:12,color:"var(--muted)",maxWidth:240,margin:"0 auto"}}>Instantly alerts all family members with your GPS location.</div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {[{e:"📍",t:"Share Location",d:"Send GPS to family"},{e:"📞",t:"Call 112",d:"Emergency services"},{e:"🏥",t:"Find Hospital",d:"Nearest hospital"},{e:"👮",t:"Police",d:"Call authorities"}].map(a=>(<div key={a.t} style={{...S.card,cursor:"pointer",padding:"16px 10px"}} onClick={()=>alert(`${a.e} ${a.t}`)}>
        <div style={{fontSize:26,marginBottom:6}}>{a.e}</div>
        <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{a.t}</div>
        <div style={{fontSize:10,color:"var(--muted)",marginTop:2}}>{a.d}</div>
      </div>))}
    </div>
    <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.3);}50%{box-shadow:0 0 0 10px rgba(239,68,68,0);}}`}</style>
  </div>);

  const Settings=()=>(<div style={S.page}>
    <div style={{background:"linear-gradient(135deg,var(--primary),var(--primary2))",borderRadius:16,padding:20,color:"white",marginBottom:12,textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:8}}>🏠✨</div>
      <div style={{fontSize:20,fontWeight:800}}>FamilyVerse v4.0</div>
      <div style={{fontSize:11,opacity:.5,marginBottom:10}}>{family.familyName}</div>
      <div style={{background:"rgba(245,158,11,.15)",borderRadius:10,padding:"10px 14px",textAlign:"left",border:"1px solid rgba(245,158,11,.3)"}}>
        <div style={{fontSize:11,fontStyle:"italic",opacity:.9,lineHeight:1.6}}>"Built with love for every family — health, faith, memories, and real connection."</div>
        <div style={{fontSize:10,color:"#FCD34D",fontWeight:700,marginTop:4}}>— Syed Muzamil, Creator</div>
      </div>
    </div>
    <div style={{...S.card,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:22}}>🌙</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>Dark Mode</div><div style={{fontSize:11,color:"var(--muted)"}}>Easy on eyes at night</div></div>
      <button onClick={()=>setDark(d=>!d)} style={{width:44,height:24,borderRadius:12,cursor:"pointer",background:dark?"var(--primary)":"var(--border)",border:"none",position:"relative",transition:"background .25s",flexShrink:0}}>
        <div style={{position:"absolute",top:3,width:18,height:18,borderRadius:"50%",background:"white",transition:"left .25s",left:dark?"23px":"3px",boxShadow:"0 1px 3px rgba(0,0,0,.2)"}}/>
      </button>
    </div>
    <div style={S.card}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
        <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,var(--primary),var(--primary2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>🏠</div>
        <div><div style={{fontSize:15,fontWeight:800,color:"var(--text)"}}>{family.familyName}</div><div style={{fontSize:11,color:"var(--muted)"}}>{members.length} members</div></div>
      </div>
      <div style={{background:"#FEF3C7",borderRadius:10,padding:"10px 12px"}}>
        <div style={{fontSize:10,fontWeight:700,color:"#92400E",marginBottom:3}}>🔑 INVITE CODE — Share this!</div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}><div style={{fontSize:20,fontWeight:900,color:"#F59E0B",letterSpacing:2,fontFamily:"monospace"}}>{family.inviteCode}</div><button onClick={()=>{navigator.clipboard?.writeText(family.inviteCode);alert("Invite code copied! ✅");}} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Copy</button></div>
        <div style={{fontSize:10,color:"#92400E",marginTop:4}}>Others: Open app → Join Family → Enter code ✅</div>
        <button onClick={()=>apiFetch("POST","/notifications/test",{},T).then(()=>alert("Test notification sent! Check your phone! 🔔")).catch(e=>alert("Error: "+e.message))} style={{marginTop:8,width:"100%",padding:"8px",borderRadius:8,border:"none",background:"#6366F1",color:"white",fontFamily:"inherit",fontWeight:700,fontSize:12,cursor:"pointer"}}>🔔 Test Notifications</button>
      </div>
    </div>
    <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--muted)",fontWeight:700,margin:"12px 0 8px"}}>👥 MEMBERS</div>
    {members.map(m=>(<div key={m._id||m.id} style={{...S.card,display:"flex",alignItems:"center",gap:12,marginBottom:8}}>
      <div style={{fontSize:24}}>{m.emoji}</div>
      <div style={{flex:1}}><div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{m.name}{m.name===me.name?" (You)":""}</div><div style={{fontSize:11,color:"var(--muted)"}}>{m.role} · {m.online?"🟢 Online":"⚫ Offline"}</div></div>
      <div style={{fontSize:20}}>{MOODS.find(md=>md.id===(m.mood||"happy"))?.e||"😊"}</div>
    </div>))}
    <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--muted)",fontWeight:700,margin:"12px 0 8px"}}>🔔 NOTIFICATIONS ({notifications.length})</div>
    {notifications.length===0?<div style={{...S.card,textAlign:"center",fontSize:12,color:"var(--muted)",padding:"14px"}}>No notifications yet</div>:
    notifications.slice(0,5).map(n=>(<div key={n.id} style={{...S.card,display:"flex",gap:10,alignItems:"center",marginBottom:7,padding:"10px 12px"}}>
      <div style={{fontSize:20,flexShrink:0}}>{n.icon}</div>
      <div style={{flex:1}}><div style={{fontSize:12,color:"var(--text)",fontWeight:600}}>{n.text}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{new Date(n.time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</div></div>
    </div>))}
    <div style={{...S.card,display:"flex",alignItems:"center",gap:12,cursor:"pointer",border:"1px solid #FCA5A5",marginTop:14}} onClick={()=>{if(confirm("Sign out?")){ LS.clear();dataLoadedRef.current=false;setSession(null);}}}>
      <div style={{fontSize:20}}>🚪</div>
      <div><div style={{fontSize:13,fontWeight:700,color:"#EF4444"}}>Sign Out</div><div style={{fontSize:11,color:"var(--muted)"}}>Return to login</div></div>
    </div>
    <div style={{textAlign:"center",padding:"16px 0",fontSize:11,color:"var(--muted)"}}>FamilyVerse v4.0 · Crafted with ❤️<br/><em>A Syed Muzamil Creation</em></div>
  </div>);

  const PAGES={dashboard:<Dashboard/>,health:<Health/>,faith:<Faith/>,kids:<Kids/>,chat:<ChatList/>,memories:<Memories/>,emergency:<Emergency/>,settings:<Settings/>};

  return(<div style={S.root}>
    {showOnboarding&&<OnboardingSlides onDone={finishOnboarding}/>}
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Amiri:wght@400;700&display=swap');*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}input,select,textarea{-webkit-appearance:none;font-family:inherit;}::-webkit-scrollbar{display:none;}body{overscroll-behavior:none;touch-action:manipulation;}`}</style>
    {/* Connection bar */}
    <div style={{height:socketConnected?0:22,overflow:"hidden",background:"#EF4444",color:"white",textAlign:"center",fontSize:10,fontWeight:700,lineHeight:"22px",flexShrink:0,transition:"height .3s"}}>🔴 Connecting to server...</div>
    {/* Topbar */}
    <div style={S.topbar}>
      <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,var(--primary),var(--primary2))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>🏠</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:15,fontWeight:800,color:"var(--text)"}}>{family.familyName}</div>
        <div style={{fontSize:9,color:"var(--muted)"}}>{page.charAt(0).toUpperCase()+page.slice(1)} {socketConnected?"· 🟢":""}</div>
      </div>
      {/* Notifications bell */}
      <button onClick={()=>setShowNotif(n=>!n)} style={{width:34,height:34,borderRadius:9,border:"none",background:"var(--card2)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center",position:"relative"}}>
        🔔{notifications.length>0&&<div style={{position:"absolute",top:5,right:5,width:8,height:8,borderRadius:"50%",background:"var(--danger)",border:"2px solid var(--card)"}}/>}
      </button>
      <button onClick={()=>setDark(d=>!d)} style={{width:34,height:34,borderRadius:9,border:"none",background:"var(--card2)",cursor:"pointer",fontSize:16,display:"flex",alignItems:"center",justifyContent:"center"}}>{dark?"☀️":"🌙"}</button>
      <button onClick={()=>setPage("settings")} style={{width:34,height:34,borderRadius:9,border:"none",background:"var(--card2)",cursor:"pointer",fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>{me.emoji}</button>
    </div>
    {/* Notification panel */}
    {showNotif&&<div style={{position:"fixed",top:56,left:0,right:0,background:"var(--card)",borderBottom:"1px solid var(--border)",zIndex:200,maxHeight:260,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,.15)"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>🔔 Notifications</div>
        <button onClick={()=>{setNotifications([]);setShowNotif(false);}} style={{fontSize:11,color:"var(--primary)",border:"none",background:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Clear all</button>
      </div>
      {notifications.length===0?<div style={{padding:"16px",textAlign:"center",fontSize:12,color:"var(--muted)"}}>No notifications</div>:
      notifications.slice(0,10).map(n=>(<div key={n.id} style={{display:"flex",gap:10,alignItems:"center",padding:"10px 16px",borderBottom:"1px solid var(--border)"}}>
        <div style={{fontSize:18,flexShrink:0}}>{n.icon}</div>
        <div style={{flex:1}}><div style={{fontSize:12,color:"var(--text)",fontWeight:600}}>{n.text}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{new Date(n.time).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</div></div>
      </div>))}
    </div>}
    {/* Page content */}
    <div style={S.scroll} onClick={()=>showNotif&&setShowNotif(false)}>{PAGES[page]}</div>
    {/* Bottom nav */}
    <div style={S.bnav}>
      {NAV.map(n=>(<button key={n.id} style={S.nb(page===n.id)} onClick={()=>{setPage(n.id);setOpenChat(null);setShowNotif(false);}}>
        <div style={{fontSize:20,lineHeight:1,position:"relative"}}>
          {n.icon}
          {n.badge>0&&<div style={{position:"absolute",top:-2,right:-6,background:"var(--danger)",color:"white",fontSize:9,fontWeight:800,padding:"1px 4px",borderRadius:10,minWidth:15,textAlign:"center"}}>{n.badge}</div>}
        </div>
        {n.l}
      </button>))}
    </div>
  </div>);
}
