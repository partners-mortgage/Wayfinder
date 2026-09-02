/* Partners Academy · admin.jsx
   Admin screens. Settings today, people and reporting later. */

/* ================= Settings ================= */
function SettingsScreen({ apiKey,setApiKey,keyState,setKeyState,keyMsg,testKey,me }){
  const dot=(on)=><span style={{width:8,height:8,borderRadius:"50%",background:on?"var(--pm-green)":"var(--sand-300)"}}/>;
  return (
    <div style={{maxWidth:720,margin:"0 auto",padding:"36px 28px 90px",animation:"fadeUp .4s ease"}}>
      <Eyebrow>SETTINGS</Eyebrow>
      <H2>SET IT ONCE</H2>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:20}}>
        <Card>
          <CardHead icon={<IcKey size={18}/>} title="AI CONNECTION"
            right={<Pill ok={keyState==="valid"} label={keyState==="valid"?"Connected":keyState==="testing"?"Checking":"Not checked"}/>}/>
          <p style={{fontSize:13.5,color:"var(--sand-600)",margin:"2px 0 14px"}}>Step detection and narration are handled securely behind the scenes. Creators never paste or hold a key. Use Test to confirm the app is connected.</p>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <button onClick={testKey} className="u" style={{...btn.primary,padding:"9px 18px",fontSize:11,flexShrink:0}}>{keyState==="testing"?<Spinner sm/>:"Test connection"}</button>
            <span className="num" style={{fontSize:12,color:"var(--sand-500)",wordBreak:"break-all"}}>{CFG.PROXY_URL?"Connected":"Not configured"}</span>
          </div>
          {keyMsg && <div style={{fontSize:13,marginTop:10,color:keyState==="valid"?"var(--pm-green)":keyState==="invalid"?"var(--pm-coral)":"var(--sand-600)"}}>{keyMsg}</div>}
        </Card>
        <Card>
          <CardHead icon={<IcLink size={18}/>} title="CONNECTIONS"/>
          {[["AI engine","step detection + narration",!!CFG.PROXY_URL],["Shared library","team guides",FB_ON],["Video builder","narrated video",!!CFG.PROXY_URL],["Media storage","video hosting",!!CFG.R2_UPLOAD_URL]].map(([a,b,on])=>(
            <div key={a} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 0",borderBottom:"1px solid var(--sand-100)"}}>
              <span style={{display:"flex",alignItems:"center",gap:9}}>{dot(on)}<span className="u" style={{fontSize:12,fontWeight:700,letterSpacing:".04em"}}>{a}</span></span>
              <span style={{fontSize:12.5,color:"var(--sand-500)"}}>{on?b:"not connected"}</span>
            </div>
          ))}
        </Card>
        <Card>
          <CardHead icon={<IcUsers size={18}/>} title="YOUR ACCOUNT"/>
          <p style={{fontSize:13.5,color:"var(--sand-600)",margin:"2px 0 6px"}}>Accounts are limited to verified @{DOMAIN} email addresses. Recording is limited to training admins.</p>
          <div style={{fontSize:13,color:"var(--sand-800)"}}>Signed in as <b>{(auth&&auth.currentUser&&auth.currentUser.email)||"unknown"}</b></div>
          <div style={{fontSize:13,color:"var(--sand-800)",marginTop:4}}>Role <b>{(me&&me.role)||"learner"}</b>{me&&isAdminEmail(me.email)?" (bootstrap allowlist)":""}</div>
        </Card>
        <Card>
          <CardHead icon={<IcFlag size={18}/>} title="THIS BUILD"/>
          <p style={{fontSize:13.5,color:"var(--sand-600)",margin:"2px 0 8px"}}>Read this before diagnosing anything. If it does not match the build you just deployed, the deploy did not land and the bug you are chasing is not real.</p>
          <div className="num" style={{fontSize:13,color:"var(--sand-800)"}}>Build <b>{window.ACADEMY_BUILD||"unknown"}</b></div>
          <div className="num" style={{fontSize:13,color:"var(--sand-500)",marginTop:3}}>
            React {(window.React&&React.version)||"?"} &middot; Babel {(window.Babel&&Babel.version)||"?"} &middot; Firebase {FB_ON?"connected":"off"}
          </div>
        </Card>
      </div>
    </div>
  );
}
