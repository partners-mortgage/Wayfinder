/* Partners Academy · auth.jsx
   Boot and identity. App decides which phase to show, and the sign in,
   sign up, and email verification screens live here. */

/* ================================================================ */
function App(){
  const [state,setState] = useState({ phase:"loading", user:null });

  useEffect(()=>{
    if(!FB_ON || !auth){ setState({ phase:"noauth", user:null }); return; }
    const unsub = auth.onAuthStateChanged(async (u)=>{
      if(!u){ setState({ phase:"signedout", user:null }); return; }
      // reload so a just-clicked verification link is reflected
      try{ await u.reload(); }catch{}
      const email = (u.email||"").toLowerCase();
      if(!isAllowedEmail(email)){
        try{ await auth.signOut(); }catch{}
        setState({ phase:"signedout", user:null, notice:"That address isn't a Partners Mortgage account." });
        return;
      }
      if(!u.emailVerified){ setState({ phase:"unverified", user:u }); return; }
      // Mint a FRESH token. A token minted before the verification link was
      // clicked still carries email_verified:false, which the proxy rejects.
      try{ await u.getIdToken(true); }catch{}
      /* Read or create users/{uid}, then take the role from it. The email
         allowlist still short-circuits to admin, so a bootstrap admin can
         always get in even if their document says learner. */
      const prof = await ensureUserDoc(u);
      setState({
        phase:"in", user:u, email,
        uid: u.uid,
        name: prof.name,
        role: prof.role,
        admin: prof.role === "admin",
        profile: prof
      });
    });
    return ()=>unsub();
  },[]);

  if(state.phase==="loading") return <Splash label="Loading…"/>;
  if(state.phase==="noauth") return <Splash label="Sign-in isn't configured yet." sub="Add your Firebase config to enable accounts."/>;
  if(state.phase==="signedout") return <AuthGate notice={state.notice}/>;
  if(state.phase==="unverified") return <VerifyNotice user={state.user}/>;
  return <Studio me={{ email:state.email, admin:state.admin, role:state.role,
                       uid:state.uid, name:state.name, profile:state.profile,
                       user:state.user }}/>;
}

function Shell({ children }){
  return (
    <div style={{minHeight:"100%",display:"grid",placeItems:"center",padding:24,background:"var(--teal-900)"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`url("data:image/svg+xml,${ROOF}")`,backgroundSize:"72px 72px",opacity:.6}}/>
      <div style={{position:"relative",width:"100%",maxWidth:400,textAlign:"center",animation:"fadeUp .4s ease"}}>
        <div style={{display:"inline-grid",placeItems:"center",width:66,height:66,borderRadius:18,background:"var(--teal-800)",marginBottom:20,boxShadow:"var(--shadow-dark)"}}>
          <Mark size={40} onDark/>
        </div>
        <div className="u" style={{fontWeight:900,fontSize:28,letterSpacing:".1em",color:"#fff"}}>PARTNERS ACADEMY</div>
        <div className="u" style={{fontSize:9,letterSpacing:".2em",color:"var(--sand-300)",marginTop:6,marginBottom:24}}>A PARTNERS MORTGAGE TOOL</div>
        {children}
      </div>
    </div>
  );
}
function Splash({ label, sub }){
  return <Shell><div style={{color:"#fff",fontSize:15}}>{label}</div>{sub && <div style={{color:"var(--sand-300)",fontSize:13,marginTop:8}}>{sub}</div>}</Shell>;
}

/* ================= Sign in / sign up ================= */
function AuthGate({ notice }){
  const [mode,setMode] = useState("in");      // "in" | "up" | "reset"
  const [email,setEmail] = useState("");
  const [pw,setPw] = useState("");
  const [busy,setBusy] = useState(false);
  const [msg,setMsg] = useState(notice||"");
  const [good,setGood] = useState("");

  const go = async ()=>{
    setMsg(""); setGood("");
    const e = email.trim().toLowerCase();
    if(!e || (mode!=="reset" && !pw)){ setMsg("Enter your email and password."); return; }
    if(!isAllowedEmail(e)){ setMsg(`Use your @${DOMAIN} email address, or an address that has been invited.`); return; }
    setBusy(true);
    try{
      if(mode==="up"){
        const cred = await auth.createUserWithEmailAndPassword(e, pw);
        try{ await cred.user.sendEmailVerification(); }catch{}
        setGood("Account created. Check your email for the verification link.");
      } else if(mode==="reset"){
        await auth.sendPasswordResetEmail(e);
        setGood("Password reset email sent.");
      } else {
        await auth.signInWithEmailAndPassword(e, pw);
      }
    }catch(err){
      const c = (err && err.code) || "";
      setMsg(
        c==="auth/invalid-credential" || c==="auth/wrong-password" || c==="auth/user-not-found" ? "That email and password didn't match."
        : c==="auth/email-already-in-use" ? "An account already exists for that email. Try signing in."
        : c==="auth/weak-password" ? "Use at least 6 characters for the password."
        : c==="auth/too-many-requests" ? "Too many attempts. Wait a moment and try again."
        : c==="auth/invalid-email" ? "That email address doesn't look right."
        : (err && err.message) || "Something went wrong."
      );
    }finally{ setBusy(false); }
  };

  return (
    <Shell>
      <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:16,padding:"20px 20px 22px",textAlign:"left"}}>
        <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",color:"var(--amber-500)",marginBottom:14,textAlign:"center"}}>
          {mode==="up"?"CREATE YOUR ACCOUNT":mode==="reset"?"RESET PASSWORD":"SIGN IN"}
        </div>
        <label className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:"var(--sand-300)",display:"block",marginBottom:6}}>Work email</label>
        <input value={email} autoFocus autoComplete="username" onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") go(); }} placeholder={`you@${DOMAIN}`} style={{...inpDark,marginBottom:12}}/>
        {mode!=="reset" && <>
          <label className="u" style={{fontSize:10,fontWeight:700,letterSpacing:".08em",color:"var(--sand-300)",display:"block",marginBottom:6}}>Password</label>
          <input type="password" value={pw} autoComplete={mode==="up"?"new-password":"current-password"}
            onChange={e=>setPw(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter") go(); }}
            placeholder={mode==="up"?"at least 6 characters":"••••••••"} style={{...inpDark,marginBottom:4}}/>
        </>}
        {msg && <div style={{color:"#ffb4b8",fontSize:12.5,marginTop:10}}>{msg}</div>}
        {good && <div style={{color:"#cfe89a",fontSize:12.5,marginTop:10}}>{good}</div>}
        <button onClick={go} disabled={busy} className="u" style={{...btn.amber,width:"100%",justifyContent:"center",marginTop:14,opacity:busy?.6:1}}>
          {busy?<Spinner sm/>:(mode==="up"?"Create account":mode==="reset"?"Send reset email":"Sign in")}
        </button>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:14,fontSize:12}}>
          {mode==="in" ? (
            <>
              <button onClick={()=>{setMode("up");setMsg("");setGood("");}} style={linkBtn}>Create an account</button>
              <button onClick={()=>{setMode("reset");setMsg("");setGood("");}} style={linkBtn}>Forgot password</button>
            </>
          ) : (
            <button onClick={()=>{setMode("in");setMsg("");setGood("");}} style={linkBtn}>Back to sign in</button>
          )}
        </div>
      </div>
      <p style={{fontSize:11.5,color:"var(--sand-500)",marginTop:18,lineHeight:1.5}}>
        Anyone with a Partners Mortgage email can create an account and watch guides. Invited guests can too. Recording is limited to training admins.
      </p>
    </Shell>
  );
}
const initials = (email)=>{ const n=(email||"").split("@")[0].replace(/[^a-z]/gi," ").trim().split(/\s+/); return ((n[0]||"?")[0]+((n[1]||"")[0]||"")).toUpperCase(); };
const linkBtn = { background:"none",border:"none",color:"var(--sand-300)",fontSize:12,cursor:"pointer",padding:0,textDecoration:"underline" };

/* ================= Verify email ================= */
function VerifyNotice({ user }){
  const [sent,setSent] = useState(false);
  const [busy,setBusy] = useState(false);
  const resend = async ()=>{ setBusy(true); try{ await user.sendEmailVerification(); setSent(true); }catch{} finally{ setBusy(false); } };
  return (
    <Shell>
      <div style={{background:"rgba(255,255,255,.06)",border:"1px solid rgba(255,255,255,.14)",borderRadius:16,padding:"22px 20px"}}>
        <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",color:"var(--amber-500)",marginBottom:12}}>ONE MORE STEP</div>
        <p style={{color:"#fff",fontSize:14.5,lineHeight:1.6,marginBottom:8}}>
          We sent a verification link to <b>{user.email}</b>. Click it, then come back and refresh this page.
        </p>
        <p style={{color:"var(--sand-300)",fontSize:12.5,marginBottom:16}}>Check spam if it hasn't arrived in a minute.</p>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>window.location.reload()} className="u" style={{...btn.amber,flex:1,justifyContent:"center"}}>I've verified</button>
          <button onClick={resend} disabled={busy||sent} className="u" style={{...btn.outlineDark,flex:1,justifyContent:"center",opacity:(busy||sent)?.6:1}}>
            {sent?"Sent":busy?<Spinner sm/>:"Resend"}
          </button>
        </div>
        <button onClick={()=>auth.signOut()} style={{...linkBtn,marginTop:14}}>Sign out</button>
      </div>
    </Shell>
  );
}
