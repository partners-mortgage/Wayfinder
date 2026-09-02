/* Partners Academy · ui.jsx
   The design system. Small presentational pieces and the style objects
   every screen reuses. No business logic lives here. */

/* ================= Shared bits ================= */
function Eyebrow({ children }){ return <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".14em",color:"var(--teal-500)",marginBottom:10}}>{children}</div>; }
function H2({ children }){ return <h2 className="u" style={{fontWeight:900,fontSize:"clamp(28px,3.5vw,34px)",letterSpacing:".01em",color:"var(--sand-900)",lineHeight:1.05}}>{children}</h2>; }
function Field({ label,optional,children }){
  return <div style={{marginBottom:16}}>
    <div style={{display:"flex",alignItems:"baseline",gap:8,marginBottom:7}}>
      <label className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".08em",color:"var(--sand-600)"}}>{label}</label>
      {optional && <span style={{fontSize:11,color:"var(--sand-500)"}}>optional</span>}
    </div>{children}</div>;
}
function Card({ children }){ return <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,padding:"20px 22px",boxShadow:"var(--shadow-card)"}}>{children}</div>; }
function CardHead({ icon,title,right }){
  return <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
    <span style={{color:"var(--teal-500)"}}>{icon}</span>
    <span className="u" style={{fontWeight:800,fontSize:13,letterSpacing:".06em",color:"var(--sand-900)"}}>{title}</span>
    {right && <span style={{marginLeft:"auto"}}>{right}</span>}
  </div>;
}
function Pill({ ok,label }){ return <span className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".06em",padding:"4px 10px",borderRadius:100,background:ok?"var(--pm-green-wash)":"var(--sand-100)",color:ok?"#5a7d0f":"var(--sand-600)"}}>{label}</span>; }
function Spinner({ sm,big }){ const s=big?26:sm?13:16; return <span style={{width:s,height:s,border:`${big?3:2}px solid currentColor`,borderTopColor:"transparent",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite"}}/>; }
function Toast({ msg }){ return <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",zIndex:60,background:"var(--sand-900)",color:"#fff",padding:"12px 18px",borderRadius:11,fontSize:14,boxShadow:"0 8px 30px rgba(0,0,0,.2)",maxWidth:440}}>{msg}</div>; }

const inp={ width:"100%",padding:"11px 13px",fontSize:14.5,fontFamily:"var(--font-body)",color:"var(--sand-900)",background:"#fff",border:"1px solid var(--sand-200)",borderRadius:"var(--radius-input)",outline:"none",transition:"border-color .15s,box-shadow .15s" };
const inpDark={ ...inp,background:"rgba(255,255,255,.06)",color:"#fff",border:"1px solid rgba(255,255,255,.16)" };

const btn={
  primary:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--teal-500)",color:"#fff",border:"none",borderRadius:11,padding:"12px 20px",fontSize:13,fontWeight:700,letterSpacing:".04em",cursor:"pointer",transition:"background .15s"},
  amber:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--amber-500)",color:"var(--sand-900)",border:"none",borderRadius:11,padding:"12px 20px",fontSize:13,fontWeight:800,letterSpacing:".04em",cursor:"pointer"},
  coral:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"var(--pm-coral)",color:"#fff",border:"none",borderRadius:11,padding:"12px 20px",fontSize:13,fontWeight:700,letterSpacing:".04em",cursor:"pointer"},
  ghost:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"#fff",color:"var(--sand-800)",border:"1px solid var(--sand-200)",borderRadius:11,padding:"11px 18px",fontSize:13,fontWeight:700,letterSpacing:".04em",cursor:"pointer"},
  outlineDark:{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,background:"transparent",color:"#fff",border:"1px solid rgba(255,255,255,.3)",borderRadius:11,padding:"12px 20px",fontSize:13,fontWeight:700,letterSpacing:".04em",cursor:"pointer"},
};
function iconBtn(active,danger){ return {width:32,height:32,display:"grid",placeItems:"center",borderRadius:8,cursor:"pointer",border:"1px solid var(--sand-200)",background:"#fff",color:danger?"var(--pm-coral)":"var(--sand-600)",transition:"all .15s"}; }
function iconBtnSm(danger){ return {flex:1,height:28,display:"grid",placeItems:"center",borderRadius:7,cursor:"pointer",border:"1px solid var(--sand-200)",background:"#fff",color:danger?"var(--pm-coral)":"var(--sand-600)"}; }
