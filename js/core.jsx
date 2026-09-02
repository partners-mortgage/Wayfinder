/* Partners Academy · core.jsx
   Shared foundation. Config, Firebase, the proxy client, icons, the
   Waypoint mark, resilient storage, and small helpers. Everything else
   depends on this file, so it loads first. */

const { useState, useRef, useEffect } = React;
const CFG = window.WAYFINDER_CONFIG;

/* ---------- Firebase init (graceful) ---------- */
let db = null, FB_ON = false, auth = null;
try{
  if(CFG.firebase && CFG.firebase.apiKey && CFG.firebase.projectId){
    firebase.initializeApp(CFG.firebase);
    db = firebase.firestore();
    auth = firebase.auth();
    FB_ON = true;
  }
}catch(e){ FB_ON = false; }

const DOMAIN = (CFG.ALLOWED_DOMAIN||"").toLowerCase();
const ADMINS = (CFG.ADMINS||[]).map(e=>String(e).toLowerCase());
const isAdminEmail = (email)=> ADMINS.includes(String(email||"").toLowerCase());
const GUESTS = (CFG.GUESTS||[]).map(e=>String(e).toLowerCase());
const isAllowedEmail = (email)=>{
  const e = String(email||"").toLowerCase();
  if(GUESTS.includes(e)) return true;                 // named outside guest
  return !DOMAIN || e.endsWith("@"+DOMAIN);
};

/* ---------- roles ---------- */
/* Role now lives on users/{uid}.role, but the email allowlist above stays
   permanently as a bootstrap. It is always allowlist OR role, never role
   alone. Without that, the first admin to sign in after the switch creates
   their own document as a learner and there is nobody left who can promote
   them. */
const ROLES = ["admin","instructor","learner"];
const resolveRole = (email, doc)=>{
  if(isAdminEmail(email)) return "admin";             // bootstrap wins
  const r = doc && doc.role;
  return ROLES.includes(r) ? r : "learner";
};

/* Read the user document, creating it on first sign-in. A new record is
   always written as a learner, matching what the rules permit a person to
   create for themselves. Bootstrap admins still resolve to admin above, and
   the stored role can be raised later by an admin. */
async function ensureUserDoc(user){
  const email = String((user && user.email) || "").toLowerCase();
  const fallback = { email, name: nameFromEmail(email), role: resolveRole(email, null), branchId: null,
                     points:0, level:1, badgeIds:[], coursesDone:0, certCount:0 };
  if(!FB_ON || !db || !user) return fallback;
  const ref = db.collection("users").doc(user.uid);
  try{
    const snap = await ref.get();
    if(!snap.exists){
      const fresh = {
        email, name: nameFromEmail(email),
        role: "learner",                 // rules only allow self-create as learner
        branchId: null,
        createdAt: Date.now(), lastSeenAt: Date.now(),
        points: 0, level: 1, badgeIds: [], coursesDone: 0, certCount: 0
      };
      await ref.set(fresh);
      return { ...fresh, role: resolveRole(email, fresh) };
    }
    const doc = snap.data() || {};
    /* Touch lastSeenAt only. Rules forbid a person changing their own role,
       points, level, or badges, so nothing else is sent. */
    try{ await ref.update({ lastSeenAt: Date.now() }); }catch{}
    return { ...doc, email: doc.email || email, name: doc.name || nameFromEmail(email),
             role: resolveRole(email, doc) };
  }catch(e){
    return fallback;
  }
}

const nameFromEmail = (email)=>{
  const raw = String(email||"").split("@")[0].replace(/[._-]+/g," ").trim();
  if(!raw) return "";
  return raw.split(/\s+/).map(w=> w.charAt(0).toUpperCase()+w.slice(1)).join(" ");
};

/* ---------- proxy helpers (send the signed-in user's token) ---------- */
const PROXY = (CFG.PROXY_URL||"").replace(/\/+$/,"");
async function authHeaders(force){
  const h = { "Content-Type":"application/json" };
  try{
    const u = auth && auth.currentUser;
    if(u){ const t = await u.getIdToken(!!force); h["Authorization"] = "Bearer " + t; }
  }catch{}
  return h;
}
/* Post to the proxy. If it answers 401, the token may be stale (for example
   it was issued before the email was verified), so refresh once and retry. */
async function postProxy(path, body){
  let r = await fetch(PROXY + path, { method:"POST", headers: await authHeaders(false), body: JSON.stringify(body) });
  if(r.status === 401){
    r = await fetch(PROXY + path, { method:"POST", headers: await authHeaders(true), body: JSON.stringify(body) });
  }
  return r;
}
async function callClaude(payload){ return postProxy("/claude", payload); }
async function callRender(body){ return postProxy("/render", body); }
async function callUploadUrl(body){ return postProxy("/upload-url", body); }
/* GET through the proxy (used for job status polling) */
async function getProxy(path){
  let r = await fetch(PROXY + path, { headers: await authHeaders(false) });
  if(r.status === 401){ r = await fetch(PROXY + path, { headers: await authHeaders(true) }); }
  return r;
}

/* ---------- Icons ---------- */
const Icon = ({ size = 20, fill = "none", stroke = 2, children, ...p }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" {...p}>{children}</svg>
);
const IcRecord=(p)=><Icon {...p}><circle cx="12" cy="12" r="6" fill="currentColor" stroke="none"/></Icon>;
const IcStop=(p)=><Icon {...p}><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor" stroke="none"/></Icon>;
const IcSpark=(p)=><Icon {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></Icon>;
const IcCheck=(p)=><Icon {...p}><path d="M20 6 9 17l-5-5"/></Icon>;
const IcX=(p)=><Icon {...p}><path d="M18 6 6 18M6 6l12 12"/></Icon>;
const IcEdit=(p)=><Icon {...p}><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></Icon>;
const IcTrash=(p)=><Icon {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></Icon>;
const IcVideo=(p)=><Icon {...p}><path d="m22 8-6 4 6 4V8ZM2 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6Z"/></Icon>;
const IcDoc=(p)=><Icon {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM14 2v6h6M9 13h6M9 17h6"/></Icon>;
const IcLink=(p)=><Icon {...p}><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></Icon>;
const IcArrow=(p)=><Icon {...p}><path d="M5 12h14M13 6l6 6-6 6"/></Icon>;
const IcArrowL=(p)=><Icon {...p}><path d="M19 12H5M11 18l-6-6 6-6"/></Icon>;
const IcPlus=(p)=><Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IcKey=(p)=><Icon {...p}><path d="M15.5 7.5a4 4 0 1 1-4-4 4 4 0 0 1 4 4Zm-1.9 1.9L21 16.8V21h-4.2l-1.4-1.4v-2l-2-2"/></Icon>;
const IcPlay=(p)=><Icon {...p}><path d="M6 4l14 8-14 8V4Z" fill="currentColor" stroke="none"/></Icon>;
const IcGrip=(p)=><Icon {...p}><circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/></Icon>;
const IcClock=(p)=><Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IcSearch=(p)=><Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>;
const IcScissors=(p)=><Icon {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></Icon>;
const IcDownload=(p)=><Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>;
const IcEye=(p)=><Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></Icon>;
const IcUsers=(p)=><Icon {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></Icon>;
const IcFlag=(p)=><Icon {...p}><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1ZM4 22v-7"/></Icon>;
const IcSlack=(p)=><Icon {...p}><path d="M9 3a1.5 1.5 0 0 0 0 3h1.5V4.5A1.5 1.5 0 0 0 9 3ZM9 9H4.5a1.5 1.5 0 0 0 0 3H9a1.5 1.5 0 0 0 0-3ZM21 9a1.5 1.5 0 0 0-3 0v1.5h1.5A1.5 1.5 0 0 0 21 9ZM15 9V4.5a1.5 1.5 0 0 0-3 0V9a1.5 1.5 0 0 0 3 0ZM15 21a1.5 1.5 0 0 0 0-3h-1.5v1.5A1.5 1.5 0 0 0 15 21ZM15 15h4.5a1.5 1.5 0 0 0 0-3H15a1.5 1.5 0 0 0 0 3ZM3 15a1.5 1.5 0 0 0 3 0v-1.5H4.5A1.5 1.5 0 0 0 3 15ZM9 15v4.5a1.5 1.5 0 0 0 3 0V15a1.5 1.5 0 0 0-3 0Z"/></Icon>;
const IcMonitor=(p)=><Icon {...p}><path d="M3 4h18a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1ZM8 21h8M12 17v4"/></Icon>;

/* ---------- Waypoint mark (approved 1a) ---------- */
const Mark = ({ size = 30, onDark }) => {
  const roof = onDark ? "#ffffff" : "var(--teal-500)";
  const house = onDark ? "var(--amber-500)" : "var(--sand-500)";
  const dot = onDark ? "var(--teal-900)" : "#ffffff";
  return (
    <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
      <path d="M14 48 L48 17 L82 48" stroke={roof} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M30 62 L48 45 L66 62 L66 79 L30 79 Z" fill={house}/>
      <circle cx="48" cy="68" r="6" fill={dot}/>
    </svg>
  );
};
const AscentGlyph = ({ size=54 })=>(
  <svg width={size} height={size} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <circle cx="48" cy="48" r="44" fill="rgba(255,172,39,.12)" stroke="var(--amber-500)" strokeWidth="3"/>
    <path d="M24 62 L40 44 L52 54 L72 30" stroke="var(--amber-500)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M60 30 L72 30 L72 42" stroke="var(--amber-500)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MODEL = "claude-opus-4-6";
const LS_KEY = "wf_apikey";
const LS_GUIDES = "wf_guides";
const SS_UNLOCK = "wf_unlocked";
const CATS = ["Pricing","LOS","Web Tools","Sales Tools","Documents","Compliance","Onboarding"];
const VOICES = [
  { id:"Danielle", label:"Danielle", note:"warm, natural" },
  { id:"Joanna",   label:"Joanna",   note:"clear, classic" },
  { id:"Ruth",     label:"Ruth",     note:"expressive" },
  { id:"Salli",    label:"Salli",    note:"bright, upbeat" },
  { id:"Matthew",  label:"Matthew",  note:"steady, calm" },
  { id:"Stephen",  label:"Stephen",  note:"confident" },
];

/* ---------- resilient storage ---------- */
const memStore = {};
const store = {
  get(k){
    try{ const v=localStorage.getItem(k); if(v!==null) return v; }catch{}
    try{ const m=document.cookie.match(new RegExp("(?:^|; )"+k+"=([^;]*)")); if(m) return decodeURIComponent(m[1]); }catch{}
    return k in memStore ? memStore[k] : null;
  },
  set(k,v){ memStore[k]=v; let ok=false;
    try{ localStorage.setItem(k,v); ok=true; }catch{}
    if(!ok){ try{ document.cookie = `${k}=${encodeURIComponent(v)}; path=/; max-age=${60*60*24*180}; SameSite=Lax`; }catch{} }
  },
  del(k){ delete memStore[k]; try{ localStorage.removeItem(k); }catch{} try{ document.cookie = `${k}=; path=/; max-age=0`; }catch{} }
};

const SEED = [
  { id:"seed-1", name:"How to price a loan in Lender Price", desc:"Pull and compare rate options for a borrower, then send the best fit.", steps:5, mins:4, cat:"Pricing", status:"Published", updated:Date.now()-86400000*2, plays:38, pct:82, author:"Rachael Gaines", coverFrame:"" },
  { id:"seed-2", name:"Uploading borrower documents", desc:"Where docs go and how to tag them so nothing gets lost.", steps:4, mins:3, cat:"Documents", status:"Draft", updated:Date.now()-86400000*6, plays:12, pct:40, author:"Marcus Reed", coverFrame:"" },
  { id:"seed-3", name:"Running a pre-approval", desc:"End to end pre-approval in the LOS, start to letter.", steps:7, mins:6, cat:"LOS", status:"Published", updated:Date.now()-86400000*11, plays:57, pct:91, author:"Rachael Gaines", coverFrame:"" },
];
const loadLocal = ()=>{ try{ const s=store.get(LS_GUIDES); return s?JSON.parse(s):SEED; }catch{ return SEED; } };
const saveLocal = (g)=>{ try{ store.set(LS_GUIDES, JSON.stringify(g)); }catch{} };
const timeAgo = (t)=>{ const d=Math.floor((Date.now()-t)/86400000); return d<=0?"today":d===1?"yesterday":`${d} days ago`; };
const fmt=(sec)=>{ sec=Math.max(0,Math.round(sec||0)); const m=Math.floor(sec/60),s=sec%60; return `${m}:${String(s).padStart(2,"0")}`; };
const ROOF = encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='72' height='72'><g fill='none' stroke='#ffffff' stroke-opacity='0.12' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M0 30 L18 12 L36 30 L54 12 L72 30'/><path d='M0 60 L18 42 L36 60 L54 42 L72 60'/></g></svg>`);
