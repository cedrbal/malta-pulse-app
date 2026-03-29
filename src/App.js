import { useState, useEffect, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const SOURCES = [
  { id: "tom", name: "Times of Malta", icon: "🗞️", category: "News", color: "#e63946" },
  { id: "ind", name: "Malta Independent", icon: "📰", category: "News", color: "#457b9d" },
  { id: "mtd", name: "MaltaToday", icon: "📡", category: "News", color: "#2d6a4f" },
  { id: "lovin", name: "Lovin Malta", icon: "❤️", category: "Lifestyle", color: "#e76f51" },
  { id: "md", name: "Malta Daily", icon: "☀️", category: "News", color: "#f4a261" },
  { id: "sport", name: "Malta Sports", icon: "⚽", category: "Sports", color: "#264653" },
  { id: "weather", name: "MeteoCiel / MET", icon: "🌤️", category: "Weather", color: "#48cae4" },
  { id: "traffic", name: "Google Maps / Waze", icon: "🚗", category: "Traffic", color: "#6a994e" },
];

const CATEGORIES = ["All", "Breaking", "News", "Weather", "Traffic", "Sports", "Lifestyle"];

const CAT_COLORS = {
  Breaking: "#e63946",
  News: "#457b9d",
  Weather: "#48cae4",
  Traffic: "#6a994e",
  Sports: "#264653",
  Lifestyle: "#e76f51",
};

const TONE_PROMPT = `You write in a casual, fun, hype Maltese English voice. Use emojis naturally, local references, and excitement. 
For breaking news: urgent and punchy. For lifestyle/events: fun and engaging. Always write from scratch — never copy source text.
Always end with a question or CTA to boost engagement. Use relevant hashtags.`;

const MOCK_QUEUE = [
  {
    id: 1, category: "Breaking", isBreaking: true,
    source: "Times of Malta", sourceIcon: "🗞️",
    rawTitle: "Fatal accident on Mosta bypass causes major delays",
    rawSummary: "A two-vehicle collision on the Mosta bypass this morning has resulted in one fatality and serious injuries to two others. Emergency services are on the scene.",
    generatedPost: "🚨 BREAKING | Tragic news from the Mosta bypass this morning — a serious crash has claimed one life and left two others injured 💔 Emergency services are at the scene and traffic is at a standstill.\n\nPlease AVOID the area and take alternative routes. Stay safe out there, Malta 🙏\n\n#MaltaNews #MostaBypass #Breaking #RoadSafety #Malta",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600&q=80",
    timestamp: "08:43", timeAgo: "2 min ago", status: "pending", alertSent: true,
  },
  {
    id: 2, category: "Weather", isBreaking: false,
    source: "MeteoCiel / MET", sourceIcon: "🌤️",
    rawTitle: "Hot and humid through the week — 35°C by Thursday",
    rawSummary: "Malta Meteorological Office forecasts a persistent high pressure system bringing temperatures up to 35°C by mid-week with humidity levels above 80%.",
    generatedPost: "🌡️ WEATHER CHECK | Yeah it's about to get SPICY, Malta! 🔥 Temps climbing to 35°C by Thursday with humidity that'll make you feel like you're swimming through air 😅\n\nHydrate, wear sunscreen, and maybe don't plan that outdoor workout for midday yeah? 💦\n\nHigh: 35°C 🌞 | Low: 26°C 🌙 | Humidity: 80%+ 💧 | UV: Very High ☀️\n\n#MaltaWeather #HeatWave #Malta #Summer #StayCool",
    image: "https://images.unsplash.com/photo-1561553873-e8491a564fd0?w=600&q=80",
    timestamp: "09:00", timeAgo: "15 min ago", status: "pending", alertSent: false,
  },
  {
    id: 3, category: "Traffic", isBreaking: false,
    source: "Google Maps / Waze", sourceIcon: "🚗",
    rawTitle: "Heavy congestion on Regional Road A1 — 40 min delays",
    rawSummary: "Waze and Google Maps reporting major slowdowns on the Regional Road between Birkirkara and Attard junction. Estimated delays of 35–40 minutes.",
    generatedPost: "🚗 TRAFFIC ALERT | The Regional Road is basically a car park right now 😩 Birkirkara ➡️ Attard junction — you're looking at 40 MINUTES of delays!\n\nQuick detours:\n📍 Via Balzan back roads\n📍 Through Lija village\n📍 St. Andrew's Road\n\nLeave earlier or grab a coffee and wait it out ☕\n\n#MaltaTraffic #RegionalRoad #Birkirkara #MaltaDriving #TrafficUpdate",
    image: "https://images.unsplash.com/photo-1581262208435-41726149a759?w=600&q=80",
    timestamp: "08:55", timeAgo: "20 min ago", status: "approved", alertSent: false,
  },
  {
    id: 4, category: "Sports", isBreaking: false,
    source: "Malta Sports", sourceIcon: "⚽",
    rawTitle: "Hibernians win BOV Premier League title after 3-1 win over Valletta FC",
    rawSummary: "Hibernians FC clinched the BOV Premier League title last night with a commanding 3-1 victory over Valletta FC at the National Stadium.",
    generatedPost: "🏆 CHAMPIONS!! Hibernians are your BOV Premier League winners!! 🔴⚫🔥\n\nWhat a night at the National Stadium — 3-1 over Valletta FC and the title is THEIRS! The Paola faithful are going absolutely mental right now 🎉🎉\n\nHibernians fans — this one's for you! Drop a 🔴 in the comments!\n\n#Hibernians #BOVPremierLeague #MaltaFootball #Champions #PaolaFC #MaltaSports",
    image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&q=80",
    timestamp: "07:30", timeAgo: "1 hr ago", status: "pending", alertSent: false,
  },
  {
    id: 5, category: "Lifestyle", isBreaking: false,
    source: "Lovin Malta", sourceIcon: "❤️",
    rawTitle: "New rooftop bar opens in Valletta with 360° harbour views",
    rawSummary: "A new rooftop bar called Bastion Sky has opened on Republic Street, Valletta, offering panoramic views of the Grand Harbour and Marsamxett.",
    generatedPost: "🍹 NEW SPOT ALERT! Valletta just got a whole lot cooler 😍 Bastion Sky is officially OPEN on Republic Street and the views are absolutely INSANE — 360° of Grand Harbour magic!\n\nPerfect for sundowners, date nights, or just showing off to your tourist friends 😂✨\n\nHave you been yet? Tag who you're taking! 👇\n\n#BastionSky #Valletta #MaltaBars #GrandHarbour #MaltaNightlife #NewOpening",
    image: "https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=600&q=80",
    timestamp: "06:00", timeAgo: "2 hrs ago", status: "pending", alertSent: false,
  },
  {
    id: 6, category: "News", isBreaking: false,
    source: "Malta Daily", sourceIcon: "☀️",
    rawTitle: "Government announces €50M fund for first-time buyers",
    rawSummary: "Finance Minister unveils a new €50 million scheme to help first-time property buyers in Malta, including interest subsidies and down payment grants.",
    generatedPost: "🏠 LISTEN UP first-time buyers! The government just dropped €50 MILLION to help YOU get on the property ladder!! 👀💸\n\nWe're talking interest subsidies AND down payment grants — this could be your moment!\n\nFull details dropping soon but if you've been dreaming of your own place in Malta... this one's for you 🔑✨\n\nAre you a first-time buyer? Drop a 🏠 below!\n\n#MaltaProperty #FirstTimeBuyer #MaltaNews #RealEstate #Malta #HomeOwner",
    image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=80",
    timestamp: "05:00", timeAgo: "3 hrs ago", status: "posted", alertSent: false,
  },
];

// ─── AGENT STATUS DATA ─────────────────────────────────────────────────────────
const INITIAL_AGENTS = [
  { id: "news", name: "News Agent", icon: "🗞️", status: "running", lastRun: "2 min ago", nextRun: "3 min", postsFound: 14, sources: ["Times of Malta", "Malta Independent", "MaltaToday", "Malta Daily"] },
  { id: "social", name: "Social Agent", icon: "📱", status: "running", lastRun: "5 min ago", nextRun: "5 min", postsFound: 7, sources: ["Lovin Malta", "Malta Daily FB", "Sports Pages"] },
  { id: "weather", name: "Weather Agent", icon: "🌤️", status: "running", lastRun: "45 min ago", nextRun: "15 min", postsFound: 2, sources: ["MeteoCiel", "MET Malta", "Open-Meteo"] },
  { id: "traffic", name: "Traffic Agent", icon: "🚗", status: "running", lastRun: "1 min ago", nextRun: "2 min", postsFound: 3, sources: ["Google Maps API", "Waze API"] },
  { id: "alert", name: "Alert Agent", icon: "🚨", status: "running", lastRun: "Just now", nextRun: "always on", postsFound: 1, sources: ["WhatsApp", "Email"] },
];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function AgentPulse({ status }) {
  return (
    <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: status === "running" ? "#4ade80" : status === "paused" ? "#fbbf24" : "#f87171", boxShadow: status === "running" ? "0 0 0 3px rgba(74,222,128,0.25)" : "none", animation: status === "running" ? "pulse 2s infinite" : "none" }} />
  );
}

function BreakingBanner({ post, onApprove, onDismiss }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #e63946, #c1121f)", color: "#fff", padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, animation: "slideDown 0.4s ease" }}>
      <span style={{ fontSize: 22, animation: "shake 0.5s infinite" }}>🚨</span>
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 13, letterSpacing: 3, opacity: 0.8, textTransform: "uppercase" }}>Breaking Alert</span>
        <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 16 }}>{post.rawTitle}</div>
        <div style={{ fontSize: 12, opacity: 0.75, fontFamily: "system-ui", marginTop: 2 }}>WhatsApp & Email alert sent • {post.timeAgo}</div>
      </div>
      <button onClick={onApprove} style={{ background: "#fff", color: "#e63946", border: "none", padding: "8px 20px", borderRadius: 8, fontWeight: 800, cursor: "pointer", fontFamily: "system-ui", fontSize: 13 }}>
        ✅ APPROVE NOW
      </button>
      <button onClick={onDismiss} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "none", padding: "8px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui", fontSize: 13 }}>
        Review Later
      </button>
    </div>
  );
}

function PostCard({ post, onSelect, selected }) {
  const catColor = CAT_COLORS[post.category] || "#888";
  return (
    <div onClick={() => onSelect(post)} style={{ background: selected ? "#1e2533" : "#151b27", border: `1.5px solid ${selected ? catColor : "rgba(255,255,255,0.07)"}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: selected ? `0 0 20px ${catColor}44` : "none" }}>
      <div style={{ position: "relative", height: 130 }}>
        <img src={post.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.8 }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", top: 8, left: 8, display: "flex", gap: 6 }}>
          <span style={{ background: catColor, color: "#fff", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 800, fontFamily: "system-ui", letterSpacing: 1, textTransform: "uppercase" }}>
            {post.isBreaking ? "🔴 BREAKING" : post.category}
          </span>
        </div>
        <div style={{ position: "absolute", top: 8, right: 8 }}>
          {post.status === "pending" && <span style={{ background: "#fbbf24", color: "#000", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, fontFamily: "system-ui" }}>PENDING</span>}
          {post.status === "approved" && <span style={{ background: "#4ade80", color: "#000", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, fontFamily: "system-ui" }}>APPROVED</span>}
          {post.status === "posted" && <span style={{ background: "#1877F2", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, fontFamily: "system-ui" }}>POSTED</span>}
          {post.status === "rejected" && <span style={{ background: "#f87171", color: "#fff", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 800, fontFamily: "system-ui" }}>REJECTED</span>}
        </div>
        <div style={{ position: "absolute", bottom: 8, left: 10, right: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Oswald', sans-serif", lineHeight: 1.3 }}>{post.rawTitle}</div>
        </div>
      </div>
      <div style={{ padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "system-ui" }}>{post.sourceIcon} {post.source}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui" }}>{post.timeAgo}</span>
      </div>
    </div>
  );
}

function AgentCard({ agent, onToggle }) {
  return (
    <div style={{ background: "#151b27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{agent.icon}</span>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 600, fontSize: 14, color: "#fff" }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontFamily: "system-ui", marginTop: 1 }}>Next: {agent.nextRun}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AgentPulse status={agent.status} />
          <button onClick={() => onToggle(agent.id)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "rgba(255,255,255,0.6)", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "system-ui" }}>
            {agent.status === "running" ? "⏸ Pause" : "▶ Start"}
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {agent.sources.map(s => (
          <span key={s} style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)", padding: "2px 8px", borderRadius: 20, fontSize: 10, fontFamily: "system-ui" }}>{s}</span>
        ))}
      </div>
      <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.35)", fontFamily: "system-ui" }}>
        Last run: {agent.lastRun} · {agent.postsFound} items found
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export default function MaltaPulseDashboard() {
  const [posts, setPosts] = useState(MOCK_QUEUE);
  const [agents, setAgents] = useState(INITIAL_AGENTS);
  const [selected, setSelected] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [activeCategory, setActiveCategory] = useState("All");
  const [showSettings, setShowSettings] = useState(false);
  const [toast, setToast] = useState(null);
  const [breakingAlert, setBreakingAlert] = useState(MOCK_QUEUE[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("maltapulse_settings");
      return saved ? JSON.parse(saved) : { fbToken: "", fbPageId: "", whatsapp: "", email: "", claudeKey: "" };
    } catch { return { fbToken: "", fbPageId: "", whatsapp: "", email: "", claudeKey: "" }; }
  });

  useEffect(() => {
    try { localStorage.setItem("maltapulse_settings", JSON.stringify(settings)); } catch {}
  }, [settings]);
  const [liveStats, setLiveStats] = useState({ scraped: 47, generated: 31, posted: 12, pending: 4 });

  // Simulate live agent activity
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveStats(s => ({ ...s, scraped: s.scraped + Math.floor(Math.random() * 2) }));
      setAgents(prev => prev.map(a => ({
        ...a,
        lastRun: a.status === "running" ? (Math.random() > 0.7 ? "Just now" : a.lastRun) : a.lastRun,
      })));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (msg, type = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelect = (post) => {
    setSelected(post);
    setEditCaption(post.generatedPost);
  };

  const handleApprove = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "approved", generatedPost: editCaption } : p));
    if (breakingAlert?.id === id) setBreakingAlert(null);
    showToast("✅ Post approved — ready to go live!");
    setLiveStats(s => ({ ...s, pending: Math.max(0, s.pending - 1) }));
  };

  const handleReject = (id) => {
    setPosts(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
    setSelected(null);
    setBreakingAlert(null);
    showToast("❌ Post rejected.", "err");
  };

  const handlePost = async (post) => {
    if (!settings.fbToken || !settings.fbPageId) {
      setShowSettings(true);
      showToast("⚙️ Add your Facebook credentials first!", "err");
      return;
    }
    const caption = selected?.id === post.id ? editCaption : post.generatedPost;
    try {
      const res = await fetch(`https://graph.facebook.com/${settings.fbPageId}/feed`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: caption, access_token: settings.fbToken }),
      });
      const data = await res.json();
      if (data.id) {
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, status: "posted" } : p));
        showToast("🚀 LIVE on Facebook!");
        setLiveStats(s => ({ ...s, posted: s.posted + 1 }));
      } else {
        showToast(data.error?.message || "Facebook error — check credentials.", "err");
      }
    } catch {
      showToast("Network error. Try again.", "err");
    }
  };

  const handleRegenerate = async (post) => {
    if (!settings.claudeKey) { showToast("Add Claude API key in settings!", "err"); return; }
    setIsGenerating(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": settings.claudeKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 500,
          system: TONE_PROMPT,
          messages: [{ role: "user", content: `Write a Facebook post for Malta Pulse about this news. Write from scratch, do not copy source text. Category: ${post.category}\n\nHeadline: ${post.rawTitle}\nSummary: ${post.rawSummary}\n\nReturn only the Facebook post text.` }]
        })
      });
      const data = await res.json();
      const newCaption = data.content?.[0]?.text || editCaption;
      setEditCaption(newCaption);
      setPosts(prev => prev.map(p => p.id === post.id ? { ...p, generatedPost: newCaption } : p));
      showToast("✨ New caption generated!");
    } catch { showToast("AI generation failed.", "err"); }
    setIsGenerating(false);
  };

  const toggleAgent = (id) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, status: a.status === "running" ? "paused" : "running" } : a));
  };

  const filtered = posts.filter(p => activeCategory === "All" || p.category === activeCategory);

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", minHeight: "100vh", background: "#0d1117", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&display=swap');
        @keyframes pulse { 0%,100%{box-shadow:0 0 0 3px rgba(74,222,128,0.3)} 50%{box-shadow:0 0 0 6px rgba(74,222,128,0.1)} }
        @keyframes shake { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-10deg)} 75%{transform:rotate(10deg)} }
        @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeUp { from{transform:translateY(10px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes spin { to{transform:rotate(360deg)} }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0d1117; } ::-webkit-scrollbar-thumb { background: #2d3748; border-radius: 2px; }
        textarea:focus,input:focus { outline: none; }
        button:hover { filter: brightness(1.12); }
      `}</style>

      {/* TOAST */}
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 9999, background: toast.type === "err" ? "#e63946" : "#4ade80", color: toast.type === "err" ? "#fff" : "#000", padding: "12px 20px", borderRadius: 10, fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "fadeUp 0.3s ease", maxWidth: 300 }}>
          {toast.msg}
        </div>
      )}

      {/* BREAKING ALERT BANNER */}
      {breakingAlert && breakingAlert.status === "pending" && (
        <BreakingBanner post={breakingAlert} onApprove={() => handleApprove(breakingAlert.id)} onDismiss={() => setBreakingAlert(null)} />
      )}

      {/* HEADER */}
      <div style={{ background: "#151b27", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, background: "linear-gradient(135deg, #e63946, #457b9d)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🇲🇹</div>
          <div>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: 1 }}>MALTA PULSE</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2, textTransform: "uppercase" }}>24/7 Automated Content System</div>
          </div>
        </div>

        {/* Live stat pills */}
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { label: "Scraped Today", val: liveStats.scraped, color: "#457b9d" },
            { label: "Generated", val: liveStats.generated, color: "#a78bfa" },
            { label: "Posted", val: liveStats.posted, color: "#1877F2" },
            { label: "Pending", val: posts.filter(p => p.status === "pending").length, color: "#fbbf24" },
          ].map(s => (
            <div key={s.label} style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 14px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, fontWeight: 700, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>

        <button onClick={() => setShowSettings(!showSettings)} style={{ background: showSettings ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: "9px 18px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
          ⚙️ Settings
        </button>
      </div>

      {/* SETTINGS PANEL */}
      {showSettings && (
        <div style={{ background: "#151b27", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "20px 24px", display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-end" }}>
          {[
            { key: "fbPageId", label: "Facebook Page ID", ph: "123456789", w: 180 },
            { key: "fbToken", label: "FB Page Access Token", ph: "EAAxx...", w: 280, pw: true },
            { key: "whatsapp", label: "WhatsApp Number (Twilio)", ph: "+356xxxxxxxx", w: 200 },
            { key: "email", label: "Alert Email", ph: "you@email.com", w: 200 },
            { key: "claudeKey", label: "Claude API Key", ph: "sk-ant-...", w: 220, pw: true },
          ].map(f => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{f.label}</label>
              <input type={f.pw ? "password" : "text"} value={settings[f.key]} onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))} placeholder={f.ph}
                style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.12)", color: "#fff", padding: "9px 12px", borderRadius: 8, fontSize: 13, width: f.w }} />
            </div>
          ))}
          <button onClick={() => { setShowSettings(false); showToast("✅ Settings saved permanently!"); }} style={{ background: "#e63946", color: "#fff", border: "none", padding: "10px 22px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontSize: 13 }}>Save All</button>
        </div>
      )}

      {/* NAV TABS */}
      <div style={{ background: "#151b27", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", display: "flex", gap: 0 }}>
        {[
          { id: "queue", label: "📥 Post Queue", count: posts.filter(p => p.status === "pending").length },
          { id: "agents", label: "🤖 Agents", count: agents.filter(a => a.status === "running").length },
          { id: "posted", label: "📘 Posted", count: posts.filter(p => p.status === "posted").length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: "none", border: "none", borderBottom: activeTab === tab.id ? "2px solid #e63946" : "2px solid transparent", color: activeTab === tab.id ? "#fff" : "rgba(255,255,255,0.4)", padding: "14px 20px", fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}>
            {tab.label}
            {tab.count > 0 && <span style={{ background: tab.id === "queue" ? "#e63946" : "#2d3748", color: "#fff", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 800 }}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* MAIN BODY */}
      <div style={{ display: "flex", height: "calc(100vh - 180px)" }}>

        {/* ── QUEUE TAB ── */}
        {activeTab === "queue" && (
          <>
            {/* Post Grid */}
            <div style={{ width: selected ? "40%" : "100%", overflowY: "auto", padding: 20, transition: "width 0.3s" }}>
              {/* Category filters */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid", borderColor: activeCategory === cat ? "#e63946" : "rgba(255,255,255,0.1)", background: activeCategory === cat ? "#e63946" : "transparent", color: activeCategory === cat ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {cat}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 14 }}>
                {filtered.map(post => (
                  <PostCard key={post.id} post={post} onSelect={handleSelect} selected={selected?.id === post.id} />
                ))}
              </div>
            </div>

            {/* Editor Panel */}
            {selected && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(255,255,255,0.07)", overflowY: "auto", background: "#0d1117" }}>
                <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 2 }}>Edit Post</span>
                    <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, marginTop: 2 }}>{selected.rawTitle}</div>
                  </div>
                  <button onClick={() => setSelected(null)} style={{ background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.5)", width: 30, height: 30, borderRadius: "50%", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>

                <img src={selected.image} alt="" style={{ width: "100%", height: 180, objectFit: "cover" }} />

                {/* FB Preview */}
                <div style={{ margin: "16px 20px 0", background: "#1a1f2e", borderRadius: 10, padding: 16 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, #e63946, #457b9d)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🇲🇹</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>Malta Pulse</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Just now · 🌍</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.65, whiteSpace: "pre-wrap", color: "rgba(255,255,255,0.85)" }}>{editCaption}</div>
                </div>

                {/* Caption editor */}
                <div style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: 1.5 }}>Caption</label>
                    <button onClick={() => handleRegenerate(selected)} disabled={isGenerating} style={{ background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      {isGenerating ? <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span> : "✨ Regenerate"}
                    </button>
                  </div>
                  <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)}
                    style={{ width: "100%", height: 180, background: "#151b27", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", padding: 12, borderRadius: 10, fontSize: 13, lineHeight: 1.6, resize: "vertical" }} />
                </div>

                {/* Action buttons */}
                <div style={{ padding: "0 20px 20px", display: "flex", gap: 10 }}>
                  <button onClick={() => handleApprove(selected.id)} style={{ flex: 1, background: "#4ade80", color: "#000", border: "none", padding: 13, borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                    ✅ Approve
                  </button>
                  <button onClick={() => { handleApprove(selected.id); setTimeout(() => handlePost(selected), 300); }} style={{ flex: 1, background: "#1877F2", color: "#fff", border: "none", padding: 13, borderRadius: 10, fontWeight: 800, cursor: "pointer", fontSize: 14 }}>
                    📘 Approve & Post
                  </button>
                  <button onClick={() => handleReject(selected.id)} style={{ background: "rgba(230,57,70,0.15)", color: "#e63946", border: "1px solid rgba(230,57,70,0.3)", padding: "13px 16px", borderRadius: 10, fontWeight: 700, cursor: "pointer", fontSize: 16 }}>
                    ✕
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── AGENTS TAB ── */}
        {activeTab === "agents" && (
          <div style={{ width: "100%", overflowY: "auto", padding: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, marginBottom: 4 }}>🤖 Agent Control Room</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>All agents run 24/7 in the background. Pause individual agents if needed.</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14, marginBottom: 28 }}>
              {agents.map(agent => <AgentCard key={agent.id} agent={agent} onToggle={toggleAgent} />)}
            </div>

            {/* Source list */}
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 18, marginBottom: 14 }}>📡 Monitored Sources</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
              {SOURCES.map(src => (
                <div key={src.id} style={{ background: "#151b27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 22 }}>{src.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{src.name}</div>
                    <span style={{ background: src.color + "33", color: src.color, padding: "2px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>{src.category}</span>
                  </div>
                  <AgentPulse status="running" />
                </div>
              ))}
            </div>

            {/* Schedule info */}
            <div style={{ marginTop: 24, background: "#151b27", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 16, marginBottom: 12 }}>📅 Posting Schedule</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {[
                  { label: "Routine Posts", val: "Every 2 hours", icon: "🕐" },
                  { label: "Weather Updates", val: "6am, 12pm, 6pm", icon: "🌤️" },
                  { label: "Traffic Updates", val: "7am, 8am, 5pm, 6pm", icon: "🚗" },
                  { label: "Breaking News", val: "Instant — alert sent", icon: "🚨" },
                  { label: "Sports Results", val: "After final whistle", icon: "⚽" },
                  { label: "Lifestyle/Events", val: "Morning & Evening", icon: "❤️" },
                ].map(s => (
                  <div key={s.label} style={{ background: "#0d1117", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{s.val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── POSTED TAB ── */}
        {activeTab === "posted" && (
          <div style={{ width: "100%", overflowY: "auto", padding: 24 }}>
            <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 20, marginBottom: 16 }}>📘 Posted to Facebook</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {posts.filter(p => p.status === "posted").map(post => (
                <PostCard key={post.id} post={post} onSelect={handleSelect} selected={false} />
              ))}
            </div>
            {posts.filter(p => p.status === "posted").length === 0 && (
              <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", marginTop: 60, fontSize: 15 }}>No posts published yet — approve & post from the queue!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
