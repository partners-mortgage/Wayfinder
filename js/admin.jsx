/* Partners Academy · admin.jsx
   Admin screens. Course builder, assignment, people, and settings.

   The course builder is where a Wayfinder guide becomes a lesson, which is
   the join between the two halves of the product. */

function AdminConsole({ me, guides, showToast }){
  const [tab,setTab]         = useState("courses");   // courses | people
  const [courses,setCourses] = useState([]);
  const [loading,setLoading] = useState(true);
  const [editing,setEditing] = useState(null);        // a course object, or null

  const reload = async ()=>{
    setLoading(true);
    try{ setCourses(await dataLoadCourses()); }
    catch(e){ showToast && showToast("Could not load courses. " + (e.message||"")); }
    setLoading(false);
  };
  useEffect(()=>{ reload(); },[]);

  if(!me || !me.admin){
    return (
      <div style={{maxWidth:640,margin:"0 auto",padding:"60px 28px"}}>
        <Card><p style={{fontSize:14.5,color:"var(--sand-600)"}}>
          The Admin area is limited to training admins. If you think you should have access, ask Leif.
        </p></Card>
      </div>
    );
  }

  if(editing){
    return <AdminBuilder course={editing} allCourses={courses} guides={guides} me={me}
      showToast={showToast}
      onClose={()=>{ setEditing(null); reload(); }}/>;
  }

  return (
    <div style={{maxWidth:1000,margin:"0 auto",padding:"36px 28px 90px",animation:"fadeUp .4s ease"}}>
      <Eyebrow>ADMIN</Eyebrow>
      <H2>THE CONSOLE</H2>

      <div style={{display:"flex",gap:5,margin:"20px 0 22px"}}>
        {[["courses","Courses"],["people","People"]].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} className="u"
            style={{background:tab===k?"var(--teal-wash)":"#fff",color:tab===k?"var(--teal-600)":"var(--sand-600)",
              border:"1px solid "+(tab===k?"transparent":"var(--sand-200)"),borderRadius:10,padding:"9px 16px",
              fontSize:11.5,fontWeight:700,letterSpacing:".08em",cursor:"pointer"}}>{l}</button>
        ))}
      </div>

      {tab === "courses" && (
        <AdminCourses courses={courses} loading={loading} guides={guides} me={me}
          showToast={showToast}
          onEdit={setEditing}
          onNew={()=>setEditing(dataBlankCourse(me))}
          onChanged={reload}/>
      )}

      {tab === "people" && <AdminPeople me={me} courses={courses} showToast={showToast}/>}
    </div>
  );
}

/* ================= Course list ================= */

function AdminCourses({ courses, loading, guides, me, showToast, onEdit, onNew, onChanged }){
  const [busy,setBusy] = useState("");

  const togglePublish = async (c)=>{
    setBusy(c.id);
    try{
      await dataSaveCourse({ ...c, status: (c.status==="published") ? "draft" : "published" });
      showToast && showToast(c.status==="published" ? "Moved back to draft." : "Published.");
      onChanged();
    }catch(e){ showToast && showToast("Could not save. " + (e.message||"")); }
    setBusy("");
  };

  const remove = async (c)=>{
    if(!confirm('Delete "' + (c.title||"this course") + '"? Learner progress records are left behind and become orphaned.')) return;
    setBusy(c.id);
    try{ await dataDeleteCourse(c.id); showToast && showToast("Course deleted."); onChanged(); }
    catch(e){ showToast && showToast("Could not delete. " + (e.message||"")); }
    setBusy("");
  };

  if(loading) return <LearnSplash label="Loading courses"/>;

  return (
    <>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <p style={{flex:1,fontSize:14.5,color:"var(--sand-600)"}}>
          {courses.length ? courses.length + " course" + (courses.length===1?"":"s") + " in the Academy."
                          : "No courses yet. Your " + (guides||[]).length + " Wayfinder guides are ready to drop in as lessons."}
        </p>
        <button onClick={onNew} className="u" style={{...btn.primary,padding:"10px 17px",fontSize:11.5}}>
          <IcPlus size={15}/> New course
        </button>
      </div>

      {!courses.length && (
        <Card>
          <div style={{textAlign:"center",padding:"30px 10px"}}>
            <div style={{color:"var(--sand-300)",marginBottom:12}}><IcDoc size={38}/></div>
            <div className="u" style={{fontWeight:800,fontSize:15,color:"var(--sand-800)",marginBottom:6}}>BUILD THE FIRST COURSE</div>
            <p style={{fontSize:14,color:"var(--sand-600)",maxWidth:440,margin:"0 auto 16px"}}>
              Give it a title, add your existing guides as lessons, assign it, and publish. A learner sees it the moment it is published.
            </p>
            <button onClick={onNew} className="u" style={{...btn.primary,padding:"10px 18px",fontSize:11.5}}>
              <IcPlus size={15}/> New course
            </button>
          </div>
        </Card>
      )}

      <div style={{display:"flex",flexDirection:"column",gap:11}}>
        {courses.map(c=>{
          const n = dataLessonsOf(c).length;
          const pub = (c.status||"draft") === "published";
          const aud = c.audience === "assigned" ? (c.assignedTo||[]).length + " assigned"
                    : c.audience === "roles"    ? "by role" : "everyone";
          return (
            <div key={c.id} style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:14,
              padding:"15px 18px",display:"flex",alignItems:"center",gap:14,boxShadow:"var(--shadow-card)"}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:3}}>
                  <span className="u" style={{fontWeight:800,fontSize:14.5,letterSpacing:".02em",color:"var(--sand-900)"}}>{c.title}</span>
                  <Pill ok={pub} label={pub?"PUBLISHED":"DRAFT"}/>
                </div>
                <div style={{fontSize:12.5,color:"var(--sand-500)"}}>
                  {n} lesson{n===1?"":"s"} &middot; {c.cat || "Uncategorised"} &middot; {aud}
                </div>
              </div>
              <button onClick={()=>togglePublish(c)} disabled={busy===c.id} className="u"
                style={{...btn.ghost,padding:"8px 14px",fontSize:11}}>
                {busy===c.id ? <Spinner sm/> : pub ? "Unpublish" : "Publish"}
              </button>
              <button onClick={()=>onEdit(c)} style={iconBtn()} title="Edit"><IcEdit size={15}/></button>
              <button onClick={()=>remove(c)} style={iconBtn(false,true)} title="Delete"><IcTrash size={15}/></button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ================= Course builder ================= */

function AdminBuilder({ course, allCourses, guides, me, showToast, onClose }){
  const [c,setC]         = useState(course);
  const [saving,setSaving] = useState(false);
  const [picker,setPicker] = useState(null);   // null | "new" | lesson object
  const [dragId,setDragId] = useState(null);

  const set = (patch)=> setC(prev=> ({ ...prev, ...patch }));
  const lessons = dataLessonsOf(c);

  const save = async (andClose)=>{
    if(!String(c.title||"").trim()){ showToast && showToast("Give the course a title first."); return; }
    setSaving(true);
    try{
      await dataSaveCourse(c);
      showToast && showToast("Saved.");
      if(andClose) onClose();
    }catch(e){ showToast && showToast("Could not save. " + (e.message||"")); }
    setSaving(false);
  };

  const upsertLesson = (lesson)=>{
    const list = lessons.slice();
    const i = list.findIndex(l=> l.id === lesson.id);
    if(i >= 0) list[i] = lesson; else list.push(lesson);
    set({ lessons: list });
    setPicker(null);
  };
  const removeLesson = (id)=> set({ lessons: lessons.filter(l=> l.id !== id) });
  const moveLesson = (id, dir)=>{
    const list = lessons.slice();
    const i = list.findIndex(l=> l.id === id);
    const j = i + dir;
    if(i < 0 || j < 0 || j >= list.length) return;
    const [x] = list.splice(i,1); list.splice(j,0,x);
    set({ lessons: list });
  };
  const dropOn = (targetId)=>{
    if(!dragId || dragId === targetId) return;
    const list = lessons.slice();
    const from = list.findIndex(l=> l.id === dragId);
    const to   = list.findIndex(l=> l.id === targetId);
    if(from < 0 || to < 0) return;
    const [x] = list.splice(from,1); list.splice(to,0,x);
    set({ lessons: list });
    setDragId(null);
  };

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 28px 90px",animation:"fadeUp .4s ease"}}>
      <button onClick={onClose} className="u" style={{background:"none",border:"none",color:"var(--sand-500)",
        fontSize:11,fontWeight:700,letterSpacing:".08em",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
        <IcArrowL size={14}/> ALL COURSES
      </button>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:22,flexWrap:"wrap"}}>
        <div style={{flex:1,minWidth:240}}>
          <Eyebrow>COURSE BUILDER</Eyebrow>
          <H2>{c.title || "Untitled course"}</H2>
        </div>
        <button onClick={()=>save(false)} disabled={saving} className="u" style={{...btn.ghost,padding:"10px 17px",fontSize:11.5}}>
          {saving ? <Spinner sm/> : "Save"}
        </button>
        <button onClick={()=>save(true)} disabled={saving} className="u" style={{...btn.primary,padding:"10px 17px",fontSize:11.5}}>
          <IcCheck size={15}/> Save and close
        </button>
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:16}}>

        <Card>
          <CardHead icon={<IcDoc size={18}/>} title="THE BASICS"/>
          <div style={{display:"flex",flexDirection:"column",gap:13,marginTop:4}}>
            <Field label="Title">
              <input value={c.title||""} onChange={e=>set({title:e.target.value})} style={inp} placeholder="New Loan Officer Onboarding"/>
            </Field>
            <Field label="Description" optional>
              <textarea value={c.desc||""} onChange={e=>set({desc:e.target.value})} rows={2}
                style={{...inp,lineHeight:1.6}} placeholder="Everything a new loan officer needs in week one."/>
            </Field>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:13}}>
              <Field label="Category">
                <select value={c.cat||"Onboarding"} onChange={e=>set({cat:e.target.value})} style={inp}>
                  {COURSE_CATS.map(x=> <option key={x} value={x}>{x}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select value={c.status||"draft"} onChange={e=>set({status:e.target.value})} style={inp}>
                  <option value="draft">Draft, only admins see it</option>
                  <option value="published">Published, learners see it</option>
                </select>
              </Field>
            </div>
          </div>
        </Card>

        <Card>
          <CardHead icon={<IcGrip size={18}/>} title="LESSONS"
            right={<button onClick={()=>setPicker("new")} className="u" style={{...btn.primary,padding:"7px 13px",fontSize:10.5}}>
              <IcPlus size={13}/> Add lesson</button>}/>

          {!lessons.length && (
            <p style={{fontSize:14,color:"var(--sand-600)",padding:"12px 0"}}>
              No lessons yet. Add one and pick from your {(guides||[]).length} Wayfinder guides, or write a lesson from scratch.
            </p>
          )}

          <div style={{display:"flex",flexDirection:"column",gap:7,marginTop:6}}>
            {lessons.map((l,i)=>{
              const g = l.type==="guide" ? (guides||[]).find(x=> x.id === l.guideId) : null;
              const missing = l.type==="guide" && !g;
              return (
                <div key={l.id} draggable
                  onDragStart={()=>setDragId(l.id)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={()=>dropOn(l.id)}
                  onDragEnd={()=>setDragId(null)}
                  style={{display:"flex",alignItems:"center",gap:11,background:dragId===l.id?"var(--teal-wash)":"var(--sand-50)",
                    border:"1px solid var(--sand-200)",borderRadius:11,padding:"10px 12px",cursor:"grab"}}>

                  <span style={{color:"var(--sand-300)"}}><IcGrip size={16}/></span>
                  <span className="num" style={{flex:"none",width:22,height:22,borderRadius:"50%",background:"var(--sand-100)",
                    color:"var(--sand-600)",display:"grid",placeItems:"center",fontSize:11,fontWeight:800}}>{i+1}</span>

                  <span style={{flex:1,minWidth:0}}>
                    <span className="u" style={{display:"block",fontWeight:700,fontSize:13,letterSpacing:".02em",
                      color:"var(--sand-900)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{l.title}</span>
                    <span style={{display:"block",fontSize:11.5,color:missing?"var(--pm-coral)":"var(--sand-500)"}}>
                      {({guide:"Guide",video:"Video",text:"Written",quiz:"Quiz"})[l.type] || l.type}
                      {l.required === false && " · optional"}
                      {missing && " · guide missing from the library"}
                    </span>
                  </span>

                  <button onClick={()=>moveLesson(l.id,-1)} disabled={i===0} style={iconBtn()} title="Move up">
                    <span style={{transform:"rotate(-90deg)",display:"grid"}}><IcArrow size={14}/></span>
                  </button>
                  <button onClick={()=>moveLesson(l.id,1)} disabled={i===lessons.length-1} style={iconBtn()} title="Move down">
                    <span style={{transform:"rotate(90deg)",display:"grid"}}><IcArrow size={14}/></span>
                  </button>
                  <button onClick={()=>setPicker(l)} style={iconBtn()} title="Edit"><IcEdit size={14}/></button>
                  <button onClick={()=>removeLesson(l.id)} style={iconBtn(false,true)} title="Remove"><IcTrash size={14}/></button>
                </div>
              );
            })}
          </div>

          {lessons.length > 1 && (
            <p style={{fontSize:12,color:"var(--sand-500)",marginTop:11}}>
              Drag to reorder, or use the arrows. Lesson order is the order learners see.
            </p>
          )}
        </Card>

        <Card>
          <CardHead icon={<IcUsers size={18}/>} title="WHO GETS IT"/>
          <div style={{display:"flex",flexDirection:"column",gap:11,marginTop:4}}>
            {[["all","Everyone with an account"],
              ["assigned","Only the people I list"],
              ["roles","Everyone with a given role"]].map(([k,label])=>(
              <label key={k} style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:"var(--sand-800)",cursor:"pointer"}}>
                <input type="radio" name="aud" checked={(c.audience||"all")===k} onChange={()=>set({audience:k})}
                  style={{width:16,height:16,accentColor:"var(--teal-500)",cursor:"pointer"}}/>
                {label}
              </label>
            ))}

            {(c.audience||"all") === "assigned" && (
              <Field label="Email addresses, one per line">
                <textarea rows={4} style={{...inp,lineHeight:1.6,fontFamily:"ui-monospace,Menlo,monospace",fontSize:13}}
                  value={(c.assignedTo||[]).join("\n")}
                  onChange={e=>set({ assignedTo: e.target.value.split("\n").map(s=>s.trim().toLowerCase()).filter(Boolean) })}
                  placeholder={"rgaines@partnersmortgage.com\nmmiles@partnersmortgage.com"}/>
                <p style={{fontSize:12,color:"var(--sand-500)",marginTop:6}}>
                  Assignment keys on email, so you can assign a course to someone who has not signed in yet.
                </p>
              </Field>
            )}

            {(c.audience||"all") === "roles" && (
              <Field label="Roles">
                <div style={{display:"flex",gap:9}}>
                  {ROLES.map(r=>(
                    <label key={r} style={{display:"flex",alignItems:"center",gap:7,fontSize:13.5,color:"var(--sand-800)",cursor:"pointer"}}>
                      <input type="checkbox" checked={(c.assignedRoles||[]).includes(r)}
                        onChange={e=>{
                          const cur = c.assignedRoles||[];
                          set({ assignedRoles: e.target.checked ? cur.concat(r) : cur.filter(x=>x!==r) });
                        }}
                        style={{width:15,height:15,accentColor:"var(--teal-500)",cursor:"pointer"}}/>
                      {r}
                    </label>
                  ))}
                </div>
              </Field>
            )}
          </div>
        </Card>

        <Card>
          <CardHead icon={<IcKey size={18}/>} title="GATING" right={<Pill label="OPTIONAL"/>}/>
          <p style={{fontSize:13.5,color:"var(--sand-600)",margin:"2px 0 13px"}}>
            Leave both alone unless this course genuinely depends on something else. A lock a learner does not
            understand is worse than no lock.
          </p>

          <Field label="Must finish first" optional>
            {allCourses.filter(x=> x.id !== c.id).length ? (
              <div style={{display:"flex",flexDirection:"column",gap:7}}>
                {allCourses.filter(x=> x.id !== c.id).map(x=>(
                  <label key={x.id} style={{display:"flex",alignItems:"center",gap:9,fontSize:13.5,color:"var(--sand-800)",cursor:"pointer"}}>
                    <input type="checkbox" checked={(c.prereqCourseIds||[]).includes(x.id)}
                      onChange={e=>{
                        const cur = c.prereqCourseIds||[];
                        set({ prereqCourseIds: e.target.checked ? cur.concat(x.id) : cur.filter(id=>id!==x.id) });
                      }}
                      style={{width:15,height:15,accentColor:"var(--teal-500)",cursor:"pointer"}}/>
                    {x.title}
                  </label>
                ))}
              </div>
            ) : <p style={{fontSize:13.5,color:"var(--sand-500)"}}>No other courses exist yet.</p>}
          </Field>

          <div style={{marginTop:13}}>
            <Field label="Completion">
              <select value={c.completionRule||"all-required"} onChange={e=>set({completionRule:e.target.value})} style={inp}>
                <option value="all-required">Every required lesson must be done</option>
                <option value="percent">A percentage of all lessons</option>
              </select>
            </Field>
            {c.completionRule === "percent" && (
              <div style={{marginTop:11}}>
                <Field label="Percent needed">
                  <input type="number" min="1" max="100" value={c.completionPct||100}
                    onChange={e=>set({completionPct: Math.max(1, Math.min(100, Number(e.target.value)||100))})} style={inp}/>
                </Field>
              </div>
            )}
          </div>
        </Card>
      </div>

      {picker && (
        <AdminLessonModal
          lesson={picker === "new" ? null : picker}
          guides={guides}
          onSave={upsertLesson}
          onClose={()=>setPicker(null)}/>
      )}
    </div>
  );
}

/* ================= Add or edit a lesson ================= */

function AdminLessonModal({ lesson, guides, onSave, onClose }){
  const [type,setType]   = useState((lesson && lesson.type) || "guide");
  const [title,setTitle] = useState((lesson && lesson.title) || "");
  const [guideId,setGuideId] = useState((lesson && lesson.guideId) || "");
  const [videoUrl,setVideoUrl] = useState((lesson && lesson.videoUrl) || "");
  const [body,setBody]   = useState((lesson && lesson.body) || "");
  const [required,setRequired] = useState(lesson ? lesson.required !== false : true);
  const [q,setQ]         = useState("");
  const [err,setErr]     = useState("");

  useEffect(()=>{
    const h=(e)=>{ if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    document.body.style.overflow="hidden";
    return ()=>{ window.removeEventListener("keydown",h); document.body.style.overflow=""; };
  },[onClose]);

  const pool = (guides||[]).filter(g=>{
    if(!q.trim()) return true;
    const s = (String(g.name||"") + " " + String(g.cat||"") + " " + String(g.desc||"")).toLowerCase();
    return s.includes(q.trim().toLowerCase());
  });

  const pickGuide = (g)=>{
    setGuideId(g.id);
    if(!title.trim()) setTitle(g.name || "");
  };

  const commit = ()=>{
    setErr("");
    if(type === "guide" && !guideId) return setErr("Pick a guide, or change the lesson type.");
    if(type === "video" && !videoUrl.trim()) return setErr("Paste a video link, or change the lesson type.");
    if(type === "text" && !body.trim()) return setErr("Write something, or change the lesson type.");

    const t = title.trim() || (type === "guide"
      ? ((guides||[]).find(g=>g.id===guideId)||{}).name || "Untitled lesson"
      : "Untitled lesson");

    const out = { id: (lesson && lesson.id) || dataNewId(), type, title: t, required };
    if(type === "guide") out.guideId = guideId;
    if(type === "video") out.videoUrl = videoUrl.trim();
    if(type === "text")  out.body = body;
    onSave(out);
  };

  return (
    <div onClick={e=>{ if(e.target === e.currentTarget) onClose(); }}
      style={{position:"fixed",inset:0,zIndex:80,background:"rgba(36,31,29,.5)",display:"grid",
        placeItems:"center",padding:20,overflow:"auto"}}>
      <div style={{background:"#fff",borderRadius:"var(--radius-card)",width:"100%",maxWidth:620,
        maxHeight:"88vh",overflow:"auto",boxShadow:"0 30px 80px rgba(0,0,0,.3)"}}>

        <div style={{display:"flex",alignItems:"center",gap:12,padding:"18px 22px",borderBottom:"1px solid var(--sand-200)",
          position:"sticky",top:0,background:"#fff",zIndex:2}}>
          <div className="u" style={{flex:1,fontWeight:800,fontSize:14,letterSpacing:".08em",color:"var(--sand-900)"}}>
            {lesson ? "EDIT LESSON" : "ADD A LESSON"}
          </div>
          <button onClick={onClose} style={iconBtn()}><IcX size={15}/></button>
        </div>

        <div style={{padding:"20px 22px",display:"flex",flexDirection:"column",gap:15}}>

          <Field label="Type">
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {LESSON_TYPES.map(t=>{
                const on = type === t.id;
                const soon = t.id === "quiz";
                return (
                  <button key={t.id} onClick={()=>{ if(!soon) setType(t.id); }} disabled={soon}
                    style={{textAlign:"left",background:on?"var(--teal-wash)":"#fff",
                      border:"1px solid "+(on?"var(--teal-500)":"var(--sand-200)"),borderRadius:11,padding:"10px 12px",
                      cursor:soon?"not-allowed":"pointer",opacity:soon?.45:1}}>
                    <span className="u" style={{display:"block",fontWeight:700,fontSize:12,letterSpacing:".04em",
                      color:on?"var(--teal-600)":"var(--sand-900)"}}>{t.label}</span>
                    <span style={{display:"block",fontSize:11.5,color:"var(--sand-500)",marginTop:2}}>{t.hint}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {type === "guide" && (
            <Field label="Pick a Wayfinder guide">
              <div style={{position:"relative",marginBottom:9}}>
                <span style={{position:"absolute",left:11,top:11,color:"var(--sand-300)"}}><IcSearch size={16}/></span>
                <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search guides"
                  autoComplete="off" autoCorrect="off" spellCheck="false"
                  style={{...inp,paddingLeft:34}}/>
              </div>
              <div style={{maxHeight:230,overflow:"auto",border:"1px solid var(--sand-200)",borderRadius:11}}>
                {!pool.length && (
                  <p style={{fontSize:13.5,color:"var(--sand-500)",padding:"14px 13px"}}>
                    {(guides||[]).length ? "No guides match that search." : "No guides in the library yet. Record one first."}
                  </p>
                )}
                {pool.map(g=>{
                  const on = guideId === g.id;
                  return (
                    <button key={g.id} onClick={()=>pickGuide(g)}
                      style={{display:"flex",alignItems:"center",gap:11,width:"100%",textAlign:"left",
                        background:on?"var(--teal-wash)":"#fff",border:"none",borderBottom:"1px solid var(--sand-100)",
                        padding:"11px 13px",cursor:"pointer"}}>
                      <span style={{flex:"none",width:18,height:18,borderRadius:"50%",display:"grid",placeItems:"center",
                        border:"1px solid "+(on?"var(--teal-500)":"var(--sand-300)"),
                        background:on?"var(--teal-500)":"#fff",color:"#fff"}}>
                        {on && <IcCheck size={11}/>}
                      </span>
                      <span style={{flex:1,minWidth:0}}>
                        <span className="u" style={{display:"block",fontWeight:700,fontSize:13,letterSpacing:".02em",
                          color:"var(--sand-900)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{g.name}</span>
                        <span style={{display:"block",fontSize:11.5,color:"var(--sand-500)"}}>
                          {g.cat || "Uncategorised"} &middot; {g.steps || 0} steps
                          {g.videoUrl ? " · video ready" : " · no video yet"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {type === "video" && (
            <Field label="Video link">
              <input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} style={inp}
                autoComplete="off" spellCheck="false"
                placeholder="https://pub-....r2.dev/videos/welcome.mp4"/>
              <p style={{fontSize:12,color:"var(--sand-500)",marginTop:6}}>
                A direct link to an MP4. It plays inline and marks itself complete at 90 percent watched.
              </p>
            </Field>
          )}

          {type === "text" && (
            <Field label="Lesson body">
              <textarea value={body} onChange={e=>setBody(e.target.value)} rows={9}
                style={{...inp,lineHeight:1.7,fontFamily:"ui-monospace,Menlo,monospace",fontSize:13}}
                placeholder={"## How pricing works\n\nStart with the **rate sheet**, then:\n\n- Check the lock period\n- Confirm the loan amount"}/>
              <p style={{fontSize:12,color:"var(--sand-500)",marginTop:6}}>
                Markdown works for headings, bold, italic, lists, links, and code.
              </p>
            </Field>
          )}

          <Field label="Title">
            <input value={title} onChange={e=>setTitle(e.target.value)} style={inp}
              placeholder={type==="guide" ? "Defaults to the guide name" : "Price a loan"}/>
          </Field>

          <label style={{display:"flex",alignItems:"center",gap:10,fontSize:14,color:"var(--sand-800)",cursor:"pointer"}}>
            <input type="checkbox" checked={required} onChange={e=>setRequired(e.target.checked)}
              style={{width:16,height:16,accentColor:"var(--teal-500)",cursor:"pointer"}}/>
            Required to complete the course
          </label>

          {err && (
            <div style={{background:"#ffe9ea",borderLeft:"3px solid var(--pm-coral)",borderRadius:"0 10px 10px 0",
              padding:"10px 13px",fontSize:13.5,color:"#8f2126"}}>{err}</div>
          )}
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"flex-end",padding:"15px 22px",
          borderTop:"1px solid var(--sand-200)",position:"sticky",bottom:0,background:"#fff"}}>
          <button onClick={onClose} className="u" style={{...btn.ghost,padding:"10px 17px",fontSize:11.5}}>Cancel</button>
          <button onClick={commit} className="u" style={{...btn.primary,padding:"10px 17px",fontSize:11.5}}>
            <IcCheck size={15}/> {lesson ? "Save lesson" : "Add lesson"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= People ================= */

function AdminPeople({ me, courses, showToast }){
  const [users,setUsers]   = useState([]);
  const [prog,setProg]     = useState([]);
  const [loading,setLoad]  = useState(true);
  const [busy,setBusy]     = useState("");

  const load = async ()=>{
    setLoad(true);
    try{
      const us = [];
      const snap = await db.collection("users").get();
      snap.forEach(d=>{ const u = d.data()||{}; u.uid = d.id; us.push(u); });
      us.sort((a,b)=> String(a.name||a.email||"").localeCompare(String(b.name||b.email||"")));
      setUsers(us);

      const ps = [];
      try{
        const psnap = await db.collection("progress").get();
        psnap.forEach(d=> ps.push(d.data()||{}));
      }catch(e){}
      setProg(ps);
    }catch(e){
      showToast && showToast("Could not load people. " + (e.message||""));
    }
    setLoad(false);
  };
  useEffect(()=>{ load(); },[]);

  const setRole = async (u, role)=>{
    setBusy(u.uid);
    try{
      await db.collection("users").doc(u.uid).update({ role });
      setUsers(list=> list.map(x=> x.uid===u.uid ? { ...x, role } : x));
      showToast && showToast((u.name || u.email) + " is now " + role + ".");
    }catch(e){ showToast && showToast("Could not change the role. " + (e.message||"")); }
    setBusy("");
  };

  if(loading) return <LearnSplash label="Loading people"/>;

  return (
    <>
      <p style={{fontSize:14.5,color:"var(--sand-600)",marginBottom:16}}>
        {users.length} {users.length===1?"person has":"people have"} signed in. A record is created the first time
        someone signs in, so this list fills up as the team arrives.
      </p>

      <Card>
        <div style={{overflow:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13.5}}>
            <thead>
              <tr>
                {["Person","Role","Courses done","Last seen"].map(h=>(
                  <th key={h} className="u" style={{textAlign:"left",fontSize:10,fontWeight:800,letterSpacing:".1em",
                    color:"var(--sand-500)",padding:"8px 9px",borderBottom:"1px solid var(--sand-200)"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u=>{
                const mine = prog.filter(p=> p.uid === u.uid);
                const doneN = mine.filter(p=>{
                  const c = courses.find(x=> x.id === p.courseId);
                  return c && dataIsComplete(c, p);
                }).length;
                const boot = isAdminEmail(u.email);
                return (
                  <tr key={u.uid}>
                    <td style={{padding:"11px 9px",borderBottom:"1px solid var(--sand-100)"}}>
                      <div className="u" style={{fontWeight:700,fontSize:13,color:"var(--sand-900)"}}>{u.name || "No name"}</div>
                      <div style={{fontSize:12,color:"var(--sand-500)"}}>{u.email}</div>
                    </td>
                    <td style={{padding:"11px 9px",borderBottom:"1px solid var(--sand-100)"}}>
                      {boot ? (
                        <span title="Set by the bootstrap allowlist in the app and the rules. Change it in both places."
                          style={{fontSize:12.5,color:"var(--sand-600)"}}>
                          admin <span style={{color:"var(--sand-400)"}}>(allowlist)</span>
                        </span>
                      ) : (
                        <select value={u.role || "learner"} disabled={busy===u.uid}
                          onChange={e=>setRole(u, e.target.value)}
                          style={{...inp,padding:"6px 9px",fontSize:12.5,width:"auto"}}>
                          {ROLES.map(r=> <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="num" style={{padding:"11px 9px",borderBottom:"1px solid var(--sand-100)",color:"var(--sand-800)"}}>
                      {doneN} of {mine.length || 0}
                    </td>
                    <td style={{padding:"11px 9px",borderBottom:"1px solid var(--sand-100)",color:"var(--sand-500)",fontSize:12.5}}>
                      {u.lastSeenAt ? new Date(u.lastSeenAt).toLocaleDateString("en-US",{month:"short",day:"numeric"}) : "never"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <p style={{fontSize:12.5,color:"var(--sand-500)",marginTop:12}}>
        Admins on the bootstrap allowlist cannot be demoted here. That is deliberate: the allowlist is the escape
        hatch that guarantees somebody can always get in. To change it, edit the ADMINS list in the app and the
        matching list in the Firestore rules.
      </p>
    </>
  );
}

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
