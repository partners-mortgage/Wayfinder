/* Partners Academy · shell.jsx
   The application shell. Studio holds all the stage routing and the
   shared state the authoring flow threads through. Header and FlowStrip
   are its chrome. */

/* ================= Main ================= */
function Studio({ me }){
  const [stage,setStage] = useState("library");
  const [proj,setProj] = useState({ name:"", desc:"", cat:"Pricing" });
  const [apiKey,setApiKey] = useState(()=>{ try{ return store.get(LS_KEY)||""; }catch{ return ""; } });
  const [keyState,setKeyState] = useState("idle");
  const [keyMsg,setKeyMsg] = useState("");
  const [steps,setSteps] = useState([]);
  const [scripts,setScripts] = useState({});
  const [details,setDetails] = useState({});
  const [voice,setVoice] = useState("Danielle");
  const [guideId,setGuideId] = useState(null);
  const [watching,setWatching] = useState(null);
  const [source,setSource] = useState("record");   // "record" | "upload"
  const [genErr,setGenErr] = useState("");
  const [busy,setBusy] = useState(false);
  const [toast,setToast] = useState(null);
  const [guides,setGuides] = useState([]);
  const [loadingLib,setLoadingLib] = useState(true);
  const [recUrl,setRecUrl] = useState(null);
  const [recBlob,setRecBlob] = useState(null);
  const [dur,setDur] = useState(0);
  const [marks,setMarks] = useState([]);
  const [analyzeMsg,setAnalyzeMsg] = useState("");
  const [analyzePct,setAnalyzePct] = useState(0);
  const [analyzeErr,setAnalyzeErr] = useState("");
  const recRef = useRef(null), streamRef = useRef(null), chunksRef = useRef([]);

  const showToast = (m)=>{ setToast(m); setTimeout(()=>setToast(null),3200); };
  useEffect(()=>{ try{ apiKey ? store.set(LS_KEY,apiKey) : store.del(LS_KEY); }catch{} },[apiKey]);

  useEffect(()=>{
    if(FB_ON && db){
      const unsub = db.collection("guides").orderBy("updated","desc").onSnapshot(
        snap=>{ setGuides(snap.docs.map(d=>({ id:d.id, ...d.data() }))); setLoadingLib(false); },
        ()=>{ setGuides(loadLocal()); setLoadingLib(false); }
      );
      return ()=>unsub();
    } else { setGuides(loadLocal()); setLoadingLib(false); }
  },[]);
  useEffect(()=>{ if(!FB_ON) saveLocal(guides); },[guides]);

  /* A shared link looks like ...?g=<guideId>. Once the library has loaded,
     open that guide. Runs once, and clears the parameter so a refresh does
     not reopen it unexpectedly. */
  const deepLinkDone = useRef(false);
  useEffect(()=>{
    if(deepLinkDone.current || loadingLib) return;
    let want = null;
    try{ want = new URLSearchParams(location.search).get("g"); }catch{}
    if(!want) { deepLinkDone.current = true; return; }
    deepLinkDone.current = true;
    const g = guides.find(x=>x.id===want);
    if(g){ setWatching(g); }
    else { showToast("That guide could not be found. It may have been removed."); }
    try{ history.replaceState({}, "", location.origin+location.pathname); }catch{}
  },[loadingLib, guides]);

  /* ---------- ENGINE (proxy-routed) ---------- */
  const testKey = async ()=>{
    setKeyState("testing"); setKeyMsg("");
    try{
      const r = await callClaude({ model:MODEL, max_tokens:8, messages:[{role:"user",content:"ping"}] });
      if(r.ok){ setKeyState("valid"); setKeyMsg("Connected and ready. Nothing to set up on your end."); return; }
      const e = await r.json().catch(()=>({}));
      setKeyState("invalid");
      setKeyMsg(r.status===401 ? "Connection was refused (an access setting needs a look)."
        : r.status===429 ? "Busy right now. Try again in a moment."
        : `Couldn't connect (${r.status}). ${e?.error?.message||""}`);
    }catch{
      setKeyState("invalid");
      setKeyMsg("Couldn't reach the service. Make sure you're online and try again."); /* dev note: check PROXY_URL + Worker deploy */
    }
  };

  const startRec = async ()=>{
    try{
      const stream = await navigator.mediaDevices.getDisplayMedia({ video:{ mediaSource:"screen" }, audio:false });
      streamRef.current = stream;
      chunksRef.current = []; setMarks([]);
      const mr = new MediaRecorder(stream); recRef.current = mr;
      mr.ondataavailable = (e)=>{ if(e.data && e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async ()=>{
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecBlob(blob); setRecUrl(url);
        setStage("analyzing");
        analyzeRecording(url);
      };
      stream.getVideoTracks()[0].addEventListener("ended", ()=>{ if(recRef.current?.state==="recording") stopRec(); });
      mr.start(); setStage("recording");
    }catch{ showToast("Screen sharing was blocked. Allow it and try again."); }
  };
  const stopRec = ()=>{
    if(recRef.current && recRef.current.state!=="inactive") recRef.current.stop();
    streamRef.current?.getTracks().forEach(t=>t.stop());
  };

  const loadVideo = (url)=> new Promise((res,rej)=>{
    const v=document.createElement("video"); v.muted=true; v.playsInline=true; v.preload="auto"; v.src=url;
    v.onerror=()=>rej(new Error("Couldn't load the recording."));
    v.onloadedmetadata=()=>{
      if(v.duration===Infinity || isNaN(v.duration)){
        v.currentTime=24*3600;
        v.ontimeupdate=()=>{ v.ontimeupdate=null; v.currentTime=0; res(v); };
      } else res(v);
    };
  });
  const captureAt = (v,t,w,q)=> new Promise((res)=>{
    const on=()=>{ v.removeEventListener("seeked",on);
      const scale=w/(v.videoWidth||w), h=Math.round((v.videoHeight||w)*scale);
      const c=document.createElement("canvas"); c.width=w; c.height=h||Math.round(w*0.56);
      try{ c.getContext("2d").drawImage(v,0,0,c.width,c.height); res(c.toDataURL("image/jpeg",q)); }
      catch{ res(""); }
    };
    v.addEventListener("seeked",on);
    v.currentTime=Math.max(0, Math.min(t, (v.duration||t)-0.05));
  });

  /* When the author marked steps with M, those marks ARE the steps. We only
     ask Claude to name each one. Nothing is merged, dropped, or re-cut. */
  const titleMarkedSteps = async (frames, times)=>{
    const content = frames.map(f=>({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:f.split(",")[1] } }));
    content.push({ type:"text", text:
`These ${frames.length} still frames are consecutive steps the author marked in a screen recording of a software workflow, in order.

Write a short imperative title for EACH frame (max 6 words each). Do not merge, skip, reorder, or combine frames. Return exactly ${frames.length} titles.

Return ONLY a JSON array of strings, one per frame, in the same order:
["Open the loan application","Enter borrower information"]` });
    const r = await callClaude({ model:MODEL, max_tokens:900, messages:[{ role:"user", content }] });
    if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message || `Titling failed (${r.status})`); }
    const data = await r.json();
    const txt = data.content?.[0]?.text || "";
    let arr; try{ arr=JSON.parse(txt); }catch{ const m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error("Model didn't return titles."); arr=JSON.parse(m[0]); }
    if(!Array.isArray(arr)) throw new Error("Titles came back in an unexpected shape.");
    // pad or trim so every marked step keeps its place no matter what
    return times.map((t,i)=> String(arr[i] || `Step ${i+1}`).slice(0,60));
  };

  const visionSteps = async (frames, times, D)=>{
    const content = frames.map(f=>({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:f.split(",")[1] } }));
    const markHint = marks.length ? `\n\nThe author marked likely step boundaries at these times (seconds): ${marks.map(m=>m.toFixed(1)).join(", ")}. Prefer these as boundaries.` : "";
    content.push({ type:"text", text:
`These ${frames.length} still frames are sampled from a ${Math.round(D)}-second screen recording of a software workflow. Frame times in seconds: ${times.map(t=>t.toFixed(1)).join(", ")}.${markHint}

Identify the MACRO steps, one per distinct screen or task, NOT one per click. For each step give a "start" time in seconds (use the frame times) and a short imperative "title" (max 6 words).

Return ONLY a JSON array, 3 to 14 items, sorted by start, like:
[{"start":0,"title":"Open the loan application"},{"start":12.5,"title":"Enter borrower information"}]` });
    const r = await callClaude({ model:MODEL, max_tokens:700, messages:[{ role:"user", content }] });
    if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message || `Vision request failed (${r.status})`); }
    const data = await r.json();
    const txt = data.content?.[0]?.text || "";
    let arr; try{ arr=JSON.parse(txt); }catch{ const m=txt.match(/\[[\s\S]*\]/); if(!m) throw new Error("Model didn't return step data."); arr=JSON.parse(m[0]); }
    arr = arr.filter(s=>typeof s.start==="number").map(s=>({ start:Math.max(0,Math.min(s.start,D)), title:(s.title||"Step").slice(0,60) })).sort((a,b)=>a.start-b.start);
    const gap = marks.length ? 0.2 : 1.2;
    const out=[]; for(const s of arr){ if(!out.length || s.start-out[out.length-1].start>gap) out.push(s); }
    if(!out.length) throw new Error("No steps detected.");
    return out;
  };

  const analyzeRecording = async (url)=>{
    setAnalyzeErr(""); setAnalyzePct(0);
    try{
      setAnalyzeMsg("Loading your recording…"); setAnalyzePct(10);
      const v = await loadVideo(url);
      const D = v.duration || 1; setDur(D);
      const N = Math.max(6, Math.min(12, Math.round(D/4)));
      const times = Array.from({length:N},(_,i)=> +(0.4 + i*(Math.max(D-0.8,0.4))/(N-1||1)).toFixed(2));
      /* If the author marked steps, use those exact boundaries. The first
         step starts at the beginning; each M press starts the next one. */
      const marked = Array.from(new Set(marks.map(m=>+Number(m).toFixed(2))))
        .filter(m=>m>0.3 && m<D-0.2).sort((a,b)=>a-b);
      let proposed;
      if(marked.length){
        const stepTimes = [0, ...marked];
        setAnalyzeMsg(`Using the ${stepTimes.length} steps you marked…`); setAnalyzePct(35);
        const shots=[]; for(const t of stepTimes){ shots.push(await captureAt(v, Math.min(t+0.15, D-0.1), 480, 0.5)); }
        setAnalyzeMsg("Naming each step…"); setAnalyzePct(60);
        let titles;
        try{ titles = await titleMarkedSteps(shots, stepTimes); }
        catch{ titles = stepTimes.map((_,i)=>`Step ${i+1}`); }
        proposed = stepTimes.map((t,i)=>({ start:t, title:titles[i] }));
      } else {
        setAnalyzeMsg("Sampling frames from the recording…"); setAnalyzePct(35);
        const small=[]; for(const t of times){ small.push(await captureAt(v,t,480,0.5)); }
        setAnalyzeMsg("Asking Claude to find the steps…"); setAnalyzePct(60);
        proposed = await visionSteps(small, times, D);
      }
      setAnalyzeMsg("Grabbing a screenshot for each step…"); setAnalyzePct(85);
      const withThumbs=[];
      for(let i=0;i<proposed.length;i++){
        const thumb = await captureAt(v, Math.min(proposed[i].start+0.25, D-0.1), 1100, 0.72);
        withThumbs.push({ id:i+1, title:proposed[i].title, t:proposed[i].start, thumb, conf:0.9 });
      }
      setAnalyzePct(100);
      setSteps(withThumbs); setStage("steps");
    }catch(err){
      setAnalyzeErr(err.message || "Auto-detection needed a hand. Here's an even split you can shape.");
      try{
        const v = await loadVideo(url); const D=v.duration||1; setDur(D);
        const k=4, out=[];
        for(let i=0;i<k;i++){ const t=+(i*D/k).toFixed(2); out.push({ id:i+1, title:`Step ${i+1}`, t, thumb:await captureAt(v,Math.min(t+0.2,D-0.1),1100,0.72), conf:1 }); }
        setSteps(out);
      }catch{ setSteps([]); }
      setStage("steps");
    }
  };

  const genScripts = async ()=>{
    setBusy(true); setGenErr("");
    const list = steps.map((s,i)=>`${i+1}. ${s.title}`).join("\n");
    const prompt = `You write training narration for Partners Mortgage, for an internal audience. Voice: active verbs, plain language (no jargon), direct "you" statements, short sentences. A little warmer and more human than the marketing site, but never jokey about compliance.

Write one line of narration (1-2 sentences) for each step below. Return ONLY raw JSON, no markdown fences, keyed by step number:
{"1":"...","2":"..."}

Steps:
${list}`;
    try{
      const r = await callClaude({ model:MODEL, max_tokens:1000, messages:[{role:"user",content:prompt}] });
      if(!r.ok){
        const e = await r.json().catch(()=>({}));
        throw new Error(r.status===401 ? "Proxy rejected the request (gate PIN or Worker key issue)."
          : r.status===429 ? "Rate limited (429). Wait a moment and retry."
          : `Request failed (${r.status}). ${e?.error?.message||""}`);
      }
      const data = await r.json();
      const txt = data.content?.[0]?.text || "";
      let parsed;
      try{ parsed = JSON.parse(txt); }
      catch{ const m = txt.match(/\{[\s\S]*\}/); if(!m) throw new Error("Response wasn't valid JSON."); parsed = JSON.parse(m[0]); }
      setScripts(parsed); setStage("editing");
    }catch(err){ setGenErr(err.message || "Something went wrong generating scripts."); }
    finally{ setBusy(false); }
  };

  /* An uploaded file takes the place of a screen recording. Everything
     downstream (frames, narration, render, PDF) works the same way. */
  const useUpload = async (file)=>{
    if(!file) return;
    const okType = /^video\//.test(file.type||"") || /\.(mp4|webm|mov|m4v)$/i.test(file.name||"");
    if(!okType){ showToast("That does not look like a video file."); return; }
    if(file.size > 500*1024*1024){ showToast("That file is very large. Try one under about 500 MB."); return; }
    const url = URL.createObjectURL(file);
    // make sure the browser can actually play it, since we read frames from it
    try{
      const v = await loadVideo(url);
      setDur(v.duration||0);
    }catch{
      showToast("The browser could not open that file. MP4 works best (Loom and Teams exports are fine).");
      return;
    }
    setSource("upload");
    setRecBlob(file);
    setRecUrl(url);
    setMarks([]);
    setStage("chapters");
  };

  /* Turn the chapter marks into steps: grab a frame for each and name them. */
  const chaptersToSteps = async (times)=>{
    setStage("analyzing"); setAnalyzeErr(""); setAnalyzePct(10);
    setAnalyzeMsg("Reading your chapters…");
    try{
      const v = await loadVideo(recUrl);
      const D = v.duration || 0; setDur(D);
      const pts = Array.from(new Set([0, ...times.map(t=>+Number(t).toFixed(2))]))
        .filter(t=>t>=0 && t<Math.max(D-0.2,0.3)).sort((a,b)=>a-b);
      setAnalyzePct(35); setAnalyzeMsg("Grabbing a frame for each chapter…");
      const thumbs=[];
      for(const t of pts){ thumbs.push(await captureAt(v, Math.min(t+0.15, D-0.1), 1100, 0.72)); }
      setAnalyzePct(65); setAnalyzeMsg("Naming your chapters…");
      let titles;
      try{
        const small=[];
        for(const t of pts){ small.push(await captureAt(v, Math.min(t+0.15, D-0.1), 480, 0.5)); }
        titles = await titleMarkedSteps(small, pts);
      }catch{ titles = pts.map((_,i)=>`Chapter ${i+1}`); }
      setAnalyzePct(100);
      setMarks(pts.slice(1));
      setSteps(pts.map((t,i)=>({ id:i+1, title:titles[i]||`Chapter ${i+1}`, t, thumb:thumbs[i], conf:1 })));
      setStage("steps");
    }catch(err){
      setAnalyzeErr("Could not read the chapters from that file.");
      setStage("chapters");
    }
  };

  const goGenerate = ()=>{ setStage("generating"); setTimeout(()=>setStage("preview"),2500); };
  const expandDetail = async (step)=>{
    const narration = scripts[step.id]??scripts[String(step.id)]??"";
    const content = [];
    if(step.thumb) content.push({ type:"image", source:{ type:"base64", media_type:"image/jpeg", data:step.thumb.split(",")[1] } });
    content.push({ type:"text", text:
`This is one step in a written training guide for Partners Mortgage (internal audience). Voice: plain, direct, warm, no jargon, no fluff.

Step title: "${step.title}"
Short narration (for the video): "${narration}"

Write a fuller written explanation for the PDF version of this step: 2 to 4 sentences that add the useful detail a spoken line skips (what to watch for, why it matters, a gotcha or tip). Do not repeat the title. Return ONLY the paragraph text, no preamble, no markdown.` });
    const r = await callClaude({ model:MODEL, max_tokens:400, messages:[{ role:"user", content }] });
    if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e?.error?.message || `Expand failed (${r.status})`); }
    const data = await r.json();
    return (data.content?.[0]?.text || "").trim();
  };
  const newGuide = ()=>{ if(!(me&&me.admin)){ showToast("Recording is limited to training admins."); return; } setProj({name:"",desc:"",cat:"Pricing"}); setSteps([]); setScripts({}); setDetails({}); setGenErr("");
    setRecUrl(null); setRecBlob(null); setDur(0); setMarks([]); setAnalyzeErr(""); setSource("record"); setGuideId(null); setStage("setup"); };

  const saveToLibrary = async ()=>{
    const cover = steps.find(s=>s.thumb)?.thumb || "";
    /* Store the written steps as text so a guide can be read and watched
       later. Thumbnails are deliberately left out: they are large and would
       risk the document size limit. */
    const guideSteps = steps.map((st,i)=>({
      n:i+1, title:st.title||"",
      narration:scripts[st.id]??scripts[String(st.id)]??"",
      detail:(details&&(details[st.id]??details[String(st.id)]))||""
    }));
    const entry = { name:proj.name||"Untitled guide", desc:proj.desc||"", cat:proj.cat||"Pricing",
      steps:steps.length, mins:Math.max(1,Math.round((dur||steps.length*40)/60)), status:"Published",
      updated:Date.now(), plays:0, pct:0, author:(me&&me.email)||"You", coverFrame:cover,
      videoUrl:"", guideSteps };
    if(FB_ON && db){
      try{
        const ref = await db.collection("guides").add(entry);
        setGuideId(ref.id);
        showToast(`"${entry.name}" published to the library.`);
      }
      catch{ showToast("Couldn't save to the library. Check your access."); }
    } else {
      const lid = "g-"+Date.now();
      setGuideId(lid);
      setGuides([{ id:lid, ...entry }, ...guides]);
      showToast(`"${entry.name}" published (local test mode).`);
    }
  };

  /* Once a video exists, attach it to the saved guide so the library can
     play it. Without this the library has nothing to open. */
  const attachVideo = async (url)=>{
    if(!url) return;
    if(FB_ON && db && guideId){
      try{ await db.collection("guides").doc(guideId).update({ videoUrl:url }); }
      catch{ showToast("Video is ready, but saving the link to the library failed."); }
    } else if(guideId){
      setGuides(gs=>gs.map(g=>g.id===guideId?{...g,videoUrl:url}:g));
    }
  };
  const deleteGuide = async (id)=>{
    if(FB_ON && db){ try{ await db.collection("guides").doc(id).delete(); }catch{ showToast("Delete failed. Check rules."); } }
    else setGuides(guides.filter(g=>g.id!==id));
  };

  const FLOW = ["Set up", source==="upload"?"Chapters":"Record", "Steps","Script","Publish"];
  const stageIndex = { setup:0, recording:1, chapters:1, analyzing:2, steps:2, editing:3, generating:4, preview:4 }[stage];
  const inFlow = ["setup","recording","chapters","analyzing","steps","editing","generating","preview"].includes(stage);

  return (
    <div style={{minHeight:"100%",display:"flex",flexDirection:"column"}}>
      <Header stage={stage} setStage={setStage} onRecord={newGuide} me={me}/>
      {inFlow && <FlowStrip steps={FLOW} active={stageIndex} onExit={()=>setStage("library")}/>}

      {stage==="library" && <Library {...{guides,loadingLib,onNew:newGuide,onDelete:deleteGuide,setStage,me,onWatch:setWatching,onShared:()=>showToast("Share link copied.")}}/>}
      {stage==="learn" && <Learn guides={guides} me={me} showToast={showToast}/>}
      {stage==="admin" && <AdminConsole me={me} guides={guides} showToast={showToast}/>}
      {stage==="settings" && <SettingsScreen {...{apiKey,setApiKey,keyState,setKeyState,keyMsg,testKey,me}}/>}

      {inFlow && (
        <main style={{flex:1,width:"100%",maxWidth:1120,margin:"0 auto",padding:"32px 28px 90px"}} key={stage}>
          {stage==="setup" && <Setup {...{proj,setProj,onNext:startRec,onUpload:useUpload}}/>}
          {stage==="chapters" && <Chapters {...{recUrl,dur,onDone:chaptersToSteps,onBack:()=>setStage("setup")}}/>}
          {stage==="recording" && <RecordStudio {...{onStop:stopRec,marks,setMarks}}/>}
          {stage==="analyzing" && <Analyzing msg={analyzeMsg} pct={analyzePct}/>}
          {stage==="steps" && <Steps {...{steps,setSteps,busy,recUrl,dur,analyzeErr,marked:marks.length,onGen:genScripts,onBack:()=>setStage("setup")}}/>}
          {stage==="editing" && <Editing {...{steps,setSteps,scripts,setScripts,details,setDetails,expandDetail,genErr,onNext:goGenerate,onBack:()=>setStage("steps")}}/>}
          {stage==="generating" && <Generating/>}
          {stage==="preview" && <Published {...{proj,steps,scripts,details,voice,setVoice,recUrl,recBlob,dur,guides,showToast,onSave:saveToLibrary,onVideoReady:attachVideo,guideId,onDone:()=>setStage("library")}}/>}
        </main>
      )}
      {watching && <Watch guide={watching} onClose={()=>setWatching(null)}/>}
      {toast && <Toast msg={toast}/>}
      <style>{`
        @media(max-width:860px){
          .hero-grid{grid-template-columns:1fr!important}
          .feature{grid-template-columns:1fr!important}
          .pub-grid{grid-template-columns:1fr!important}
          .flow-nodes{display:none!important}
          .flow-mini{display:flex!important}
          .nav-links{display:none!important}
        }
      `}</style>
    </div>
  );
}

/* ================= Header ================= */
function Header({ stage, setStage, onRecord, me }){
  const nav = [["Library","library"],["Learn","learn"]]
    .concat(me && me.admin ? [["Admin","admin"]] : [])
    .concat([["Settings","settings"]]);
  const active = ["library","learn","admin","settings"].includes(stage) ? stage : null;
  return (
    <header style={{height:64,background:"#fff",borderBottom:"1px solid var(--sand-200)",display:"flex",alignItems:"center",gap:20,padding:"0 24px",position:"sticky",top:0,zIndex:30}}>
      <button onClick={()=>setStage("library")} style={{display:"flex",alignItems:"center",gap:11,background:"none",border:"none",cursor:"pointer",padding:0}}>
        <Mark size={30}/>
        <span style={{textAlign:"left",lineHeight:1}}>
          <span className="u" style={{display:"block",fontWeight:900,fontSize:17,letterSpacing:".1em",color:"var(--sand-900)"}}>PARTNERS ACADEMY</span>
          <span className="u" style={{display:"block",fontSize:7.5,letterSpacing:".18em",color:"var(--sand-500)",marginTop:2}}>A PARTNERS MORTGAGE TOOL</span>
        </span>
      </button>
      <nav className="nav-links" style={{display:"flex",gap:4,marginLeft:14}}>
        {nav.map(([label,key])=>(
          <button key={key} onClick={()=>setStage(key)} className="u"
            style={{background:active===key?"var(--teal-wash)":"none",color:active===key?"var(--teal-600)":"var(--sand-600)",
              border:"none",borderRadius:9,padding:"8px 14px",fontSize:12,fontWeight:700,letterSpacing:".08em",cursor:"pointer"}}>{label}</button>
        ))}
      </nav>
      <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:16}}>
        <span style={{fontFamily:"var(--font-script)",fontStyle:"italic",fontSize:19,color:"var(--teal-500)"}}>You matter.</span>
        {me && me.admin && <button onClick={onRecord} className="u" style={{...btn.primary,padding:"10px 16px",fontSize:12}}><IcRecord size={14}/> Record a guide</button>}
        <span title={(me&&me.email)||""} style={{display:"flex",alignItems:"center",gap:8}}>
          {me && me.admin && <span className="u" style={{fontSize:9,fontWeight:700,letterSpacing:".08em",padding:"3px 7px",borderRadius:100,background:"var(--amber-wash)",color:"var(--amber-600)"}}>ADMIN</span>}
          <span style={{width:34,height:34,borderRadius:"50%",background:"var(--teal-900)",color:"#fff",display:"grid",placeItems:"center",fontFamily:"var(--font-display)",fontWeight:700,fontSize:12}}>
            {initials((me&&me.email)||"")}
          </span>
          <button onClick={()=>{ try{ auth.signOut(); }catch{} }} className="u" title="Sign out"
            style={{background:"none",border:"none",color:"var(--sand-500)",fontSize:10,fontWeight:700,letterSpacing:".06em",cursor:"pointer",padding:0}}>Sign out</button>
        </span>
      </div>
    </header>
  );
}

/* ================= Flow strip ================= */
function FlowStrip({ steps, active, onExit }){
  return (
    <div style={{height:62,background:"#fff",borderBottom:"1px solid var(--sand-200)",display:"flex",alignItems:"center",gap:18,padding:"0 24px",position:"sticky",top:64,zIndex:20}}>
      <button onClick={onExit} className="u" style={{display:"inline-flex",alignItems:"center",gap:6,background:"none",border:"none",color:"var(--sand-600)",fontSize:11,fontWeight:700,letterSpacing:".1em",cursor:"pointer"}}>
        <IcArrowL size={15}/> Exit
      </button>
      <div style={{width:1,height:26,background:"var(--sand-200)"}}/>
      <div className="flow-nodes" style={{display:"flex",alignItems:"center",gap:0,flex:1,maxWidth:640}}>
        {steps.map((s,i)=>{
          const done=i<active, now=i===active;
          return (
            <React.Fragment key={i}>
              <div style={{display:"flex",alignItems:"center",gap:9}}>
                <div style={{width:24,height:24,borderRadius:"50%",display:"grid",placeItems:"center",flexShrink:0,fontFamily:"var(--font-display)",fontWeight:700,fontSize:11,transition:"all .25s",
                  background:done?"var(--teal-500)":now?"#fff":"var(--sand-100)",color:done?"#fff":now?"var(--teal-600)":"var(--sand-500)",
                  border:now?"2px solid var(--teal-500)":"2px solid transparent",boxShadow:now?"0 0 0 4px var(--teal-wash)":"none"}}>
                  {done?<IcCheck size={13} stroke={3}/>:i+1}
                </div>
                <span className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".06em",color:now?"var(--sand-900)":done?"var(--sand-600)":"var(--sand-500)"}}>{s}</span>
              </div>
              {i<steps.length-1 && <div style={{flex:1,height:2,margin:"0 12px",background:done?"var(--teal-500)":"var(--sand-200)",minWidth:16}}/>}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flow-mini" style={{display:"none",alignItems:"center",gap:10,flex:1}}>
        <span className="u" style={{fontSize:12,fontWeight:700,letterSpacing:".06em",color:"var(--sand-900)"}}>Step {active+1} of {steps.length}</span>
        <div style={{flex:1,height:5,borderRadius:5,background:"var(--sand-200)",overflow:"hidden"}}><div style={{width:`${(active+1)/steps.length*100}%`,height:"100%",background:"var(--teal-500)"}}/></div>
      </div>
    </div>
  );
}
