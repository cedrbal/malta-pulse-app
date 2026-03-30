import React, { useState, useEffect, useCallback } from 'react';
import './App.css';

const API_URL = 'https://safer-sandwich-brian-springs.trycloudflare.com';

// ─── Category config ──────────────────────────────────────────────────────────
const CAT_COLOR = {
  Breaking:'#CE1126', News:'#1877F2', Weather:'#1a6fb5',
  Traffic:'#FF6B35', Sports:'#2d9e6b', Lifestyle:'#e91e8c',
  'World News':'#7B2FBE', Culture:'#E8B922', Health:'#27ae60',
};
const CAT_IMGS = {
  Breaking:    ['photo-1504384308090-c894fdcc538d','photo-1495020689067-958852a7765e','photo-1504711434969-e33886168f5c','photo-1557804506-669a67965ba0'],
  News:        ['photo-1504711434969-e33886168f5c','photo-1529107386315-e1a2ed48a620','photo-1541872703-74c5e44368f9','photo-1477959858617-67f85cf4f1df'],
  Weather:     ['photo-1561553873-e8491a564fd0','photo-1592210454359-9043f067919b','photo-1504608524841-42584120d693','photo-1516912481808-3406841bd33c'],
  Traffic:     ['photo-1477959858617-67f85cf4f1df','photo-1519003722824-194d4455a60c','photo-1567784177951-6fa58317e16b','photo-1489824904134-891ab64532f1'],
  Sports:      ['photo-1522778119026-d647f0596c20','photo-1461896836934-ffe607ba8211','photo-1579952363873-27f3bade9f55','photo-1560272564-c83b66b1ad12'],
  Lifestyle:   ['photo-1516483638261-f4dbaf036963','photo-1414235077428-338989a2e8c0','photo-1504674900247-0877df9cc836','photo-1540189549336-e6e99c3679fe','photo-1517248135467-4c7edcad34c4','photo-1555396273-367ea4eb4db5'],
  'World News':['photo-1532274402911-5a369e4c4bb5','photo-1451187580459-43490279c0fa','photo-1507003211169-0a1dd7228f2d','photo-1526778548025-fa2f459cd5ce'],
  Culture:     ['photo-1514320291840-2e0a9bf2a9ae','photo-1533090161767-e6ffed986c88','photo-1493225457124-a3eb161ffa5f'],
  Health:      ['photo-1519494026892-80bbd2d6fd0d','photo-1505751172876-fa1923c5c528','photo-1576091160550-2173dba999ef'],
};
const DEFAULT_IMGS = ['photo-1507003211169-0a1dd7228f2d','photo-1504711434969-e33886168f5c','photo-1541872703-74c5e44368f9'];
const AGENT_DEFS = [
  { key:'news',       name:'News Agent',        icon:'📰', desc:'Scrapes RSS feeds every 5 mins' },
  { key:'weather',    name:'Weather Agent',      icon:'🌤️', desc:'Tomorrow.io every 30 mins' },
  { key:'traffic',    name:'Traffic Agent',      icon:'🚗', desc:'Google Maps live traffic' },
  { key:'seo',        name:'SEO/Trending Agent', icon:'📈', desc:'Monitors viral Malta content' },
  { key:'supervisor', name:'Supervisor Agent',   icon:'🛡️', desc:'Checks all agents are running' },
];

// ─── Utilities ────────────────────────────────────────────────────────────────
function uImg(id) { return `https://images.unsplash.com/${id}?w=600&q=80`; }
function catImgs(cat) { return (CAT_IMGS[cat] || DEFAULT_IMGS).map(uImg); }
function catColor(cat) { return CAT_COLOR[cat] || '#666'; }
function timeAgo(ts) {
  if (!ts) return 'Just now';
  const d = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  if (d < 86400) return `${Math.floor(d/3600)}h ago`;
  return `${Math.floor(d/86400)}d ago`;
}
function postStatus(p) { return p.status || p.approvalStatus || 'pending'; }

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  card:       { background:'#161616', borderRadius:12, border:'1px solid #222', overflow:'hidden', display:'flex', flexDirection:'column' },
  input:      { width:'100%', background:'#0d0d0d', border:'1px solid #2a2a2a', borderRadius:8, padding:'10px 12px', color:'#fff', fontSize:14, boxSizing:'border-box' },
  label:      { color:'#888', fontSize:12, fontWeight:600, display:'block', marginBottom:6, letterSpacing:0.4, textTransform:'uppercase' },
  btnRed:     { background:'#CE1126', color:'#fff', border:'none', padding:'9px 18px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' },
  btnGhost:   { background:'transparent', color:'#888', border:'1px solid #2a2a2a', padding:'9px 18px', borderRadius:8, fontWeight:600, fontSize:13, cursor:'pointer' },
  btnSm:      { padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer', border:'none' },
  btnSmGhost: { background:'transparent', color:'#777', border:'1px solid #222', padding:'6px 12px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer' },
  overlay:    { position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 },
  modal:      { background:'#161616', borderRadius:14, width:'min(520px,95vw)', border:'1px solid #2a2a2a', boxShadow:'0 24px 60px rgba(0,0,0,0.7)', maxHeight:'90vh', overflowY:'auto' },
  modalHead:  { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #222' },
  xBtn:       { background:'transparent', border:'none', color:'#666', fontSize:20, cursor:'pointer', lineHeight:1, padding:'0 4px' },
  settCard:   { background:'#161616', borderRadius:12, border:'1px solid #222', padding:22, marginBottom:16 },
};

// ─── Image Picker Modal ───────────────────────────────────────────────────────
function ImagePickerModal({ post, onPick, onClose }) {
  const [custom, setCustom] = useState('');
  const imgs = catImgs(post.category || 'News');
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <div style={S.modalHead}>
          <span style={{color:'#fff', fontWeight:700, fontSize:16}}>🖼 Pick Image</span>
          <button style={S.xBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:'16px 20px 20px'}}>
          <p style={{color:'#777', fontSize:13, marginBottom:14}}>
            Category: <strong style={{color:'#bbb'}}>{post.category || 'News'}</strong> — click a photo or paste a custom URL
          </p>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16}}>
            {imgs.map((url, i) => (
              <div key={i} className="img-opt" onClick={() => onPick(url)}>
                <img src={url} alt="" />
              </div>
            ))}
          </div>
          <div style={{display:'flex', gap:8}}>
            <input
              className="mp-input"
              style={{...S.input, flex:1}}
              placeholder="Or paste a custom image URL…"
              value={custom}
              onChange={e => setCustom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && custom && onPick(custom)}
            />
            <button style={{...S.btnRed, opacity: custom ? 1 : 0.4}} disabled={!custom} onClick={() => onPick(custom)}>Use</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({ post, onSave, onClose }) {
  const [text, setText] = useState(post.generatedPost || '');
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={{...S.modal, width:'min(720px,95vw)'}} onClick={e => e.stopPropagation()}>
        <div style={S.modalHead}>
          <span style={{color:'#fff', fontWeight:700, fontSize:16}}>✏️ Edit Article</span>
          <button style={S.xBtn} onClick={onClose}>✕</button>
        </div>
        <div style={{padding:'16px 20px 20px'}}>
          <div style={{color:'#ccc', fontSize:14, fontWeight:600, marginBottom:12, lineHeight:1.4}}>
            {post.rawTitle || post.title}
          </div>
          <textarea
            className="mp-input"
            style={{...S.input, height:320, resize:'vertical', lineHeight:1.7, fontSize:14, fontFamily:'inherit'}}
            value={text}
            onChange={e => setText(e.target.value)}
          />
          <div style={{display:'flex', gap:8, justifyContent:'flex-end', marginTop:14}}>
            <button style={S.btnGhost} onClick={onClose}>Cancel</button>
            <button style={S.btnRed} onClick={() => onSave(text)}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, pickedImg, onApprove, onReject, onEdit, onPickImage, approving, rejecting }) {
  const [expanded, setExpanded] = useState(false);
  const img = pickedImg || catImgs(post.category || 'News')[0];
  const text = post.generatedPost || '';
  const color = catColor(post.category);
  const status = postStatus(post);
  const STATUS_BADGE = {
    pending:  { bg:'rgba(96,170,255,0.12)',  color:'#60aaff', label:'Pending' },
    approved: { bg:'rgba(77,187,135,0.12)',  color:'#4dbb87', label:'Approved' },
    rejected: { bg:'rgba(255,107,107,0.12)', color:'#ff6b6b', label:'Rejected' },
  };
  const badge = STATUS_BADGE[status] || { bg:'#222', color:'#888', label: status };

  return (
    <div style={S.card}>
      <div className="card-img-wrap" onClick={onPickImage}>
        <img src={img} alt="" onError={e => { e.target.style.display='none'; }} />
        <div className="card-img-overlay">📷 Change Image</div>
      </div>
      <div style={{padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:8}}>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', alignItems:'center'}}>
          <span style={{background:color+'20', color, fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, letterSpacing:0.5, textTransform:'uppercase'}}>
            {post.category || 'News'}
          </span>
          <span style={{background:badge.bg, color:badge.color, fontSize:11, fontWeight:600, padding:'2px 8px', borderRadius:4}}>
            {badge.label}
          </span>
          {post.isBreaking && (
            <span style={{background:'rgba(206,17,38,0.15)', color:'#CE1126', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4}}>🔴 Breaking</span>
          )}
          <span style={{color:'#444', fontSize:11, marginLeft:'auto'}}>{timeAgo(post.timestamp || post.createdAt)}</span>
        </div>
        <div style={{color:'#f0f0f0', fontWeight:700, fontSize:15, lineHeight:1.4}}>
          {post.rawTitle || post.title || '(No title)'}
        </div>
        {post.source && <div style={{color:'#555', fontSize:12}}>📰 {post.source}</div>}
        {text && (
          <div style={{color:'#777', fontSize:13, lineHeight:1.65, flex:1}}>
            {expanded ? text : text.slice(0, 220) + (text.length > 220 ? '…' : '')}
            {text.length > 220 && (
              <button style={{background:'none', border:'none', color:'#CE1126', cursor:'pointer', fontSize:12, fontWeight:600, padding:'0 4px'}} onClick={() => setExpanded(!expanded)}>
                {expanded ? ' Less' : ' More'}
              </button>
            )}
          </div>
        )}
        <div style={{display:'flex', gap:6, flexWrap:'wrap', paddingTop:8, borderTop:'1px solid #1e1e1e', marginTop:'auto'}}>
          <button style={S.btnSmGhost} onClick={onEdit}>✏️ Edit</button>
          <button style={S.btnSmGhost} onClick={onPickImage}>🖼 Image</button>
          <div style={{flex:1}} />
          {status !== 'approved' && (
            <button className="btn-approve" style={{...S.btnSm, background:'rgba(77,187,135,0.1)', color:'#4dbb87', border:'1px solid rgba(77,187,135,0.2)'}} onClick={onApprove} disabled={approving}>
              {approving ? '…' : '✓ Approve'}
            </button>
          )}
          {status !== 'rejected' && (
            <button className="btn-reject" style={{...S.btnSm, background:'rgba(255,107,107,0.1)', color:'#ff6b6b', border:'1px solid rgba(255,107,107,0.2)'}} onClick={onReject} disabled={rejecting}>
              {rejecting ? '…' : '✕ Reject'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Agents Tab ───────────────────────────────────────────────────────────────
function AgentsTab({ agents, loading, onRefresh }) {
  return (
    <div>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
        <div>
          <h2 style={{color:'#fff', fontSize:18, fontWeight:700, marginBottom:4}}>Agent Status</h2>
          <p style={{color:'#444', fontSize:13}}>Auto-refreshes every 30 seconds</p>
        </div>
        <button style={S.btnGhost} onClick={onRefresh} disabled={loading}>{loading ? '↻ Refreshing…' : '↺ Refresh Now'}</button>
      </div>
      <div className="agent-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14}}>
        {AGENT_DEFS.map(def => {
          const agent = agents?.find(a => a.key === def.key || (a.name||'').toLowerCase().includes(def.key)) || {};
          const status = agent.status || 'unknown';
          const dotColor = { running:'#4dbb87', idle:'#60aaff', error:'#ff6b6b' }[status] || '#333';
          return (
            <div key={def.key} style={S.card}>
              <div style={{padding:'18px 18px 16px'}}>
                <div style={{display:'flex', alignItems:'flex-start', gap:12, marginBottom:14}}>
                  <span style={{fontSize:28, lineHeight:1}}>{def.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{color:'#fff', fontWeight:700, fontSize:15}}>{def.name}</div>
                    <div style={{color:'#444', fontSize:12, marginTop:2}}>{def.desc}</div>
                  </div>
                  <div style={{width:10, height:10, borderRadius:'50%', background:dotColor, flexShrink:0, marginTop:5}} className={status==='running'?'status-dot-running':''} />
                </div>
                <div style={{display:'flex', gap:20, fontSize:12}}>
                  <div>
                    <div style={{color:'#444', marginBottom:3}}>Status</div>
                    <div style={{color:dotColor, fontWeight:600, textTransform:'capitalize'}}>{status}</div>
                  </div>
                  {agent.lastRun && (
                    <div>
                      <div style={{color:'#444', marginBottom:3}}>Last run</div>
                      <div style={{color:'#bbb', fontWeight:600}}>{timeAgo(agent.lastRun)}</div>
                    </div>
                  )}
                  {agent.postsToday !== undefined && (
                    <div>
                      <div style={{color:'#444', marginBottom:3}}>Today</div>
                      <div style={{color:'#bbb', fontWeight:600}}>{agent.postsToday} posts</div>
                    </div>
                  )}
                </div>
                {agent.lastError && (
                  <div style={{marginTop:12, padding:'8px 12px', borderRadius:7, background:'rgba(255,107,107,0.08)', border:'1px solid rgba(255,107,107,0.15)', color:'#ff6b6b', fontSize:12}}>
                    ⚠ {agent.lastError}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function ResultBanner({ s }) {
  if (!s) return null;
  return (
    <div style={{marginTop:12, padding:'10px 14px', borderRadius:8, fontSize:13, fontWeight:500,
      background: s.ok ? 'rgba(77,187,135,0.08)' : 'rgba(255,107,107,0.08)',
      border:`1px solid ${s.ok ? 'rgba(77,187,135,0.2)' : 'rgba(255,107,107,0.2)'}`,
      color: s.ok ? '#4dbb87' : '#ff6b6b',
    }}>
      {s.ok ? '✓ ' : '✗ '}{s.msg}
      {s.expired && <div style={{marginTop:6}}><a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer">→ Renew at Meta Business Suite</a></div>}
    </div>
  );
}

function SettingsTab() {
  const [fbToken, setFbToken] = useState(() => localStorage.getItem('mp_fb_token') || '');
  const [fbStatus, setFbStatus] = useState(null);
  const [fbBusy, setFbBusy] = useState(false);
  const [tgToken, setTgToken] = useState(() => localStorage.getItem('mp_tg_token') || '');
  const [tgChat, setTgChat]   = useState(() => localStorage.getItem('mp_tg_chat') || '');
  const [tgStatus, setTgStatus] = useState(null);
  const [tgBusy, setTgBusy] = useState(false);

  function saveFb() {
    localStorage.setItem('mp_fb_token', fbToken);
    setFbStatus({ ok:true, msg:'Token saved.' });
    setTimeout(() => setFbStatus(null), 2500);
  }
  async function testFb() {
    setFbBusy(true); setFbStatus(null);
    try {
      const r = await fetch(`https://graph.facebook.com/me?access_token=${fbToken}`);
      const d = await r.json();
      if (d.error) setFbStatus({ ok:false, msg:d.error.message, expired: d.error.code === 190 });
      else setFbStatus({ ok:true, msg:`Connected as: ${d.name} (${d.id})` });
    } catch(e) { setFbStatus({ ok:false, msg:'Network error: ' + e.message }); }
    setFbBusy(false);
  }
  function saveTg() {
    localStorage.setItem('mp_tg_token', tgToken);
    localStorage.setItem('mp_tg_chat', tgChat);
    setTgStatus({ ok:true, msg:'Saved!' });
    setTimeout(() => setTgStatus(null), 2500);
  }
  async function testTg() {
    setTgBusy(true); setTgStatus(null);
    try {
      const r = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ chat_id:tgChat, text:'✅ Malta Pulse — test message from dashboard' }),
      });
      const d = await r.json();
      setTgStatus(d.ok ? { ok:true, msg:'Test message sent!' } : { ok:false, msg:d.description||'Failed' });
    } catch(e) { setTgStatus({ ok:false, msg:'Network error: ' + e.message }); }
    setTgBusy(false);
  }

  return (
    <div style={{maxWidth:600}}>
      {/* Facebook */}
      <div style={S.settCard}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:18}}>
          <div style={{width:40,height:40,background:'#1877F2',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📘</div>
          <div>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>Facebook Integration</div>
            <div style={{color:'#555',fontSize:12}}>Auto-post approved articles to your Facebook page</div>
          </div>
        </div>
        <label style={S.label}>Page Access Token</label>
        <input className="mp-input" type="password" style={S.input} placeholder="EAAxxxxxxx…" value={fbToken} onChange={e => setFbToken(e.target.value)} />
        <div style={{fontSize:12,color:'#444',marginTop:6,marginBottom:14}}>
          Get yours from <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer">Meta Business Suite → Settings → Page Access Tokens</a>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={S.btnRed} onClick={saveFb} disabled={!fbToken}>Save Token</button>
          <button style={S.btnGhost} onClick={testFb} disabled={!fbToken||fbBusy}>{fbBusy?'Testing…':'Test Connection'}</button>
        </div>
        <ResultBanner s={fbStatus} />
      </div>

      {/* Telegram */}
      <div style={S.settCard}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
          <div style={{width:40,height:40,background:'#229ED9',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>✈️</div>
          <div>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>Telegram Alerts</div>
            <div style={{color:'#555',fontSize:12}}>Alerts for new posts, agent errors and system events</div>
          </div>
        </div>
        <label style={S.label}>Bot Token</label>
        <input className="mp-input" type="password" style={{...S.input,marginBottom:12}} placeholder="123456:ABC-DEF…" value={tgToken} onChange={e => setTgToken(e.target.value)} />
        <label style={S.label}>Chat ID</label>
        <input className="mp-input" style={S.input} placeholder="-100123456789" value={tgChat} onChange={e => setTgChat(e.target.value)} />
        <div style={{fontSize:12,color:'#444',marginTop:6,marginBottom:14}}>
          Create bot with <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer">@BotFather</a> · Get chat ID from <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer">@userinfobot</a>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button style={S.btnRed} onClick={saveTg} disabled={!tgToken||!tgChat}>Save</button>
          <button style={S.btnGhost} onClick={testTg} disabled={!tgToken||!tgChat||tgBusy}>{tgBusy?'Sending…':'Send Test Message'}</button>
        </div>
        <ResultBanner s={tgStatus} />
      </div>

      {/* Server info */}
      <div style={S.settCard}>
        <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
          <div style={{width:40,height:40,background:'#222',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🖥️</div>
          <div>
            <div style={{color:'#fff',fontWeight:700,fontSize:15}}>Server Info</div>
            <div style={{color:'#555',fontSize:12}}>Read-only reference</div>
          </div>
        </div>
        {[
          {label:'API URL',     val:API_URL},
          {label:'Server IP',   val:'77.42.91.193'},
          {label:'SSH',         val:'root@77.42.91.193'},
          {label:'Server path', val:'/home/malta-pulse/'},
        ].map(row => (
          <div key={row.label} style={{display:'flex',gap:16,padding:'8px 0',borderBottom:'1px solid #1a1a1a',fontSize:13}}>
            <span style={{color:'#444',width:96,flexShrink:0}}>{row.label}</span>
            <span style={{color:'#999',fontFamily:'monospace',wordBreak:'break-all'}}>{row.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState('queue');
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [editPost, setEditPost] = useState(null);
  const [imagePost, setImagePost] = useState(null);
  const [pickedImgs, setPickedImgs] = useState({});
  const [editedTexts, setEditedTexts] = useState({});
  const [busyApprove, setBusyApprove] = useState({});
  const [busyReject, setBusyReject] = useState({});
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3200);
  }

  const fetchPosts = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/posts/all`);
      if (!r.ok) throw new Error();
      setPosts(await r.json());
      setLastUpdate(new Date());
    } catch {}
    setLoadingPosts(false);
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/api/stats`);
      if (r.ok) setStats(await r.json());
    } catch {}
  }, []);

  const fetchAgents = useCallback(async () => {
    setLoadingAgents(true);
    try {
      const r = await fetch(`${API_URL}/api/agents/status`);
      if (r.ok) setAgents(await r.json());
    } catch {}
    setLoadingAgents(false);
  }, []);

  useEffect(() => {
    fetchPosts(); fetchStats(); fetchAgents();
    const iv = setInterval(() => { fetchPosts(); fetchStats(); }, 30000);
    return () => clearInterval(iv);
  }, [fetchPosts, fetchStats, fetchAgents]);

  async function handleApprove(post) {
    setBusyApprove(p => ({...p, [post.id]:true}));
    const fbToken = localStorage.getItem('mp_fb_token');
    try {
      const body = {};
      if (editedTexts[post.id] !== undefined) body.generatedPost = editedTexts[post.id];
      if (pickedImgs[post.id]) body.imageUrl = pickedImgs[post.id];
      if (fbToken) body.fbToken = fbToken;
      const r = await fetch(`${API_URL}/api/posts/${post.id}/approve`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body),
      });
      if (r.ok) { showToast('✓ Post approved'); fetchPosts(); fetchStats(); }
      else showToast('Failed to approve', false);
    } catch { showToast('Network error', false); }
    setBusyApprove(p => ({...p, [post.id]:false}));
  }

  async function handleReject(post) {
    setBusyReject(p => ({...p, [post.id]:true}));
    try {
      const r = await fetch(`${API_URL}/api/posts/${post.id}/reject`, { method:'POST' });
      if (r.ok) { showToast('Post rejected'); fetchPosts(); fetchStats(); }
      else showToast('Failed to reject', false);
    } catch { showToast('Network error', false); }
    setBusyReject(p => ({...p, [post.id]:false}));
  }

  const counts = {
    all: posts.length,
    pending:  posts.filter(p => postStatus(p) === 'pending').length,
    approved: posts.filter(p => postStatus(p) === 'approved').length,
    rejected: posts.filter(p => postStatus(p) === 'rejected').length,
  };
  const filtered = posts.filter(p => filter === 'all' || postStatus(p) === filter);

  const STAT_ITEMS = [
    { label:'Scraped',  val: stats?.totalScraped ?? stats?.total ?? '—',  color:'#60aaff' },
    { label:'Pending',  val: stats?.pending ?? counts.pending,             color:'#f0a500' },
    { label:'Approved', val: stats?.approved ?? counts.approved,           color:'#4dbb87' },
    { label:'Posted',   val: stats?.posted ?? stats?.published ?? '—',     color:'#CE1126' },
  ];

  return (
    <div style={{minHeight:'100vh', background:'#0d0d0d'}}>
      {/* Header */}
      <div style={{background:'#111', borderBottom:'2px solid #CE1126', position:'sticky', top:0, zIndex:200}}>
        <div style={{maxWidth:1240, margin:'0 auto', padding:'0 20px', display:'flex', alignItems:'center', gap:16, height:58}}>
          <div style={{display:'flex', alignItems:'center', gap:10, flexShrink:0}}>
            <span style={{fontSize:22}}>🇲🇹</span>
            <div>
              <div style={{fontWeight:800, fontSize:16, color:'#fff', letterSpacing:0.5, lineHeight:1}}>
                MALTA<span style={{color:'#CE1126'}}>PULSE</span>
              </div>
              <div style={{fontSize:9, color:'#444', letterSpacing:2, lineHeight:1, marginTop:2}}>DASHBOARD</div>
            </div>
          </div>
          <div style={{flex:1}} />
          <div className="stats-row" style={{display:'flex', gap:22}}>
            {STAT_ITEMS.map(s => (
              <div key={s.label} style={{textAlign:'center'}}>
                <div style={{fontWeight:800, fontSize:18, color:s.color, lineHeight:1}}>{s.val}</div>
                <div style={{fontSize:9, color:'#444', lineHeight:1, marginTop:2, letterSpacing:0.8}}>{s.label.toUpperCase()}</div>
              </div>
            ))}
          </div>
          <div style={{display:'flex', alignItems:'center', gap:6, background:'#CE1126', borderRadius:20, padding:'5px 12px', fontSize:11, fontWeight:800, letterSpacing:1, flexShrink:0}}>
            <div style={{width:6, height:6, background:'#fff', borderRadius:'50%', animation:'blink 1s infinite'}} />
            LIVE
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{background:'#111', borderBottom:'1px solid #1a1a1a'}}>
        <div style={{maxWidth:1240, margin:'0 auto', padding:'0 16px', display:'flex', gap:2, overflowX:'auto'}}>
          {[
            { key:'queue',    label:'Post Queue', icon:'📋', badge: counts.pending || null },
            { key:'agents',   label:'Agents',     icon:'🤖' },
            { key:'settings', label:'Settings',   icon:'⚙️' },
          ].map(t => (
            <button key={t.key} className="tab-btn" onClick={() => setTab(t.key)} style={{
              color: tab === t.key ? '#fff' : '#555',
              borderBottom:`2px solid ${tab === t.key ? '#CE1126' : 'transparent'}`,
            }}>
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span style={{background:'#CE1126', color:'#fff', borderRadius:10, padding:'1px 7px', fontSize:11, fontWeight:700}}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
          {lastUpdate && (
            <span style={{color:'#333', fontSize:11, marginLeft:'auto', alignSelf:'center', paddingRight:4}}>
              Updated {timeAgo(lastUpdate)}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div style={{maxWidth:1240, margin:'0 auto', padding:'24px 20px'}}>

        {tab === 'queue' && (
          <div>
            <div style={{display:'flex', gap:8, marginBottom:20, flexWrap:'wrap', alignItems:'center'}}>
              {['pending','approved','rejected','all'].map(f => (
                <button key={f} className="filter-pill" onClick={() => setFilter(f)} style={{
                  background: filter === f ? '#CE1126' : '#161616',
                  color:       filter === f ? '#fff'    : '#666',
                  borderColor: filter === f ? '#CE1126' : '#222',
                }}>
                  {f.charAt(0).toUpperCase()+f.slice(1)}&nbsp;
                  <span style={{opacity:0.65}}>({counts[f] ?? 0})</span>
                </button>
              ))}
              <button style={{...S.btnGhost, marginLeft:'auto'}} onClick={fetchPosts}>↺ Refresh</button>
            </div>

            {loadingPosts ? (
              <div style={{textAlign:'center', padding:80, color:'#333'}}>
                <div style={{fontSize:36, marginBottom:12}}>⟳</div>
                <div>Loading posts…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{textAlign:'center', padding:80}}>
                <div style={{fontSize:40, marginBottom:12}}>📭</div>
                <div style={{color:'#444', fontSize:15}}>No {filter} posts</div>
                {filter === 'pending' && (
                  <div style={{color:'#333', fontSize:13, marginTop:6}}>
                    New posts appear here automatically every 30 seconds
                  </div>
                )}
              </div>
            ) : (
              <div className="post-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:14}}>
                {filtered.map(post => (
                  <PostCard
                    key={post.id}
                    post={editedTexts[post.id] !== undefined ? {...post, generatedPost:editedTexts[post.id]} : post}
                    pickedImg={pickedImgs[post.id]}
                    onApprove={() => handleApprove(post)}
                    onReject={() => handleReject(post)}
                    onEdit={() => setEditPost(post)}
                    onPickImage={() => setImagePost(post)}
                    approving={!!busyApprove[post.id]}
                    rejecting={!!busyReject[post.id]}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'agents' && <AgentsTab agents={agents} loading={loadingAgents} onRefresh={fetchAgents} />}
        {tab === 'settings' && <SettingsTab />}
      </div>

      {editPost && (
        <EditModal
          post={editPost}
          onSave={text => {
            setEditedTexts(p => ({...p, [editPost.id]:text}));
            showToast('✓ Edits saved — applied on approve');
            setEditPost(null);
          }}
          onClose={() => setEditPost(null)}
        />
      )}

      {imagePost && (
        <ImagePickerModal
          post={imagePost}
          onPick={url => {
            setPickedImgs(p => ({...p, [imagePost.id]:url}));
            showToast('✓ Image selected');
            setImagePost(null);
          }}
          onClose={() => setImagePost(null)}
        />
      )}

      {toast && (
        <div className="mp-toast" style={{
          background: toast.ok ? 'rgba(77,187,135,0.12)' : 'rgba(255,107,107,0.12)',
          color:       toast.ok ? '#4dbb87' : '#ff6b6b',
          border:`1px solid ${toast.ok ? 'rgba(77,187,135,0.25)' : 'rgba(255,107,107,0.25)'}`,
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
