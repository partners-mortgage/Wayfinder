/* Partners Academy · authoring.jsx
   The authoring flow, finished and verified. Do not change the video
   timing here without measuring it. Cover through Published. */

/* ================= Cover ================= */
function Cover({ title, status, mins, frame, size="card" }){
  const titleSize = size==="feature"?20:size==="share"?40:15;
  const pad = size==="share"?"0 34px 26px":size==="feature"?"0 22px 18px":"0 16px 14px";
  const hasPhoto = !!frame;
  return (
    <div style={{position:"relative",aspectRatio:"16/9",width:"100%",overflow:"hidden",
      borderRadius:size==="card"?"14px 14px 0 0":14,background:"var(--teal-900)",
      display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>

      {/* the opening frame of the recording */}
      {hasPhoto && <img src={frame} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>}

      {hasPhoto ? (
        <>
          {/* fade the picture out toward the bottom so the title always reads */}
          <div style={{position:"absolute",inset:0,background:
            "linear-gradient(to bottom, rgba(6,47,52,.10) 0%, rgba(6,47,52,.30) 38%, rgba(6,47,52,.72) 72%, rgba(6,47,52,.94) 100%)"}}/>
          {/* whisper of brand teal over the whole thing */}
          <div style={{position:"absolute",inset:0,background:"rgba(0,129,141,.14)",mixBlendMode:"multiply"}}/>
        </>
      ) : (
        <>
          {/* no frame captured: fall back to the teal roofline treatment */}
          <div style={{position:"absolute",inset:0,background:"linear-gradient(150deg, rgba(0,129,141,.5) 0%, rgba(6,47,52,.15) 60%)"}}/>
          <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px"}}/>
        </>
      )}

      <div style={{position:"relative",padding:pad}}>
        <div style={{width:32,height:4,borderRadius:4,background:"var(--amber-500)",marginBottom:size==="share"?16:10}}/>
        <div className="u" style={{fontWeight:900,color:"#fff",fontSize:titleSize,lineHeight:1.12,letterSpacing:".01em",
          textShadow:hasPhoto?"0 2px 14px rgba(0,0,0,.55)":"none"}}>{title||"UNTITLED GUIDE"}</div>
      </div>

      {status && <span className="u" style={{position:"absolute",top:12,right:12,fontSize:9.5,fontWeight:800,letterSpacing:".08em",padding:"4px 9px",borderRadius:100,
        background:status==="Published"?"var(--amber-500)":"rgba(255,255,255,.92)",color:status==="Published"?"var(--sand-900)":"var(--sand-800)"}}>{status}</span>}
      {mins!=null && <span className="num" style={{position:"absolute",bottom:12,right:12,fontSize:11,fontWeight:600,padding:"3px 8px",borderRadius:100,background:"rgba(6,47,52,.7)",color:"#fff"}}>{mins} min</span>}
    </div>
  );
}

/* ================= Library ================= */
function Library({ guides, loadingLib, onNew, onDelete, setStage, me, onWatch, onShared }){
  const [q,setQ] = useState("");
  const [cat,setCat] = useState("All");
  const [sort,setSort] = useState("Newest");
  const published = guides.filter(g=>g.status==="Published");
  const totalPlays = guides.reduce((a,g)=>a+(g.plays||0),0);
  const authors = new Set(guides.map(g=>g.author).filter(Boolean)).size || 1;
  const avgMin = guides.reduce((a,g)=>a+(g.mins||4),0)/(guides.length||1);
  const hoursSaved = Math.round(totalPlays*avgMin/60);

  let list = guides.filter(g=>{
    const hay=((g.name||"")+(g.desc||"")+(g.author||"")+(g.cat||"")).toLowerCase();
    return hay.includes(q.toLowerCase()) && (cat==="All"||g.cat===cat);
  });
  if(sort==="Most watched") list=[...list].sort((a,b)=>(b.plays||0)-(a.plays||0));
  else if(sort==="A–Z") list=[...list].sort((a,b)=>(a.name||"").localeCompare(b.name||""));
  else list=[...list].sort((a,b)=>(b.updated||0)-(a.updated||0));

  const featured = published.slice().sort((a,b)=>(b.plays||0)-(a.plays||0))[0];

  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{background:"var(--teal-900)",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px",opacity:.5}}/>
        <div className="hero-grid" style={{position:"relative",maxWidth:1120,margin:"0 auto",padding:"46px 28px",display:"grid",gridTemplateColumns:"1.5fr 1fr",gap:36,alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
              <span style={{width:7,height:7,borderRadius:"50%",background:"var(--amber-500)"}}/>
              <span className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".18em",color:"var(--sand-300)"}}>TRAINING LIBRARY</span>
            </div>
            <h1 className="u" style={{fontWeight:900,fontSize:"clamp(34px,5vw,50px)",lineHeight:1.02,letterSpacing:".01em",color:"#fff",marginBottom:16}}>SHOW SOMEONE<br/>HOW IT'S DONE</h1>
            <p style={{fontSize:16,color:"var(--sand-300)",maxWidth:440,marginBottom:26}}>Record a workflow, or upload a video you already have. Claude finds the steps, writes the narration, and it lands in the shared library for the whole team.</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {me && me.admin && <button onClick={onNew} className="u" style={{...btn.amber,padding:"13px 22px"}}><IcRecord size={16}/> Start recording</button>}
              {me && me.admin && <button onClick={onNew} className="u" style={{...btn.outlineDark,padding:"13px 22px"}}><IcDownload size={16}/> Upload a video</button>}
              <button onClick={()=>setStage("learn")} className="u" style={{...btn.outlineDark,padding:"13px 22px"}}><IcEye size={16}/> Browse as a learner</button>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.12)",borderRadius:18,padding:"22px 24px",backdropFilter:"blur(4px)"}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"18px 14px"}}>
              <Stat n={published.length} label="Guides live"/>
              <Stat n={totalPlays} label="Views"/>
              <Stat n={hoursSaved+"h"} label="Shadowing saved"/>
              <Stat n={authors} label="Authors"/>
            </div>
            <div style={{marginTop:18,paddingTop:16,borderTop:"1px solid rgba(255,255,255,.12)",fontSize:13,color:"var(--sand-300)"}}>
              You're <span style={{color:"var(--amber-500)",fontWeight:600}}>two guides</span> from the Trailblazer badge.
            </div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:1120,margin:"0 auto",padding:"28px 28px 90px"}}>
        <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginBottom:22}}>
          <div style={{position:"relative",flex:"1 1 240px",maxWidth:340}}>
            <span style={{position:"absolute",left:13,top:"50%",transform:"translateY(-50%)",color:"var(--sand-500)"}}><IcSearch size={17}/></span>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guides, authors, topics" style={{...inp,paddingLeft:38}}/>
          </div>
          <select value={sort} onChange={e=>setSort(e.target.value)} className="u" style={{...inp,width:"auto",fontSize:11,fontWeight:700,letterSpacing:".06em",cursor:"pointer"}}>
            {["Newest","Most watched","A–Z"].map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:26}}>
          {["All",...CATS].map(c=>(
            <button key={c} onClick={()=>setCat(c)} className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".06em",padding:"7px 13px",borderRadius:100,cursor:"pointer",
              border:`1px solid ${cat===c?"var(--teal-500)":"var(--sand-200)"}`,background:cat===c?"var(--teal-500)":"#fff",color:cat===c?"#fff":"var(--sand-600)"}}>{c}</button>
          ))}
        </div>

        {featured && cat==="All" && !q && (
          <div style={{marginBottom:30}}>
            <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".14em",color:"var(--sand-500)",marginBottom:12}}>FEATURED THIS WEEK</div>
            <div className="feature" style={{display:"grid",gridTemplateColumns:"300px 1fr",background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,overflow:"hidden",boxShadow:"var(--shadow-card)"}}>
              <Cover title={featured.name} status={featured.status} mins={featured.mins} frame={featured.coverFrame} size="feature"/>
              <div style={{padding:"22px 24px",display:"flex",flexDirection:"column"}}>
                <span className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".1em",color:"var(--teal-500)",marginBottom:8}}>{featured.cat}</span>
                <div className="u" style={{fontWeight:800,fontSize:19,letterSpacing:".01em",color:"var(--sand-900)",marginBottom:8}}>{featured.name}</div>
                <p style={{fontSize:14.5,color:"var(--sand-600)",marginBottom:16,flex:1}}>{featured.desc}</p>
                <div style={{display:"flex",alignItems:"center",gap:16,fontSize:12.5,color:"var(--sand-500)",marginBottom:18}}>
                  <span className="num">{featured.steps} steps</span><span className="num">{featured.mins} min</span><span>{featured.author}</span>
                </div>
                <div style={{display:"flex",gap:10}}>
                  <button onClick={()=>onWatch&&onWatch(featured)} className="u" style={{...btn.primary,padding:"10px 18px",fontSize:12}}><IcPlay size={14}/> Watch it</button>
                  <button onClick={()=>{
                    const link = `${location.origin}${location.pathname}?g=${encodeURIComponent(featured.id)}`;
                    try{ navigator.clipboard.writeText(link); onShared && onShared(); }catch{}
                  }} className="u" style={{...btn.ghost,padding:"10px 18px",fontSize:12}}><IcLink size={14}/> Share</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {loadingLib ? <div style={{textAlign:"center",padding:60,color:"var(--sand-500)"}}><Spinner/></div> :
         list.length===0 ? (
          <div style={{border:"1.5px dashed var(--sand-300)",borderRadius:16,padding:"56px 24px",textAlign:"center"}}>
            <div className="u" style={{fontWeight:800,fontSize:18,letterSpacing:".04em",marginBottom:6,color:"var(--sand-800)"}}>NOTHING MATCHES THAT</div>
            <div style={{fontSize:14,color:"var(--sand-600)"}}>Try a different search or category.</div>
          </div>
         ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:18}}>
            {list.map(g=>(
              <div key={g.id} style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,overflow:"hidden",boxShadow:"var(--shadow-card)",transition:"transform .18s,box-shadow .18s",display:"flex",flexDirection:"column"}}
                onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 10px 26px rgba(36,31,29,.10)";}}
                onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="var(--shadow-card)";}}>
                <div onClick={()=>onWatch&&onWatch(g)} style={{cursor:"pointer"}}>
                  <Cover title={g.name} status={g.status} mins={g.mins} frame={g.coverFrame}/>
                </div>
                <div style={{padding:"14px 16px 16px",flex:1,display:"flex",flexDirection:"column"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9}}>
                    <span className="u" style={{fontSize:9.5,fontWeight:700,letterSpacing:".08em",color:"var(--teal-500)",background:"var(--teal-wash)",padding:"3px 8px",borderRadius:100}}>{g.cat||"General"}</span>
                    <span style={{fontSize:11.5,color:"var(--sand-500)"}}>{timeAgo(g.updated)}</span>
                  </div>
                  <p style={{fontSize:14,color:"var(--sand-800)",lineHeight:1.5,marginBottom:14,flex:1}}>{g.desc||"No description."}</p>
                  <div style={{marginBottom:12}}>
                    <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--sand-500)",marginBottom:4}}>
                      <span className="u" style={{letterSpacing:".06em",fontWeight:700}}>Team completion</span><span className="num">{g.pct||0}%</span>
                    </div>
                    <div style={{height:6,borderRadius:6,background:"var(--sand-100)",overflow:"hidden"}}>
                      <div style={{width:`${g.pct||0}%`,height:"100%",background:(g.pct||0)>=80?"var(--pm-green)":"var(--teal-500)"}}/>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:12,color:"var(--sand-500)"}}>
                    <span style={{display:"flex",gap:12}}>
                      <span className="num" style={{display:"inline-flex",alignItems:"center",gap:5}}><IcDoc size={13}/>{g.steps}</span>
                      <span className="num" style={{display:"inline-flex",alignItems:"center",gap:5}}><IcEye size={13}/>{g.plays||0}</span>
                    </span>
                    <span style={{display:"flex",gap:4}}>
                      <button title="Watch" onClick={()=>onWatch&&onWatch(g)} style={iconBtn()}><IcPlay size={14}/></button>
                      <button title="Copy share link" onClick={()=>{
                        const link = `${location.origin}${location.pathname}?g=${encodeURIComponent(g.id)}`;
                        try{ navigator.clipboard.writeText(link); onShared && onShared(); }catch{}
                      }} style={iconBtn()}><IcLink size={14}/></button>
                      {me && me.admin && <button title="Delete" onClick={()=>onDelete(g.id)} style={iconBtn(false,true)}><IcTrash size={14}/></button>}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {me && me.admin && <button onClick={onNew} style={{border:"1.5px dashed var(--sand-300)",borderRadius:16,background:"transparent",cursor:"pointer",padding:"28px 20px",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,minHeight:220,transition:"all .18s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--teal-500)";e.currentTarget.style.background="var(--teal-wash)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--sand-300)";e.currentTarget.style.background="transparent";}}>
              <span style={{width:46,height:46,borderRadius:12,background:"var(--teal-500)",color:"#fff",display:"grid",placeItems:"center"}}><IcPlus size={22}/></span>
              <span className="u" style={{fontWeight:800,fontSize:14,letterSpacing:".03em",color:"var(--sand-800)"}}>RECORD A GUIDE</span>
              <span style={{fontSize:13,color:"var(--sand-600)",textAlign:"center",maxWidth:220}}>Something you explain more than twice? Record it once.</span>
            </button>}
          </div>
         )}
      </div>
    </div>
  );
}
function Stat({ n, label }){
  return (
    <div>
      <div className="num" style={{fontSize:28,fontWeight:800,color:"var(--amber-500)",lineHeight:1}}>{n}</div>
      <div className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".1em",color:"var(--sand-300)",marginTop:5}}>{label}</div>
    </div>
  );
}

/* ================= Setup ================= */
function Setup({ proj,setProj,onNext,onUpload }){
  const can = proj.name.trim();
  return (
    <div style={{maxWidth:640,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 1 OF 5 · ABOUT 30 SECONDS</Eyebrow>
      <H2>WHAT ARE YOU TEACHING?</H2>
      <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:"var(--radius-card)",padding:"22px 22px 24px",boxShadow:"var(--shadow-card)",marginTop:18}}>
        <Field label="Guide title">
          <input value={proj.name} onChange={e=>setProj({...proj,name:e.target.value})} placeholder="How to price a loan in Lender Price" style={inp}/>
        </Field>
        <Field label="One-line promise" optional>
          <input value={proj.desc} onChange={e=>setProj({...proj,desc:e.target.value})} placeholder="What can a teammate do after watching?" style={inp}/>
        </Field>
        <div style={{marginTop:4}}>
          <label className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".08em",color:"var(--sand-600)",display:"block",marginBottom:9}}>Category</label>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {CATS.map(c=>(
              <button key={c} onClick={()=>setProj({...proj,cat:c})} className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".05em",padding:"7px 13px",borderRadius:100,cursor:"pointer",
                border:`1px solid ${proj.cat===c?"var(--teal-500)":"var(--sand-200)"}`,background:proj.cat===c?"var(--teal-500)":"#fff",color:proj.cat===c?"#fff":"var(--sand-600)"}}>{c}</button>
            ))}
          </div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center",background:"var(--teal-wash)",border:"1px solid #cfe6e8",borderRadius:12,padding:"14px 16px",marginTop:16,fontSize:13.5,color:"var(--teal-800)"}}>
        <span style={{flexShrink:0,color:"var(--teal-500)"}}><IcMonitor size={20}/></span>
        <span>Your browser will ask which window to share. Nothing leaves this machine until you publish, so feel free to flub the first take.</span>
      </div>
      <div style={{display:"flex",gap:12,marginTop:22,flexWrap:"wrap",alignItems:"center"}}>
        <button onClick={onNext} disabled={!can} className="u" style={{...btn.primary,opacity:can?1:.5,cursor:can?"pointer":"not-allowed",background:can?"var(--teal-500)":"var(--sand-300)"}}>
          <IcRecord size={16}/> Start recording
        </button>
        <span className="u" style={{fontSize:11,color:"var(--sand-500)",letterSpacing:".08em"}}>OR</span>
        <label className="u" style={{...btn.ghost,cursor:can?"pointer":"not-allowed",opacity:can?1:.5,margin:0}}>
          <IcDownload size={15}/> Upload a video
          <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" disabled={!can}
            onChange={e=>{ const f=e.target.files&&e.target.files[0]; e.target.value=""; if(f) onUpload&&onUpload(f); }}
            style={{display:"none"}}/>
        </label>
      </div>
      {!can
        ? <div style={{fontSize:13,color:"var(--sand-500)",marginTop:12}}>Give it a title first. Future you will thank present you.</div>
        : <div style={{fontSize:12.5,color:"var(--sand-500)",marginTop:12,maxWidth:560,lineHeight:1.55}}>
            Already have a video? Upload it and mark your own chapters. Loom and Teams exports work well. MP4 is the safest format, and keep files under about five minutes for the smoothest result.
          </div>}
    </div>
  );
}


/* ================= Chapters (for uploaded video) ================= */
function Chapters({ recUrl, dur, onDone, onBack }){
  const vref = useRef(null);
  const [t,setT] = useState(0);
  const [len,setLen] = useState(dur||0);
  const [marks,setMarks] = useState([]);
  const add = ()=>{
    const at = +Number(t).toFixed(2);
    if(at < 0.4){ return; }                               // chapter 1 is the start
    if(marks.some(m=>Math.abs(m-at) < 0.4)) return;        // ignore near-duplicates
    setMarks(ms=>[...ms, at].sort((a,b)=>a-b));
  };
  const drop = (m)=> setMarks(ms=>ms.filter(x=>x!==m));
  useEffect(()=>{
    const h=(e)=>{
      if(e.target && /input|textarea/i.test(e.target.tagName)) return;
      if(e.key==="m"||e.key==="M"){ e.preventDefault(); add(); }
    };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[t,marks]);

  const total = marks.length + 1;
  return (
    <div style={{maxWidth:880,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 2 OF 5</Eyebrow>
      <H2>CARVE IT INTO CHAPTERS</H2>
      <p style={{fontSize:15,color:"var(--sand-600)",marginTop:8,marginBottom:20,maxWidth:620}}>
        Play the video and add a chapter wherever a new topic starts. Chapter one begins at the start automatically. Each chapter gets its own narration and its own place in the guide.
      </p>

      <div style={{borderRadius:16,overflow:"hidden",border:"1px solid var(--sand-200)",background:"var(--teal-900)",boxShadow:"var(--shadow-card)"}}>
        <video ref={vref} src={recUrl} controls playsInline preload="metadata"
          onLoadedMetadata={e=>setLen(e.target.duration||0)}
          onTimeUpdate={e=>setT(e.target.currentTime||0)}
          style={{width:"100%",display:"block",aspectRatio:"16/9",background:"var(--teal-900)"}}/>
      </div>

      <div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",marginTop:14}}>
        <button onClick={add} className="u" style={{...btn.primary}}>
          <IcFlag size={16}/> Add chapter at {fmt(t)}
          <kbd style={{marginLeft:8,fontFamily:"var(--font-display)",fontSize:10,padding:"2px 6px",borderRadius:5,background:"rgba(255,255,255,.2)"}}>M</kbd>
        </button>
        <span className="num" style={{fontSize:13,color:"var(--sand-600)"}}>{total} chapter{total===1?"":"s"}</span>
      </div>

      {/* timeline of chapter marks */}
      {len>0 && (
        <div style={{position:"relative",height:38,marginTop:20,borderTop:"2px solid var(--sand-200)"}}>
          <div style={{position:"absolute",top:-2,left:0}}>
            <div style={{width:2,height:12,background:"var(--teal-500)"}}/>
            <div className="num" style={{fontSize:10,color:"var(--sand-500)",marginTop:2}}>0:00</div>
          </div>
          {marks.map(m=>(
            <div key={m} style={{position:"absolute",top:-2,left:`${Math.min(100,(m/len)*100)}%`}}>
              <div style={{width:2,height:12,background:"var(--amber-500)"}}/>
              <div className="num" style={{fontSize:10,color:"var(--sand-500)",marginTop:2,transform:"translateX(-50%)"}}>{fmt(m)}</div>
            </div>
          ))}
        </div>
      )}

      {/* chapter chips */}
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:14}}>
        <span className="num" style={{fontSize:12,color:"var(--teal-600)",background:"var(--teal-wash)",borderRadius:100,padding:"6px 12px"}}>
          <span className="u" style={{fontWeight:700,letterSpacing:".05em",marginRight:6}}>Ch 1</span>0:00
        </span>
        {marks.map((m,i)=>(
          <span key={m} className="num" style={{fontSize:12,color:"var(--sand-800)",background:"var(--sand-100)",borderRadius:100,padding:"6px 8px 6px 12px",display:"inline-flex",alignItems:"center",gap:8}}>
            <span><span className="u" style={{fontWeight:700,letterSpacing:".05em",marginRight:6}}>Ch {i+2}</span>{fmt(m)}</span>
            <button onClick={()=>drop(m)} title="Remove this chapter"
              style={{background:"none",border:"none",cursor:"pointer",color:"var(--pm-coral)",display:"grid",placeItems:"center",padding:0}}>
              <IcX size={13}/>
            </button>
          </span>
        ))}
      </div>

      <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}>
        <button onClick={()=>onDone(marks)} className="u" style={btn.primary}>
          <IcSpark size={16}/> Use these {total} chapter{total===1?"":"s"}
        </button>
        <button onClick={onBack} className="u" style={btn.ghost}><IcArrowL size={15}/> Back</button>
      </div>
      <p style={{fontSize:12.5,color:"var(--sand-500)",marginTop:14}}>
        You can still rename, split, reorder, or delete chapters on the next screen.
      </p>
    </div>
  );
}

/* ================= Recording studio ================= */
function RecordStudio({ onStop, marks, setMarks }){
  const [t,setT] = useState(0);
  const startRef = useRef(Date.now());
  useEffect(()=>{ const id=setInterval(()=>setT((Date.now()-startRef.current)/1000),200); return ()=>clearInterval(id); },[]);
  const mark = ()=> setMarks(m=>[...m, +((Date.now()-startRef.current)/1000).toFixed(1)]);
  useEffect(()=>{
    const h=(e)=>{ if(e.key==="m"||e.key==="M"){ e.preventDefault(); mark(); } };
    window.addEventListener("keydown",h); return ()=>window.removeEventListener("keydown",h);
  },[]);
  const mm=String(Math.floor(t/60)).padStart(2,"0"), ss=String(Math.floor(t%60)).padStart(2,"0");
  return (
    <div style={{maxWidth:820,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 2 OF 5</Eyebrow>
      <H2>YOU'RE ON THE AIR</H2>
      <div style={{background:"var(--teal-900)",borderRadius:20,padding:"36px 32px",boxShadow:"var(--shadow-dark)",position:"relative",overflow:"hidden",marginTop:18}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px",opacity:.4}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:22}}>
            <span style={{width:11,height:11,borderRadius:"50%",background:"var(--pm-coral)",animation:"pulseDot 1.1s infinite"}}/>
            <span className="u" style={{fontSize:11,fontWeight:800,letterSpacing:".16em",color:"#fff"}}>ON THE AIR</span>
          </div>
          <div className="num" style={{fontSize:76,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:".02em"}}>{mm}:{ss}</div>
          <div style={{display:"flex",gap:3,alignItems:"flex-end",height:40,margin:"24px 0"}}>
            {Array.from({length:60}).map((_,i)=>{
              const h = 8 + Math.abs(Math.sin((i*0.5)+(t*3)))*30;
              return <span key={i} style={{flex:1,height:h,borderRadius:2,background:"rgba(255,255,255,.28)"}}/>;
            })}
          </div>
          <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
            <button onClick={mark} className="u" style={{...btn.outlineDark,padding:"12px 18px"}}><IcFlag size={16}/> Mark a step <kbd style={{marginLeft:6,fontFamily:"var(--font-display)",fontSize:10,padding:"2px 6px",borderRadius:5,background:"rgba(255,255,255,.16)"}}>M</kbd></button>
            <button onClick={onStop} className="u" style={{...btn.coral,padding:"12px 20px"}}><IcStop size={16}/> Stop & review</button>
          </div>
          {marks.length>0 && (
            <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:20}}>
              {marks.map((m,i)=>(
                <span key={i} className="num" style={{fontSize:12,color:"#fff",background:"rgba(255,255,255,.1)",border:"1px solid rgba(255,255,255,.16)",borderRadius:100,padding:"5px 11px"}}>
                  <span className="u" style={{fontWeight:700,letterSpacing:".05em",marginRight:6}}>Step {i+2}</span>{fmt(m)}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <p style={{fontSize:13.5,color:"var(--sand-600)",marginTop:16}}>Tap <b>M</b> each time you start a new step. Every mark becomes its own step, nothing gets combined. If you do not mark anything, Claude will find the steps for you.</p>
    </div>
  );
}

/* ================= Analyzing ================= */
function Analyzing({ msg, pct }){
  return (
    <div style={{maxWidth:560,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 3 OF 5</Eyebrow>
      <H2>FINDING YOUR STEPS</H2>
      <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:"var(--radius-card)",padding:"30px 26px",textAlign:"center",boxShadow:"var(--shadow-card)",marginTop:18}}>
        <div style={{display:"inline-flex",marginBottom:18,color:"var(--teal-500)"}}><Spinner big/></div>
        <div aria-live="polite" style={{fontSize:15,fontFamily:"var(--font-body)",color:"var(--sand-800)",marginBottom:18}}>{msg||"Working…"}</div>
        <div style={{height:8,borderRadius:8,background:"var(--sand-100)",overflow:"hidden",maxWidth:320,margin:"0 auto"}}>
          <div style={{width:`${pct}%`,height:"100%",background:"var(--teal-500)",transition:"width .4s ease"}}/>
        </div>
        <div style={{fontSize:13,color:"var(--sand-500)",marginTop:16}}>Usually about ten seconds. Stretch your legs.</div>
      </div>
    </div>
  );
}

/* ================= Steps (filmstrip) ================= */
function Steps({ steps,setSteps,busy,recUrl,dur,analyzeErr,marked,onGen,onBack }){
  const [dragId,setDragId]=useState(null);
  const dragOK=useRef(false);
  const [overId,setOverId]=useState(null);
  const [splitId,setSplitId]=useState(null);
  const [splitT,setSplitT]=useState(0);
  const [splitThumb,setSplitThumb]=useState("");
  const vidRef=useRef(null);

  useEffect(()=>{ if(!recUrl) return; const v=document.createElement("video"); v.src=recUrl; v.muted=true; v.playsInline=true; v.preload="auto"; vidRef.current=v; },[recUrl]);
  const capture=(t,w=1100,q=0.72)=> new Promise((res)=>{ const v=vidRef.current; if(!v){res("");return;}
    const on=()=>{ v.removeEventListener("seeked",on); const scale=w/(v.videoWidth||w),h=Math.round((v.videoHeight||w)*scale);
      const c=document.createElement("canvas"); c.width=w; c.height=h||360; try{ c.getContext("2d").drawImage(v,0,0,c.width,c.height); res(c.toDataURL("image/jpeg",q)); }catch{ res(""); } };
    v.addEventListener("seeked",on); v.currentTime=Math.max(0,Math.min(t,(v.duration||t)-0.05)); });

  const remove=(id)=> setSteps(steps.filter(s=>s.id!==id));
  const onDrop=(targetId)=>{ if(dragId==null||dragId===targetId){ setDragId(null); setOverId(null); return; }
    const arr=[...steps]; const from=arr.findIndex(s=>s.id===dragId), to=arr.findIndex(s=>s.id===targetId);
    const [m]=arr.splice(from,1); arr.splice(to,0,m); setSteps(arr); setDragId(null); setOverId(null); };
  const openSplit=async(s,i)=>{ const next=steps[i+1]; const hi=next?next.t:(dur||s.t+8); const mid=+((s.t+hi)/2).toFixed(1); setSplitId(s.id); setSplitT(mid); setSplitThumb(await capture(mid)); };
  const previewSplit=async(val)=>{ setSplitT(val); setSplitThumb(await capture(val)); };
  const confirmSplit=async()=>{ const i=steps.findIndex(s=>s.id===splitId); const thumb=splitThumb||await capture(splitT);
    const ns={ id:Math.max(0,...steps.map(s=>s.id))+1, title:"New step", t:splitT, thumb, conf:1 };
    const arr=[...steps]; arr.splice(i+1,0,ns); setSteps(arr); setSplitId(null); setSplitThumb(""); };

  return (
    <div style={{animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 3 OF 5</Eyebrow>
      <H2>CONFIRM YOUR STEPS</H2>
      <p style={{fontSize:15,color:"var(--sand-600)",marginTop:8,marginBottom:analyzeErr?14:22,maxWidth:620}}>
        {marked
          ? `These are the ${steps.length} steps you marked while recording, kept exactly as you set them. Rename, reorder, split, or delete any of them.`
          : `Claude found ${steps.length} steps in your recording. Rename, reorder, split, or delete until it reads right. Tip: press M while recording to set the steps yourself.`}
      </p>
      {analyzeErr && <div style={{display:"flex",gap:10,padding:"12px 14px",borderRadius:11,marginBottom:20,background:"var(--amber-wash)",color:"#9a6b1e",fontSize:13.5,alignItems:"flex-start"}}><span style={{marginTop:1}}><IcFlag size={16}/></span><span>{analyzeErr}</span></div>}

      <div style={{display:"flex",gap:14,overflowX:"auto",paddingBottom:14}}>
        {steps.map((s,i)=>{
          const over=overId===s.id&&dragId!==s.id, dragging=dragId===s.id;
          return (
            <div key={s.id} draggable
              onDragStart={e=>{ if(!dragOK.current){ e.preventDefault(); return; } setDragId(s.id); }}
              onDragEnd={()=>{ dragOK.current=false; setDragId(null); setOverId(null); }}
              onDragOver={e=>{e.preventDefault();setOverId(s.id);}} onDrop={()=>onDrop(s.id)}
              style={{width:232,flexShrink:0,background:"#fff",border:`1px solid ${over?"var(--teal-500)":"var(--sand-200)"}`,borderRadius:14,overflow:"hidden",boxShadow:over?"0 0 0 3px var(--teal-wash)":"var(--shadow-card)",opacity:dragging?.4:1,transition:"all .15s"}}>
              <div style={{position:"relative",aspectRatio:"16/10",background:"var(--teal-900)"}}>
                {s.thumb && <img src={s.thumb} alt={`Step ${i+1}: ${s.title}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>}
                <span className="num" style={{position:"absolute",top:8,left:8,fontSize:22,fontWeight:900,color:"rgba(255,255,255,.85)",textShadow:"0 1px 6px rgba(0,0,0,.4)"}}>{String(i+1).padStart(2,"0")}</span>
                <span className="num" style={{position:"absolute",bottom:8,right:8,fontSize:11,color:"#fff",background:"rgba(6,47,52,.72)",borderRadius:100,padding:"2px 7px"}}>{fmt(s.t)}</span>
                <span title="Drag to reorder" onMouseDown={()=>{dragOK.current=true;}}
                  style={{position:"absolute",top:8,right:8,color:"rgba(255,255,255,.7)",cursor:"grab",padding:2}}><IcGrip size={16}/></span>
              </div>
              <div style={{padding:"10px 11px 11px"}}>
                <label className="u" style={{display:"block",fontSize:9,fontWeight:700,letterSpacing:".08em",color:"var(--sand-500)",marginBottom:4}}>Step name</label>
                <input value={s.title||""} placeholder={`Step ${i+1}`}
                  onChange={e=>setSteps(prev=>prev.map(x=>x.id===s.id?{...x,title:e.target.value}:x))}
                  className="u" style={{...inp,padding:"6px 8px",fontSize:12,fontWeight:700,letterSpacing:".03em"}}/>
                <div style={{display:"flex",gap:5,marginTop:9}}>
                  {recUrl && <button onClick={()=>openSplit(s,i)} style={iconBtnSm()} title="Split this step"><IcScissors size={14}/></button>}
                  <button onClick={()=>remove(s.id)} style={iconBtnSm(true)} title="Delete this step"><IcTrash size={14}/></button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {dur>0 && (
        <div style={{position:"relative",height:34,margin:"10px 2px 0",borderTop:"2px solid var(--sand-200)"}}>
          {steps.map((s)=>(
            <div key={s.id} style={{position:"absolute",top:-2,left:`${Math.min(100,(s.t/dur)*100)}%`}}>
              <div style={{width:2,height:12,background:"var(--teal-500)"}}/>
              <div className="num" style={{fontSize:10,color:"var(--sand-500)",marginTop:2,transform:"translateX(-50%)"}}>{fmt(s.t)}</div>
            </div>
          ))}
        </div>
      )}

      {splitId!=null && (()=>{ const i=steps.findIndex(s=>s.id===splitId); const s=steps[i]; const hi=steps[i+1]?steps[i+1].t:(dur||s.t+8);
        return (
          <div style={{border:"1px solid var(--teal-500)",borderRadius:14,background:"var(--teal-wash)",padding:"16px 18px",marginTop:18,maxWidth:520}}>
            <div className="u" style={{fontSize:12,fontWeight:700,letterSpacing:".06em",color:"var(--teal-600)",marginBottom:12}}>PICK WHERE THE NEW STEP BEGINS</div>
            <div style={{display:"flex",gap:14,alignItems:"center"}}>
              <div style={{width:150,height:86,borderRadius:8,overflow:"hidden",flexShrink:0,border:"1px solid var(--sand-200)",background:"var(--teal-900)"}}>{splitThumb && <img src={splitThumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>}</div>
              <div style={{flex:1}}>
                <input type="range" min={s.t} max={hi} step="0.5" value={splitT} onChange={e=>previewSplit(parseFloat(e.target.value))} style={{width:"100%",accentColor:"var(--teal-500)"}}/>
                <div className="num" style={{fontSize:12,color:"var(--sand-600)",marginTop:4}}>New step at {fmt(splitT)}</div>
                <div style={{display:"flex",gap:8,marginTop:10}}>
                  <button onClick={confirmSplit} className="u" style={{...btn.primary,padding:"8px 14px",fontSize:11}}>Split here</button>
                  <button onClick={()=>{setSplitId(null);setSplitThumb("");}} className="u" style={{...btn.ghost,padding:"8px 14px",fontSize:11}}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        ); })()}

      <div style={{display:"flex",gap:12,marginTop:30,flexWrap:"wrap"}}>
        <button onClick={onGen} disabled={!steps.length||busy} className="u" style={{...btn.primary,opacity:steps.length&&!busy?1:.5}}>
          {busy?<><Spinner/> Writing…</>:<><IcSpark size={16}/> Write the narration</>}
        </button>
        <button onClick={onBack} className="u" style={btn.ghost}><IcArrowL size={15}/> Back</button>
      </div>
    </div>
  );
}

/* ================= Editing (script) ================= */
function Editing({ steps,setSteps,scripts,setScripts,details,setDetails,expandDetail,genErr,onNext,onBack }){
  const set=(id,v)=> setScripts({...scripts,[id]:v});
  const setD=(id,v)=> setDetails({...details,[id]:v});
  const [busyId,setBusyId]=useState(null);
  const [expErr,setExpErr]=useState("");
  const doExpand=async(s)=>{
    setBusyId(s.id); setExpErr("");
    try{ const txt=await expandDetail(s); setDetails(prev=>({...prev,[s.id]:txt})); }
    catch(err){ setExpErr(String(err.message||err)); }
    finally{ setBusyId(null); }
  };
  return (
    <div style={{maxWidth:820,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 4 OF 5</Eyebrow>
      <H2>SOUND LIKE YOURSELF</H2>
      <p style={{fontSize:15,color:"var(--sand-600)",marginTop:8,marginBottom:22,maxWidth:600}}>The narration stays short for the video. The detail field adds depth for the written PDF only, so the guide can teach more without slowing the video down.</p>
      {genErr && <div style={{display:"flex",gap:10,padding:"12px 14px",borderRadius:11,marginBottom:18,background:"#FBEDEA",color:"var(--pm-coral)",fontSize:13.5}}><IcX size={16}/><span>{genErr}</span></div>}
      {expErr && <div style={{display:"flex",gap:10,padding:"12px 14px",borderRadius:11,marginBottom:18,background:"#FBEDEA",color:"var(--pm-coral)",fontSize:13.5}}><IcX size={16}/><span>{expErr}</span></div>}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {steps.map((s)=>{
          const v=scripts[s.id]??scripts[String(s.id)]??""; const len=v.length;
          const d=details[s.id]??details[String(s.id)]??"";
          const tone=len===0?"var(--sand-500)":len<=140?"var(--pm-green)":len<=220?"var(--amber-600)":"var(--pm-coral)";
          return (
            <div key={s.id} style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:14,padding:"14px 16px",boxShadow:"var(--shadow-card)"}}>
              <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:11}}>
                {s.thumb && <div style={{width:76,height:46,borderRadius:8,overflow:"hidden",flexShrink:0,border:"1px solid var(--sand-200)"}}><img src={s.thumb} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
                <div>
                  <span className="num" style={{fontSize:11,color:"var(--sand-500)"}}>{fmt(s.t)}</span>
                  <input value={s.title||""} placeholder={`Step ${s.id}`}
                    onChange={e=>setSteps&&setSteps(prev=>prev.map(x=>x.id===s.id?{...x,title:e.target.value}:x))}
                    className="u" style={{...inp,padding:"4px 7px",fontSize:13,fontWeight:700,letterSpacing:".03em",background:"transparent",border:"1px solid transparent"}}
                    onFocus={e=>{e.target.style.background="#fff";e.target.style.borderColor="var(--sand-200)";}}
                    onBlur={e=>{e.target.style.background="transparent";e.target.style.borderColor="transparent";}}/>
                </div>
              </div>
              <label className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:"var(--sand-500)",display:"block",marginBottom:5}}>Narration · spoken in the video</label>
              <textarea value={v} onChange={e=>set(s.id,e.target.value)} rows={2} style={{...inp,fontFamily:"var(--font-body)",fontSize:15,lineHeight:1.6}}/>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginTop:6,color:tone}}>
                <span>Two sentences beats five.</span><span className="num">{len}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:14,marginBottom:5}}>
                <label className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:"var(--sand-500)"}}>Written detail · PDF only <span style={{color:"var(--sand-400,#b8b0aa)",fontWeight:600}}>optional</span></label>
                <button onClick={()=>doExpand(s)} disabled={busyId===s.id} className="u"
                  style={{display:"inline-flex",alignItems:"center",gap:6,fontSize:10,fontWeight:700,letterSpacing:".05em",padding:"5px 10px",borderRadius:8,cursor:"pointer",border:"1px solid var(--amber-500)",background:"var(--amber-wash)",color:"var(--amber-600)"}}>
                  {busyId===s.id?<><Spinner sm/> Expanding…</>:<><IcSpark size={13}/> Expand with AI</>}
                </button>
              </div>
              <textarea value={d} onChange={e=>setD(s.id,e.target.value)} rows={3} placeholder="Add extra context, tips, or warnings for the written guide. Leave blank to keep the PDF short."
                style={{...inp,fontFamily:"var(--font-body)",fontSize:14.5,lineHeight:1.6,background:"var(--sand-50)"}}/>
            </div>
          );
        })}
      </div>
      <div style={{display:"flex",gap:12,marginTop:28,flexWrap:"wrap"}}>
        <button onClick={onNext} className="u" style={btn.primary}><IcVideo size={16}/> Build the guide</button>
        <button onClick={onBack} className="u" style={btn.ghost}><IcArrowL size={15}/> Back to steps</button>
      </div>
    </div>
  );
}

/* ================= Generating ================= */
function Generating(){
  const items=["Composing the video","Rendering the narration","Formatting the written guide","Applying Partners branding"];
  const [done,setDone]=useState(0);
  useEffect(()=>{ const id=setInterval(()=>setDone(d=>Math.min(d+1,items.length)),620); return ()=>clearInterval(id); },[]);
  return (
    <div style={{maxWidth:560,animation:"fadeUp .35s ease"}}>
      <Eyebrow>STEP 5 OF 5</Eyebrow>
      <H2>BUILDING YOUR GUIDE</H2>
      <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:"var(--radius-card)",padding:8,marginTop:18,boxShadow:"var(--shadow-card)"}}>
        {items.map((it,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:14,borderBottom:i<items.length-1?"1px solid var(--sand-100)":"none"}}>
            <div style={{width:22,height:22,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,background:i<done?"var(--teal-500)":"transparent",color:"#fff",border:i<done?"none":"2px solid var(--sand-200)"}}>
              {i<done?<IcCheck size={13} stroke={3}/>:i===done?<Spinner sm/>:null}
            </div>
            <span style={{fontSize:15,color:i<=done?"var(--sand-900)":"var(--sand-500)"}}>{it}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= Published (reward) ================= */
function Published({ proj,steps,scripts,details,voice,setVoice,recUrl,recBlob,dur,guides,showToast,onSave,onVideoReady,guideId,onDone }){
  const [saved,setSaved]=useState(false);
  const [copied,setCopied]=useState(false);
  const [vidState,setVidState]=useState("idle"); // idle | rendering | done | error
  const [vidUrl,setVidUrl]=useState("");
  const [vidMsg,setVidMsg]=useState("");
  useEffect(()=>{ if(!saved){ onSave(); setSaved(true); } },[]);
  const mins=Math.max(1,Math.round((dur||steps.length*40)/60));
  const myCount=(guides.filter(g=>g.author==="You").length)+1;
  const downloadRaw=()=>{ if(!recBlob)return; const a=document.createElement("a"); a.href=URL.createObjectURL(recBlob); a.download=`${(proj.name||"recording").replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()}.webm`; a.click(); };
  /* A real link back into this app, pointing at this guide. Recipients sign
     in with their Partners account and land on the guide. */
  const shareLink = guideId
    ? `${location.origin}${location.pathname}?g=${encodeURIComponent(guideId)}`
    : "";
  const copyLink=async()=>{
    if(!shareLink){ showToast("The link appears once the guide is saved."); return; }
    try{ await navigator.clipboard.writeText(shareLink); }
    catch{
      // clipboard can be blocked; fall back to selecting the field
      const el=document.getElementById("wf-share-input");
      if(el){ el.removeAttribute("readonly"); el.select(); document.execCommand&&document.execCommand("copy"); el.setAttribute("readonly","readonly"); }
    }
    setCopied(true); setTimeout(()=>setCopied(false),2000);
  };
  const makePDF=()=>{
    try{
      const JS = window.jspdf && window.jspdf.jsPDF;
      if(!JS){ showToast("PDF library still loading, try again in a second."); return; }
      const doc = new JS({ unit:"pt", format:"letter" });
      const W=612, H=792, M=56, CONTENT=W-M*2;
      const TEAL=[0,110,120], DEEP=[6,47,52], AMBER=[255,172,39];
      const INK=[36,31,29], SOFT=[95,88,84], LINE=[228,223,218];

      /* ---------- cover ---------- */
      doc.setFillColor(DEEP[0],DEEP[1],DEEP[2]); doc.rect(0,0,W,H,"F");
      doc.setFillColor(AMBER[0],AMBER[1],AMBER[2]); doc.rect(M,300,48,6,"F");
      doc.setTextColor(255,255,255); doc.setFont("helvetica","bold"); doc.setFontSize(34);
      let ty=348;
      doc.splitTextToSize((proj.name||"Training Guide").toUpperCase(), CONTENT).forEach(l=>{ doc.text(l,M,ty); ty+=40; });
      if(proj.desc){
        doc.setFont("helvetica","normal"); doc.setFontSize(13); doc.setTextColor(205,214,213);
        doc.text(doc.splitTextToSize(proj.desc, CONTENT-40), M, ty+6);
      }
      doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(150,168,168);
      doc.text("WAYFINDER   \u00b7   A PARTNERS MORTGAGE TOOL", M, H-90);
      doc.setFont("helvetica","italic"); doc.setFontSize(12);
      doc.setTextColor(AMBER[0],AMBER[1],AMBER[2]);
      doc.text("You matter.", M, H-66);

      /* ---------- steps ---------- */
      const IMG_W=372, pageTop=72, pageBottom=H-64;
      let page=1;
      doc.addPage(); page++;
      let y=pageTop;
      const footer=()=>{
        doc.setFont("helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(165,158,152);
        doc.text("WAYFINDER  \u00b7  "+(proj.name||"Training guide"), M, H-40);
        doc.text(String(page-1), W-M, H-40, { align:"right" });
      };
      footer();

      steps.forEach((s,i)=>{
        const detail=(details&&(details[s.id]??details[String(s.id)]))||"";
        const narr=scripts[s.id]??scripts[String(s.id)]??"";
        const body=(detail.trim()||narr||"").trim();

        const imgH = s.thumb ? Math.round(IMG_W*0.625) : 0;
        doc.setFont("helvetica","normal"); doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(body||" ", CONTENT);
        const blockH = 26 + (imgH?imgH+14:0) + lines.length*14.5 + 30;
        if(y+blockH > pageBottom){ doc.addPage(); page++; y=pageTop; footer(); }

        doc.setFillColor(230,242,243); doc.circle(M+10,y+2,11,"F");
        doc.setFont("helvetica","bold"); doc.setFontSize(11);
        doc.setTextColor(TEAL[0],TEAL[1],TEAL[2]);
        doc.text(String(i+1), M+10, y+6, { align:"center" });

        doc.setFont("helvetica","bold"); doc.setFontSize(13.5);
        doc.setTextColor(INK[0],INK[1],INK[2]);
        let tyy=y+7;
        doc.splitTextToSize(s.title||"", CONTENT-34).forEach(l=>{ doc.text(l,M+30,tyy); tyy+=17; });
        let cursor=Math.max(y+26, tyy+4);

        if(s.thumb){
          try{
            doc.addImage(s.thumb,"JPEG",M+30,cursor,IMG_W,imgH);
            doc.setDrawColor(LINE[0],LINE[1],LINE[2]); doc.setLineWidth(0.7);
            doc.rect(M+30,cursor,IMG_W,imgH);
          }catch(e){}
          cursor += imgH+14;
        }

        doc.setFont("helvetica","normal"); doc.setFontSize(10.5);
        doc.setTextColor(SOFT[0],SOFT[1],SOFT[2]);
        lines.forEach(l=>{ doc.text(l,M+30,cursor+3); cursor+=14.5; });

        y = cursor+16;
        if(i<steps.length-1){
          doc.setDrawColor(LINE[0],LINE[1],LINE[2]); doc.setLineWidth(0.8);
          doc.line(M,y,W-M,y); y+=22;
        }
      });

      doc.save(`${(proj.name||"wayfinder-guide").replace(/[^a-z0-9-_]+/gi,"-").toLowerCase()}.pdf`);
    }catch(err){ showToast("PDF build hit a snag: "+(err.message||err)); }
  };
  const [showRaw,setShowRaw]=useState(false);
  const [vidPhase,setVidPhase]=useState("");   // "uploading" | "rendering"
  const [vidPct,setVidPct]=useState(0);
  const timers=useRef([]);
  const phaseRef=useRef("waking");
  const clearTimers=()=>{ timers.current.forEach(clearTimeout); timers.current=[]; };
  useEffect(()=>()=>clearTimers(),[]);
  const makeVideo=async()=>{
    if(!PROXY){ showToast("Video service isn't configured yet."); return; }
    clearTimers();
    setVidState("rendering"); setVidPhase("uploading"); setVidPct(2);
    setVidMsg("Uploading your recording. This uses your real screen capture, so give it a moment.");
    try{
      /* 1. Upload the actual recording so the renderer can use the real
            footage. Ask the service for a one-time upload address, then
            send the file straight to storage (no proxy hop for the video). */
      let videoUrl = "";
      if(recBlob){
        const ur = await callUploadUrl({ name: proj.name||"recording", content_type: recBlob.type||"video/webm" });
        const ud = await ur.json().catch(()=>({}));
        if(!ur.ok || !ud.put_url) throw new Error(ud.detail||ud.error||"Couldn't start the upload.");
        const put = await fetch(ud.put_url, {
          method:"PUT",
          headers:{ "Content-Type": recBlob.type||"video/webm" },
          body: recBlob
        });
        if(!put.ok) throw new Error("Upload failed ("+put.status+"). If this keeps happening, storage may need a CORS rule for this site.");
        videoUrl = ud.video_url || "";
      }

      /* 2. Start the render job. Returns immediately with a job id. */
      setVidPhase("rendering"); setVidPct(8); setVidMsg("Building your narrated video.");
      const payload = {
        title: proj.name||"Wayfinder guide",
        voice: voice,
        video_url: videoUrl,
        steps: steps.map((s,i)=>({
          n: i+1,
          title: s.title,
          narration: scripts[s.id]??scripts[String(s.id)]??s.title,
          t: Number(s.t)||0
        }))
      };
      const r = await callRender(payload);
      const d = await r.json().catch(()=>({}));
      if(!r.ok) throw new Error(d.detail||d.error||("Render failed ("+r.status+")"));
      if(!d.job_id) throw new Error("The service didn't return a job id.");

      /* 3. Poll until it's ready. Progress comes from the service, so the
            bar reflects real work instead of guessing. */
      const started = Date.now();
      const poll = async ()=>{
        if(Date.now()-started > 15*60*1000){
          setVidState("error"); setVidMsg("This is taking unusually long. Try again."); return;
        }
        let j = null;
        try{
          const jr = await getProxy("/job/"+d.job_id);
          j = await jr.json().catch(()=>null);
          if(jr.status===404){ throw new Error("The job expired. Please try again."); }
        }catch(e){
          // transient network hiccup: keep waiting rather than failing
          timers.current.push(setTimeout(poll, 4000)); return;
        }
        if(!j){ timers.current.push(setTimeout(poll, 4000)); return; }

        if(typeof j.pct === "number") setVidPct(Math.max(2, Math.min(99, j.pct)));
        if(j.message) setVidMsg(j.message);
        if(j.phase) setVidPhase(j.phase==="uploading"?"uploading":"rendering");

        if(j.status === "done" && j.url){
          clearTimers(); setVidPct(100); setVidUrl(j.url);
          setVidState("done"); setVidPhase(""); setVidMsg("");
          try{ onVideoReady && onVideoReady(j.url); }catch{}
          return;
        }
        if(j.status === "error"){
          clearTimers(); setVidState("error"); setVidPhase(""); setVidPct(0);
          setVidMsg(j.error || "Render failed."); return;
        }
        timers.current.push(setTimeout(poll, 3000));
      };
      timers.current.push(setTimeout(poll, 2500));

    }catch(err){ clearTimers(); setVidState("error"); setVidPhase(""); setVidPct(0); setVidMsg(String(err.message||err)); }
  };

  return (
    <div style={{animation:"fadeUp .4s ease"}}>
      <div style={{background:"var(--teal-900)",borderRadius:20,padding:"32px 34px",position:"relative",overflow:"hidden",boxShadow:"var(--shadow-dark)"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px",opacity:.45}}/>
        <div className="pub-grid" style={{position:"relative",display:"grid",gridTemplateColumns:"1fr auto",gap:28,alignItems:"center"}}>
          <div>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
              <span style={{width:26,height:26,borderRadius:"50%",background:"var(--amber-500)",display:"grid",placeItems:"center",color:"var(--sand-900)"}}><IcCheck size={16} stroke={3}/></span>
              <span className="u" style={{fontSize:11,fontWeight:800,letterSpacing:".16em",color:"var(--amber-500)"}}>PUBLISHED TO THE LIBRARY</span>
            </div>
            <div className="u" style={{fontWeight:900,fontSize:"clamp(26px,3.5vw,40px)",lineHeight:1.05,letterSpacing:".01em",color:"#fff",marginBottom:12}}>{proj.name||"YOUR GUIDE"}</div>
            <p style={{fontSize:15,color:"var(--sand-300)",maxWidth:460,marginBottom:22}}>That's one fewer thing anyone has to tap you on the shoulder about. Nice work.</p>
            <div style={{display:"flex",gap:26}}>
              <BannerStat n={steps.length} label="Steps"/>
              <BannerStat n={mins+" min"} label="Runtime"/>
              <BannerStat n={myCount} label="Your guides"/>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:16,padding:"22px 20px",textAlign:"center",minWidth:200}}>
            <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><AscentGlyph/></div>
            <div className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".14em",color:"var(--sand-300)",marginBottom:4}}>BADGE UNLOCKED</div>
            <div style={{fontFamily:"var(--font-script)",fontStyle:"italic",fontSize:22,color:"var(--amber-500)",marginBottom:6}}>Trailblazer</div>
            <div style={{fontSize:12,color:"var(--sand-300)",lineHeight:1.5}}>Your guides have saved the team an estimated 3 hours of shadowing.</div>
          </div>
        </div>
      </div>

      <div className="pub-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.5fr) minmax(240px,1fr)",gap:24,marginTop:24}}>
        <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,overflow:"hidden",boxShadow:"var(--shadow-card)"}}>
          <div className="u" style={{padding:"14px 18px",borderBottom:"1px solid var(--sand-100)",fontWeight:700,fontSize:12,letterSpacing:".08em",color:"var(--sand-800)"}}>THE WRITTEN GUIDE</div>
          <div style={{maxHeight:420,overflowY:"auto"}}>
            {steps.map((s,i)=>(
              <div key={s.id} style={{display:"flex",gap:13,padding:"14px 18px",borderBottom:i<steps.length-1?"1px solid var(--sand-100)":"none"}}>
                <div className="num" style={{width:24,height:24,borderRadius:7,flexShrink:0,background:"var(--teal-wash)",color:"var(--teal-600)",fontWeight:700,fontSize:12,display:"grid",placeItems:"center"}}>{i+1}</div>
                {s.thumb && <div style={{width:104,height:60,borderRadius:8,overflow:"hidden",flexShrink:0,border:"1px solid var(--sand-200)"}}><img src={s.thumb} alt={`Step ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/></div>}
                <div style={{minWidth:0}}>
                  <div className="u" style={{fontWeight:700,fontSize:13,letterSpacing:".02em",marginBottom:3,color:"var(--sand-900)"}}>{s.title}</div>
                  <div style={{fontSize:14,color:"var(--sand-600)",lineHeight:1.55}}>{(details&&(details[s.id]??details[String(s.id)]))||scripts[s.id]||scripts[String(s.id)]||""}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",color:"var(--sand-500)",marginBottom:12}}>SEND IT OUT</div>
          <div style={{display:"flex",gap:8,marginBottom:8}}>
            <input id="wf-share-input" readOnly value={shareLink||"Saving to the library…"}
              onClick={e=>e.target.select()}
              style={{...inp,fontSize:12,color:shareLink?"var(--sand-800)":"var(--sand-500)"}}/>
            <button onClick={copyLink} className="u" style={{...btn.primary,padding:"0 16px",fontSize:11,flexShrink:0,opacity:shareLink?1:.5}}>{copied?"Copied":"Copy"}</button>
          </div>
          <div style={{fontSize:11,color:"var(--sand-500)",marginBottom:12,lineHeight:1.5}}>
            Opens in Wayfinder. Anyone with a Partners account can watch it.
            {vidState==="done" && vidUrl && <>
              {" "}<a href={vidUrl} target="_blank" rel="noopener" style={{color:"var(--teal-600)"}}>Direct video file</a>
              {" "}(plays without signing in).
            </>}
          </div>
          {/* finished video plays right here */}
          {vidState==="done" && vidUrl && (
            <div style={{marginBottom:10,borderRadius:12,overflow:"hidden",border:"1px solid var(--sand-200)",background:"var(--teal-900)"}}>
              <video src={vidUrl} controls playsInline preload="metadata"
                style={{width:"100%",display:"block",aspectRatio:"16/9",background:"var(--teal-900)"}}/>
            </div>
          )}
          {/* preview the raw capture before rendering */}
          {vidState!=="done" && recUrl && (
            <div style={{marginBottom:10}}>
              {showRaw ? (
                <div style={{borderRadius:12,overflow:"hidden",border:"1px solid var(--sand-200)",background:"var(--teal-900)"}}>
                  <video src={recUrl} controls playsInline preload="metadata"
                    style={{width:"100%",display:"block",aspectRatio:"16/9",background:"var(--teal-900)"}}/>
                </div>
              ) : (
                <button onClick={()=>setShowRaw(true)} className="u" style={{...btn.ghost,width:"100%",justifyContent:"center",fontSize:11}}>
                  <IcPlay size={13}/> Watch your recording
                </button>
              )}
            </div>
          )}
          {/* voice picker */}
          <div style={{border:"1px solid var(--sand-200)",borderRadius:12,padding:"12px 14px",marginBottom:8,background:"#fff"}}>
            <label className="u" style={{display:"block",fontSize:10,fontWeight:700,letterSpacing:".08em",color:"var(--sand-500)",marginBottom:7}}>Narrator voice</label>
            <select value={voice} onChange={e=>setVoice(e.target.value)} disabled={vidState==="rendering"}
              style={{...inp,padding:"9px 11px",fontSize:14,cursor:vidState==="rendering"?"not-allowed":"pointer"}}>
              {VOICES.map(v=><option key={v.id} value={v.id}>{v.label} ({v.note})</option>)}
            </select>
            {vidState==="done" && <div style={{fontSize:11,color:"var(--sand-500)",marginTop:6}}>Pick a different voice and make it again to hear another read.</div>}
          </div>
          {/* live narrated video via proxy -> render service */}
          <div style={{border:"1px solid var(--sand-200)",borderRadius:12,padding:"12px 14px",marginBottom:8,background:vidState==="done"?"var(--pm-green-wash)":"#fff"}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <span style={{color:"var(--teal-500)"}}><IcVideo size={18}/></span>
              <span style={{flex:1}}>
                <span className="u" style={{display:"block",fontWeight:700,fontSize:12.5,letterSpacing:".03em",color:"var(--sand-900)"}}>Narrated video</span>
                <span style={{display:"block",fontSize:12,color:"var(--sand-500)",marginTop:1}}>
                  {vidState==="rendering"?(vidPhase==="uploading"?"Uploading recording…":"Rendering…"):vidState==="done"?`Ready · ${voice}`:vidState==="error"?"Failed":`Your recording · ${voice}`}
                </span>
              </span>
              {vidState==="idle" && <button onClick={makeVideo} className="u" style={{...btn.primary,padding:"7px 13px",fontSize:11}}>Make it</button>}
              {vidState==="rendering" && <span className="num" style={{fontSize:12,fontWeight:700,color:"var(--teal-600)"}}>{Math.round(vidPct)}%</span>}
              {vidState==="done" && <span style={{display:"flex",gap:6}}>
                <button onClick={makeVideo} className="u" style={{...btn.ghost,padding:"7px 11px",fontSize:11}}>Redo</button>
                <a href={vidUrl} target="_blank" rel="noopener" className="u" style={{...btn.amber,padding:"7px 13px",fontSize:11,textDecoration:"none"}}>Open</a>
              </span>}
              {vidState==="error" && <button onClick={makeVideo} className="u" style={{...btn.ghost,padding:"7px 13px",fontSize:11}}>Retry</button>}
            </div>
            {vidState==="rendering" && (
              <div style={{marginTop:10}}>
                <div style={{height:6,borderRadius:6,background:"var(--sand-100)",overflow:"hidden"}}>
                  <div style={{width:`${vidPct}%`,height:"100%",background:vidPhase==="uploading"?"var(--amber-500)":"var(--teal-500)",transition:"width .6s ease, background .3s ease"}}/>
                </div>
                <div style={{fontSize:11,color:vidPhase==="uploading"?"var(--amber-600)":"var(--sand-500)",marginTop:6,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{width:6,height:6,borderRadius:"50%",background:vidPhase==="uploading"?"var(--amber-500)":"var(--teal-500)",animation:"pulseDot 1.1s infinite"}}/>
                  Your real screen capture is used, so this takes a few minutes. You can leave this open.
                </div>
              </div>
            )}
            {vidMsg && <div style={{fontSize:12,marginTop:8,color:vidState==="error"?"var(--pm-coral)":"var(--sand-600)"}}>{vidMsg}</div>}
          </div>

          {[[IcDownload,"Raw recording",".webm, right now",false,downloadRaw],
            [IcDoc,"PDF guide","Formatted handout",false,makePDF]].map(([I,t,s,prev,fn],i)=>(
            <button key={i} onClick={fn} style={{display:"flex",alignItems:"center",gap:12,width:"100%",background:"#fff",border:"1px solid var(--sand-200)",borderRadius:12,padding:"12px 14px",cursor:"pointer",textAlign:"left",marginBottom:8,transition:"all .15s"}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor="var(--teal-500)";e.currentTarget.style.background="var(--teal-wash)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor="var(--sand-200)";e.currentTarget.style.background="#fff";}}>
              <span style={{color:"var(--teal-500)"}}><I size={18}/></span>
              <span style={{flex:1}}>
                <span style={{display:"flex",alignItems:"center",gap:7}}>
                  <span className="u" style={{fontWeight:700,fontSize:12.5,letterSpacing:".03em",color:"var(--sand-900)"}}>{t}</span>
                  {prev && <span className="u" style={{fontSize:9,fontWeight:700,letterSpacing:".05em",padding:"2px 6px",borderRadius:5,background:"var(--sand-100)",color:"var(--sand-500)"}}>PREVIEW</span>}
                </span>
                <span style={{display:"block",fontSize:12,color:"var(--sand-500)",marginTop:1}}>{s}</span>
              </span>
            </button>
          ))}
          <button onClick={onDone} className="u" style={{...btn.ghost,width:"100%",justifyContent:"center",marginTop:8}}>Back to library</button>
        </div>
      </div>
    </div>
  );
}
function BannerStat({ n, label }){
  return <div><div className="num" style={{fontSize:24,fontWeight:800,color:"#fff",lineHeight:1}}>{n}</div><div className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".1em",color:"var(--sand-300)",marginTop:4}}>{label}</div></div>;
}
