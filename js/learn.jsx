/* Partners Academy · learn.jsx
   The Learn half. Course delivery grows here. Watch is the guide player
   and is reused as the guide lesson type. */

/* ================= Learn (viewer stub) ================= */
function Learn({ guides }){
  const tracks=[
    { id:"t1", name:"New LO Onboarding", desc:"Everything a new loan officer needs in week one.", done:1, total:2 },
    { id:"t2", name:"Document Handling", desc:"Get docs in, tagged, and compliant.", done:0, total:1 },
  ];
  return (
    <div style={{maxWidth:1120,margin:"0 auto",padding:"36px 28px 90px",animation:"fadeUp .4s ease"}}>
      <Eyebrow>LEARN</Eyebrow>
      <H2>YOUR TRACKS</H2>
      <p style={{fontSize:15,color:"var(--sand-600)",marginTop:8,marginBottom:24,maxWidth:560}}>Guides grouped into paths. Pick up where you left off. (Viewer experience, wired to the data model. The video player is coming soon.)</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18}}>
        {tracks.map(t=>{
          const pct=Math.round(t.done/t.total*100);
          const cta=pct===0?"Start track":pct===100?"Review":"Continue";
          return (
            <div key={t.id} style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,padding:"20px 22px",boxShadow:"var(--shadow-card)"}}>
              <div className="u" style={{fontWeight:800,fontSize:16,letterSpacing:".02em",color:"var(--sand-900)",marginBottom:6}}>{t.name}</div>
              <p style={{fontSize:14,color:"var(--sand-600)",marginBottom:16}}>{t.desc}</p>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--sand-500)",marginBottom:5}}>
                <span className="u" style={{fontWeight:700,letterSpacing:".06em"}}>{t.done} of {t.total} done</span><span className="num">{pct}%</span>
              </div>
              <div style={{height:6,borderRadius:6,background:"var(--sand-100)",overflow:"hidden",marginBottom:16}}>
                <div style={{width:`${pct}%`,height:"100%",background:pct>=80?"var(--pm-green)":"var(--teal-500)"}}/>
              </div>
              <button className="u" style={{...btn.primary,padding:"9px 16px",fontSize:11}}>{cta} <IcArrow size={14}/></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}


/* ================= Watch a guide ================= */
function Watch({ guide, onClose }){
  const steps = Array.isArray(guide.guideSteps) ? guide.guideSteps : [];
  const hasVideo = !!guide.videoUrl;
  useEffect(()=>{
    const h=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    document.body.style.overflow="hidden";
    return ()=>{ window.removeEventListener("keydown",h); document.body.style.overflow=""; };
  },[]);
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:80,background:"rgba(6,47,52,.72)",
      backdropFilter:"blur(3px)",display:"flex",alignItems:"flex-start",justifyContent:"center",
      padding:"40px 20px",overflowY:"auto"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxWidth:900,background:"#fff",
        borderRadius:18,overflow:"hidden",boxShadow:"0 30px 80px rgba(6,47,52,.4)",animation:"fadeUp .28s ease"}}>

        {/* header */}
        <div style={{background:"var(--teal-900)",padding:"20px 24px",position:"relative"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px",opacity:.4}}/>
          <div style={{position:"relative",display:"flex",alignItems:"flex-start",gap:16}}>
            <div style={{flex:1}}>
              <div style={{width:32,height:4,borderRadius:4,background:"var(--amber-500)",marginBottom:10}}/>
              <div className="u" style={{fontWeight:900,fontSize:22,letterSpacing:".01em",color:"#fff",lineHeight:1.15}}>{guide.name}</div>
              {guide.desc && <p style={{fontSize:14,color:"var(--sand-300)",marginTop:8,maxWidth:560}}>{guide.desc}</p>}
              <div style={{display:"flex",gap:16,marginTop:12,fontSize:12,color:"var(--sand-300)"}}>
                <span className="num">{guide.steps||steps.length} steps</span>
                {guide.mins!=null && <span className="num">{guide.mins} min</span>}
                {guide.author && <span>{guide.author}</span>}
              </div>
            </div>
            <button onClick={onClose} title="Close" style={{background:"rgba(255,255,255,.12)",border:"none",
              color:"#fff",width:34,height:34,borderRadius:9,cursor:"pointer",display:"grid",placeItems:"center",flexShrink:0}}>
              <IcX size={17}/>
            </button>
          </div>
        </div>

        {/* video */}
        {hasVideo ? (
          <video src={guide.videoUrl} controls autoPlay playsInline preload="metadata"
            style={{width:"100%",display:"block",aspectRatio:"16/9",background:"var(--teal-900)"}}/>
        ) : (
          <div style={{padding:"26px 24px",background:"var(--amber-wash)",borderBottom:"1px solid var(--sand-200)",
            display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{color:"var(--amber-600)",marginTop:1}}><IcVideo size={18}/></span>
            <div>
              <div className="u" style={{fontWeight:700,fontSize:12.5,letterSpacing:".04em",color:"#9a6b1e"}}>NO VIDEO YET</div>
              <div style={{fontSize:13.5,color:"#9a6b1e",marginTop:4}}>
                The written steps are below. A narrated video can be made from the publish screen when this guide is recorded again.
              </div>
            </div>
          </div>
        )}

        {/* written steps */}
        <div style={{padding:"18px 24px 26px"}}>
          <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",color:"var(--sand-500)",marginBottom:14}}>THE WRITTEN GUIDE</div>
          {steps.length===0 ? (
            <div style={{fontSize:14,color:"var(--sand-500)"}}>No written steps were saved with this guide.</div>
          ) : steps.map((st,i)=>(
            <div key={i} style={{display:"flex",gap:13,padding:"12px 0",borderBottom:i<steps.length-1?"1px solid var(--sand-100)":"none"}}>
              <div className="num" style={{width:24,height:24,borderRadius:7,flexShrink:0,background:"var(--teal-wash)",
                color:"var(--teal-600)",fontWeight:700,fontSize:12,display:"grid",placeItems:"center"}}>{st.n||i+1}</div>
              <div style={{minWidth:0}}>
                <div className="u" style={{fontWeight:700,fontSize:13,letterSpacing:".02em",color:"var(--sand-900)",marginBottom:3}}>{st.title}</div>
                <div style={{fontSize:14,color:"var(--sand-600)",lineHeight:1.55}}>{st.detail||st.narration}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
