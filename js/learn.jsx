/* Partners Academy · learn.jsx
   The Learn half. Course delivery for learners.

   Learn owns its own sub-navigation (list, course, lesson) rather than
   pushing more stages into the shell, so the authoring flow is untouched.

   Watch is the guide player. It doubles as the guide lesson type, which is
   the whole bridge between the two halves of the product. */

function Learn({ guides, me, showToast }){
  const [view,setView]       = useState("list");     // list | course | lesson
  const [courses,setCourses] = useState([]);
  const [prog,setProg]       = useState({});         // courseId -> progress doc
  const [loading,setLoading] = useState(true);
  const [curId,setCurId]     = useState(null);
  const [lessonId,setLessonId] = useState(null);

  const reload = async ()=>{
    setLoading(true);
    try{
      const [cs, ps] = await Promise.all([ dataLoadCourses(), dataLoadProgress(me && me.uid) ]);
      setCourses(cs); setProg(ps);
    }catch(e){
      showToast && showToast("Could not load courses. " + (e.message || ""));
    }
    setLoading(false);
  };
  useEffect(()=>{ reload(); },[]);

  const course = courses.find(c=> c.id === curId) || null;
  const visible = courses.filter(c=> dataCanSeeCourse(c, me));

  const openCourse = (c)=>{ setCurId(c.id); setView("course"); window.scrollTo(0,0); };
  const openLesson = (id)=>{ setLessonId(id); setView("lesson"); window.scrollTo(0,0); };

  const onLessonDone = async (lesson, extra)=>{
    if(!course) return;
    const before = prog[course.id];
    const wasDone = before && (before.lessonsDone || []).includes(lesson.id);
    const next = await dataMarkLesson(me, course, lesson.id, extra);
    if(next){
      setProg(p=> ({ ...p, [course.id]: next }));
      if(!wasDone && showToast) showToast("Lesson complete.");
    }
  };

  if(loading) return <LearnSplash label="Loading your courses"/>;

  if(view === "lesson" && course){
    return <LearnLesson
      course={course} lessonId={lessonId} guides={guides} me={me}
      prog={prog[course.id]} onDone={onLessonDone} onGo={openLesson}
      onBack={()=>{ setView("course"); window.scrollTo(0,0); }}/>;
  }

  if(view === "course" && course){
    return <LearnCourse
      course={course} me={me} guides={guides}
      prog={prog[course.id]} allCourses={courses} allProg={prog}
      onOpen={openLesson} onBack={()=>{ setView("list"); window.scrollTo(0,0); }}/>;
  }

  return <LearnList courses={visible} allCourses={courses} prog={prog} me={me} onOpen={openCourse}/>;
}

function LearnSplash({ label }){
  return (
    <div style={{maxWidth:1120,margin:"0 auto",padding:"80px 28px",textAlign:"center",color:"var(--sand-500)"}}>
      <Spinner big/>
      <div className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",marginTop:14}}>{label}</div>
    </div>
  );
}

/* ================= My courses ================= */

function LearnList({ courses, allCourses, prog, me, onOpen }){
  const assigned = courses.filter(c=> dataAssignedToMe(c, me));
  const open     = courses.filter(c=> !dataAssignedToMe(c, me));

  const done = courses.filter(c=> dataIsComplete(c, prog[c.id])).length;
  const started = courses.filter(c=>{
    const p = prog[c.id];
    return p && (p.lessonsDone || []).length && !dataIsComplete(c, p);
  }).length;

  return (
    <div style={{maxWidth:1120,margin:"0 auto",padding:"36px 28px 90px",animation:"fadeUp .4s ease"}}>
      <Eyebrow>LEARN</Eyebrow>
      <H2>YOUR COURSES</H2>
      <p style={{fontSize:15,color:"var(--sand-600)",marginTop:8,marginBottom:24,maxWidth:600}}>
        Guides and written lessons grouped into courses. Pick up where you left off.
      </p>

      {!!courses.length && (
        <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:26}}>
          <Stat n={courses.length} label="available"/>
          <Stat n={started} label="in progress"/>
          <Stat n={done} label="completed"/>
        </div>
      )}

      {!courses.length && (
        <Card>
          <div style={{textAlign:"center",padding:"30px 10px"}}>
            <div style={{color:"var(--sand-300)",marginBottom:12}}><IcDoc size={38}/></div>
            <div className="u" style={{fontWeight:800,fontSize:15,color:"var(--sand-800)",marginBottom:6}}>NO COURSES YET</div>
            <p style={{fontSize:14,color:"var(--sand-600)",maxWidth:420,margin:"0 auto"}}>
              {me && me.admin
                ? "Head to the Admin tab to build the first one. Your Wayfinder guides can be dropped straight in as lessons."
                : "Nothing has been assigned to you yet. Training is on the way."}
            </p>
          </div>
        </Card>
      )}

      {!!assigned.length && (
        <>
          <LearnSectionHead label="ASSIGNED TO YOU" n={assigned.length}/>
          <LearnGrid list={assigned} prog={prog} me={me} allCourses={allCourses} onOpen={onOpen} flagAssigned/>
        </>
      )}

      {!!open.length && (
        <>
          {!!assigned.length && <div style={{height:30}}/>}
          <LearnSectionHead label={assigned.length ? "EVERYTHING ELSE" : "AVAILABLE"} n={open.length}/>
          <LearnGrid list={open} prog={prog} me={me} allCourses={allCourses} onOpen={onOpen}/>
        </>
      )}
    </div>
  );
}

function LearnSectionHead({ label, n }){
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <span className="u" style={{fontSize:11,fontWeight:700,letterSpacing:".12em",color:"var(--sand-500)"}}>{label}</span>
      <span className="num" style={{fontSize:11,color:"var(--sand-300)"}}>{n}</span>
      <span style={{flex:1,height:1,background:"var(--sand-200)"}}/>
    </div>
  );
}

function LearnGrid({ list, prog, me, allCourses, onOpen, flagAssigned }){
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:18}}>
      {list.map(c=> (
        <LearnCard key={c.id} course={c} prog={prog[c.id]} me={me}
          lock={dataLockState(c, me, allCourses, prog)}
          onOpen={onOpen} flagAssigned={flagAssigned}/>
      ))}
    </div>
  );
}

function LearnCard({ course, prog, me, lock, onOpen, flagAssigned }){
  const lessons = dataLessonsOf(course);
  const pct = dataPct(course, prog);
  const complete = dataIsComplete(course, prog);
  const cnt = dataCounts(course, prog);
  const cta = complete ? "Review" : pct > 0 ? "Continue" : "Start course";

  return (
    <div style={{background:"#fff",border:"1px solid var(--sand-200)",borderRadius:16,padding:"20px 22px",
      boxShadow:"var(--shadow-card)",opacity:lock?.72:1,display:"flex",flexDirection:"column"}}>

      <div style={{display:"flex",alignItems:"flex-start",gap:9,marginBottom:7}}>
        <div className="u" style={{flex:1,fontWeight:800,fontSize:16,letterSpacing:".02em",color:"var(--sand-900)",lineHeight:1.25}}>
          {course.title}
        </div>
        {complete && <Pill ok label="DONE"/>}
        {!complete && flagAssigned && <Pill label="ASSIGNED"/>}
        {(course.status||"draft") !== "published" && <Pill label="DRAFT"/>}
      </div>

      <p style={{fontSize:14,color:"var(--sand-600)",marginBottom:14,flex:1}}>{course.desc || "No description yet."}</p>

      <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11.5,color:"var(--sand-500)",marginBottom:12}}>
        <IcDoc size={13}/>
        <span className="u" style={{fontWeight:700,letterSpacing:".05em"}}>{lessons.length} lesson{lessons.length===1?"":"s"}</span>
        {course.cat && <><span>&middot;</span><span>{course.cat}</span></>}
      </div>

      {lock ? (
        <div style={{display:"flex",alignItems:"center",gap:8,background:"var(--sand-100)",borderRadius:10,
          padding:"10px 12px",fontSize:12.5,color:"var(--sand-600)"}}>
          <IcKey size={14}/><span>{lock.label}</span>
        </div>
      ) : (
        <>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--sand-500)",marginBottom:5}}>
            <span className="u" style={{fontWeight:700,letterSpacing:".06em"}}>{cnt.done} of {cnt.total}{cnt.total < lessons.length ? " required" : ""} done</span>
            <span className="num">{pct}%</span>
          </div>
          <div style={{height:6,borderRadius:6,background:"var(--sand-100)",overflow:"hidden",marginBottom:16}}>
            <div style={{width:pct+"%",height:"100%",background:complete?"var(--pm-green)":"var(--teal-500)",transition:"width .3s"}}/>
          </div>
          <button onClick={()=>onOpen(course)} className="u" style={{...btn.primary,padding:"9px 16px",fontSize:11}}>
            {cta} <IcArrow size={14}/>
          </button>
        </>
      )}
    </div>
  );
}

/* ================= One course ================= */

function LearnCourse({ course, me, guides, prog, allCourses, allProg, onOpen, onBack }){
  const lessons = dataLessonsOf(course);
  const done = (prog && prog.lessonsDone) || [];
  const pct = dataPct(course, prog);
  const complete = dataIsComplete(course, prog);
  const lock = dataLockState(course, me, allCourses, allProg);
  const cnt = dataCounts(course, prog);

  const nextLesson = lessons.find(l=> !done.includes(l.id)) || lessons[0];

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 28px 90px",animation:"fadeUp .4s ease"}}>
      <button onClick={onBack} className="u" style={{background:"none",border:"none",color:"var(--sand-500)",
        fontSize:11,fontWeight:700,letterSpacing:".08em",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6,marginBottom:18}}>
        <IcArrowL size={14}/> ALL COURSES
      </button>

      <div style={{background:"var(--teal-900)",borderRadius:"var(--radius-card)",padding:"28px 30px",color:"#fff",marginBottom:22}}>
        <div className="u" style={{fontSize:10.5,fontWeight:700,letterSpacing:".14em",color:"var(--amber-500)",marginBottom:9}}>
          {course.cat || "COURSE"}
        </div>
        <div className="u" style={{fontWeight:900,fontSize:"clamp(24px,3.2vw,31px)",lineHeight:1.1,marginBottom:9}}>
          {course.title}
        </div>
        {course.desc && <p style={{fontSize:14.5,color:"#cfe0e2",maxWidth:600,marginBottom:18}}>{course.desc}</p>}

        <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
          <div style={{flex:"1 1 220px",minWidth:200}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"#9fc0c4",marginBottom:5}}>
              <span className="u" style={{fontWeight:700,letterSpacing:".07em"}}>{cnt.done} of {cnt.total}{cnt.total < lessons.length ? " required" : ""} done</span>
              <span className="num">{pct}%</span>
            </div>
            <div style={{height:7,borderRadius:7,background:"rgba(255,255,255,.14)",overflow:"hidden"}}>
              <div style={{width:pct+"%",height:"100%",background:complete?"var(--pm-green)":"var(--amber-500)",transition:"width .3s"}}/>
            </div>
          </div>
          {!lock && !!lessons.length && (
            <button onClick={()=>onOpen(nextLesson.id)} className="u" style={{...btn.amber,padding:"11px 19px",fontSize:12}}>
              {complete ? "Review" : pct > 0 ? "Continue" : "Start"} <IcArrow size={15}/>
            </button>
          )}
        </div>
      </div>

      {lock && (
        <Card>
          <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{color:"var(--amber-600)",marginTop:2}}><IcKey size={20}/></span>
            <div>
              <div className="u" style={{fontWeight:800,fontSize:13,color:"var(--sand-900)",marginBottom:4}}>LOCKED</div>
              <p style={{fontSize:14,color:"var(--sand-600)"}}>{lock.label}</p>
            </div>
          </div>
        </Card>
      )}

      {!lock && (
        <Card>
          <CardHead icon={<IcDoc size={18}/>} title="LESSONS"
            right={<span className="num" style={{fontSize:12,color:"var(--sand-500)"}}>{lessons.length}</span>}/>
          {!lessons.length && (
            <p style={{fontSize:14,color:"var(--sand-600)",padding:"10px 0"}}>
              No lessons have been added to this course yet.
            </p>
          )}
          <div style={{display:"flex",flexDirection:"column",gap:2}}>
            {lessons.map((l,i)=> (
              <LearnLessonRow key={l.id} lesson={l} n={i+1} guides={guides}
                done={done.includes(l.id)} onOpen={()=>onOpen(l.id)}/>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function LearnLessonRow({ lesson, n, guides, done, onOpen }){
  const g = lesson.type === "guide" ? (guides || []).find(x=> x.id === lesson.guideId) : null;
  const missing = lesson.type === "guide" && !g;
  const isQuiz = lesson.type === "quiz";
  const kindLabel = { guide:"Guide", video:"Video", text:"Written", quiz:"Quiz" }[lesson.type] || "Lesson";
  const kindIcon  = lesson.type === "video" ? <IcVideo size={15}/>
                  : lesson.type === "guide" ? <IcPlay size={15}/>
                  : lesson.type === "quiz"  ? <IcCheck size={15}/> : <IcDoc size={15}/>;

  return (
    <button onClick={isQuiz || missing ? undefined : onOpen} disabled={isQuiz || missing}
      style={{display:"flex",alignItems:"center",gap:13,width:"100%",textAlign:"left",background:"none",
        border:"none",borderBottom:"1px solid var(--sand-100)",padding:"13px 4px",
        cursor:(isQuiz||missing)?"default":"pointer",opacity:(isQuiz||missing)?.55:1}}>

      <span style={{flex:"none",width:24,height:24,borderRadius:"50%",display:"grid",placeItems:"center",
        background:done?"var(--pm-green)":"var(--sand-100)",color:done?"#fff":"var(--sand-500)",
        fontFamily:"var(--font-display)",fontSize:11,fontWeight:800}}>
        {done ? <IcCheck size={13}/> : n}
      </span>

      <span style={{flex:"none",color:"var(--sand-500)"}}>{kindIcon}</span>

      <span style={{flex:1,minWidth:0}}>
        <span className="u" style={{display:"block",fontWeight:700,fontSize:13.5,letterSpacing:".02em",
          color:"var(--sand-900)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{lesson.title}</span>
        <span style={{display:"block",fontSize:12,color:"var(--sand-500)",marginTop:1}}>
          {kindLabel}
          {lesson.required === false && " · optional"}
          {missing && " · this guide is no longer in the library"}
          {isQuiz && " · coming in the next phase"}
        </span>
      </span>

      {!isQuiz && !missing && <span style={{flex:"none",color:"var(--sand-300)"}}><IcArrow size={16}/></span>}
    </button>
  );
}

/* ================= Lesson player ================= */

function LearnLesson({ course, lessonId, guides, me, prog, onDone, onGo, onBack }){
  const lessons = dataLessonsOf(course);
  const idx = Math.max(0, lessons.findIndex(l=> l.id === lessonId));
  const lesson = lessons[idx];
  const done = (prog && prog.lessonsDone) || [];
  const prev = lessons[idx-1], next = lessons[idx+1];

  if(!lesson) return <LearnSplash label="Lesson not found"/>;

  const isDone = done.includes(lesson.id);
  const guide = lesson.type === "guide" ? (guides || []).find(g=> g.id === lesson.guideId) : null;

  return (
    <div style={{maxWidth:900,margin:"0 auto",padding:"28px 28px 90px",animation:"fadeUp .4s ease"}}>
      <button onClick={onBack} className="u" style={{background:"none",border:"none",color:"var(--sand-500)",
        fontSize:11,fontWeight:700,letterSpacing:".08em",cursor:"pointer",padding:0,display:"flex",alignItems:"center",gap:6,marginBottom:16}}>
        <IcArrowL size={14}/> {course.title}
      </button>

      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
        <span className="u" style={{fontSize:10.5,fontWeight:700,letterSpacing:".13em",color:"var(--teal-500)"}}>
          LESSON {idx+1} OF {lessons.length}
        </span>
        {isDone && <Pill ok label="COMPLETE"/>}
      </div>
      <H2>{lesson.title}</H2>

      <div style={{marginTop:22}}>
        {lesson.type === "guide" && (
          guide
            ? <LearnGuideBody guide={guide} done={isDone} onWatched={(extra)=>onDone(lesson, extra)}/>
            : <LearnMissing text="This guide is no longer in the library. It may have been deleted in the authoring flow."/>
        )}

        {lesson.type === "video" && (
          lesson.videoUrl
            ? <LearnVideo url={lesson.videoUrl} me={me} course={course} lesson={lesson}
                lastPos={((prog && prog.lessonState && prog.lessonState[lesson.id]) || {}).lastPos}
                onWatched={(extra)=>onDone(lesson, extra)}/>
            : <LearnMissing text="No video has been attached to this lesson yet."/>
        )}

        {lesson.type === "text" && (
          <LearnText body={lesson.body} done={isDone} onRead={()=>onDone(lesson,{ readOnly:true })}/>
        )}

        {lesson.type === "quiz" && <LearnMissing text="Quizzes arrive in the next phase. This lesson cannot be taken yet."/>}
      </div>

      <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginTop:26,paddingTop:20,borderTop:"1px solid var(--sand-200)"}}>
        {prev && (
          <button onClick={()=>onGo(prev.id)} className="u" style={{...btn.ghost,padding:"10px 16px",fontSize:11.5}}>
            <IcArrowL size={14}/> Previous
          </button>
        )}

{/* There is deliberately no "mark complete" button for learners.
            Completion has to be earned by watching or reading to the end,
            or the progress numbers mean nothing. Admins keep an override
            so they can check a course without sitting through every video. */}
        {!isDone && lesson.type !== "quiz" && me && me.admin && (
          <button onClick={()=>onDone(lesson,{ adminOverride:true })} className="u"
            title="Admin only. Learners cannot do this."
            style={{...btn.ghost,padding:"10px 16px",fontSize:11.5,color:"var(--sand-600)"}}>
            <IcCheck size={14}/> Override as admin
          </button>
        )}

        {next
          ? <button onClick={()=>onGo(next.id)} className="u" style={{...btn.amber,padding:"10px 18px",fontSize:11.5,marginLeft:"auto"}}>
              Next lesson <IcArrow size={14}/>
            </button>
          : <button onClick={onBack} className="u" style={{...btn.amber,padding:"10px 18px",fontSize:11.5,marginLeft:"auto"}}>
              Back to course <IcArrow size={14}/>
            </button>}
      </div>
    </div>
  );
}

/* Completion is earned, never declared.
   Video and guide-with-video complete at 90 percent watched. Written
   lessons and guides with no video complete when this marker scrolls into
   view, which means the learner actually reached the end of the content
   rather than clicking a button at the top. */
function LearnReadMarker({ done, onReach }){
  const ref = useRef(null);
  const fired = useRef(false);

  useEffect(()=>{
    if(done || !ref.current) return;
    /* No IntersectionObserver means an old browser. Fall back to marking it
       read rather than trapping someone in a lesson they cannot finish. */
    if(typeof IntersectionObserver === "undefined"){
      if(!fired.current){ fired.current = true; onReach(); }
      return;
    }
    const io = new IntersectionObserver(entries=>{
      entries.forEach(e=>{
        if(e.isIntersecting && !fired.current){
          fired.current = true;
          onReach();
          io.disconnect();
        }
      });
    },{ threshold: 1 });
    io.observe(ref.current);
    return ()=> io.disconnect();
  },[done]);

  return (
    <div ref={ref} style={{display:"flex",alignItems:"center",gap:9,marginTop:18,padding:"12px 14px",
      background:done?"var(--pm-green-wash)":"var(--sand-100)",borderRadius:11,fontSize:13,
      color:done?"#5a7d0f":"var(--sand-600)"}}>
      {done ? <IcCheck size={15}/> : <IcDoc size={15}/>}
      <span>{done ? "You have read this lesson." : "Read to the end of this lesson to complete it."}</span>
    </div>
  );
}

function LearnMissing({ text }){
  return (
    <div style={{display:"flex",gap:11,alignItems:"flex-start",background:"var(--amber-wash)",
      borderLeft:"3px solid var(--amber-500)",borderRadius:"0 12px 12px 0",padding:"14px 16px"}}>
      <span style={{color:"var(--amber-600)",marginTop:1}}><IcFlag size={17}/></span>
      <p style={{fontSize:14,color:"#6b4a08"}}>{text}</p>
    </div>
  );
}

function LearnText({ body, done, onRead }){
  if(!body || !String(body).trim()) return <LearnMissing text="This lesson has no content yet."/>;
  return (
    <Card>
      <div style={{fontSize:15.5,lineHeight:1.75,color:"var(--sand-800)"}}
        dangerouslySetInnerHTML={{ __html: dataMarkdown(body) }}/>
      <LearnReadMarker done={done} onReach={onRead}/>
    </Card>
  );
}

/* A video counts complete at 90% watched, the threshold already agreed for
   the Learn stub. Position is saved as they go so they can pick up where
   they left off, and it is throttled so a long video is not writing to
   Firestore on every timeupdate. */
function LearnVideo({ url, me, course, lesson, lastPos, onWatched }){
  const ref = useRef(null);
  const fired = useRef(false);
  const lastSave = useRef(0);
  const restored = useRef(false);
  const [failed,setFailed] = useState(false);

  const onTime = ()=>{
    const v = ref.current;
    if(!v || !v.duration) return;

    if(!fired.current && v.currentTime / v.duration >= 0.9){
      fired.current = true;
      onWatched({ secondsWatched: Math.floor(v.currentTime), lastPos: Math.floor(v.currentTime) });
    }
    const now = Date.now();
    if(now - lastSave.current > 8000){
      lastSave.current = now;
      dataSavePosition(me, course, lesson.id, v.currentTime);
    }
  };

  const onMeta = ()=>{
    const v = ref.current;
    if(!v || restored.current) return;
    restored.current = true;
    /* Do not restore right at the end, or the video opens already finished. */
    if(lastPos && v.duration && lastPos < v.duration - 5) v.currentTime = lastPos;
  };

  return (
    <div>
      <div style={{borderRadius:14,overflow:"hidden",background:"#000",border:"1px solid var(--sand-200)"}}>
        <video ref={ref} src={url} controls playsInline preload="metadata"
          onLoadedMetadata={onMeta} onTimeUpdate={onTime} onError={()=>setFailed(true)}
          onEnded={()=>{ if(!fired.current){ fired.current = true; onWatched({}); } }}
          style={{width:"100%",display:"block",maxHeight:520}}/>
      </div>
      {failed
        ? <div style={{marginTop:11}}><LearnMissing text="This video would not load, so the lesson cannot be completed. That is a problem with the file, not with you. Tell a training admin and move on to the next lesson."/></div>
        : <p style={{fontSize:12.5,color:"var(--sand-500)",marginTop:9}}>
            {lastPos ? "Picking up where you left off. " : ""}This lesson marks itself complete once you have watched 90 percent. There is no way to skip it.
          </p>}
    </div>
  );
}

/* A guide lesson is a Wayfinder guide: the video, the written steps, and
   the PDF. This reuses the shape the Watch view already established rather
   than inventing a second way to show the same thing. */
function LearnGuideBody({ guide, onWatched, done }){
  const steps = Array.isArray(guide.guideSteps) ? guide.guideSteps : [];
  const fired = useRef(false);
  const ref = useRef(null);

  const onTime = ()=>{
    const v = ref.current;
    if(!v || !v.duration || fired.current) return;
    if(v.currentTime / v.duration >= 0.9){
      fired.current = true;
      onWatched({ secondsWatched: Math.floor(v.currentTime) });
    }
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:18}}>
      {guide.videoUrl && (
        <div style={{borderRadius:14,overflow:"hidden",background:"#000",border:"1px solid var(--sand-200)"}}>
          <video ref={ref} src={guide.videoUrl} controls playsInline preload="metadata"
            onTimeUpdate={onTime}
            onEnded={()=>{ if(!fired.current){ fired.current = true; onWatched({}); } }}
            style={{width:"100%",display:"block",maxHeight:520}}/>
        </div>
      )}

      {!!steps.length && (
        <Card>
          <CardHead icon={<IcDoc size={18}/>} title="THE WRITTEN GUIDE"
            right={<span className="num" style={{fontSize:12,color:"var(--sand-500)"}}>{steps.length} steps</span>}/>
          <div style={{display:"flex",flexDirection:"column",gap:16,marginTop:4}}>
            {steps.map((s,i)=> (
              <div key={i} style={{display:"flex",gap:13}}>
                <span className="num" style={{flex:"none",width:25,height:25,borderRadius:"50%",background:"var(--teal-wash)",
                  color:"var(--teal-600)",display:"grid",placeItems:"center",fontSize:12,fontWeight:800}}>{s.n || i+1}</span>
                <div style={{flex:1}}>
                  <div className="u" style={{fontWeight:700,fontSize:13.5,letterSpacing:".02em",color:"var(--sand-900)",marginBottom:3}}>
                    {s.title}
                  </div>
                  {s.detail
                    ? <p style={{fontSize:14.5,color:"var(--sand-600)",lineHeight:1.7}}>{s.detail}</p>
                    : s.narration && <p style={{fontSize:14.5,color:"var(--sand-600)",lineHeight:1.7}}>{s.narration}</p>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* No video means the written steps are the lesson, so reaching the end
          of them is what completes it. */}
      {!guide.videoUrl && !!steps.length && <LearnReadMarker done={done} onReach={()=>onWatched({ readOnly:true })}/>}

      {!guide.videoUrl && !steps.length && <LearnMissing text="This guide has no video or written steps yet."/>}
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
