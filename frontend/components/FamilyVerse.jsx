"use client";
import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://familyverse-backend.onrender.com";

const api = async (method, path, body, token) => {
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
const PRAYER_ICONS = ["🌙","☀️","🌤️","🌅","🌃"];
const PRAYER_NAMES = ["Fajr","Dhuhr","Asr","Maghrib","Isha"];

const DUAS = [
  {t:"Morning Dua",ar:"أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ",tr:"Asbahna wa asbahal mulku lillah walhamdu lillah",en:"We have reached morning and sovereignty belongs to Allah"},
  {t:"Before Eating",ar:"بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ",tr:"Bismillahi wa ala barakatillah",en:"In the name of Allah and with His blessings"},
  {t:"After Eating",ar:"الْحَمْدُ لِلَّهِ الَّذِي أَطْعَمَنَا وَسَقَانَا وَجَعَلَنَا مُسْلِمِينَ",tr:"Alhamdulillahilladhi at'amana wa saqana wa ja'alana muslimeen",en:"Praise Allah Who fed us, gave us drink and made us Muslims"},
  {t:"Before Sleep",ar:"بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا",tr:"Bismika Allahumma amootu wa ahya",en:"In Your name O Allah, I die and I live"},
  {t:"Entering Home",ar:"بِسْمِ اللَّهِ وَلَجْنَا وَبِسْمِ اللَّهِ خَرَجْنَا",tr:"Bismillahi walajna wa bismillahi kharajna",en:"In the name of Allah we enter and in His name we leave"},
  {t:"Leaving Home",ar:"بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ",tr:"Bismillahi tawakkaltu alallah",en:"In the name of Allah, I place my trust in Allah"},
  {t:"For Anxiety",ar:"اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",tr:"Allahumma inni a'udhu bika minal hammi wal hazan",en:"O Allah, I seek refuge in You from worry and grief"},
  {t:"For Good Health",ar:"اللَّهُمَّ عَافِنِي فِي بَدَنِي",tr:"Allahumma 'afini fi badani",en:"O Allah, grant health to my body"},
  {t:"Ayatul Kursi",ar:"اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ",tr:"Allahu la ilaha illa huwal hayyul qayyum",en:"Allah - there is no god except Him, the Ever-Living"},
  {t:"For Parents",ar:"رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",tr:"Rabbir hamhuma kama rabbayani sagheera",en:"My Lord, have mercy on them as they raised me when small"},
  {t:"Istikhara",ar:"اللَّهُمَّ إِنِّي أَسْتَخِيرُكَ بِعِلْمِكَ",tr:"Allahumma inni astakhiruka bi'ilmik",en:"O Allah, I seek Your guidance through Your knowledge"},
  {t:"Travel Dua",ar:"سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَٰذَا",tr:"Subhanal ladhi sakhkhara lana hadha",en:"Glory to Him Who has subjected this to us"},
];

const STORIES = [
  {t:"Prophet Ibrahim ﷺ",e:"🌟",age:"5+",d:"The brave prophet who built the Kaaba with his son Ismail ﷺ — a story of courage and faith."},
  {t:"The Elephant & Spider",e:"🕷️",age:"4+",d:"How a tiny spider helped protect Prophet Muhammad ﷺ in the Cave of Thawr."},
  {t:"Bilal & the Adhan",e:"🕌",age:"6+",d:"The first muezzin and his beautiful call to prayer that still echoes through history."},
  {t:"Asma bint Abu Bakr",e:"💪",age:"7+",d:"The courageous woman of two belts who helped during the Hijra."},
  {t:"Prophet Yusuf ﷺ",e:"👑",age:"8+",d:"A story of patience, forgiveness and complete trust in Allah's plan."},
  {t:"Salah ad-Din al-Ayyubi",e:"⚔️",age:"9+",d:"The great Muslim leader who showed justice and mercy to all people."},
];

const QUOTES = [
  {t:"A family is not just a group of people — it's a universe of love, patience, and grace.",a:"Syed Muzamil"},
  {t:"In every family dinner, every bedtime story, every shared prayer — life finds its deepest meaning.",a:"Syed Muzamil"},
  {t:"The greatest wealth is a loving family that grows together in faith and kindness.",a:"Syed Muzamil"},
  {t:"Every child who feels loved at home carries a light that illuminates the world.",a:"Syed Muzamil"},
  {t:"Home is not a place — it is the warmth in the hearts of those who love each other.",a:"Syed Muzamil"},
];

const genMath = () => {
  const a=Math.floor(Math.random()*12)+1, b=Math.floor(Math.random()*12)+1;
  const op=Math.random()>.5?"+":"×"; const ans=op==="+"?a+b:a*b;
  const opts=[ans]; while(opts.length<4){const r=ans+(Math.floor(Math.random()*8)-4); if(r>0&&!opts.includes(r))opts.push(r);}
  return {q:`${a} ${op} ${b} = ?`, answer:ans, opts:opts.sort(()=>Math.random()-.5)};
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&family=Amiri:wght@400;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
:root{--navy:#1E3A5F;--amber:#F59E0B;--teal:#0D9488;--cream:#FFF8F0;--white:#FFFDF9;--soft:#F1F5F9;--text:#1A1A2E;--mid:#4A5568;--muted:#94A3B8;--r:16px;--rs:12px;--sh:0 2px 12px rgba(0,0,0,.07);}
html{height:100%;overflow:hidden;}
body{font-family:'Nunito',sans-serif;background:var(--cream);color:var(--text);height:100%;overflow:hidden;position:fixed;width:100%;}
#fv{display:flex;flex-direction:column;height:100%;height:100dvh;overflow:hidden;}
.topbar{height:54px;min-height:54px;display:flex;align-items:center;gap:10px;padding:0 13px;background:var(--navy);color:white;flex-shrink:0;z-index:100;}
.tb-brand{display:flex;align-items:center;gap:8px;flex:1;min-width:0;}
.tb-ic{width:32px;height:32px;border-radius:9px;background:linear-gradient(135deg,#F59E0B,#EF4444);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0;}
.tb-title{font-family:'Fredoka One',cursive;font-size:17px;}
.tb-sub{font-size:9px;opacity:.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tb-right{display:flex;gap:5px;flex-shrink:0;}
.tb-btn{width:34px;height:34px;border-radius:9px;border:none;background:rgba(255,255,255,.1);color:white;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;}
.tb-dot{position:absolute;top:5px;right:5px;width:7px;height:7px;border-radius:50%;background:#EF4444;border:1.5px solid var(--navy);}
.scroll{flex:1;overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;}
.page{padding:12px 12px 24px;}
.bnav{height:58px;min-height:58px;display:flex;background:white;border-top:1px solid rgba(0,0,0,.08);flex-shrink:0;z-index:100;}
.nb{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:none;cursor:pointer;font-family:'Nunito',sans-serif;font-size:9px;font-weight:700;color:var(--muted);padding:5px 2px;position:relative;}
.nb.active{color:var(--navy);}
.nb.active::after{content:'';position:absolute;bottom:6px;width:4px;height:4px;border-radius:50%;background:var(--amber);}
.ni{font-size:18px;line-height:1;}
.nb-badge{position:absolute;top:3px;right:calc(50% - 14px);background:#EF4444;color:white;font-size:9px;font-weight:800;padding:1px 4px;border-radius:8px;min-width:15px;text-align:center;}
.card{background:white;border-radius:var(--r);padding:14px;box-shadow:var(--sh);border:1px solid rgba(0,0,0,.04);margin-bottom:10px;}
.card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;}
.card-t{font-size:13px;font-weight:800;color:var(--navy);}
.card-lnk{font-size:12px;color:var(--amber);font-weight:700;border:none;background:none;cursor:pointer;font-family:'Nunito',sans-serif;}
.banner{background:linear-gradient(135deg,#1E3A5F,#0D9488);border-radius:var(--r);padding:18px;color:white;margin-bottom:10px;position:relative;overflow:hidden;}
.banner::after{content:'';position:absolute;top:-30px;right:-30px;width:130px;height:130px;border-radius:50%;background:rgba(245,158,11,.12);pointer-events:none;}
.bn-g{font-size:11px;opacity:.55;margin-bottom:2px;}
.bn-n{font-family:'Fredoka One',cursive;font-size:24px;margin-bottom:2px;}
.bn-d{font-size:10px;opacity:.45;}
.bn-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:12px;}
.bs{background:rgba(255,255,255,.1);border-radius:8px;padding:7px 4px;text-align:center;}
.bs-n{font-family:'Fredoka One',cursive;font-size:18px;color:#F59E0B;}
.bs-l{font-size:8px;opacity:.5;text-transform:uppercase;}
.quote{background:linear-gradient(135deg,#FEF3C7,#FEE2E2);border-radius:var(--rs);padding:10px 12px;border-left:3px solid var(--amber);margin-bottom:10px;}
.quote-t{font-size:11px;color:var(--navy);font-style:italic;font-weight:600;line-height:1.5;}
.quote-a{font-size:10px;color:var(--amber);font-weight:700;margin-top:3px;}
.qgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.qcard{border-radius:var(--r);padding:14px 10px;text-align:center;border:none;font-family:'Nunito',sans-serif;cursor:pointer;}
.qcard:active{opacity:.85;transform:scale(.98);}
.qc-i{font-size:24px;margin-bottom:5px;}
.qc-l{font-size:12px;font-weight:800;color:white;}
.qc-s{font-size:10px;color:rgba(255,255,255,.7);margin-top:1px;}
.mem-scroll{display:flex;gap:10px;overflow-x:auto;padding-bottom:5px;-webkit-overflow-scrolling:touch;}
.mem-scroll::-webkit-scrollbar{display:none;}
.mc{display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;cursor:pointer;}
.mc-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;position:relative;background:var(--soft);border:2px solid rgba(0,0,0,.05);}
.mc-on{position:absolute;bottom:1px;right:1px;width:10px;height:10px;border-radius:50%;background:#22C55E;border:2px solid white;}
.mc-n{font-size:10px;font-weight:700;color:var(--navy);max-width:52px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:center;}
.add-mc{display:flex;flex-direction:column;align-items:center;gap:3px;flex-shrink:0;cursor:pointer;}
.add-mc-av{width:50px;height:50px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;border:2px dashed var(--amber);background:#FFFBEB;}
.pr-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px;margin-bottom:5px;}
.pr-row.passed{background:#F8FAFC;}.pr-row.next{background:linear-gradient(135deg,#1E3A5F,#0D9488);color:white;}.pr-row.upcoming{background:white;border:1px solid rgba(0,0,0,.06);}
.med-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,.04);}
.med-row:last-child{border-bottom:none;}
.med-ic{width:36px;height:36px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
.med-btn{font-size:10px;font-weight:700;padding:5px 9px;border-radius:15px;border:none;cursor:pointer;font-family:'Nunito',sans-serif;white-space:nowrap;flex-shrink:0;}
.taken{background:#DCFCE7;color:#16A34A;}.pending{background:#FEF3C7;color:#92400E;}
.hgrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;}
.hcard{border-radius:var(--r);padding:14px;color:white;position:relative;overflow:hidden;}
.hc-l{font-size:9px;font-weight:700;text-transform:uppercase;opacity:.7;}
.hc-v{font-family:'Fredoka One',cursive;font-size:24px;margin:3px 0 1px;}
.hc-u{font-size:10px;opacity:.6;}
.hc-ic{position:absolute;right:10px;top:10px;font-size:22px;opacity:.2;}
.hbar{background:rgba(0,0,0,.15);border-radius:10px;height:4px;margin-top:7px;overflow:hidden;}
.hbar-f{height:100%;border-radius:10px;background:rgba(255,255,255,.6);transition:width .5s;}
.wgrid{display:grid;grid-template-columns:repeat(8,1fr);gap:5px;margin-bottom:7px;}
.wc{aspect-ratio:1;border-radius:7px;border:2px solid rgba(14,165,233,.25);background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px;}
.wc.full{background:#E0F2FE;border-color:#0EA5E9;}
.ai-card{background:linear-gradient(135deg,#1E3A5F,#0D9488);border-radius:var(--r);padding:16px;color:white;margin-bottom:10px;}
.ai-title{font-family:'Fredoka One',cursive;font-size:16px;margin-bottom:6px;}
.ai-resp{background:rgba(255,255,255,.1);border-radius:var(--rs);padding:12px;font-size:12px;line-height:1.7;margin-top:8px;}
.ai-row{display:flex;gap:7px;margin-top:8px;}
.ai-inp{flex:1;padding:9px 12px;border-radius:10px;border:none;font-family:'Nunito',sans-serif;font-size:13px;outline:none;background:rgba(255,255,255,.15);color:white;}
.ai-inp::placeholder{color:rgba(255,255,255,.5);}
.ai-btn{padding:9px 14px;border-radius:10px;border:none;background:#F59E0B;color:white;font-family:'Nunito',sans-serif;font-weight:800;font-size:12px;cursor:pointer;flex-shrink:0;}
.pgrid5{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin-bottom:10px;}
.pc{border-radius:var(--rs);padding:8px 4px;text-align:center;}
.pc.passed{background:#F1F5F9;color:#94A3B8;}.pc.next{background:linear-gradient(135deg,#1E3A5F,#0D9488);color:white;}.pc.upcoming{background:white;border:1px solid rgba(0,0,0,.07);color:var(--navy);}
.pc-icon{font-size:16px;margin-bottom:3px;}.pc-name{font-size:9px;font-weight:800;text-transform:uppercase;}.pc-time{font-size:10px;font-weight:700;margin-top:2px;}
.qibla-wrap{width:160px;height:160px;margin:0 auto 10px;position:relative;}
.qibla-outer{width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#1E3A5F,#0D9488);display:flex;align-items:center;justify-content:center;box-shadow:0 8px 30px rgba(30,58,95,.3);position:relative;}
.qibla-ring{position:absolute;inset:10px;border-radius:50%;border:1px solid rgba(255,255,255,.2);}
.qibla-dirs{position:absolute;inset:0;pointer-events:none;}
.qd{position:absolute;font-size:10px;color:rgba(255,255,255,.7);font-weight:700;}
.qd.n{top:8px;left:50%;transform:translateX(-50%);}
.qd.s{bottom:8px;left:50%;transform:translateX(-50%);}
.qd.e{right:8px;top:50%;transform:translateY(-50%);}
.qd.w{left:8px;top:50%;transform:translateY(-50%);}
.qibla-arrow{font-size:38px;transition:transform .3s ease;}
.tb-btn-wrap{text-align:center;}
.tasbeeh-btn{width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,#1E3A5F,#0D9488);border:none;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto;box-shadow:0 6px 24px rgba(30,58,95,.3);}
.tasbeeh-btn:active{transform:scale(.93);}
.tn{font-family:'Fredoka One',cursive;font-size:32px;line-height:1;}.tl{font-size:10px;opacity:.7;}
.treset{margin-top:10px;background:none;border:1px solid rgba(0,0,0,.1);border-radius:20px;padding:5px 16px;cursor:pointer;font-size:11px;color:var(--muted);font-family:'Nunito',sans-serif;}
.arabic{font-family:'Amiri',serif;font-size:18px;direction:rtl;text-align:right;color:var(--navy);line-height:1.8;}
.translit{font-style:italic;color:var(--teal);font-size:12px;margin:3px 0;}
.meaning{font-size:11px;color:var(--muted);}
.dua-card{background:white;border-radius:var(--rs);padding:14px;border-left:3px solid var(--teal);margin-bottom:8px;box-shadow:var(--sh);}
.dua-t{font-size:10px;text-transform:uppercase;letter-spacing:.5px;color:var(--teal);font-weight:800;margin-bottom:7px;}
.ram-grid{display:grid;grid-template-columns:repeat(10,1fr);gap:4px;margin-top:8px;}
.rd{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;cursor:pointer;}
.rd.fasted{background:var(--teal);color:white;}.rd.today-r{background:var(--amber);color:white;}.rd.unfasted{background:#F1F5F9;color:#94A3B8;}
.kids-banner{background:linear-gradient(135deg,#FF6B6B,#FF8E53,#FFC93C);border-radius:var(--r);padding:16px;color:white;text-align:center;margin-bottom:10px;}
.ktabs{display:flex;gap:6px;margin-bottom:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;}
.ktabs::-webkit-scrollbar{display:none;}
.ktab{padding:7px 14px;border-radius:25px;border:none;font-family:'Nunito',sans-serif;font-weight:800;font-size:12px;cursor:pointer;white-space:nowrap;}
.ktab.active{color:white;background:linear-gradient(135deg,#FF6B6B,#FFC93C);}
.ktab:not(.active){background:white;color:var(--mid);box-shadow:var(--sh);}
.alpha-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:5px;}
.ab{aspect-ratio:1;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Fredoka One',cursive;font-size:16px;cursor:pointer;background:white;box-shadow:var(--sh);}
.ab:active{transform:scale(1.15);}
.math-box{background:linear-gradient(135deg,#EDE9FE,#E0F2FE);border-radius:var(--r);padding:18px;text-align:center;}
.math-q{font-family:'Fredoka One',cursive;font-size:30px;color:var(--navy);margin-bottom:12px;}
.math-opts{display:grid;grid-template-columns:1fr 1fr;gap:7px;max-width:220px;margin:0 auto;}
.mo{padding:10px;border-radius:10px;border:2px solid rgba(0,0,0,.08);background:white;font-family:'Fredoka One',cursive;font-size:18px;cursor:pointer;color:var(--navy);}
.mo:active{transform:scale(.95);}
.mo.correct{background:#16A34A;color:white;border-color:#16A34A;}
.mo.wrong{background:#EF4444;color:white;border-color:#EF4444;}
.story-card{background:white;border-radius:var(--r);padding:12px;cursor:pointer;box-shadow:var(--sh);margin-bottom:8px;}
.story-card:active{opacity:.85;}
.draw-toolbar{display:flex;gap:5px;align-items:center;padding:7px;background:white;border-radius:var(--rs) var(--rs) 0 0;border-bottom:1px solid rgba(0,0,0,.07);flex-wrap:wrap;}
.csw{width:22px;height:22px;border-radius:50%;cursor:pointer;border:2px solid transparent;flex-shrink:0;}
.csw:active,.csw.sel{transform:scale(1.3);border-color:var(--navy);}
.draw-cv{display:block;width:100%;background:white;border-radius:0 0 var(--rs) var(--rs);touch-action:none;}
.cr{display:flex;align-items:center;gap:10px;padding:10px;background:white;border-radius:var(--rs);margin-bottom:6px;cursor:pointer;border:1px solid rgba(0,0,0,.05);box-shadow:var(--sh);}
.cr:active{background:var(--cream);}
.cr-av{width:44px;height:44px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;background:var(--soft);position:relative;}
.cr-n{font-size:13px;font-weight:800;color:var(--navy);}
.cr-p{font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px;}
.ubadge{background:#EF4444;color:white;font-size:9px;font-weight:800;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.chat-win{display:flex;flex-direction:column;height:100%;overflow:hidden;}
.cw-hd{padding:10px 12px;background:var(--navy);color:white;display:flex;align-items:center;gap:10px;flex-shrink:0;}
.cw-back{background:none;border:none;color:white;font-size:20px;cursor:pointer;padding:0 4px 0 0;}
.cw-acts{margin-left:auto;display:flex;gap:6px;}
.cw-act{width:32px;height:32px;border-radius:8px;border:none;background:rgba(255,255,255,.15);color:white;font-size:15px;cursor:pointer;display:flex;align-items:center;justify-content:center;}
.chat-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:var(--cream);-webkit-overflow-scrolling:touch;}
.mw{display:flex;flex-direction:column;max-width:78%;}
.mw.sent{align-self:flex-end;align-items:flex-end;}
.mw.received{align-self:flex-start;align-items:flex-start;}
.ms{font-size:10px;font-weight:700;color:var(--muted);margin-bottom:2px;padding:0 3px;}
.mb-text{padding:8px 11px;border-radius:13px;font-size:13px;line-height:1.5;word-break:break-word;}
.sent .mb-text{background:linear-gradient(135deg,#1E3A5F,#0D9488);color:white;border-bottom-right-radius:3px;}
.received .mb-text{background:white;color:var(--text);border-bottom-left-radius:3px;box-shadow:0 1px 3px rgba(0,0,0,.08);}
.mt-msg{font-size:9px;color:var(--muted);margin-top:2px;padding:0 3px;}
.chat-inp-wrap{flex-shrink:0;background:white;border-top:1px solid rgba(0,0,0,.07);padding:8px 10px;display:flex;align-items:flex-end;gap:7px;}
.chat-inp{flex:1;padding:9px 13px;border-radius:22px;border:1.5px solid rgba(0,0,0,.1);font-family:'Nunito',sans-serif;font-size:14px;outline:none;background:var(--cream);resize:none;min-height:38px;max-height:100px;line-height:1.4;overflow-y:auto;}
.chat-inp:focus{border-color:var(--amber);}
.send-btn{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#F59E0B,#EF4444);border:none;cursor:pointer;font-size:16px;color:white;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.send-btn:active{transform:scale(.93);}
.em-row{padding:6px 10px;background:white;display:flex;flex-wrap:wrap;gap:6px;border-top:1px solid rgba(0,0,0,.07);}
.typing-ind{font-size:11px;color:var(--muted);font-style:italic;padding:0 14px 4px;}
.call-overlay{position:fixed;inset:0;background:linear-gradient(135deg,#1E3A5F,#0D9488);z-index:999;display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;}
.call-av{font-size:70px;margin-bottom:12px;}
.call-name{font-family:'Fredoka One',cursive;font-size:28px;margin-bottom:6px;}
.call-status{font-size:14px;opacity:.7;margin-bottom:40px;}
.call-btns{display:flex;gap:20px;}
.call-btn{width:60px;height:60px;border-radius:50%;border:none;font-size:24px;cursor:pointer;}
.call-end{background:#EF4444;}.call-accept{background:#22C55E;}.call-mute{background:rgba(255,255,255,.2);}
.mem-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.mem-card{background:white;border-radius:var(--r);overflow:hidden;cursor:pointer;box-shadow:var(--sh);border:1px solid rgba(0,0,0,.04);}
.mem-card:active{opacity:.85;}
.mem-th{height:90px;display:flex;align-items:center;justify-content:center;font-size:36px;position:relative;}
.mem-lock{position:absolute;inset:0;background:rgba(30,58,95,.82);display:flex;flex-direction:column;align-items:center;justify-content:center;color:white;gap:2px;}
.mem-bd{padding:8px;}
.mem-type{font-size:9px;text-transform:uppercase;letter-spacing:.4px;font-weight:700;}
.mem-ttl{font-size:12px;font-weight:800;color:var(--navy);margin:2px 0;}
.mem-dt{font-size:10px;color:var(--muted);}
.mem-ft{display:flex;justify-content:space-between;padding:6px 8px;background:var(--cream);border-top:1px solid rgba(0,0,0,.04);font-size:10px;}
.sos-btn{width:150px;height:150px;border-radius:50%;background:linear-gradient(135deg,#EF4444,#DC2626);border:7px solid #FEE2E2;cursor:pointer;color:white;display:flex;flex-direction:column;align-items:center;justify-content:center;margin:0 auto 16px;box-shadow:0 8px 35px rgba(239,68,68,.4);}
.sos-btn:active{transform:scale(.95);}
.sos-alert{background:linear-gradient(135deg,#FEE2E2,#FECACA);border:2px solid #FCA5A5;border-radius:var(--r);padding:14px;margin-bottom:10px;animation:pulse 1.5s ease-in-out infinite;}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.3);}50%{box-shadow:0 0 0 8px rgba(239,68,68,0);}}
.ss{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);font-weight:700;margin:14px 0 7px;}
.si{background:white;border-radius:var(--rs);padding:12px 13px;display:flex;align-items:center;gap:11px;margin-bottom:6px;cursor:pointer;border:1px solid rgba(0,0,0,.05);}
.si:active{background:var(--cream);}
.si-ic{font-size:19px;flex-shrink:0;}
.si-t{font-size:13px;font-weight:700;color:var(--navy);}
.si-d{font-size:11px;color:var(--muted);margin-top:1px;}
.toggle{width:38px;height:21px;border-radius:11px;cursor:pointer;transition:background .25s;position:relative;border:none;flex-shrink:0;}
.toggle.on{background:var(--teal);}.toggle.off{background:#CBD5E0;}
.toggle::after{content:'';position:absolute;top:2.5px;width:16px;height:16px;border-radius:50%;background:white;transition:left .25s;box-shadow:0 1px 3px rgba(0,0,0,.2);}
.toggle.on::after{left:19px;}.toggle.off::after{left:3px;}
.about-card{background:linear-gradient(135deg,#1E3A5F,#0D9488);border-radius:var(--r);padding:20px;color:white;text-align:center;margin-bottom:10px;}
.about-q{background:rgba(245,158,11,.15);border-radius:10px;padding:10px 13px;border-left:3px solid #F59E0B;text-align:left;margin-top:12px;}
.ob{position:fixed;inset:0;background:linear-gradient(160deg,#1E3A5F,#0D9488);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;z-index:1000;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.ob-card{background:white;border-radius:18px;padding:20px;width:100%;max-width:380px;}
.ob-h{font-family:'Fredoka One',cursive;font-size:17px;color:var(--navy);margin-bottom:14px;}
.ob-lbl{font-size:11px;font-weight:700;color:var(--mid);margin-bottom:5px;display:block;}
.ob-inp{width:100%;padding:11px 13px;border-radius:11px;border:1.5px solid rgba(0,0,0,.1);font-family:'Nunito',sans-serif;font-size:14px;outline:none;margin-bottom:11px;background:white;-webkit-appearance:none;}
.ob-inp:focus{border-color:var(--amber);}
.ob-btn{width:100%;padding:12px;border-radius:12px;border:none;background:linear-gradient(135deg,#F59E0B,#EF4444);color:white;font-family:'Fredoka One',cursive;font-size:17px;cursor:pointer;margin-top:3px;}
.ob-btn:disabled{opacity:.6;}
.ob-or{text-align:center;color:var(--muted);font-size:12px;margin:12px 0;font-weight:600;}
.ob-join{width:100%;padding:11px;border-radius:12px;border:2px solid var(--amber);background:transparent;color:var(--amber);font-family:'Fredoka One',cursive;font-size:16px;cursor:pointer;}
.role-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:12px;}
.rb{padding:9px 5px;border-radius:10px;border:2px solid rgba(0,0,0,.08);background:white;font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;cursor:pointer;text-align:center;}
.rb:active,.rb.sel{border-color:var(--amber);background:#FEF3C7;}
.rb-e{font-size:18px;display:block;margin-bottom:2px;}
.mo-overlay{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:500;display:flex;align-items:flex-end;justify-content:center;}
.modal{background:white;border-radius:18px 18px 0 0;padding:18px;width:100%;max-width:480px;max-height:88vh;overflow-y:auto;-webkit-overflow-scrolling:touch;}
.modal-t{font-family:'Fredoka One',cursive;font-size:18px;color:var(--navy);margin-bottom:14px;}
.notif-panel{position:fixed;top:60px;left:10px;right:10px;background:white;border-radius:var(--r);box-shadow:0 8px 30px rgba(0,0,0,.15);z-index:300;padding:12px;border:1px solid rgba(0,0,0,.07);}
.ni-item{display:flex;gap:8px;padding:8px 0;border-bottom:1px solid rgba(0,0,0,.04);}
.ni-item:last-child{border-bottom:none;}
.score-box{background:linear-gradient(135deg,#F59E0B,#EF4444);border-radius:var(--r);padding:14px;color:white;text-align:center;margin-bottom:10px;}
.score-v{font-family:'Fredoka One',cursive;font-size:42px;line-height:1;}
.chal{display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--rs);border:1px solid rgba(0,0,0,.06);background:white;margin-bottom:7px;cursor:pointer;box-shadow:var(--sh);}
.chal.done{background:#F0FDF4;border-color:#86EFAC;}
.invite-box{background:#FEF3C7;border-radius:10px;padding:10px 12px;}
.invite-code{font-family:monospace;font-size:18px;font-weight:900;color:var(--amber);letter-spacing:2px;}
.fade{animation:fadeUp .3s ease;}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.txt-c{text-align:center;}.txt-m{color:var(--muted);font-size:11px;}
.row{display:flex;align-items:center;gap:8px;}.flex1{flex:1;min-width:0;}
.mt8{margin-top:8px;}.mb10{margin-bottom:10px;}
.btn{padding:8px 14px;border-radius:10px;border:none;font-family:'Nunito',sans-serif;font-weight:800;font-size:12px;cursor:pointer;}
.btn:active{opacity:.85;}
.btn-p{background:var(--navy);color:white;}.btn-a{background:var(--amber);color:white;}
.btn-sm{padding:6px 11px;font-size:11px;border-radius:8px;}
.sec-t{font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);font-weight:700;margin:12px 0 7px;}
.footer{text-align:center;padding:14px;font-size:10px;color:var(--muted);}
.inp{width:100%;padding:10px 13px;border-radius:11px;border:1.5px solid rgba(0,0,0,.1);font-family:'Nunito',sans-serif;font-size:13px;outline:none;margin-bottom:10px;-webkit-appearance:none;}
.inp:focus{border-color:var(--amber);}
.spin{width:28px;height:28px;border-radius:50%;border:3px solid var(--soft);border-top-color:var(--amber);animation:spin .7s linear infinite;margin:0 auto;}
@keyframes spin{to{transform:rotate(360deg);}}
.conn-bar{background:#22C55E;color:white;text-align:center;font-size:10px;font-weight:700;padding:3px;flex-shrink:0;}
.conn-bar.off{background:#EF4444;}
`;

// Drawing Board
function DrawingBoard() {
  const ref = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#1E3A5F");
  const [size, setSize] = useState(4);
  const last = useRef(null);
  const COLORS = ["#1E3A5F","#EF4444","#F59E0B","#16A34A","#7C3AED","#0EA5E9","#EC4899","#000","#fff"];

  useEffect(() => {
    const c = ref.current; if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr; c.height = 240 * dpr;
    const ctx = c.getContext("2d"); ctx.scale(dpr, dpr);
    ctx.fillStyle = "white"; ctx.fillRect(0, 0, c.offsetWidth, 240);
  }, []);

  const getPos = (e, c) => {
    const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left) * (c.width / r.width / dpr), y: (src.clientY - r.top) * (c.height / r.height / dpr) };
  };
  const start = useCallback((e) => { e.preventDefault(); last.current = getPos(e, ref.current); setDrawing(true); }, []);
  const move = useCallback((e) => {
    e.preventDefault(); if (!drawing) return;
    const c = ref.current, ctx = c.getContext("2d"), pos = getPos(e, c);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.stroke(); last.current = pos;
  }, [drawing, color, size]);
  const stop = useCallback(() => setDrawing(false), []);
  const clear = () => { const c = ref.current, ctx = c.getContext("2d"); ctx.fillStyle="white"; ctx.fillRect(0,0,c.offsetWidth,240); };

  return (
    <div className="card">
      <div className="card-hd"><div className="card-t">🎨 Drawing Board</div><button className="card-lnk" onClick={clear}>Clear</button></div>
      <div className="draw-toolbar">
        {COLORS.map(cl => <div key={cl} className={`csw${color===cl?" sel":""}`} style={{background:cl,border:cl==="#fff"?"2px solid #CBD5E0":undefined}} onClick={()=>setColor(cl)} />)}
        <select value={size} onChange={e=>setSize(+e.target.value)} style={{marginLeft:"auto",padding:"3px 6px",borderRadius:7,border:"1px solid rgba(0,0,0,.1)",fontFamily:"Nunito",fontSize:11}}>
          <option value={2}>Thin</option><option value={4}>Medium</option><option value={8}>Thick</option>
        </select>
      </div>
      <canvas ref={ref} className="draw-cv" style={{height:240}}
        onMouseDown={start} onMouseMove={move} onMouseUp={stop} onMouseLeave={stop}
        onTouchStart={start} onTouchMove={move} onTouchEnd={stop} />
    </div>
  );
}

function OnboardingSlides({ onDone }) {
  const [slide, setSlide] = useState(0);
  const SLIDES = [
    {bg:"linear-gradient(135deg,#1E3A5F,#0D9488)",icon:"🏠",title:"Welcome to FamilyVerse",sub:"Your private family universe",desc:"One app for your whole family — health, chat, faith, memories and safety. All in one private place."},
    {bg:"linear-gradient(135deg,#6366F1,#8B5CF6)",icon:"✨",title:"Everything In One Place",sub:"6 powerful features",features:[{e:"💬",t:"Real-time Family Chat"},{e:"❤️",t:"Health & Medicine"},{e:"☪️",t:"Prayer Times & Qibla"},{e:"🤖",t:"AI Health Assistant"},{e:"📸",t:"Memory Capsule"},{e:"🆘",t:"Emergency SOS"}]},
    {bg:"linear-gradient(135deg,#0D9488,#22C55E)",icon:"🔒",title:"100% Private & Secure",sub:"Only your family",desc:"Secret invite code. No strangers. No ads. More private than WhatsApp."},
    {bg:"linear-gradient(135deg,#F59E0B,#EF4444)",icon:"🚀",title:"Ready to Connect!",sub:"Takes 1 minute",steps:[{n:"1",t:"Create your family"},{n:"2",t:"Share the invite code"},{n:"3",t:"Family joins instantly"},{n:"4",t:"Start using together! 🎉"}]},
  ];
  const s=SLIDES[slide],isLast=slide===SLIDES.length-1;
  return(
    <div style={{position:"fixed",inset:0,background:s.bg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"30px 24px",zIndex:2000}}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}} .ob-slide{animation:fadeUp .35s ease;}`}</style>
      <button onClick={onDone} style={{position:"absolute",top:50,right:20,background:"rgba(255,255,255,.2)",border:"none",color:"white",padding:"6px 16px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"inherit"}}>Skip</button>
      <div className="ob-slide" key={slide} style={{textAlign:"center",maxWidth:340,width:"100%"}}>
        <div style={{fontSize:64,marginBottom:12,lineHeight:1}}>{s.icon}</div>
        <div style={{fontSize:24,fontWeight:800,color:"white",marginBottom:6,lineHeight:1.2}}>{s.title}</div>
        <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginBottom:24}}>{s.sub}</div>
        {s.desc&&<div style={{fontSize:14,color:"rgba(255,255,255,.9)",lineHeight:1.8,background:"rgba(255,255,255,.12)",borderRadius:16,padding:"16px 20px"}}>{s.desc}</div>}
        {s.features&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>{s.features.map((f,i)=><div key={i} style={{background:"rgba(255,255,255,.15)",borderRadius:14,padding:"12px 10px",display:"flex",alignItems:"center",gap:8}}><span style={{fontSize:22}}>{f.e}</span><span style={{fontSize:12,fontWeight:600,color:"white",textAlign:"left"}}>{f.t}</span></div>)}</div>}
        {s.steps&&<div style={{display:"flex",flexDirection:"column",gap:10}}>{s.steps.map((st,i)=><div key={i} style={{background:"rgba(255,255,255,.15)",borderRadius:14,padding:"12px 16px",display:"flex",alignItems:"center",gap:14}}><div style={{width:32,height:32,borderRadius:"50%",background:"rgba(255,255,255,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,fontWeight:800,color:"white",flexShrink:0}}>{st.n}</div><span style={{fontSize:14,fontWeight:600,color:"white"}}>{st.t}</span></div>)}</div>}
      </div>
      <div style={{position:"absolute",bottom:50,left:24,right:24}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:20}}>{SLIDES.map((_,i)=><div key={i} onClick={()=>setSlide(i)} style={{width:i===slide?24:8,height:8,borderRadius:4,background:i===slide?"white":"rgba(255,255,255,.35)",transition:"all .3s",cursor:"pointer"}}/>)}</div>
        <button onClick={()=>isLast?onDone():setSlide(s=>s+1)} style={{width:"100%",padding:"15px 20px",borderRadius:14,border:"none",background:"white",color:"#1E3A5F",fontFamily:"inherit",fontWeight:800,fontSize:16,cursor:"pointer"}}>{isLast?"Let's Get Started! 🚀":"Next →"}</button>
      </div>
    </div>
  );
}


export default function FamilyVerse() {
  const [session, setSession] = useState(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const savedSession = LS.get("session", null);
    if (savedSession) setSession(savedSession);
    if (!LS.get("ob_done", false)) setShowOnboarding(true);
    setMyMood(LS.get("myMood", "happy"));
  }, []);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [obMode, setObMode] = useState("create");
  const [obStep, setObStep] = useState(1);
  const [obData, setObData] = useState({ familyName:"", userName:"", role:"Father", city:"Hyderabad", password:"", joinCode:"" });
  const [obLoading, setObLoading] = useState(false);

  const [page, setPage] = useState("dashboard");
  const [openChat, setOpenChat] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showNotif, setShowNotif] = useState(false);
  const [sosActive, setSosActive] = useState(false);
  const [kidsTab, setKidsTab] = useState("alphabet");
  const [mathQ, setMathQ] = useState(genMath);
  const [mathRes, setMathRes] = useState(null);
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));

  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddMem, setShowAddMem] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showAddApt, setShowAddApt] = useState(false);

  const [fmMed, setFmMed] = useState({ name:"", time:"", member:"" });
  const [fmMem, setFmMem] = useState({ title:"", emoji:"⭐", lockedUntil:"" });
  const [fmLog, setFmLog] = useState({ text:"", member:"", bloodSugar:"", bloodPressure:"" });
  const [fmApt, setFmApt] = useState({ doctorName:"", specialty:"", date:"", member:"", notes:"" });
  const [chatInput, setChatInput] = useState("");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [memories, setMemories] = useState([]);
  const [healthLogs, setHealthLogs] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prayerTimes, setPrayerTimes] = useState([]);
  const [qiblaDir, setQiblaDir] = useState(null);
  const [compassHeading, setCompassHeading] = useState(0);
  const [myMood, setMyMood] = useState("happy");
  const [water, setWater] = useState(() => LS.get("water", 0));
  const [tasbeeh, setTasbeeh] = useState(0);
  const [ramadan, setRamadan] = useState(() => LS.get("ramadan", Array(30).fill("unfasted")));
  const [settings, setSettings] = useState(() => LS.get("settings", { notifications:true, prayerAlerts:true }));
  const [challenges, setChallenges] = useState(() => LS.get("challenges", [
    {id:1,t:"Hydration Hero",d:"Drink 8 glasses of water",e:"💧",pts:10,done:false},
    {id:2,t:"Prayer Champion",d:"Complete all 5 prayers",e:"🕌",pts:20,done:false},
    {id:3,t:"Helper of the Day",d:"Help a family member",e:"🤝",pts:15,done:false},
    {id:4,t:"Gratitude Moment",d:"Tell someone you love them",e:"💝",pts:10,done:false},
    {id:5,t:"Learning Star",d:"20 mins reading/studying",e:"📚",pts:15,done:false},
  ]));
  const [typingUser, setTypingUser] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const msgsEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const T = session?.token;

  // Load prayer times from Aladhan API
  const loadPrayerTimes = useCallback(async (city) => {
    try {
      const resp = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city||"Hyderabad")}&country=IN&method=1`);
      const data = await resp.json();
      if (data.code === 200) {
        const t = data.data.timings;
        const now = new Date();
        const nowMins = now.getHours() * 60 + now.getMinutes();
        const parsed = PRAYER_NAMES.map((n, i) => {
          const [h, m] = t[n].split(":").map(Number);
          const ampm = h >= 12 ? "PM" : "AM";
          const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
          return { name:n, icon:PRAYER_ICONS[i], time:`${h12}:${String(m).padStart(2,"0")} ${ampm}`, passed: nowMins > h*60+m };
        });
        setPrayerTimes(parsed);
      }
    } catch {
      const h = new Date().getHours();
      setPrayerTimes([
        {name:"Fajr",icon:"🌙",time:"05:12 AM",passed:h>=5},
        {name:"Dhuhr",icon:"☀️",time:"12:30 PM",passed:h>=12},
        {name:"Asr",icon:"🌤️",time:"03:45 PM",passed:h>=15},
        {name:"Maghrib",icon:"🌅",time:"06:28 PM",passed:h>=18},
        {name:"Isha",icon:"🌃",time:"07:55 PM",passed:h>=20},
      ]);
    }
  }, []);

  // Real Qibla direction from GPS
  const loadQibla = useCallback(() => {
    if (!navigator.geolocation) { setQiblaDir(290); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords;
        const resp = await fetch(`https://api.aladhan.com/v1/qibla/${latitude}/${longitude}`);
        const data = await resp.json();
        if (data.code === 200) setQiblaDir(Math.round(data.data.direction));
        else setQiblaDir(290);
      } catch { setQiblaDir(290); }
    }, () => setQiblaDir(290));
  }, []);

  // Compass
  useEffect(() => {
    const handler = (e) => { if (e.alpha !== null) setCompassHeading(e.alpha); };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  // Socket connection
  const connectSocket = useCallback(async (token) => {
    try {
      const { io } = await import("socket.io-client");
      const socket = io(API, { auth: { token }, transports: ["websocket","polling"], reconnection: true });
      socket.on("connect", () => setSocketConnected(true));
      socket.on("disconnect", () => setSocketConnected(false));
      socket.on("newMessage", (msg) => setMessages(prev => prev.find(m=>m._id===msg._id) ? prev : [...prev, msg]));
      socket.on("userTyping", ({ name, typing }) => setTypingUser(typing ? name : null));
      socket.on("memberOnline", ({ name }) => setMembers(p => p.map(m => m.name===name ? {...m,online:true} : m)));
      socket.on("memberOffline", ({ name }) => setMembers(p => p.map(m => m.name===name ? {...m,online:false} : m)));
      socket.on("memberMoodUpdated", ({ name, mood }) => setMembers(p => p.map(m => m.name===name ? {...m,mood} : m)));
      socket.on("sosReceived", ({ from }) => alert(`🚨 SOS! ${from} needs help! Check on them immediately!`));
      socket.on("incomingCall", (data) => setIncomingCall(data));
      socket.on("callEnded", () => { setActiveCall(null); setIncomingCall(null); });
      socket.on("callRejected", () => { setActiveCall(null); alert("Call declined."); });
      socketRef.current = socket;
    } catch (e) { console.log("Socket error:", e.message); }
  }, []);

  // Load all data
  const loadData = useCallback(async (token, city) => {
    setLoading(true);
    try {
      const [fam, meds, mems, logs, apts] = await Promise.allSettled([
        api("GET", "/family/members", null, token),
        api("GET", "/health/medicines", null, token),
        api("GET", "/memories", null, token),
        api("GET", "/health/logs", null, token),
        api("GET", "/health/appointments", null, token),
      ]);
      if (fam.status==="fulfilled") setMembers(fam.value.members||[]);
      if (meds.status==="fulfilled") setMedicines(meds.value||[]);
      if (mems.status==="fulfilled") setMemories(mems.value||[]);
      if (logs.status==="fulfilled") setHealthLogs(logs.value||[]);
      if (apts.status==="fulfilled") setAppointments(apts.value||[]);
      await loadPrayerTimes(city);
      loadQibla();
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, [loadPrayerTimes, loadQibla]);

  const loadMessages = async (chatId) => {
    try { const msgs = await api("GET", `/messages/${chatId}`, null, T); setMessages(msgs||[]); } catch {}
  };

  useEffect(() => {
    if (session?.token) {
      loadData(session.token, session.city);
      connectSocket(session.token);
      loadMessages("group");
    }
    return () => socketRef.current?.disconnect();
  }, [session]);

  useEffect(() => { LS.set("water", water); }, [water]);
  useEffect(() => { LS.set("challenges", challenges); }, [challenges]);
  useEffect(() => { LS.set("ramadan", ramadan); }, [ramadan]);
  useEffect(() => { LS.set("settings", settings); }, [settings]);
  useEffect(() => { msgsEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages, openChat]);

  // ONBOARDING
  const createFamily = async () => {
    if (!obData.familyName.trim()||!obData.userName.trim()||!obData.password.trim()) return alert("Please fill all fields including password!");
    setObLoading(true);
    try {
      const data = await api("POST", "/family/create", { familyName:obData.familyName, userName:obData.userName, role:obData.role, password:obData.password, city:obData.city });
      const sess = { token:data.token, member:data.member, family:data.family, city:data.family.city };
      LS.set("session", sess); setSession(sess);
    } catch(e) { alert("Error: " + e.message); }
    finally { setObLoading(false); }
  };

  const joinFamily = async () => {
    if (!obData.joinCode.trim()||!obData.userName.trim()||!obData.password.trim()) return alert("Enter invite code, your name and a password!");
    setObLoading(true);
    try {
      const data = await api("POST", "/family/join", { inviteCode:obData.joinCode.trim().toUpperCase(), userName:obData.userName, role:obData.role, password:obData.password });
      const sess = { token:data.token, member:data.member, family:data.family, city:data.family.city };
      LS.set("session", sess); setSession(sess);
    } catch(e) { alert("❌ " + e.message); }
    finally { setObLoading(false); }
  };

  if (!session) {
    return (
      <>
        <style>{CSS}</style>
        <div className="ob">
          <div style={{fontSize:52,marginBottom:10}}>🏠</div>
          <div style={{fontFamily:"Fredoka One,cursive",fontSize:28,color:"white",marginBottom:3}}>FamilyVerse</div>
          <div style={{fontSize:13,color:"rgba(255,255,255,.55)",marginBottom:24,textAlign:"center"}}>Your private family universe ✨</div>
          <div className="ob-card">
            {obMode==="create" && obStep===1 && (
              <>
                <div className="ob-h">Create Your Family 👨‍👩‍👧‍👦</div>
                <label className="ob-lbl">Family Name *</label>
                <input className="ob-inp" placeholder="e.g. Al-Rashid Family" value={obData.familyName} onChange={e=>setObData({...obData,familyName:e.target.value})} />
                <label className="ob-lbl">Your Name *</label>
                <input className="ob-inp" placeholder="e.g. Ahmad" value={obData.userName} onChange={e=>setObData({...obData,userName:e.target.value})} />
                <label className="ob-lbl">City (for prayer times)</label>
                <input className="ob-inp" placeholder="e.g. Hyderabad" value={obData.city} onChange={e=>setObData({...obData,city:e.target.value})} />
                <label className="ob-lbl">Password *</label>
                <input className="ob-inp" type="password" placeholder="Create a password" value={obData.password} onChange={e=>setObData({...obData,password:e.target.value})} />
                <button className="ob-btn" onClick={()=>{ if(!obData.familyName.trim()||!obData.userName.trim()||!obData.password.trim()) return alert("Fill all fields!"); setObStep(2); }}>Next → Choose Role</button>
                <div className="ob-or">— or —</div>
                <button className="ob-join" onClick={()=>setObMode("join")}>Join Existing Family 🔑</button>
              </>
            )}
            {obMode==="create" && obStep===2 && (
              <>
                <div className="ob-h">Your Role in the Family</div>
                <div className="role-grid">
                  {ROLES.map(r=><button key={r} className={`rb${obData.role===r?" sel":""}`} onClick={()=>setObData({...obData,role:r})}><span className="rb-e">{ROLE_EMOJI[r]||"👤"}</span>{r}</button>)}
                </div>
                <button className="ob-btn" onClick={createFamily} disabled={obLoading}>{obLoading?"Creating...":"Create Family Universe 🚀"}</button>
                <button onClick={()=>setObStep(1)} style={{width:"100%",marginTop:8,background:"none",border:"none",color:"var(--muted)",fontFamily:"Nunito",fontSize:12,cursor:"pointer",padding:"6px"}}>← Back</button>
              </>
            )}
            {obMode==="join" && (
              <>
                <div className="ob-h">Join Your Family 🔑</div>
                <label className="ob-lbl">Family Invite Code *</label>
                <input className="ob-inp" placeholder="e.g. FAM-XY2AB" value={obData.joinCode} onChange={e=>setObData({...obData,joinCode:e.target.value})} style={{textTransform:"uppercase",letterSpacing:2,fontFamily:"monospace",fontSize:16}} />
                <label className="ob-lbl">Your Name *</label>
                <input className="ob-inp" placeholder="e.g. Fatima" value={obData.userName} onChange={e=>setObData({...obData,userName:e.target.value})} />
                <label className="ob-lbl">Password *</label>
                <input className="ob-inp" type="password" placeholder="Set your password" value={obData.password} onChange={e=>setObData({...obData,password:e.target.value})} />
                <label className="ob-lbl">Your Role</label>
                <div className="role-grid">
                  {ROLES.slice(0,6).map(r=><button key={r} className={`rb${obData.role===r?" sel":""}`} onClick={()=>setObData({...obData,role:r})}><span className="rb-e">{ROLE_EMOJI[r]||"👤"}</span>{r}</button>)}
                </div>
                <button className="ob-btn" onClick={joinFamily} disabled={obLoading}>{obLoading?"Joining...":"Join Family ✅"}</button>
                <button onClick={()=>setObMode("create")} style={{width:"100%",marginTop:8,background:"none",border:"none",color:"var(--muted)",fontFamily:"Nunito",fontSize:12,cursor:"pointer",padding:"6px"}}>← Create New Family Instead</button>
              </>
            )}
          </div>
          <div style={{fontSize:10,color:"rgba(255,255,255,.3)",marginTop:14}}>Crafted with ❤️ by Syed Muzamil</div>
        </div>
      </>
    );
  }

  const me = session.member;
  const family = session.family;
  const now = new Date();
  const h = now.getHours();
  const greeting = h<5?"Good Night 🌃":h<12?"Good Morning 🌅":h<17?"Good Afternoon ☀️":h<20?"Good Evening 🌙":"Good Night 🌃";
  const dateStr = now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"});
  const nextPrayer = prayerTimes.find(p=>!p.passed);
  const doneCount = challenges.filter(c=>c.done).length;
  const happiness = challenges.length ? Math.round((doneCount/challenges.length)*100) : 0;
  const unreadMsgs = messages.filter(m=>m.sender!==me.name&&!m.read).length;
  const quote = QUOTES[quoteIdx];

  const sendMessage = () => {
    if (!chatInput.trim()) return;
    const chatId = openChat?.id==="group" ? "group" : [me.name, openChat?.name].sort().join("-");
    if (socketRef.current?.connected) {
      socketRef.current.emit("sendMessage", { chatId, text:chatInput.trim(), senderEmoji:me.emoji, type:"text" });
    } else {
      api("POST","/messages",{ chatId, text:chatInput.trim(), senderEmoji:me.emoji },T).then(msg=>setMessages(p=>[...p,msg])).catch(()=>{});
    }
    setChatInput(""); setShowEmoji(false);
    clearTimeout(typingTimeout.current);
    socketRef.current?.emit("typing",{ chatId, typing:false });
  };

  const handleTyping = (val) => {
    setChatInput(val);
    socketRef.current?.emit("typing",{ chatId:"group", typing:true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(()=>socketRef.current?.emit("typing",{chatId:"group",typing:false}), 2000);
  };

  const startCall = (member, type) => {
    setActiveCall({ to:member.name, toEmoji:member.emoji, type, status:"calling" });
    socketRef.current?.emit("callOffer",{ to:member.name, fromEmoji:me.emoji, type });
  };

  const endCall = () => {
    if (activeCall) socketRef.current?.emit("endCall",{ to:activeCall.to });
    if (incomingCall) socketRef.current?.emit("callReject",{ to:incomingCall.from });
    setActiveCall(null); setIncomingCall(null);
  };

  const askAI = async () => {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    try {
      const data = await api("POST","/health/ai-advice",{ note:aiQuery, member:me.name },T);
      setAiResponse(data.advice);
    } catch { setAiResponse("AI assistant unavailable. Make sure ANTHROPIC_API_KEY is set in Railway."); }
    finally { setAiLoading(false); }
  };

  const EMOJIS = ["❤️","😊","🥰","😂","🙏","🌙","✨","🎉","💪","👍","🤲","🌹","💝","🍕","🏠","⭐"];

  const NAV = [
    {id:"dashboard",icon:"🏠",l:"Home"},
    {id:"health",icon:"🏥",l:"Health"},
    {id:"faith",icon:"🕌",l:"Faith"},
    {id:"kids",icon:"🌈",l:"Kids"},
    {id:"chat",icon:"💬",l:"Chat",badge:unreadMsgs},
    {id:"memories",icon:"📸",l:"Memories"},
    {id:"emergency",icon:"🆘",l:"SOS"},
    {id:"settings",icon:"⚙️",l:"More"},
  ];

  const PAGE_TITLES = { dashboard:family.familyName, health:"Health 🏥", faith:"Faith 🕌", kids:"Kids 🌈", chat:"Family Chat 💬", memories:"Memories 📸", emergency:"Emergency 🆘", settings:"Settings ⚙️" };

  if (incomingCall) return (
    <>
      <style>{CSS}</style>
      <div className="call-overlay">
        <div className="call-av">{incomingCall.fromEmoji||"👤"}</div>
        <div className="call-name">{incomingCall.from}</div>
        <div className="call-status">Incoming {incomingCall.type} call...</div>
        <div className="call-btns">
          <button className="call-btn call-end" onClick={endCall}>📵</button>
          <button className="call-btn call-accept" onClick={()=>{setActiveCall(incomingCall);setIncomingCall(null);}}>📞</button>
        </div>
      </div>
    </>
  );

  if (activeCall) return (
    <>
      <style>{CSS}</style>
      <div className="call-overlay">
        <div className="call-av">{activeCall.toEmoji||"👤"}</div>
        <div className="call-name">{activeCall.to||activeCall.from}</div>
        <div className="call-status">{activeCall.status==="calling"?"Calling...":"Connected ●"}</div>
        <div style={{fontSize:12,opacity:.5,marginBottom:30}}>{activeCall.type==="video"?"📹 Video Call":"📞 Voice Call"}</div>
        <div className="call-btns">
          <button className="call-btn call-mute">🔇</button>
          <button className="call-btn call-end" onClick={endCall}>📵</button>
          {activeCall.type==="video"&&<button className="call-btn call-mute">📷</button>}
        </div>
      </div>
    </>
  );

  if (page==="chat" && openChat) {
    const chatId = openChat.id==="group" ? "group" : [me.name, openChat.name].sort().join("-");
    const chatMsgs = messages.filter(m=>m.chatId===chatId||(openChat.id==="group"&&!m.chatId));
    return (
      <>
        <style>{CSS}</style>
        <div id="fv">
          <div className="chat-win">
            <div className="cw-hd">
              <button className="cw-back" onClick={()=>{setOpenChat(null);loadMessages("group");}}>←</button>
              <div style={{fontSize:26}}>{openChat.avatar||openChat.emoji||"👥"}</div>
              <div>
                <div style={{fontWeight:800,fontSize:14}}>{openChat.name}</div>
                <div style={{fontSize:10,opacity:.6}}>{openChat.id==="group"?`${members.length} members`:openChat.online?"● Online":"○ Offline"} {socketConnected?"🟢":""}</div>
              </div>
              <div className="cw-acts">
                {openChat.id!=="group" && <>
                  <button className="cw-act" onClick={()=>startCall(openChat,"audio")}>📞</button>
                  <button className="cw-act" onClick={()=>startCall(openChat,"video")}>📹</button>
                </>}
              </div>
            </div>
            <div className="chat-msgs">
              {chatMsgs.length===0&&<div className="txt-c" style={{padding:"30px 0"}}><div style={{fontSize:32,marginBottom:8}}>{openChat.avatar||"💬"}</div><div className="txt-m">Start a conversation!</div></div>}
              {chatMsgs.map((msg,i)=>{
                const isSelf = msg.sender===me.name;
                return (
                  <div key={msg._id||i} className={`mw ${isSelf?"sent":"received"}`}>
                    {!isSelf&&<div className="ms">{msg.senderEmoji} {msg.sender}</div>}
                    <div className="mb-text">{msg.text}</div>
                    <div className="mt-msg">{msg.timestamp?new Date(msg.timestamp).toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}):"Now"}{isSelf&&" ✓✓"}</div>
                  </div>
                );
              })}
              {typingUser&&typingUser!==me.name&&<div className="typing-ind">{typingUser} is typing...</div>}
              <div ref={msgsEndRef}/>
            </div>
            {showEmoji&&<div className="em-row">{EMOJIS.map(e=><span key={e} style={{fontSize:22,cursor:"pointer"}} onClick={()=>setChatInput(p=>p+e)}>{e}</span>)}</div>}
            <div className="chat-inp-wrap">
              <button style={{background:"none",border:"none",fontSize:20,cursor:"pointer",lineHeight:1}} onClick={()=>setShowEmoji(e=>!e)}>😊</button>
              <textarea className="chat-inp" value={chatInput} onChange={e=>handleTyping(e.target.value)} placeholder="Type a message..." rows={1} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} />
              <button className="send-btn" onClick={sendMessage}>➤</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  const Dashboard = () => (
    <div className="page fade">
      <div className="banner">
        <div className="bn-g">{greeting}</div>
        <div className="bn-n">{family.familyName} 🌟</div>
        <div className="bn-d">{dateStr}</div>
        <div className="bn-stats">
          <div className="bs"><div className="bs-n">{members.length}</div><div className="bs-l">Members</div></div>
          <div className="bs"><div className="bs-n">{doneCount}</div><div className="bs-l">Done</div></div>
          <div className="bs"><div className="bs-n">{happiness}%</div><div className="bs-l">Happy</div></div>
          <div className="bs"><div className="bs-n">{water}</div><div className="bs-l">Water</div></div>
        </div>
      </div>
      <div className="quote"><div className="quote-t">"{quote.t}"</div><div className="quote-a">— {quote.a}</div></div>
      <div className="qgrid">
        {[{l:"Health",s:`${medicines.filter(m=>!m.taken).length} reminders`,e:"🏥",bg:"linear-gradient(135deg,#EF4444,#DC2626)",pg:"health"},{l:"Prayer",s:nextPrayer?`Next: ${nextPrayer.name}`:"All done ✓",e:"🕌",bg:"linear-gradient(135deg,#0D9488,#0F766E)",pg:"faith"},{l:"Kids World",s:"Learn & Play",e:"🌈",bg:"linear-gradient(135deg,#F59E0B,#D97706)",pg:"kids"},{l:"Chat",s:unreadMsgs>0?`${unreadMsgs} new`:"Say salaam!",e:"💬",bg:"linear-gradient(135deg,#7C3AED,#5B21B6)",pg:"chat"}].map(a=>(
          <button key={a.l} className="qcard" style={{background:a.bg}} onClick={()=>setPage(a.pg)}><div className="qc-i">{a.e}</div><div className="qc-l">{a.l}</div><div className="qc-s">{a.s}</div></button>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">👨‍👩‍👧‍👦 Our Family</div></div>
        <div className="mem-scroll">
          {members.map(m=>(
            <div key={m.id||m._id} className="mc">
              <div className="mc-av">{m.emoji}{m.online&&<div className="mc-on"/>}</div>
              <div className="mc-n">{m.name}{m.name===me.name?" (me)":""}</div>
              <div style={{fontSize:11}}>{MOODS.find(md=>md.id===(m.mood||"happy"))?.e||"😊"}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">💝 Your Mood</div></div>
        <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:4}}>
          {MOODS.map(m=>(
            <div key={m.id} onClick={()=>{setMyMood(m.id);socketRef.current?.emit("moodUpdate",{mood:m.id});api("POST","/family/mood",{mood:m.id},T).catch(()=>{});}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"8px 11px",borderRadius:10,cursor:"pointer",flexShrink:0,background:myMood===m.id?m.c+"22":"var(--soft)",border:`2px solid ${myMood===m.id?m.c:"transparent"}`}}>
              <span style={{fontSize:22}}>{m.e}</span>
              <span style={{fontSize:10,fontWeight:700,color:myMood===m.id?m.c:"var(--muted)"}}>{m.l}</span>
            </div>
          ))}
        </div>
      </div>
      {prayerTimes.length>0&&(
        <div className="card">
          <div className="card-hd"><div className="card-t">🕌 Prayer Times · {session.city}</div><button className="card-lnk" onClick={()=>setPage("faith")}>All</button></div>
          {prayerTimes.map(p=>(
            <div key={p.name} className={`pr-row ${p.passed?"passed":nextPrayer?.name===p.name?"next":"upcoming"}`}>
              <span style={{fontSize:15}}>{p.icon}</span>
              <span style={{fontSize:12,fontWeight:700,flex:1,color:nextPrayer?.name===p.name?"white":p.passed?"#94A3B8":""}}>{p.name}</span>
              <span style={{fontSize:11,fontWeight:600,color:nextPrayer?.name===p.name?"#FCD34D":p.passed?"#94A3B8":""}}>{p.time}</span>
              {nextPrayer?.name===p.name&&<span style={{fontSize:9,background:"#F59E0B",color:"white",padding:"2px 5px",borderRadius:5,fontWeight:800}}>NEXT</span>}
            </div>
          ))}
        </div>
      )}
      <div className="score-box">
        <div style={{fontSize:10,textTransform:"uppercase",opacity:.8}}>Family Happiness</div>
        <div className="score-v">{happiness}%</div>
        <div style={{fontSize:18,marginTop:3}}>{"⭐".repeat(Math.max(1,Math.ceil(happiness/20)))}</div>
      </div>
      {challenges.slice(0,3).map(c=>(
        <div key={c.id} className={`chal${c.done?" done":""}`} onClick={()=>setChallenges(p=>p.map(x=>x.id===c.id?{...x,done:!x.done}:x))}>
          <div style={{fontSize:26,flexShrink:0}}>{c.done?"✅":c.e}</div>
          <div style={{flex:1}}><div style={{fontSize:12,fontWeight:800,color:"var(--navy)"}}>{c.t}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{c.d}</div></div>
          <div style={{fontSize:12,fontWeight:800,color:"var(--amber)",flexShrink:0}}>+{c.pts}</div>
        </div>
      ))}
      <div className="footer">Crafted with ❤️ for families · <em style={{color:"#CBD5E0"}}>Syed Muzamil</em></div>
    </div>
  );

  const Health = () => (
    <div className="page fade">
      <div className="ai-card">
        <div className="ai-title">🤖 AI Health Assistant</div>
        <div style={{fontSize:12,opacity:.8}}>Ask about health conditions, symptoms, or get advice.</div>
        <div className="ai-row">
          <input className="ai-inp" placeholder="e.g. blood sugar 145, what to do?" value={aiQuery} onChange={e=>setAiQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&askAI()} />
          <button className="ai-btn" onClick={askAI} disabled={aiLoading}>{aiLoading?"...":"Ask 🤖"}</button>
        </div>
        {aiResponse&&<div className="ai-resp">🤖 {aiResponse}</div>}
      </div>
      <div className="hgrid">
        {[{l:"Blood Pressure",v:healthLogs.find(l=>l.bloodPressure)?.bloodPressure||"Add log",u:"mmHg",ic:"🫀",bg:"linear-gradient(135deg,#EF4444,#DC2626)",pct:65},{l:"Blood Sugar",v:healthLogs.find(l=>l.bloodSugar)?.bloodSugar||"Add log",u:"mg/dL",ic:"🩸",bg:"linear-gradient(135deg,#F59E0B,#D97706)",pct:55},{l:"Water Today",v:`${water}/8`,u:"Glasses",ic:"💧",bg:"linear-gradient(135deg,#0EA5E9,#0284C7)",pct:water*12.5},{l:"Medicines",v:`${medicines.filter(m=>m.taken).length}/${medicines.length}`,u:"Taken",ic:"💊",bg:"linear-gradient(135deg,#16A34A,#15803D)",pct:medicines.length?(medicines.filter(m=>m.taken).length/medicines.length)*100:0}].map(hc=>(
          <div key={hc.l} className="hcard" style={{background:hc.bg}}>
            <div className="hc-l">{hc.l}</div><div className="hc-v">{hc.v}</div><div className="hc-u">{hc.u}</div>
            <div className="hc-ic">{hc.ic}</div>
            <div className="hbar"><div className="hbar-f" style={{width:`${Math.min(100,hc.pct||0)}%`}}/></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">💧 Water Tracker</div><span style={{fontSize:11,color:"#0EA5E9",fontWeight:700}}>{water}/8</span></div>
        <div className="wgrid">{Array.from({length:8}).map((_,i)=><div key={i} className={`wc${i<water?" full":""}`} onClick={()=>setWater(i<water?i:i+1)}>{i<water?"💧":"🫙"}</div>)}</div>
        <div className="txt-c txt-m">{water>=8?"🎉 Goal achieved!!":`${8-water} more glasses to go`}</div>
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">💊 Medicines</div><button className="card-lnk" onClick={()=>setShowAddMed(true)}>+ Add</button></div>
        {medicines.length===0?<div className="txt-c" style={{padding:"14px 0"}}><div className="txt-m">No medicines added</div><button className="btn btn-a btn-sm mt8" onClick={()=>setShowAddMed(true)}>+ Add</button></div>:medicines.map(m=>(
          <div key={m._id} className="med-row">
            <div className="med-ic" style={{background:(m.color||"#F59E0B")+"22"}}>💊</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"var(--navy)"}}>{m.name}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{m.member} · {m.time}</div></div>
            <button className={`med-btn ${m.taken?"taken":"pending"}`} onClick={()=>!m.taken&&api("PATCH",`/health/medicines/${m._id}/taken`,{},T).then(()=>setMedicines(p=>p.map(x=>x._id===m._id?{...x,taken:true}:x))).catch(()=>{})}>{m.taken?"✓ Taken":"Mark Taken"}</button>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">📋 Health Log</div><button className="card-lnk" onClick={()=>setShowAddLog(true)}>+ Add</button></div>
        {healthLogs.length===0?<div className="txt-c" style={{padding:"10px 0"}}><div className="txt-m">No health logs</div><button className="btn btn-a btn-sm mt8" onClick={()=>setShowAddLog(true)}>+ Add</button></div>:healthLogs.slice(0,5).map(l=>(
          <div key={l._id} style={{padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,.04)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--navy)"}}>{l.text}</div>
            {(l.bloodSugar||l.bloodPressure)&&<div style={{fontSize:10,color:"var(--teal)",marginTop:2}}>{l.bloodSugar&&`Sugar: ${l.bloodSugar}`}{l.bloodPressure&&` BP: ${l.bloodPressure}`}</div>}
            <div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{l.member} · {new Date(l.date).toLocaleDateString()}</div>
            {l.aiAnalysis&&<div style={{marginTop:5,background:"#EDE9FE",borderRadius:8,padding:"6px 9px",fontSize:11,color:"#5B21B6",lineHeight:1.6}}>🤖 {l.aiAnalysis}</div>}
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><div className="card-t">🏥 Appointments</div><button className="card-lnk" onClick={()=>setShowAddApt(true)}>+ Add</button></div>
        {appointments.length===0?<div className="txt-c" style={{padding:"10px 0"}}><div className="txt-m">No appointments</div><button className="btn btn-a btn-sm mt8" onClick={()=>setShowAddApt(true)}>+ Add</button></div>:appointments.map(a=>(
          <div key={a._id} style={{display:"flex",gap:10,padding:"9px 0",borderBottom:"1px solid rgba(0,0,0,.04)"}}>
            <div style={{fontSize:22}}>🏥</div>
            <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700,color:"var(--navy)"}}>{a.doctorName} {a.specialty&&`· ${a.specialty}`}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{a.member} · {a.date}</div>{a.notes&&<div style={{fontSize:10,color:"var(--mid)",marginTop:2}}>{a.notes}</div>}</div>
          </div>
        ))}
      </div>
      {showAddMed&&<div className="mo-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddMed(false)}><div className="modal"><div className="modal-t">💊 Add Medicine</div><label className="ob-lbl">Medicine Name *</label><input className="inp" placeholder="e.g. Vitamin D" value={fmMed.name} onChange={e=>setFmMed({...fmMed,name:e.target.value})} /><label className="ob-lbl">Time</label><input className="inp" placeholder="e.g. 08:00 AM" value={fmMed.time} onChange={e=>setFmMed({...fmMed,time:e.target.value})} /><label className="ob-lbl">For which member?</label><input className="inp" placeholder={me.name} value={fmMed.member} onChange={e=>setFmMed({...fmMed,member:e.target.value})} /><button className="ob-btn" style={{fontSize:14}} onClick={()=>{ if(!fmMed.name.trim()) return alert("Enter medicine name!"); api("POST","/health/medicines",{...fmMed,member:fmMed.member||me.name},T).then(m=>{setMedicines(p=>[...p,m]);setFmMed({name:"",time:"",member:""});setShowAddMed(false);}).catch(e=>alert(e.message)); }}>Save ✅</button></div></div>}
      {showAddLog&&<div className="mo-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddLog(false)}><div className="modal"><div className="modal-t">📋 Add Health Log</div><label className="ob-lbl">Note *</label><input className="inp" placeholder="e.g. Feeling dizzy after lunch" value={fmLog.text} onChange={e=>setFmLog({...fmLog,text:e.target.value})} /><label className="ob-lbl">Blood Sugar (mg/dL)</label><input className="inp" type="number" placeholder="e.g. 120" value={fmLog.bloodSugar} onChange={e=>setFmLog({...fmLog,bloodSugar:e.target.value})} /><label className="ob-lbl">Blood Pressure</label><input className="inp" placeholder="e.g. 120/80" value={fmLog.bloodPressure} onChange={e=>setFmLog({...fmLog,bloodPressure:e.target.value})} /><button className="ob-btn" style={{fontSize:14}} onClick={()=>{ if(!fmLog.text.trim()) return alert("Enter a note!"); api("POST","/health/logs",{...fmLog,member:me.name},T).then(l=>{setHealthLogs(p=>[l,...p]);setFmLog({text:"",member:"",bloodSugar:"",bloodPressure:""});setShowAddLog(false);}).catch(e=>alert(e.message)); }}>Save & Get AI Analysis 🤖</button></div></div>}
      {showAddApt&&<div className="mo-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddApt(false)}><div className="modal"><div className="modal-t">🏥 Add Appointment</div><label className="ob-lbl">Doctor Name *</label><input className="inp" placeholder="e.g. Dr. Ahmed Khan" value={fmApt.doctorName} onChange={e=>setFmApt({...fmApt,doctorName:e.target.value})} /><label className="ob-lbl">Specialty</label><input className="inp" placeholder="e.g. Cardiologist" value={fmApt.specialty} onChange={e=>setFmApt({...fmApt,specialty:e.target.value})} /><label className="ob-lbl">Date *</label><input className="inp" type="date" value={fmApt.date} onChange={e=>setFmApt({...fmApt,date:e.target.value})} /><label className="ob-lbl">Family Member</label><input className="inp" placeholder={me.name} value={fmApt.member} onChange={e=>setFmApt({...fmApt,member:e.target.value})} /><label className="ob-lbl">Notes</label><input className="inp" placeholder="Any notes..." value={fmApt.notes} onChange={e=>setFmApt({...fmApt,notes:e.target.value})} /><button className="ob-btn" style={{fontSize:14}} onClick={()=>{ if(!fmApt.doctorName.trim()||!fmApt.date) return alert("Fill required fields!"); api("POST","/health/appointments",{...fmApt,member:fmApt.member||me.name},T).then(a=>{setAppointments(p=>[...p,a]);setFmApt({doctorName:"",specialty:"",date:"",member:"",notes:""});setShowAddApt(false);}).catch(e=>alert(e.message)); }}>Save ✅</button></div></div>}
    </div>
  );

  const Faith = () => {
    const [tb, setTb] = useState(tasbeeh);
    const qiblaAngle = qiblaDir !== null ? qiblaDir - compassHeading : null;
    return (
      <div className="page fade">
        <div className="card">
          <div className="card-hd"><div className="card-t">🕌 Prayer Times · {session.city}</div></div>
          <div className="pgrid5">
            {prayerTimes.map(p=>(
              <div key={p.name} className={`pc ${p.passed?"passed":nextPrayer?.name===p.name?"next":"upcoming"}`}>
                <div className="pc-icon">{p.icon}</div>
                <div className="pc-name">{p.name}</div>
                <div className="pc-time">{p.time}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
          <div className="card" style={{marginBottom:0}}>
            <div className="card-t" style={{marginBottom:10}}>📿 Tasbeeh</div>
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <button className="tasbeeh-btn" onClick={()=>{const n=tb+1;setTb(n);setTasbeeh(n);}}>
                <div className="tn">{tb}</div><div className="tl">tap</div>
              </button>
              <button className="treset" onClick={()=>{setTb(0);setTasbeeh(0);}}>Reset</button>
              {tb>0&&tb%33===0&&<div style={{fontSize:11,color:"var(--teal)",fontWeight:700,marginTop:6}}>✨ {tb}!</div>}
            </div>
          </div>
          <div className="card" style={{marginBottom:0}}>
            <div className="card-t" style={{marginBottom:10}}>🧭 Qibla Compass</div>
            <div style={{textAlign:"center",padding:"8px 0"}}>
              <div className="qibla-wrap">
                <div className="qibla-outer">
                  <div className="qibla-ring"/>
                  <div className="qibla-dirs">
                    <div className="qd n">N</div><div className="qd s">S</div>
                    <div className="qd e">E</div><div className="qd w">W</div>
                  </div>
                  <div className="qibla-arrow" style={{transform:`rotate(${qiblaAngle||0}deg)`}}>🕋</div>
                </div>
              </div>
              <div className="txt-m" style={{marginTop:6}}>{qiblaDir!==null?`${qiblaDir}° · Towards Makkah`:"Getting location..."}</div>
              {qiblaDir===null&&<button className="btn btn-a btn-sm mt8" onClick={loadQibla}>📍 Enable GPS</button>}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div className="card-t">🌙 Ramadan Tracker</div><span style={{fontSize:11,color:"var(--teal)",fontWeight:700}}>{ramadan.filter(d=>d==="fasted").length}/30</span></div>
          <div className="ram-grid">
            {ramadan.map((d,i)=><div key={i} className={`rd ${d==="fasted"?"fasted":"unfasted"}`} onClick={()=>setRamadan(p=>{const n=[...p];n[i]=n[i]==="fasted"?"unfasted":"fasted";return n;})}>{i+1}</div>)}
          </div>
        </div>
        <div className="sec-t">🤲 Daily Duas ({DUAS.length})</div>
        {DUAS.map((d,i)=>(
          <div key={i} className="dua-card">
            <div className="dua-t">{d.t}</div>
            <div className="arabic">{d.ar}</div>
            <div className="translit">{d.tr}</div>
            <div className="meaning">{d.en}</div>
          </div>
        ))}
      </div>
    );
  };

  const Kids = () => (
    <div className="page fade">
      <div className="kids-banner"><div style={{fontSize:24,marginBottom:4}}>🦁 🐘 🌈 ⭐ 🎨</div><div style={{fontFamily:"Fredoka One,cursive",fontSize:22}}>Kids World 🌟</div></div>
      <div className="ktabs">
        {[{id:"alphabet",l:"🔤 ABCs"},{id:"math",l:"🔢 Math"},{id:"drawing",l:"🎨 Draw"},{id:"stories",l:"📖 Stories"}].map(t=>(
          <button key={t.id} className={`ktab${kidsTab===t.id?" active":""}`} onClick={()=>setKidsTab(t.id)}>{t.l}</button>
        ))}
      </div>
      {kidsTab==="alphabet"&&(
        <div className="card fade">
          <div className="card-hd"><div className="card-t">🔤 Tap a Letter!</div></div>
          <div className="alpha-grid">
            {Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ").map((l,i)=>{
              const c=["#EF4444","#F59E0B","#16A34A","#0EA5E9","#7C3AED","#EC4899"][i%6];
              const words={A:"🍎 Apple",B:"🐝 Bee",C:"🐱 Cat",D:"🐶 Dog",E:"🐘 Elephant",F:"🐟 Fish",G:"🍇 Grape",H:"🏠 Home",I:"🍦 Ice Cream",J:"🃏 Jump",K:"🪁 Kite",L:"🦁 Lion",M:"🌙 Moon",N:"🌃 Night",O:"🍊 Orange",P:"🍕 Pizza",Q:"👸 Queen",R:"🌈 Rainbow",S:"⭐ Star",T:"🌳 Tree",U:"☂️ Umbrella",V:"🎻 Violin",W:"🌊 Water",X:"🎸 Xylophone",Y:"🟡 Yellow",Z:"🦓 Zebra"};
              return <div key={l} className="ab" style={{color:c,border:`2px solid ${c}44`}} onClick={()=>alert(`${l} is for ${words[l]||l+"!"}`)}>{l}</div>;
            })}
          </div>
        </div>
      )}
      {kidsTab==="math"&&(
        <div className="math-box fade">
          <div style={{fontSize:13,fontWeight:700,color:"var(--navy)",marginBottom:8}}>🧮 Quick Math!</div>
          <div className="math-q">{mathQ.q}</div>
          <div className="math-opts">
            {mathQ.opts.map(opt=>(
              <button key={opt} className={`mo${mathRes&&opt===mathQ.answer?" correct":mathRes&&opt!==mathQ.answer?" wrong":""}`} onClick={()=>{setMathRes(opt===mathQ.answer?"correct":"wrong");if(opt===mathQ.answer)setTimeout(()=>{setMathQ(genMath());setMathRes(null);},1200);}}>
                {opt}
              </button>
            ))}
          </div>
          {mathRes&&<div style={{marginTop:12,fontSize:20}}>{mathRes==="correct"?"🎉 Correct!":"❌ Try again!"}</div>}
          <button onClick={()=>{setMathQ(genMath());setMathRes(null);}} style={{marginTop:12,background:"white",border:"none",borderRadius:20,padding:"6px 18px",fontFamily:"Nunito",fontWeight:700,fontSize:12,cursor:"pointer",color:"var(--navy)"}}>🔄 New Question</button>
        </div>
      )}
      {kidsTab==="drawing"&&<DrawingBoard/>}
      {kidsTab==="stories"&&(
        <div className="fade">
          {STORIES.map((s,i)=>(
            <div key={i} className="story-card" onClick={()=>alert(`📖 "${s.t}"\n\n${s.d}\n\nFull story coming soon! 🌟`)}>
              <div style={{fontSize:28,marginBottom:6}}>{s.e}</div>
              <span style={{fontSize:9,background:"#FEF3C7",color:"#92400E",padding:"2px 7px",borderRadius:7,display:"inline-block",marginBottom:4,fontWeight:700}}>Ages {s.age}</span>
              <div style={{fontSize:13,fontWeight:800,color:"var(--navy)"}}>{s.t}</div>
              <div style={{fontSize:11,color:"var(--muted)",lineHeight:1.5,marginTop:3}}>{s.d}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ChatList = () => {
    const contacts = [
      {id:"group",name:`${family.familyName}`,avatar:"👨‍👩‍👧‍👦",preview:messages[messages.length-1]?.text?.substring(0,35)||"Say salaam!",online:true},
      ...members.filter(m=>m.name!==me.name).map(m=>({id:m._id||m.id,name:m.name,avatar:m.emoji,preview:"Tap to chat...",online:m.online})),
    ];
    return (
      <div className="page fade">
        <div style={{background:"#FEF3C7",borderRadius:10,padding:"8px 12px",marginBottom:10,fontSize:11,color:"#92400E"}}>
          🔑 Share your invite code to add family: <strong style={{letterSpacing:1}}>{family.inviteCode}</strong>
        </div>
        <div className="sec-t">CONVERSATIONS</div>
        {contacts.map(c=>(
          <div key={c.id} className="cr" onClick={()=>{setOpenChat(c);loadMessages(c.id==="group"?"group":[me.name,c.name].sort().join("-"));}}>
            <div className="cr-av">
              {c.avatar}
              {c.online&&<div style={{position:"absolute",bottom:1,right:1,width:10,height:10,borderRadius:"50%",background:"#22C55E",border:"2px solid white"}}/>}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div className="cr-n">{c.name}</div>
              <div className="cr-p">{c.preview}</div>
            </div>
            {c.id==="group"&&unreadMsgs>0&&<div className="ubadge">{unreadMsgs}</div>}
            <span style={{fontSize:10,color:"var(--muted)",flexShrink:0}}>{now.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
          </div>
        ))}
      </div>
    );
  };

  const Memories = () => (
    <div className="page fade">
      <div className="row mb10">
        <div className="flex1"><div style={{fontFamily:"Fredoka One,cursive",fontSize:18,color:"var(--navy)"}}>📸 Memory Capsule</div><div className="txt-m">{memories.length} memories</div></div>
        <button className="btn btn-a" onClick={()=>setShowAddMem(true)}>+ New</button>
      </div>
      {memories.length===0?<div className="card txt-c" style={{padding:24}}><div style={{fontSize:36,marginBottom:8}}>📸</div><div style={{fontWeight:700,color:"var(--navy)",marginBottom:4}}>No memories yet!</div><button className="btn btn-a mt8" onClick={()=>setShowAddMem(true)}>+ Create First Memory</button></div>:(
        <div className="mem-grid">
          {memories.map(m=>{
            const bg={capsule:"#EDE9FE",note:"#FEF3C7",photo:"#E0F2FE"}[m.type]||"#F1F5F9";
            const tc={capsule:"#7C3AED",note:"#F59E0B",photo:"#0EA5E9"}[m.type]||"var(--muted)";
            return (
              <div key={m._id} className="mem-card" onClick={()=>m.locked?alert(`🔒 Opens ${m.lockedUntil}!`):alert(`📖 "${m.title}"\nBy ${m.addedBy||"Family"} · ${new Date(m.date).toLocaleDateString()}`)}>
                <div className="mem-th" style={{background:bg}}>{m.emoji}{m.locked&&<div className="mem-lock"><span style={{fontSize:20}}>🔒</span><div style={{fontSize:10,fontWeight:700}}>Opens {m.lockedUntil}</div></div>}</div>
                <div className="mem-bd"><div className="mem-type" style={{color:tc}}>{m.type.toUpperCase()}</div><div className="mem-ttl">{m.title}</div><div className="mem-dt">{new Date(m.date).toLocaleDateString()}</div></div>
                <div className="mem-ft"><span style={{color:"#F43F5E",fontWeight:700}} onClick={e=>{e.stopPropagation();api("PATCH",`/memories/${m._id}/heart`,{},T).then(updated=>setMemories(p=>p.map(x=>x._id===m._id?updated:x))).catch(()=>{})}}>❤️ {m.hearts}</span><span className="txt-m">{m.locked?"Locked":"Tap to view"}</span></div>
              </div>
            );
          })}
        </div>
      )}
      {showAddMem&&<div className="mo-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddMem(false)}><div className="modal"><div className="modal-t">✨ New Memory</div><label className="ob-lbl">Title *</label><input className="inp" placeholder="e.g. Eid 2026" value={fmMem.title} onChange={e=>setFmMem({...fmMem,title:e.target.value})} /><label className="ob-lbl">Emoji</label><div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>{["⭐","🎉","🌙","❤️","🏠","📸","🎁","🌹","🍰","✈️","🕌","🤲"].map(e=><button key={e} onClick={()=>setFmMem({...fmMem,emoji:e})} style={{fontSize:20,background:fmMem.emoji===e?"#FEF3C7":"white",border:`2px solid ${fmMem.emoji===e?"#F59E0B":"rgba(0,0,0,.08)"}`,borderRadius:8,padding:"3px 7px",cursor:"pointer"}}>{e}</button>)}</div><label className="ob-lbl">Lock until year (optional)</label><input className="inp" placeholder="e.g. 2030" value={fmMem.lockedUntil} onChange={e=>setFmMem({...fmMem,lockedUntil:e.target.value})} /><button className="ob-btn" style={{fontSize:14}} onClick={()=>{ if(!fmMem.title.trim()) return alert("Enter a title!"); api("POST","/memories",{...fmMem,locked:!!fmMem.lockedUntil},T).then(m=>{setMemories(p=>[m,...p]);setFmMem({title:"",emoji:"⭐",lockedUntil:""});setShowAddMem(false);}).catch(e=>alert(e.message)); }}>Save Memory 💾</button></div></div>}
    </div>
  );

  const Emergency = () => (
    <div className="page fade">
      {sosActive&&<div className="sos-alert"><div style={{fontSize:18,fontWeight:800,color:"#DC2626",marginBottom:5}}>🚨 SOS ALERT SENT!</div><div style={{fontSize:12,color:"#EF4444"}}>Alert sent to all {members.length} family members.</div><button onClick={()=>setSosActive(false)} style={{marginTop:8,background:"white",border:"1px solid #EF4444",color:"#EF4444",padding:"6px 16px",borderRadius:8,fontFamily:"Nunito",fontWeight:800,cursor:"pointer",fontSize:11}}>Cancel</button></div>}
      <div className="txt-c" style={{padding:"20px 0 10px"}}>
        <button className="sos-btn" onClick={()=>{setSosActive(true);navigator.geolocation?.getCurrentPosition(pos=>socketRef.current?.emit("sosAlert",{location:{lat:pos.coords.latitude,lng:pos.coords.longitude}}),()=>socketRef.current?.emit("sosAlert",{}));}}>
          <div style={{fontSize:36,lineHeight:1}}>🆘</div>
          <div style={{fontSize:11,opacity:.85,marginTop:3}}>PRESS FOR SOS</div>
        </button>
        <div className="txt-m" style={{maxWidth:240,margin:"0 auto"}}>Instantly alerts all family members with your GPS location.</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {[{e:"📍",t:"Share Location",d:"GPS to family"},{e:"📞",t:"Call Family",d:"Emergency"},{e:"🏥",t:"Hospitals",d:"Find nearest"},{e:"👮",t:"Authorities",d:"Call 112"}].map(a=>(
          <div key={a.t} className="card txt-c" style={{cursor:"pointer",marginBottom:0}} onClick={()=>alert(`${a.e} ${a.t}\n${a.d}`)}>
            <div style={{fontSize:26,marginBottom:5}}>{a.e}</div>
            <div style={{fontWeight:800,fontSize:12,color:"var(--navy)"}}>{a.t}</div>
            <div className="txt-m">{a.d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const Settings = () => (
    <div className="page fade">
      <div className="about-card">
        <div style={{fontSize:36,marginBottom:8}}>🏠✨</div>
        <div style={{fontFamily:"Fredoka One,cursive",fontSize:22}}>FamilyVerse</div>
        <div style={{fontSize:10,opacity:.4,marginBottom:10}}>v3.0 · {family.familyName}</div>
        <div style={{fontSize:12,opacity:.8,lineHeight:1.6,marginBottom:12}}>Built with love for every family — health, faith, memories, and connection in one private universe.</div>
        <div className="about-q"><div style={{fontSize:11,fontStyle:"italic",opacity:.9}}>"I built FamilyVerse imagining my own family — the morning prayers, children's laughter, elders' wisdom."</div><div style={{fontSize:10,color:"#F59E0B",fontWeight:700,marginTop:4}}>— Syed Muzamil, Creator</div></div>
      </div>
      <div className="ss">👨‍👩‍👧‍👦 FAMILY</div>
      <div className="card">
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:46,height:46,borderRadius:"50%",background:"linear-gradient(135deg,#F59E0B,#EF4444)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏠</div>
          <div><div style={{fontWeight:800,fontSize:15,color:"var(--navy)"}}>{family.familyName}</div><div className="txt-m">{members.length} members</div></div>
        </div>
        <div className="invite-box">
          <div style={{fontSize:10,fontWeight:700,color:"#92400E",marginBottom:3}}>🔑 FAMILY INVITE CODE — Share this!</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div className="invite-code">{family.inviteCode}</div><button onClick={()=>{navigator.clipboard?.writeText(family.inviteCode);alert("Copied! ✅");}} style={{background:"#F59E0B",border:"none",borderRadius:8,padding:"4px 10px",fontSize:11,fontWeight:700,color:"white",cursor:"pointer",fontFamily:"inherit",flexShrink:0}}>Copy</button></div>
          <div className="txt-m" style={{marginTop:6}}>Family members: Open app → "Join Existing Family" → Enter this code → They're in! ✅</div>
        </div>
      </div>
      <div className="ss">👥 MEMBERS</div>
      {members.map(m=>(
        <div key={m._id||m.id} className="si">
          <div className="si-ic">{m.emoji}</div>
          <div style={{flex:1}}><div className="si-t">{m.name}{m.name===me.name?" (You)":""}</div><div className="si-d">{m.role} · {m.online?"🟢 Online":"⚫ Offline"}</div></div>
          <div style={{fontSize:18}}>{MOODS.find(md=>md.id===(m.mood||"happy"))?.e||"😊"}</div>
        </div>
      ))}
      <div className="ss">🔔 NOTIFICATIONS</div>
      {[{k:"notifications",e:"💊",t:"Medicine Reminders"},{k:"prayerAlerts",e:"🕌",t:"Prayer Alerts"},{k:"familyUpdates",e:"👨‍👩‍👧‍👦",t:"Family Updates"}].map(s=>(
        <div key={s.k} className="si">
          <div className="si-ic">{s.e}</div>
          <div style={{flex:1}}><div className="si-t">{s.t}</div></div>
          <button className={`toggle ${settings[s.k]?"on":"off"}`} onClick={()=>setSettings(p=>({...p,[s.k]:!p[s.k]}))} />
        </div>
      ))}
      <div className="ss">⚠️ DANGER ZONE</div>
      <div className="si" style={{border:"1px solid #FCA5A5"}} onClick={()=>{ if(confirm("Sign out?")) { LS.clear(); window.location.reload(); } }}>
        <div className="si-ic">🚪</div><div style={{flex:1}}><div className="si-t" style={{color:"#EF4444"}}>Sign Out</div><div className="si-d">Return to login screen</div></div>
      </div>
      <div className="footer">Crafted with ❤️ for families<br/><em style={{color:"#CBD5E0",fontSize:10}}>FamilyVerse · A Syed Muzamil Creation</em></div>
    </div>
  );

  const PAGES = { dashboard:<Dashboard/>, health:<Health/>, faith:<Faith/>, kids:<Kids/>, chat:<ChatList/>, memories:<Memories/>, emergency:<Emergency/>, settings:<Settings/> };

  return (
    <>
      <style>{CSS}</style>
      {showNotif&&<div className="notif-panel" onClick={()=>setShowNotif(false)}>
        <div style={{fontWeight:800,fontSize:13,color:"var(--navy)",marginBottom:8}}>🔔 Notifications</div>
        {[{e:"💊",t:`${medicines.filter(m=>!m.taken).length} medicines pending`,time:"Now"},{e:"🕌",t:nextPrayer?`Next: ${nextPrayer.name} at ${nextPrayer.time}`:"All prayers done ✓",time:"Today"},{e:"💬",t:unreadMsgs>0?`${unreadMsgs} unread messages`:"No new messages",time:"Today"}].map((n,i)=>(
          <div key={i} className="ni-item">
            <div style={{fontSize:18,flexShrink:0}}>{n.e}</div>
            <div><div style={{fontSize:12,color:"var(--navy)",fontWeight:600}}>{n.t}</div><div style={{fontSize:10,color:"var(--muted)",marginTop:1}}>{n.time}</div></div>
          </div>
        ))}
      </div>}
      <div id="fv">
        <div className={`conn-bar${socketConnected?"":" off"}`}>{socketConnected?"🟢 Connected — Real-time active":"🔴 Connecting to server..."}</div>
        <div className="topbar">
          <div className="tb-brand"><div className="tb-ic">🏠</div><div><div className="tb-title">FamilyVerse</div><div className="tb-sub">{PAGE_TITLES[page]}</div></div></div>
          <div className="tb-right">
            <button className="tb-btn" onClick={()=>setShowNotif(n=>!n)}>🔔{(medicines.filter(m=>!m.taken).length>0||unreadMsgs>0)&&<div className="tb-dot"/>}</button>
            <button className="tb-btn" style={{fontSize:18}} onClick={()=>setPage("settings")}>{me.emoji}</button>
          </div>
        </div>
        <div className="scroll">{PAGES[page]}</div>
        <div className="bnav">
          {NAV.map(n=>(
            <button key={n.id} className={`nb${page===n.id?" active":""}`} onClick={()=>{setPage(n.id);setOpenChat(null);}}>
              <div className="ni">{n.icon}</div>{n.l}
              {n.badge>0&&<div className="nb-badge">{n.badge}</div>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
