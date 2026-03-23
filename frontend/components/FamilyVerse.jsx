import { useState, useEffect, useRef } from "react";

const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Fredoka+One&display=swap');`;

const globalStyles = `
  ${GOOGLE_FONTS}
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Nunito', sans-serif; background: #0D0D1A; color: #E2E8F0; overflow-x: hidden; }
  ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #1A1A2E; } ::-webkit-scrollbar-thumb { background: #FF6B35; border-radius: 3px; }
  @keyframes fadeInUp { from { opacity:0;transform:translateY(18px); } to { opacity:1;transform:translateY(0); } }
  @keyframes pulse { 0%,100%{transform:scale(1);}50%{transform:scale(1.05);} }
  @keyframes float { 0%,100%{transform:translateY(0);}50%{transform:translateY(-8px);} }
  @keyframes glow { 0%,100%{box-shadow:0 0 20px rgba(255,68,68,0.4);}50%{box-shadow:0 0 50px rgba(255,68,68,0.9);} }
  @keyframes twinkle { 0%,100%{opacity:0.2;}50%{opacity:0.8;} }
  @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-12px);} }
  @keyframes spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
  .fade-in { animation: fadeInUp 0.45s ease forwards; }
  .float { animation: float 3s ease-in-out infinite; }
  .bounce-anim { animation: bounce 1.2s ease-in-out infinite; }
  .glass { background:rgba(255,255,255,0.05);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1); }
  .card { background:linear-gradient(135deg,rgba(22,33,62,0.9),rgba(15,52,96,0.6));border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:20px;transition:all 0.3s ease; }
  .card:hover { transform:translateY(-2px);border-color:rgba(255,107,53,0.25); }
  .btn { border:none;cursor:pointer;font-family:'Nunito',sans-serif;font-weight:700;transition:all 0.3s ease;border-radius:12px;display:inline-flex;align-items:center;gap:8px;padding:11px 18px;font-size:14px; }
  .btn:hover { transform:translateY(-2px);filter:brightness(1.1); }
  .btn:active { transform:translateY(0); }
  .btn-primary { background:linear-gradient(135deg,#FF6B35,#FF8C61);color:white; }
  .btn-secondary { background:linear-gradient(135deg,#4ECDC4,#26D4C8);color:#1A1A2E; }
  .btn-ghost { background:rgba(255,255,255,0.07);color:#E2E8F0;border:1px solid rgba(255,255,255,0.12); }
  .btn-danger { background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.25); }
  input,textarea,select { background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;color:#E2E8F0;font-family:'Nunito',sans-serif;font-size:14px;padding:11px 15px;outline:none;width:100%;transition:all 0.3s; }
  input:focus,textarea:focus,select:focus { border-color:#FF6B35;box-shadow:0 0 0 3px rgba(255,107,53,0.12); }
  input::placeholder,textarea::placeholder { color:#475569; }
  .nav-item { display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:13px;cursor:pointer;transition:all 0.3s;color:#64748B;font-weight:600;font-size:13px;border:1px solid transparent; }
  .nav-item:hover { background:rgba(255,107,53,0.09);color:#FF6B35;border-color:rgba(255,107,53,0.18); }
  .nav-item.active { background:linear-gradient(135deg,rgba(255,107,53,0.18),rgba(255,107,53,0.08));color:#FF6B35;border-color:rgba(255,107,53,0.28); }
  .tab-btn { padding:9px 18px;border-radius:30px;cursor:pointer;font-weight:700;font-size:12px;transition:all 0.3s;border:none;background:rgba(255,255,255,0.06);color:#64748B;font-family:'Nunito',sans-serif; }
  .tab-btn.active { background:linear-gradient(135deg,#FF6B35,#FF8C61);color:white; }
  .badge { display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700; }
  .progress-bar { height:7px;border-radius:4px;background:rgba(255,255,255,0.08);overflow:hidden; }
  .progress-fill { height:100%;border-radius:4px;transition:width 1.2s ease; }
  .mood-btn { padding:9px 14px;border-radius:28px;cursor:pointer;transition:all 0.3s;font-size:17px;border:2px solid transparent;background:rgba(255,255,255,0.05); }
  .mood-btn:hover,.mood-btn.selected { border-color:#FF6B35;background:rgba(255,107,53,0.13);transform:scale(1.12); }
  .chat-bubble { max-width:72%;padding:10px 14px;border-radius:18px;font-size:13px;line-height:1.55;word-break:break-word;animation:fadeInUp 0.25s ease; }
  .chat-bubble.sent { background:linear-gradient(135deg,#FF6B35,#FF8C61);color:white;border-bottom-right-radius:4px; }
  .chat-bubble.received { background:rgba(255,255,255,0.07);color:#E2E8F0;border-bottom-left-radius:4px; }
  .prayer-card { border-radius:15px;padding:14px 18px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s; }
  .prayer-card.done { background:rgba(16,185,129,0.09);border:1px solid rgba(16,185,129,0.25); }
  .prayer-card.next { background:rgba(255,107,53,0.09);border:1px solid rgba(255,107,53,0.28);animation:pulse 2s ease-in-out infinite; }
  .prayer-card.pending { background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07); }
  .kid-card { border-radius:22px;padding:24px 18px;text-align:center;cursor:pointer;transition:all 0.3s; }
  .kid-card:hover { transform:translateY(-6px) scale(1.03); }
  .drawing-canvas { border-radius:14px;cursor:crosshair;display:block;max-width:100%; }
  .memory-card { border-radius:18px;overflow:hidden;cursor:pointer;transition:all 0.3s;position:relative; }
  .memory-card:hover { transform:scale(1.025); }
  .sos-btn { width:155px;height:155px;border-radius:50%;background:radial-gradient(circle,#FF4444,#CC0000);border:4px solid rgba(255,68,68,0.45);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-direction:column;color:white;box-shadow:0 0 40px rgba(255,68,68,0.45);transition:all 0.3s; }
  .sos-btn:hover { transform:scale(1.06);box-shadow:0 0 65px rgba(255,68,68,0.85); }
  .sos-btn.active { animation:glow 0.6s ease-in-out infinite; }
  .star-bg { position:absolute;border-radius:50%;background:white;animation:twinkle 2s ease-in-out infinite; }
  @media(max-width:768px){.sidebar{transform:translateX(-100%);position:fixed;z-index:100;transition:transform 0.3s;}.sidebar.open{transform:translateX(0);}.mobile-header{display:flex !important;}}
`;

// ── Tiny SVG Icon ──
const I = ({ n, s = 18, c = "currentColor" }) => {
  const p = {
    dashboard: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
    health: "M22 12h-4l-3 9L9 3l-3 9H2",
    moon: "M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z",
    star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    chat: "M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z",
    camera: "M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z M12 17a4 4 0 100-8 4 4 0 000 8z",
    memory: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
    emergency: "M12 9v4 M12 17h.01 M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z",
    settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z",
    send: "M22 2L11 13 M22 2L15 22 8 13 2 2z",
    plus: "M12 5v14 M5 12h14",
    close: "M18 6L6 18 M6 6l12 12",
    menu: "M3 12h18 M3 6h18 M3 18h18",
    check: "M20 6L9 17l-5-5",
    lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
    mic: "M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z M19 10v2a7 7 0 01-14 0v-2 M12 19v4 M8 23h8",
    trophy: "M18 2H6v7a6 6 0 0012 0V2z M6 9H4.5a2.5 2.5 0 000 5H6 M18 9h1.5a2.5 2.5 0 010 5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",
  };
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {(p[n] || "").split(" M").map((d, i) => <path key={i} d={i === 0 ? d : "M" + d} />)}
    </svg>
  );
};

// ── Stars ──
const Stars = () => {
  const arr = Array.from({ length: 35 }, (_, i) => ({ id: i, left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, size: Math.random() * 2.5 + 0.5, delay: `${Math.random() * 3}s` }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
      {arr.map(s => <div key={s.id} className="star-bg" style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }} />)}
    </div>
  );
};

// ── Sidebar ──
const Sidebar = ({ active, setActive, open }) => {
  const nav = [
    { id: "dashboard", label: "Dashboard", icon: "dashboard", clr: "#FF6B35" },
    { id: "health", label: "Health Guardian", icon: "health", clr: "#10B981" },
    { id: "faith", label: "Faith Companion", icon: "moon", clr: "#A855F7" },
    { id: "kids", label: "Kids World", icon: "star", clr: "#FFE66D" },
    { id: "chat", label: "Family Chat", icon: "chat", clr: "#4ECDC4" },
    { id: "memories", label: "Memories", icon: "memory", clr: "#EC4899" },
    { id: "emergency", label: "Emergency SOS", icon: "emergency", clr: "#EF4444" },
    { id: "settings", label: "Settings", icon: "settings", clr: "#94A3B8" },
  ];
  return (
    <div className={`sidebar ${open ? "open" : ""}`} style={{ width: 255, minHeight: "100vh", background: "linear-gradient(180deg,#0D0D1A,#1A1A2E)", borderRight: "1px solid rgba(255,255,255,0.05)", padding: "22px 14px", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, zIndex: 100 }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 28, background: "linear-gradient(135deg,#FF6B35,#FFE66D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🌟 FamilyVerse</div>
        <div style={{ fontSize: 9, color: "#3D3D5C", letterSpacing: 2, marginTop: 2 }}>THE INTELLIGENT FAMILY UNIVERSE</div>
      </div>
      {/* Family badge */}
      <div style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,230,109,0.07))", border: "1px solid rgba(255,107,53,0.18)", borderRadius: 13, padding: "11px 13px", marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 26 }}>👨‍👩‍👧‍👦</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#FF6B35" }}>The Ahmed Family</div>
          <div style={{ fontSize: 10, color: "#475569" }}>5 members · Private</div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
        {nav.map(item => (
          <div key={item.id} className={`nav-item ${active === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
            <div style={{ color: active === item.id ? item.clr : "#475569" }}><I n={item.icon} s={17} /></div>
            <span>{item.label}</span>
            {item.id === "chat" && <span style={{ marginLeft: "auto", background: "#FF6B35", color: "white", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>3</span>}
            {item.id === "emergency" && <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "#EF4444", animation: "pulse 1s infinite" }} />}
          </div>
        ))}
      </nav>
      {/* Quote */}
      <div style={{ margin: "20px 0 0", padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 13, borderLeft: "3px solid #FF6B35" }}>
        <p style={{ fontSize: 10, color: "#475569", fontStyle: "italic", lineHeight: 1.6 }}>"A family that grows together, glows together."</p>
        <p style={{ fontSize: 10, color: "#FF6B35", marginTop: 5, fontWeight: 700 }}>— Syed Muzamil</p>
      </div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#2D2D4E", marginTop: 14 }}>Crafted with care for families.</div>
    </div>
  );
};

// ── Dashboard ──
const Dashboard = ({ setActive }) => {
  const [mood, setMood] = useState(null);
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const tasks = [
    { text: "Give Dad blood pressure meds", done: true, urgent: false },
    { text: "Asr prayer reminder", done: false, urgent: true },
    { text: "Ahmed's math homework", done: false, urgent: false },
    { text: "Family dinner at 7pm", done: false, urgent: false },
    { text: "Water intake check", done: true, urgent: false },
  ];
  const meds = [
    { name: "Metformin", person: "Grandma", time: "8:00 AM", done: true },
    { name: "Lisinopril", person: "Dad", time: "9:00 AM", done: true },
    { name: "Vitamin D", person: "All", time: "12:00 PM", done: false },
    { name: "Blood Pressure", person: "Dad", time: "8:00 PM", done: false },
  ];
  const fMoods = [{ n: "Mama", e: "😄" }, { n: "Baba", e: "😊" }, { n: "Ahmed", e: "😐" }, { n: "Sara", e: "😄" }, { n: "Grandma", e: "😔" }];
  const qCards = [
    { icon: "health", label: "Health", color: "#10B981", bg: "rgba(16,185,129,0.1)", page: "health" },
    { icon: "moon", label: "Prayer", color: "#A855F7", bg: "rgba(168,85,247,0.1)", page: "faith" },
    { icon: "star", label: "Kids", color: "#FFE66D", bg: "rgba(255,230,109,0.1)", page: "kids" },
    { icon: "chat", label: "Chat", color: "#4ECDC4", bg: "rgba(78,205,196,0.1)", page: "chat" },
    { icon: "memory", label: "Memories", color: "#EC4899", bg: "rgba(236,72,153,0.1)", page: "memories" },
    { icon: "emergency", label: "SOS", color: "#EF4444", bg: "rgba(239,68,68,0.1)", page: "emergency" },
  ];

  return (
    <div style={{ padding: 22, maxWidth: 1100 }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
        <div>
          <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 30, background: "linear-gradient(135deg,#FF6B35,#FFE66D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Good Evening, Family! 🌙</h1>
          <p style={{ color: "#475569", marginTop: 4, fontSize: 13 }}>{time.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · {time.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</p>
        </div>
        <div style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,230,109,0.08))", border: "1px solid rgba(255,107,53,0.18)", borderRadius: 15, padding: "12px 18px", textAlign: "right" }}>
          <div style={{ fontSize: 10, color: "#475569" }}>HYDERABAD, IN</div>
          <div style={{ fontSize: 22, marginTop: 2 }}>🌤️ 28°C</div>
          <div style={{ fontSize: 10, color: "#94A3B8" }}>Partly Cloudy</div>
        </div>
      </div>

      {/* Quote */}
      <div style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.12),rgba(99,102,241,0.08))", border: "1px solid rgba(168,85,247,0.18)", borderRadius: 17, padding: "16px 22px", marginBottom: 22, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 28 }}>✨</div>
        <div>
          <p style={{ fontSize: 14, color: "#E2E8F0", fontStyle: "italic", lineHeight: 1.6 }}>"The family is one of nature's masterpieces — nurture it with love, faith, and togetherness."</p>
          <p style={{ fontSize: 11, color: "#A855F7", marginTop: 5, fontWeight: 700 }}>— Syed Muzamil</p>
        </div>
      </div>

      {/* Quick access */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 10, marginBottom: 24 }}>
        {qCards.map(c => (
          <div key={c.label} onClick={() => setActive(c.page)} style={{ background: c.bg, border: `1px solid ${c.color}30`, borderRadius: 16, padding: "16px 10px", textAlign: "center", cursor: "pointer", transition: "all 0.3s" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = `0 10px 28px ${c.color}28`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
            <div style={{ color: c.color, display: "flex", justifyContent: "center", marginBottom: 7 }}><I n={c.icon} s={22} c={c.color} /></div>
            <div style={{ fontSize: 11, fontWeight: 700 }}>{c.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 20 }}>
        {/* Tasks */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14, display: "flex", alignItems: "center", gap: 7 }}><span style={{ color: "#FF6B35" }}>✅</span> Today's Tasks</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {tasks.map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", borderRadius: 11, background: t.done ? "rgba(16,185,129,0.07)" : t.urgent ? "rgba(255,107,53,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${t.done ? "rgba(16,185,129,0.18)" : t.urgent ? "rgba(255,107,53,0.18)" : "rgba(255,255,255,0.05)"}` }}>
                <div style={{ width: 19, height: 19, borderRadius: 5, background: t.done ? "#10B981" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {t.done && <I n="check" s={11} c="white" />}
                </div>
                <span style={{ fontSize: 12, color: t.done ? "#475569" : "#E2E8F0", textDecoration: t.done ? "line-through" : "none", flex: 1 }}>{t.text}</span>
                {t.urgent && !t.done && <span className="badge" style={{ background: "rgba(255,107,53,0.2)", color: "#FF6B35" }}>Urgent</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Mood */}
        <div className="card">
          <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>💞 Family Mood Radar</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            {fMoods.map(m => (
              <div key={m.n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 11, padding: "9px 13px", flex: 1, minWidth: 50 }}>
                <div style={{ fontSize: 22 }}>{m.e}</div>
                <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>{m.n}</div>
              </div>
            ))}
          </div>
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 13, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: "#475569", marginBottom: 7 }}>Overall Family Vibe</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1 }}><div className="progress-bar"><div className="progress-fill" style={{ width: "72%", background: "linear-gradient(90deg,#FF6B35,#10B981)" }} /></div></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#10B981" }}>72% Happy 😊</span>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "#475569", marginBottom: 8 }}>How are YOU feeling today?</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[["😄", "Happy"], ["😊", "Good"], ["😐", "Neutral"], ["😔", "Sad"], ["😤", "Stressed"]].map(([e, l]) => (
              <button key={l} className={`mood-btn ${mood === l ? "selected" : ""}`} onClick={() => setMood(l)} title={l}>{e}</button>
            ))}
          </div>
          {mood && <p style={{ fontSize: 11, color: "#10B981", marginTop: 7 }}>✓ Mood logged: {mood}</p>}
        </div>
      </div>

      {/* Meds */}
      <div className="card">
        <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 14 }}>💊 Medicine Reminders Today</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(215px,1fr))", gap: 10 }}>
          {meds.map((m, i) => (
            <div key={i} style={{ background: m.done ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${m.done ? "rgba(16,185,129,0.18)" : "rgba(255,255,255,0.07)"}`, borderRadius: 13, padding: "11px 13px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💊</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{m.name}</div>
                <div style={{ fontSize: 10, color: "#475569" }}>{m.person} · {m.time}</div>
              </div>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: m.done ? "#10B981" : "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {m.done && <I n="check" s={11} c="white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Family Challenges teaser */}
      <div className="card" style={{ marginTop: 18, background: "linear-gradient(135deg,rgba(245,158,11,0.1),rgba(255,107,53,0.07))", border: "1px solid rgba(245,158,11,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 36 }}>🏆</div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#F59E0B" }}>Family Challenges</h3>
              <p style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>Complete challenges to boost your family happiness score!</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 24, color: "#F59E0B" }}>850 pts</div>
            <div style={{ fontSize: 10, color: "#64748B" }}>Family Happiness Score</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
          {[
            { t: "Drink 8 glasses today", e: "💧", done: false, pts: 50 },
            { t: "All 5 prayers completed", e: "🤲", done: true, pts: 100 },
            { t: "Help a family member", e: "💛", done: false, pts: 75 },
            { t: "Send appreciation message", e: "💌", done: true, pts: 60 },
          ].map((ch, i) => (
            <div key={i} style={{ background: ch.done ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", border: `1px solid ${ch.done ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 160 }}>
              <span style={{ fontSize: 18 }}>{ch.e}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ch.done ? "#10B981" : "#E2E8F0", textDecoration: ch.done ? "line-through" : "none" }}>{ch.t}</div>
                <div style={{ fontSize: 10, color: "#F59E0B" }}>+{ch.pts} pts</div>
              </div>
              {ch.done && <I n="check" s={14} c="#10B981" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Health Guardian ──
const Health = () => {
  const [tab, setTab] = useState("overview");
  const [water, setWater] = useState(5);
  const [note, setNote] = useState("");
  const [bs, setBs] = useState("");
  const [bsLog, setBsLog] = useState([
    { val: 110, time: "8:00 AM", status: "Normal" },
    { val: 145, time: "12:00 PM", status: "High" },
    { val: 98, time: "6:00 PM", status: "Normal" },
  ]);
  const meds = [
    { name: "Metformin 500mg", person: "Grandma", times: ["8:00 AM", "8:00 PM"], taken: [true, false], color: "#10B981" },
    { name: "Lisinopril 10mg", person: "Dad", times: ["9:00 AM"], taken: [true], color: "#3B82F6" },
    { name: "Aspirin 75mg", person: "Dad", times: ["Bedtime"], taken: [false], color: "#F59E0B" },
    { name: "Vitamin D 1000IU", person: "Everyone", times: ["12:00 PM"], taken: [false], color: "#A855F7" },
  ];
  const appts = [
    { d: "Dr. Khan – Cardiologist", date: "Mar 15", who: "Dad", e: "❤️" },
    { d: "Dr. Fatima – Endocrinologist", date: "Mar 22", who: "Grandma", e: "🩺" },
    { d: "Dr. Ahmed – Pediatrician", date: "Apr 5", who: "Ahmed", e: "👶" },
  ];
  return (
    <div style={{ padding: 22 }} className="fade-in">
      <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: "#10B981", marginBottom: 4 }}>💚 Health Guardian</h1>
      <p style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>Keeping your family healthy, one day at a time.</p>
      <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
        {["overview", "medicines", "tracker", "appointments"].map(t => <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {tab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
            {[
              { label: "Medicines Taken", value: "6/8", icon: "💊", color: "#10B981", pct: 75 },
              { label: "Water Intake", value: `${water}/8 glasses`, icon: "💧", color: "#3B82F6", pct: (water / 8) * 100 },
              { label: "Steps Today", value: "6,240", icon: "👟", color: "#F59E0B", pct: 62 },
              { label: "Avg Blood Sugar", value: "117 mg/dL", icon: "🩸", color: "#EF4444", pct: 70 },
            ].map(s => (
              <div key={s.label} className="card">
                <div style={{ fontSize: 26, marginBottom: 7 }}>{s.icon}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 9 }}>{s.label}</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 11 }}>📝 Daily Health Note</h3>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="How is everyone feeling today? Any symptoms to note?" style={{ resize: "none" }} />
            <button className="btn btn-secondary" style={{ marginTop: 11 }}>Save Note</button>
          </div>
        </div>
      )}
      {tab === "medicines" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {meds.map((m, i) => (
            <div key={i} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ width: 44, height: 44, borderRadius: 13, background: `${m.color}22`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>💊</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: "#475569" }}>For: {m.person}</div>
                  <div style={{ fontSize: 11, color: m.color, marginTop: 2 }}>{m.times.join(" · ")}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 7 }}>
                {m.times.map((t, j) => (
                  <div key={j} style={{ padding: "5px 11px", borderRadius: 18, fontSize: 11, fontWeight: 700, background: m.taken[j] ? `${m.color}22` : "rgba(255,255,255,0.05)", color: m.taken[j] ? m.color : "#64748B", border: `1px solid ${m.taken[j] ? m.color + "44" : "rgba(255,255,255,0.08)"}` }}>
                    {m.taken[j] ? "✓ " : ""}{t}
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}><I n="plus" s={15} c="white" /> Add Medicine</button>
        </div>
      )}
      {tab === "tracker" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>💧 Water Intake</h3>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 12 }}>
              {Array.from({ length: 8 }, (_, i) => (
                <div key={i} onClick={() => setWater(i + 1)} style={{ width: 44, height: 52, borderRadius: 11, cursor: "pointer", background: i < water ? "linear-gradient(180deg,#60A5FA,#3B82F6)" : "rgba(255,255,255,0.05)", border: `2px solid ${i < water ? "#3B82F6" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, transition: "all 0.3s", transform: i < water ? "scale(1.05)" : "scale(1)" }}>💧</div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#475569" }}>{water} of 8 glasses · {Math.round((water / 8) * 100)}% goal</p>
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>🩸 Blood Sugar Log</h3>
            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              <input value={bs} onChange={e => setBs(e.target.value)} placeholder="Enter mg/dL" type="number" />
              <button className="btn btn-primary" onClick={() => {
                if (!bs) return;
                const v = parseInt(bs);
                setBsLog(p => [{ val: v, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), status: v < 100 ? "Low" : v > 140 ? "High" : "Normal" }, ...p]);
                setBs("");
              }}>Add</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7, maxHeight: 190, overflowY: "auto" }}>
              {bsLog.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 11px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{l.val} mg/dL</span>
                  <span style={{ fontSize: 11, color: "#475569" }}>{l.time}</span>
                  <span className="badge" style={{ background: l.status === "Normal" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)", color: l.status === "Normal" ? "#10B981" : "#EF4444" }}>{l.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {tab === "appointments" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          {appts.map((a, i) => (
            <div key={i} className="card" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 34 }}>{a.e}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800 }}>{a.d}</div>
                <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>For: {a.who}</div>
              </div>
              <div style={{ background: "rgba(255,107,53,0.1)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 11, padding: "7px 13px" }}>
                <div style={{ fontSize: 12, color: "#FF6B35", fontWeight: 700 }}>{a.date}</div>
              </div>
            </div>
          ))}
          <button className="btn btn-primary" style={{ alignSelf: "flex-start" }}><I n="plus" s={15} c="white" /> Add Appointment</button>
        </div>
      )}
    </div>
  );
};

// ── Faith Companion ──
const Faith = () => {
  const [tab, setTab] = useState("prayer");
  const [count, setCount] = useState(0);
  const [tasbeeh, setTasbeeh] = useState("SubhanAllah");
  const prayers = [
    { name: "Fajr", time: "5:23 AM", arabic: "الفجر", status: "done" },
    { name: "Dhuhr", time: "12:45 PM", arabic: "الظهر", status: "done" },
    { name: "Asr", time: "4:12 PM", arabic: "العصر", status: "next" },
    { name: "Maghrib", time: "6:48 PM", arabic: "المغرب", status: "pending" },
    { name: "Isha", time: "8:15 PM", arabic: "العشاء", status: "pending" },
  ];
  const duas = [
    { title: "Morning Dua", arabic: "أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ", trans: "Asbahna wa asbahal mulku lillah", meaning: "We have entered the morning and the kingdom belongs to Allah" },
    { title: "Before Eating", arabic: "بِسْمِ اللَّهِ وَعَلَى بَرَكَةِ اللَّهِ", trans: "Bismillahi wa 'ala barakatillah", meaning: "In the name of Allah and with His blessings" },
    { title: "For Parents", arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيراً", trans: "Rabbi irhamhuma kama rabbayani saghira", meaning: "My Lord, have mercy on them as they raised me when small" },
  ];
  return (
    <div style={{ padding: 22 }} className="fade-in">
      <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, background: "linear-gradient(135deg,#A855F7,#6366F1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>🌙 Faith Companion</h1>
      <p style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>Your spiritual guide for daily life.</p>
      <div style={{ display: "flex", gap: 7, marginBottom: 22, flexWrap: "wrap" }}>
        {["prayer", "qibla", "tasbeeh", "duas", "ramadan"].map(t => <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      {tab === "prayer" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.13),rgba(99,102,241,0.08))", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 18, padding: "18px 22px", marginBottom: 18, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 3 }}>NEXT PRAYER</div>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 28, color: "#FF6B35" }}>Asr Prayer</div>
            <div style={{ fontSize: 44, fontWeight: 800, marginTop: 3 }}>4:12 PM</div>
            <div style={{ fontSize: 12, color: "#A855F7", marginTop: 3 }}>in 1 hour 23 minutes</div>
            <div style={{ fontSize: 10, color: "#475569", marginTop: 5 }}>📍 Hyderabad, Telangana · Calculation: ISNA</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {prayers.map(p => (
              <div key={p.name} className={`prayer-card ${p.status}`}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ fontSize: 24, minWidth: 34 }}>{p.status === "done" ? "✅" : p.status === "next" ? "⏰" : "🔘"}</div>
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.name}</div>
                    <div style={{ fontSize: 16, color: "#A855F7", fontFamily: "serif" }}>{p.arabic}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: p.status === "next" ? "#FF6B35" : "#E2E8F0" }}>{p.time}</div>
                  <span className="badge" style={{ marginTop: 3, background: p.status === "done" ? "rgba(16,185,129,0.2)" : p.status === "next" ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.06)", color: p.status === "done" ? "#10B981" : p.status === "next" ? "#FF6B35" : "#64748B" }}>
                    {p.status === "done" ? "Prayed ✓" : p.status === "next" ? "Next" : "Upcoming"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab === "qibla" && (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>🧭</div>
          <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 7 }}>Qibla Direction</h3>
          <p style={{ color: "#475569", marginBottom: 22, fontSize: 12 }}>Based on: Hyderabad, IN</p>
          <div style={{ width: 180, height: 180, borderRadius: "50%", margin: "0 auto 18px", background: "rgba(168,85,247,0.09)", border: "2px solid rgba(168,85,247,0.28)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <div style={{ position: "absolute", top: "9%", left: "50%", transform: "translateX(-50%)", fontSize: 11, color: "#A855F7", fontWeight: 700 }}>N</div>
            <div style={{ width: 3, height: 72, background: "linear-gradient(180deg,#FF6B35,transparent)", borderRadius: 2, transform: "rotate(-292deg)", transformOrigin: "bottom center" }} />
            <div style={{ position: "absolute", width: 13, height: 13, borderRadius: "50%", background: "#FF6B35" }} />
            <div style={{ position: "absolute", bottom: "9%", fontSize: 18 }}>🕋</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#A855F7" }}>292° — Northwest</div>
          <p style={{ fontSize: 12, color: "#475569", marginTop: 5 }}>Face Northwest toward the Kaaba</p>
        </div>
      )}
      {tab === "tasbeeh" && (
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          <select value={tasbeeh} onChange={e => setTasbeeh(e.target.value)} style={{ maxWidth: 260, marginBottom: 22, textAlign: "center", fontWeight: 700 }}>
            <option>SubhanAllah</option><option>Alhamdulillah</option><option>Allahu Akbar</option><option>La ilaha illallah</option><option>Astaghfirullah</option>
          </select>
          <div onClick={() => setCount(c => c + 1)} style={{ width: 190, height: 190, borderRadius: "50%", background: "radial-gradient(circle,rgba(168,85,247,0.28),rgba(99,102,241,0.08))", border: "3px solid rgba(168,85,247,0.38)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", margin: "0 auto 26px", cursor: "pointer", transition: "all 0.15s", userSelect: "none" }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
            <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 60, color: "#A855F7", lineHeight: 1 }}>{count}</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 3 }}>Tap to count</div>
          </div>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 3 }}>{tasbeeh}</div>
          <div style={{ fontSize: 20, color: "#A855F7", fontFamily: "serif", marginBottom: 18 }}>
            {tasbeeh === "SubhanAllah" ? "سُبْحَانَ اللَّهِ" : tasbeeh === "Alhamdulillah" ? "الْحَمْدُ لِلَّهِ" : tasbeeh === "Allahu Akbar" ? "اللَّهُ أَكْبَرُ" : "لَا إِلَهَ إِلَّا اللَّهُ"}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button className="btn btn-ghost" onClick={() => setCount(0)}>Reset</button>
            {count > 0 && count % 33 === 0 && <span className="badge" style={{ background: "rgba(16,185,129,0.2)", color: "#10B981", fontSize: 13 }}>✓ 33!</span>}
          </div>
        </div>
      )}
      {tab === "duas" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {duas.map((d, i) => (
            <div key={i} className="card">
              <h4 style={{ fontWeight: 800, color: "#A855F7", marginBottom: 9 }}>{d.title}</h4>
              <p style={{ fontSize: 20, color: "#E2E8F0", textAlign: "right", direction: "rtl", marginBottom: 7, lineHeight: 1.8, fontFamily: "serif" }}>{d.arabic}</p>
              <p style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic", marginBottom: 3 }}>{d.trans}</p>
              <p style={{ fontSize: 11, color: "#475569" }}>{d.meaning}</p>
            </div>
          ))}
        </div>
      )}
      {tab === "ramadan" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.13),rgba(245,158,11,0.09))", border: "1px solid rgba(168,85,247,0.2)", borderRadius: 18, padding: 22, textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: 44, marginBottom: 7 }}>🌙</div>
            <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: "#F59E0B" }}>Ramadan Mubarak!</h2>
            <p style={{ fontSize: 28, fontWeight: 800, color: "#A855F7", marginTop: 7 }}>Day 15 of 30</p>
            <div className="progress-bar" style={{ marginTop: 14, height: 11 }}>
              <div className="progress-fill" style={{ width: "50%", background: "linear-gradient(90deg,#A855F7,#F59E0B)" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[{ label: "Suhoor", time: "4:45 AM", icon: "🌅", color: "#F59E0B" }, { label: "Iftar", time: "6:48 PM", icon: "🌇", color: "#FF6B35" }].map(r => (
              <div key={r.label} className="card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 7 }}>{r.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 15 }}>{r.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: r.color, marginTop: 3 }}>{r.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Kids World ──
const Kids = () => {
  const [tab, setTab] = useState("home");
  const [lidx, setLidx] = useState(0);
  const [mathQ, setMathQ] = useState({ a: 4, b: 3, op: "+" });
  const [mRes, setMRes] = useState(null);
  const [score, setScore] = useState(0);
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const drawColor = useRef("#FF6B35");

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const lWords = ["Apple", "Bee", "Cat", "Duck", "Elephant", "Frog", "Grape", "House", "Ice cream", "Jasmine", "Kite", "Lion", "Mango", "Nightingale", "Orange", "Penguin", "Queen", "Rose", "Snake", "Tiger", "Umbrella", "Violin", "Whale", "Xylophone", "Yarn", "Zebra"];
  const lEmojis = ["🍎", "🐝", "🐱", "🦆", "🐘", "🐸", "🍇", "🏠", "🍦", "🌺", "🪁", "🦁", "🍈", "🐦", "🍊", "🐧", "👸", "🌹", "🐍", "🐯", "☂️", "🎻", "🐋", "🎮", "🪀", "🦓"];

  const genMath = () => {
    const ops = ["+", "-", "×"];
    const op = ops[Math.floor(Math.random() * 3)];
    let a, b;
    if (op === "+") { a = Math.floor(Math.random() * 10) + 1; b = Math.floor(Math.random() * 10) + 1; }
    else if (op === "-") { a = Math.floor(Math.random() * 10) + 5; b = Math.floor(Math.random() * 5) + 1; }
    else { a = Math.floor(Math.random() * 5) + 1; b = Math.floor(Math.random() * 5) + 1; }
    setMathQ({ a, b, op }); setMRes(null);
  };
  const correct = mathQ.op === "+" ? mathQ.a + mathQ.b : mathQ.op === "-" ? mathQ.a - mathQ.b : mathQ.a * mathQ.b;

  const sd = e => { drawing.current = true; const ctx = canvasRef.current.getContext("2d"); const r = canvasRef.current.getBoundingClientRect(); ctx.beginPath(); ctx.moveTo(e.clientX - r.left, e.clientY - r.top); };
  const dd = e => { if (!drawing.current) return; const ctx = canvasRef.current.getContext("2d"); const r = canvasRef.current.getBoundingClientRect(); ctx.lineTo(e.clientX - r.left, e.clientY - r.top); ctx.strokeStyle = drawColor.current; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.stroke(); };
  const stopD = () => { drawing.current = false; };

  const stories = [
    { title: "The Generous Spider", e: "🕷️", preview: "Prophet Muhammad ﷺ was resting in a cave. A tiny spider spun its web at the entrance, protecting him from harm..." },
    { title: "The Kind Elephant", e: "🐘", preview: "In a forest far away, an elephant named Noor always helped other animals in trouble, teaching everyone the joy of giving..." },
    { title: "Ibrahim and the Stars", e: "⭐", preview: "A young boy named Ibrahim looked at the sky and wondered: 'Who made all these beautiful stars?'..." },
  ];

  return (
    <div style={{ padding: 22 }} className="fade-in">
      <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 30, background: "linear-gradient(135deg,#FFE66D,#FF6B9D,#4ECDC4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>🌈 Kids World</h1>
      <p style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>A safe & fun place just for you! 🎉</p>
      {tab === "home" && (
        <div>
          <div style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,230,109,0.08))", border: "1px solid rgba(255,230,109,0.2)", borderRadius: 18, padding: 18, marginBottom: 22, display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 42 }} className="bounce-anim">⭐</div>
            <div>
              <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, color: "#FFE66D" }}>My Stars: {score}</h3>
              <p style={{ fontSize: 12, color: "#94A3B8" }}>Keep learning to earn more stars!</p>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 14 }}>
            {[
              { id: "alphabet", icon: "🔤", label: "Alphabet Fun", color: "#FF6B9D", bg: "rgba(255,107,157,0.1)" },
              { id: "math", icon: "🔢", label: "Math Games", color: "#4ECDC4", bg: "rgba(78,205,196,0.1)" },
              { id: "drawing", icon: "🎨", label: "Drawing Board", color: "#FFE66D", bg: "rgba(255,230,109,0.1)" },
              { id: "stories", icon: "📖", label: "Islamic Stories", color: "#A855F7", bg: "rgba(168,85,247,0.1)" },
            ].map(item => (
              <div key={item.id} className="kid-card" onClick={() => setTab(item.id)} style={{ background: item.bg, border: `2px solid ${item.color}40` }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-6px) scale(1.03)"; e.currentTarget.style.boxShadow = `0 18px 40px ${item.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
                <div style={{ fontSize: 50, marginBottom: 11 }} className="float">{item.icon}</div>
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, color: item.color }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab !== "home" && (
        <div>
          <button className="btn btn-ghost" style={{ marginBottom: 18 }} onClick={() => setTab("home")}>← Back</button>
          {tab === "alphabet" && (
            <div className="card" style={{ textAlign: "center", padding: 36 }}>
              <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 110, lineHeight: 1, color: "#FF6B9D", marginBottom: 7 }}>{letters[lidx]}</div>
              <div style={{ fontSize: 56, marginBottom: 11 }}>{lEmojis[lidx]}</div>
              <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, marginBottom: 22 }}>{letters[lidx]} is for {lWords[lidx]}</div>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", marginBottom: 18 }}>
                <button onClick={() => setLidx(i => Math.max(0, i - 1))} style={{ background: "linear-gradient(135deg,#FF6B9D,#FF8C61)", border: "none", borderRadius: 18, color: "white", fontFamily: "'Fredoka One',cursive", fontSize: 17, padding: "12px 22px", cursor: "pointer", transition: "all 0.3s" }}>← Prev</button>
                <button onClick={() => setLidx(i => Math.min(25, i + 1))} style={{ background: "linear-gradient(135deg,#4ECDC4,#26D4C8)", border: "none", borderRadius: 18, color: "#1A1A2E", fontFamily: "'Fredoka One',cursive", fontSize: 17, padding: "12px 22px", cursor: "pointer", transition: "all 0.3s" }}>Next →</button>
              </div>
              <div style={{ display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap" }}>
                {letters.map((l, i) => (
                  <div key={l} onClick={() => setLidx(i)} style={{ width: 27, height: 27, borderRadius: 5, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: i === lidx ? "#FF6B9D" : "rgba(255,255,255,0.06)", color: i === lidx ? "white" : "#64748B" }}>{l}</div>
                ))}
              </div>
            </div>
          )}
          {tab === "math" && (
            <div className="card" style={{ textAlign: "center", padding: 36, maxWidth: 480, margin: "0 auto" }}>
              <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, color: "#4ECDC4", marginBottom: 18 }}>⭐ Score: {score}</div>
              <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 52, marginBottom: 22 }}>{mathQ.a} {mathQ.op} {mathQ.b} = ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 18 }}>
                {[...new Set([correct, correct + Math.floor(Math.random() * 5) + 1, correct - Math.floor(Math.random() * 5) - 1])].slice(0, 3).sort(() => Math.random() - 0.5).map(opt => (
                  <button key={opt} onClick={() => {
                    if (opt === correct) { setMRes("correct"); setScore(s => s + 10); setTimeout(genMath, 1200); }
                    else setMRes("wrong");
                  }} style={{ background: "linear-gradient(135deg,#4ECDC4,#26D4C8)", border: "none", borderRadius: 18, color: "#1A1A2E", fontFamily: "'Fredoka One',cursive", fontSize: 22, padding: "13px", cursor: "pointer", transition: "all 0.3s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""}>{opt}</button>
                ))}
              </div>
              {mRes === "correct" && <div style={{ fontSize: 36, animation: "bounce 0.5s ease" }}>🎉 Correct! +10 ⭐</div>}
              {mRes === "wrong" && <div style={{ fontSize: 28 }}>❌ Try again!</div>}
              <button onClick={genMath} style={{ marginTop: 16, background: "linear-gradient(135deg,#FF6B9D,#FF8C61)", border: "none", borderRadius: 16, color: "white", fontFamily: "'Fredoka One',cursive", fontSize: 16, padding: "11px 22px", cursor: "pointer" }}>New Question 🔄</button>
            </div>
          )}
          {tab === "drawing" && (
            <div className="card" style={{ textAlign: "center" }}>
              <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, marginBottom: 14, color: "#FFE66D" }}>🎨 Drawing Board</h3>
              <canvas ref={canvasRef} width={580} height={320} className="drawing-canvas"
                style={{ background: "#0D1117", border: "2px solid rgba(255,230,109,0.28)", maxWidth: "100%" }}
                onMouseDown={sd} onMouseMove={dd} onMouseUp={stopD} onMouseLeave={stopD} />
              <div style={{ marginTop: 11, display: "flex", gap: 7, justifyContent: "center", flexWrap: "wrap" }}>
                {["#FF6B9D", "#4ECDC4", "#FFE66D", "#A855F7", "#10B981", "#FF6B35", "#60A5FA", "#ffffff", "#000000"].map(col => (
                  <div key={col} onClick={() => { drawColor.current = col; }} style={{ width: 30, height: 30, borderRadius: "50%", background: col, cursor: "pointer", border: "2px solid rgba(255,255,255,0.2)", transition: "transform 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.25)"}
                    onMouseLeave={e => e.currentTarget.style.transform = ""} />
                ))}
                <button style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#E2E8F0", fontSize: 12, fontFamily: "'Nunito',sans-serif", fontWeight: 700, padding: "5px 13px", cursor: "pointer" }}
                  onClick={() => { const ctx = canvasRef.current.getContext("2d"); ctx.clearRect(0, 0, 580, 320); }}>Clear 🗑️</button>
              </div>
            </div>
          )}
          {tab === "stories" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {stories.map((s, i) => (
                <div key={i} className="card" style={{ cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                    <div style={{ fontSize: 44, minWidth: 55 }}>{s.e}</div>
                    <div>
                      <h4 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, color: "#FFE66D", marginBottom: 5 }}>{s.title}</h4>
                      <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.6 }}>{s.preview}</p>
                      <button style={{ marginTop: 11, background: "linear-gradient(135deg,#A855F7,#6366F1)", border: "none", borderRadius: 14, color: "white", fontFamily: "'Fredoka One',cursive", fontSize: 14, padding: "9px 18px", cursor: "pointer" }}>Read Story 📖</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Family Chat ──
const Chat = () => {
  const [msgs, setMsgs] = useState([
    { id: 1, sender: "Mama", text: "As-salamu Alaykum everyone! 🌟", time: "10:02 AM", mine: false, av: "👩" },
    { id: 2, sender: "Dad", text: "Wa Alaykum Salaam! How is everyone doing?", time: "10:04 AM", mine: false, av: "👨" },
    { id: 3, sender: "Me", text: "Alhamdulillah! Doing great 😊", time: "10:05 AM", mine: true, av: "🧑" },
    { id: 4, sender: "Ahmed", text: "Baba can we go to the park after Asr? 🌳", time: "10:07 AM", mine: false, av: "👦" },
    { id: 5, sender: "Dad", text: "Insha'Allah we will! 🌳", time: "10:08 AM", mine: false, av: "👨" },
    { id: 6, sender: "Grandma", text: "Children, remember your prayers 🤲", time: "10:10 AM", mine: false, av: "👵" },
  ]);
  const [input, setInput] = useState("");
  const [activeChat, setActiveChat] = useState("family");
  const endRef = useRef(null);

  const members = [
    { id: "family", name: "Family Group", av: "👨‍👩‍👧‍👦", online: true, last: "Grandma: Remember prayers 🤲", unread: 0 },
    { id: "mama", name: "Mama", av: "👩", online: true, last: "Don't forget medicines!", unread: 1 },
    { id: "dad", name: "Dad", av: "👨", online: false, last: "See you at dinner", unread: 0 },
    { id: "grandma", name: "Grandma", av: "👵", online: true, last: "Remember your prayers", unread: 2 },
  ];

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: Date.now(), sender: "Me", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), mine: true, av: "🧑" }]);
    setInput("");
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  const emojis = ["😊", "😂", "🥰", "😍", "🙏", "💪", "❤️", "🌟", "🎉", "👍", "🌹", "🤲", "💛", "🌙"];

  return (
    <div style={{ padding: 22, display: "flex", gap: 18, height: "calc(100vh - 60px)" }} className="fade-in">
      {/* Sidebar */}
      <div style={{ width: 270, flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "#4ECDC4", marginBottom: 14 }}>💬 Family Chat</h2>
        <input placeholder="Search conversations..." style={{ marginBottom: 10 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {members.map(m => (
            <div key={m.id} onClick={() => setActiveChat(m.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", borderRadius: 13, cursor: "pointer", transition: "all 0.3s", background: activeChat === m.id ? "rgba(78,205,196,0.09)" : "rgba(255,255,255,0.02)", border: `1px solid ${activeChat === m.id ? "rgba(78,205,196,0.28)" : "rgba(255,255,255,0.05)"}` }}>
              <div style={{ position: "relative" }}>
                <div style={{ fontSize: 26 }}>{m.av}</div>
                <div style={{ position: "absolute", bottom: 0, right: 0, width: 9, height: 9, borderRadius: "50%", background: m.online ? "#10B981" : "#475569", border: "2px solid #0D0D1A" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, display: "flex", justifyContent: "space-between" }}>
                  <span>{m.name}</span>
                  {m.unread > 0 && <span style={{ background: "#FF6B35", color: "white", borderRadius: "50%", width: 17, height: 17, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800 }}>{m.unread}</span>}
                </div>
                <div style={{ fontSize: 10, color: "#475569", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.last}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Chat */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.02)", borderRadius: 18, border: "1px solid rgba(255,255,255,0.05)", overflow: "hidden" }}>
        <div style={{ padding: "12px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: 11 }}>
          <div style={{ fontSize: 26 }}>{members.find(m => m.id === activeChat)?.av}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 14 }}>{members.find(m => m.id === activeChat)?.name}</div>
            <div style={{ fontSize: 10, color: "#10B981" }}>● Online · 5 members</div>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {msgs.map(msg => (
            <div key={msg.id} style={{ display: "flex", justifyContent: msg.mine ? "flex-end" : "flex-start", alignItems: "flex-end", gap: 7 }}>
              {!msg.mine && <div style={{ fontSize: 22, marginBottom: 3 }}>{msg.av}</div>}
              <div style={{ maxWidth: "72%" }}>
                {!msg.mine && <div style={{ fontSize: 10, color: "#475569", marginBottom: 2, marginLeft: 2 }}>{msg.sender}</div>}
                <div className={`chat-bubble ${msg.mine ? "sent" : "received"}`}>{msg.text}</div>
                <div style={{ fontSize: 9, color: "#475569", marginTop: 2, textAlign: msg.mine ? "right" : "left" }}>{msg.time} {msg.mine && "✓✓"}</div>
              </div>
              {msg.mine && <div style={{ fontSize: 22, marginBottom: 3 }}>{msg.av}</div>}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <div style={{ padding: "7px 14px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", gap: 5, flexWrap: "wrap" }}>
          {emojis.map(e => <span key={e} style={{ fontSize: 17, cursor: "pointer", transition: "transform 0.2s", userSelect: "none" }} onClick={() => setInput(i => i + e)} onMouseEnter={el => el.currentTarget.style.transform = "scale(1.4)"} onMouseLeave={el => el.currentTarget.style.transform = ""}>{e}</span>)}
        </div>
        <div style={{ padding: "11px 14px", display: "flex", gap: 9, alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <button className="btn btn-ghost" style={{ padding: "9px 11px" }}><I n="camera" s={15} /></button>
          <button className="btn btn-ghost" style={{ padding: "9px 11px" }}><I n="mic" s={15} /></button>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Type a message..." style={{ flex: 1 }} />
          <button className="btn btn-primary" onClick={send} style={{ padding: "9px 13px" }}><I n="send" s={15} c="white" /></button>
        </div>
      </div>
    </div>
  );
};

// ── Memories ──
const Memories = () => {
  const [tab, setTab] = useState("all");
  const [modal, setModal] = useState(false);
  const memories = [
    { id: 1, title: "Eid al-Fitr 2025", e: "🌙", date: "Mar 30, 2025", type: "photo", color: "#A855F7", note: "A blessed day with the whole family!" },
    { id: 2, title: "Ahmed's First A+", e: "⭐", date: "Jan 15, 2026", type: "note", color: "#FFE66D", note: "So proud of our little scholar!" },
    { id: 3, title: "Grandma's 70th Birthday", e: "🎂", date: "Feb 1, 2026", type: "photo", color: "#EC4899", note: "May Allah grant her health and happiness." },
    { id: 4, title: "Family Picnic", e: "🌳", date: "Dec 20, 2025", type: "photo", color: "#10B981", note: "The park was beautiful this winter." },
    { id: 5, title: "Sara Learns Quran", e: "📖", date: "Nov 5, 2025", type: "note", color: "#4ECDC4", note: "A milestone we will never forget." },
    { id: 6, title: "Time Capsule 2030", e: "⏳", date: "Opens: 2030", type: "capsule", color: "#F59E0B", locked: true, note: "A letter to our future selves..." },
  ];
  const filtered = memories.filter(m => tab === "all" || (tab === "photos" && m.type === "photo") || (tab === "notes" && m.type === "note") || (tab === "capsules" && m.type === "capsule"));
  return (
    <div style={{ padding: 22 }} className="fade-in">
      <div style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, background: "linear-gradient(135deg,#EC4899,#A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>📸 Memory Capsule</h1>
          <p style={{ color: "#475569", fontSize: 12, marginTop: 3 }}>Your family's precious moments, preserved forever.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><I n="plus" s={14} c="white" /> Add Memory</button>
      </div>
      <div style={{ display: "flex", gap: 7, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", "photos", "notes", "capsules"].map(t => <button key={t} className={`tab-btn ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(255px,1fr))", gap: 16 }}>
        {filtered.map(m => (
          <div key={m.id} className="memory-card card" style={{ background: `linear-gradient(135deg,${m.color}12,${m.color}06)`, border: `1px solid ${m.color}30` }}>
            {m.locked && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(10px)", borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 7, zIndex: 2 }}>
                <I n="lock" s={30} c="#F59E0B" />
                <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 15, color: "#F59E0B" }}>Opens in 2030</div>
                <div style={{ fontSize: 11, color: "#94A3B8" }}>~4 years remaining</div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <div style={{ fontSize: 38, minWidth: 46, textAlign: "center" }}>{m.e}</div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{m.title}</h4>
                <p style={{ fontSize: 11, color: "#94A3B8", lineHeight: 1.55, marginBottom: 8 }}>{m.note}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span className="badge" style={{ background: `${m.color}22`, color: m.color }}>{m.type}</span>
                  <span style={{ fontSize: 10, color: "#475569" }}>{m.date}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {modal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#1A1A2E", borderRadius: 22, padding: 28, width: 460, border: "1px solid rgba(255,255,255,0.09)", animation: "fadeInUp 0.3s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, color: "#EC4899" }}>✨ Create Memory</h3>
              <button className="btn btn-ghost" style={{ padding: "5px 9px" }} onClick={() => setModal(false)}><I n="close" s={15} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              <input placeholder="Memory title..." />
              <textarea rows={3} placeholder="Write about this memory..." style={{ resize: "none" }} />
              <div style={{ display: "flex", gap: 9 }}>
                <label className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}><I n="camera" s={15} /> Upload Photo</label>
                <label className="btn btn-ghost" style={{ flex: 1, justifyContent: "center", cursor: "pointer" }}><I n="mic" s={15} /> Voice Note</label>
              </div>
              <div style={{ background: "rgba(245,158,11,0.09)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 11, padding: 13 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#F59E0B", marginBottom: 7 }}>⏳ Time Capsule (Optional)</div>
                <input type="number" placeholder="Unlock year (e.g. 2030)" />
              </div>
              <button className="btn btn-primary" style={{ justifyContent: "center" }}>Save Memory 💾</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Emergency ──
const Emergency = () => {
  const [activated, setActivated] = useState(false);
  const [timer, setTimer] = useState(3);
  const [sent, setSent] = useState(false);
  const activate = () => {
    setActivated(true); let t = 3; setTimer(3);
    const iv = setInterval(() => { t--; setTimer(t); if (t === 0) { clearInterval(iv); setSent(true); } }, 1000);
  };
  const cancel = () => { setActivated(false); setSent(false); setTimer(3); };
  const contacts = [
    { name: "Mama", av: "👩", phone: "+91 98765 43210", online: true },
    { name: "Dad", av: "👨", phone: "+91 98765 43211", online: false },
    { name: "Uncle Hamid", av: "👴", phone: "+91 98765 43212", online: true },
  ];
  return (
    <div style={{ padding: 22 }} className="fade-in">
      <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: "#EF4444", marginBottom: 4 }}>🆘 Emergency SOS</h1>
      <p style={{ color: "#475569", fontSize: 12, marginBottom: 20 }}>One tap to alert your family instantly.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div className="card" style={{ textAlign: "center", padding: 36 }}>
          {!sent ? (
            <>
              <p style={{ fontSize: 12, color: "#475569", marginBottom: 22 }}>{activated ? `Sending alert in ${timer}...` : "Press for emergency alert"}</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
                <button className={`sos-btn ${activated ? "active" : ""}`} onClick={!activated ? activate : cancel}>
                  <div style={{ fontSize: 36 }}>🆘</div>
                  <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 20, marginTop: 4 }}>SOS</div>
                  {activated && <div style={{ fontSize: 10, marginTop: 2, opacity: 0.8 }}>Tap to Cancel</div>}
                </button>
              </div>
              <p style={{ fontSize: 11, color: "#475569" }}>Shares location & alerts all family members</p>
            </>
          ) : (
            <div className="fade-in">
              <div style={{ fontSize: 56, marginBottom: 14 }}>✅</div>
              <h3 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 22, color: "#10B981", marginBottom: 7 }}>Alert Sent!</h3>
              <p style={{ fontSize: 12, color: "#475569", marginBottom: 14 }}>Your family has been notified with your location.</p>
              <button className="btn btn-ghost" onClick={cancel}>Dismiss</button>
            </div>
          )}
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14 }}>📞 Emergency Contacts</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {contacts.map(c => (
              <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 11, padding: "11px 13px", background: "rgba(255,255,255,0.03)", borderRadius: 13, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position: "relative" }}>
                  <div style={{ fontSize: 26 }}>{c.av}</div>
                  <div style={{ position: "absolute", bottom: 0, right: 0, width: 8, height: 8, borderRadius: "50%", background: c.online ? "#10B981" : "#475569", border: "2px solid #1A1A2E" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</div>
                  <div style={{ fontSize: 10, color: "#475569" }}>{c.phone}</div>
                </div>
                <button className="btn btn-danger" style={{ padding: "7px 11px", fontSize: 11 }}>Call</button>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 11, fontSize: 13 }}><I n="plus" s={14} /> Add Contact</button>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 11 }}>🛡️ Safety Reminders</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 9 }}>
          {[["📍", "Location sharing enabled"], ["📱", "All members notified"], ["🚑", "Nearest hospital: 2.4km"], ["👮", "Emergency: 100 / 112"]].map(([icon, text], i) => (
            <div key={i} style={{ padding: "9px 13px", background: "rgba(255,255,255,0.03)", borderRadius: 11, display: "flex", alignItems: "center", gap: 9 }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ── Settings ──
const Settings = () => {
  const [name, setName] = useState("Ahmed Family");
  const [notif, setNotif] = useState(true);
  const [prayer, setPrayer] = useState(true);
  const [med, setMed] = useState(true);
  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{ width: 46, height: 24, borderRadius: 12, cursor: "pointer", background: value ? "#10B981" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.3s", flexShrink: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "white", position: "absolute", top: 3, left: value ? 25 : 3, transition: "left 0.3s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
    </div>
  );
  return (
    <div style={{ padding: 22, maxWidth: 680 }} className="fade-in">
      <h1 style={{ fontFamily: "'Fredoka One',cursive", fontSize: 26, color: "#94A3B8", marginBottom: 22 }}>⚙️ Settings</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: "#FF6B35" }}>👨‍👩‍👧‍👦 Family Profile</h3>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg,rgba(255,107,53,0.28),rgba(255,230,109,0.18))", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>👨‍👩‍👧‍👦</div>
            <div style={{ flex: 1 }}><input value={name} onChange={e => setName(e.target.value)} style={{ fontWeight: 700, fontSize: 15 }} /></div>
          </div>
          <div style={{ padding: "11px 13px", background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.18)", borderRadius: 11, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#475569" }}>Family Invite Code</div>
              <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: 3, color: "#FF6B35", fontFamily: "monospace" }}>FAM-X7K2P</div>
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 11 }}>Copy 📋</button>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: "#4ECDC4" }}>🔔 Notifications</h3>
          {[["All Notifications", "Enable or disable all alerts", notif, setNotif], ["Prayer Time Alerts", "Get reminded for each prayer", prayer, setPrayer], ["Medicine Reminders", "Daily medication notifications", med, setMed]].map(([label, sub, val, fn], i, arr) => (
            <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <div><div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div><div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{sub}</div></div>
              <Toggle value={val} onChange={fn} />
            </div>
          ))}
        </div>
        <div className="card" style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.07),rgba(99,102,241,0.04))", border: "1px solid rgba(168,85,247,0.14)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, marginBottom: 11, color: "#A855F7" }}>ℹ️ About FamilyVerse</h3>
          <p style={{ fontSize: 12, color: "#94A3B8", lineHeight: 1.7, marginBottom: 11 }}>FamilyVerse was born from a simple idea: families deserve a private, intelligent space where health, faith, communication, and memories come together. In a world of distraction, this is your sanctuary.</p>
          <div style={{ padding: "11px 14px", background: "rgba(255,107,53,0.07)", borderRadius: 11, borderLeft: "3px solid #FF6B35" }}>
            <p style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic", lineHeight: 1.7 }}>"I built FamilyVerse not just as software, but as a love letter to every family — especially those navigating the beautiful chaos of daily life. May it serve you with grace."</p>
            <p style={{ fontSize: 11, color: "#FF6B35", fontWeight: 700, marginTop: 5 }}>— Syed Muzamil, Creator of FamilyVerse</p>
          </div>
          <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#3D3D5C" }}>
            <span>Version 1.0.0</span><span>Crafted with care for families. 💛</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Auth Screen ──
const Auth = ({ onAuth }) => {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const submit = () => {
    if (mode === "login" ? (email && pw) : (email && pw && code)) onAuth();
    else setErr("Please fill all required fields.");
  };
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(ellipse at center,#1A1A2E 0%,#0D0D1A 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, position: "relative" }}>
      <Stars />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontFamily: "'Fredoka One',cursive", fontSize: 46, background: "linear-gradient(135deg,#FF6B35,#FFE66D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 4 }}>🌟 FamilyVerse</div>
          <div style={{ fontSize: 11, color: "#3D3D5C", letterSpacing: 2 }}>THE INTELLIGENT FAMILY UNIVERSE</div>
        </div>
        <div className="glass" style={{ borderRadius: 22, padding: 28 }}>
          <div style={{ display: "flex", gap: 3, marginBottom: 22, background: "rgba(255,255,255,0.04)", borderRadius: 13, padding: 3 }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(""); }} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 10, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13, background: mode === m ? "linear-gradient(135deg,#FF6B35,#FF8C61)" : "transparent", color: mode === m ? "white" : "#64748B", transition: "all 0.3s" }}>{m === "login" ? "Sign In" : "Join Family"}</button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            <input placeholder="Email address" type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input placeholder="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
            {mode === "signup" && <input placeholder="Family invite code (e.g. FAM-X7K2P)" value={code} onChange={e => setCode(e.target.value)} />}
            {err && <p style={{ fontSize: 11, color: "#EF4444" }}>{err}</p>}
            <button className="btn btn-primary" style={{ justifyContent: "center", padding: "13px", fontSize: 14 }} onClick={submit}>
              {mode === "login" ? "Enter FamilyVerse →" : "Create Account →"}
            </button>
            <p style={{ fontSize: 10, color: "#475569", textAlign: "center" }}>Demo: enter any email + password to explore</p>
          </div>
        </div>
        <div style={{ textAlign: "center", marginTop: 22 }}>
          <p style={{ fontSize: 11, color: "#3D3D5C", fontStyle: "italic" }}>"Where every family moment becomes a memory forever."</p>
          <p style={{ fontSize: 10, color: "#FF6B35", marginTop: 4, fontWeight: 700 }}>— Syed Muzamil</p>
        </div>
        <p style={{ textAlign: "center", fontSize: 9, color: "#2D2D4E", marginTop: 11 }}>Crafted with care for families.</p>
      </div>
    </div>
  );
};

// ── App Root ──
export default function App() {
  const [authed, setAuthed] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(false);
  const pages = { dashboard: <Dashboard setActive={setActive} />, health: <Health />, faith: <Faith />, kids: <Kids />, chat: <Chat />, memories: <Memories />, emergency: <Emergency />, settings: <Settings /> };
  if (!authed) return <><style>{globalStyles}</style><Auth onAuth={() => setAuthed(true)} /></>;
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0D0D1A", position: "relative" }}>
      <style>{globalStyles}</style>
      <Stars />
      {/* Mobile header */}
      <div className="mobile-header" style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 200, background: "#0D0D1A", borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "11px 14px", alignItems: "center", gap: 11 }}>
        <button onClick={() => setSideOpen(!sideOpen)} className="btn btn-ghost" style={{ padding: "7px 9px" }}><I n="menu" s={17} /></button>
        <span style={{ fontFamily: "'Fredoka One',cursive", fontSize: 18, background: "linear-gradient(135deg,#FF6B35,#FFE66D)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>🌟 FamilyVerse</span>
      </div>
      <Sidebar active={active} setActive={p => { setActive(p); setSideOpen(false); }} open={sideOpen} />
      <main style={{ flex: 1, overflowY: "auto", position: "relative", zIndex: 1 }}>
        {pages[active]}
        <footer style={{ padding: "16px 22px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 7 }}>
          <span style={{ fontSize: 10, color: "#2D2D4E" }}>Crafted with care for families. 💛</span>
          <span style={{ fontSize: 10, color: "#2D2D4E", fontStyle: "italic" }}>A creation by Syed Muzamil</span>
        </footer>
      </main>
      {sideOpen && <div onClick={() => setSideOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 99 }} />}
    </div>
  );
}
