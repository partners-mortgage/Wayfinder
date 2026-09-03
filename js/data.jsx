/* Partners Academy · data.jsx
   Course and progress data layer. Everything that touches Firestore for the
   Learn half lives here, so the screens stay about screens.

   Names are prefixed to avoid collisions across the split files. Duplicate
   top-level names do not error, they silently overwrite. */

/* ---------- shapes ----------

   courses/{courseId}
     title, desc, cat, coverFrame, status: "draft" | "published",
     createdBy, createdAt, updatedAt, branchId,
     lessons: [{ id, type, title, required, guideId?, body?, videoUrl?, quizId? }],
     prereqCourseIds: [], levelRequired,
     audience: "all" | "assigned" | "roles",
     assignedTo: [lowercased emails], assignedRoles: [],
     completionRule, completionPct, certificateOn

   progress/{uid}__{courseId}
     uid, courseId, startedAt, updatedAt, completedAt,
     pct, lessonsDone: [lessonId], lessonState: { [lessonId]: {...} }
*/

const LESSON_TYPES = [
  { id:"guide", label:"Wayfinder guide", hint:"Video plus the written steps and the PDF" },
  { id:"video", label:"Video",           hint:"Any video link, played inline" },
  { id:"text",  label:"Written",         hint:"Markdown text, no video" },
  { id:"quiz",  label:"Quiz",            hint:"Coming in the next phase" }
];

const COURSE_CATS = ["Onboarding","Pricing","LOS","Documents","Compliance","Sales Tools","Web Tools"];

/* Composite key, double underscore, matching the Academy convention. Auth
   uids contain no underscores, so the rules can read ownership from the id. */
const dataProgressKey = (uid, courseId)=> String(uid) + "__" + String(courseId);

const dataNewId = ()=> Date.now().toString(36) + Math.random().toString(36).slice(2,7);

/* ---------- courses ---------- */

async function dataLoadCourses(){
  if(!FB_ON || !db) return [];
  const snap = await db.collection("courses").get();
  const out = [];
  snap.forEach(d=>{ const c = d.data() || {}; c.id = d.id; out.push(c); });
  out.sort((a,b)=> (a.order||0) - (b.order||0) || String(a.title||"").localeCompare(String(b.title||"")));
  return out;
}

function dataBlankCourse(me){
  return {
    id: dataNewId(),
    title: "Untitled course",
    desc: "",
    cat: "Onboarding",
    coverFrame: "",
    status: "draft",
    createdBy: (me && me.uid) || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    branchId: null,
    order: 0,
    lessons: [],
    prereqCourseIds: [],
    levelRequired: 1,
    audience: "all",
    assignedTo: [],
    assignedRoles: ["learner"],
    completionRule: "all-required",
    completionPct: 100,
    certificateOn: true
  };
}

async function dataSaveCourse(course){
  if(!FB_ON || !db) throw new Error("Not connected to the database.");
  const c = { ...course, updatedAt: Date.now() };
  /* Firestore rejects undefined. Strip it rather than letting a save fail
     with a message nobody can act on. */
  const clean = JSON.parse(JSON.stringify(c));
  const id = clean.id;
  delete clean.id;
  await db.collection("courses").doc(id).set(clean);
  return { ...clean, id };
}

async function dataDeleteCourse(courseId){
  if(!FB_ON || !db) throw new Error("Not connected to the database.");
  await db.collection("courses").doc(courseId).delete();
}

/* ---------- visibility ----------
   Assignment keys on lowercased email, not uid, so a course can be assigned
   to someone who has not signed in for the first time yet. */

function dataAssignedToMe(course, me){
  const aud = course.audience || "all";
  if(aud === "all") return false;
  const em = String((me && me.email) || "").toLowerCase();
  if(aud === "assigned") return (course.assignedTo || []).map(String).includes(em);
  if(aud === "roles") return (course.assignedRoles || []).includes((me && me.role) || "learner");
  return false;
}

function dataCanSeeCourse(course, me){
  if(me && me.admin) return true;
  if((course.status || "draft") !== "published") return false;
  if((course.audience || "all") === "all") return true;
  return dataAssignedToMe(course, me);
}

/* ---------- progress ---------- */

const dataLessonsOf = (course)=> Array.isArray(course.lessons) ? course.lessons : [];

function dataPct(course, prog){
  const lessons = dataLessonsOf(course);
  const rule = course.completionRule || "all-required";
  const pool = rule === "all-required" ? lessons.filter(l=> l.required !== false) : lessons;
  if(!pool.length) return 0;
  const done = (prog && prog.lessonsDone) || [];
  const n = pool.filter(l=> done.includes(l.id)).length;
  return Math.round(n / pool.length * 100);
}

/* The counter and the percentage must use the SAME pool, or a learner sees
   "1 of 3 done" next to "50%" and reasonably concludes one of them is lying. */
function dataCounts(course, prog){
  const lessons = dataLessonsOf(course);
  const pool = (course.completionRule || "all-required") === "all-required"
    ? lessons.filter(l=> l.required !== false) : lessons;
  const done = (prog && prog.lessonsDone) || [];
  return { done: pool.filter(l=> done.includes(l.id)).length, total: pool.length };
}

function dataIsComplete(course, prog){
  const target = course.completionRule === "percent" ? (course.completionPct || 100) : 100;
  return dataPct(course, prog) >= target;
}

async function dataLoadProgress(uid){
  if(!FB_ON || !db || !uid) return {};
  const out = {};
  try{
    const snap = await db.collection("progress").where("uid","==",uid).get();
    snap.forEach(d=>{ const p = d.data() || {}; if(p.courseId) out[p.courseId] = p; });
  }catch(e){ /* an empty or unindexed read is not worth failing the screen over */ }
  return out;
}

/* Marks one lesson done. Idempotent: repeating the same call does not
   double count, because lessonsDone is a set. Points are deliberately NOT
   awarded here. That moves to the proxy Worker in the gamification phase,
   because the rules do not let a person raise their own totals. */
async function dataMarkLesson(me, course, lessonId, extra){
  if(!FB_ON || !db || !me || !me.uid) return null;
  const key = dataProgressKey(me.uid, course.id);
  const ref = db.collection("progress").doc(key);
  const now = Date.now();

  const snap = await ref.get();
  const prev = snap.exists ? (snap.data() || {}) : {};
  const done = Array.isArray(prev.lessonsDone) ? prev.lessonsDone.slice() : [];
  if(lessonId && !done.includes(lessonId)) done.push(lessonId);

  const lessonState = Object.assign({}, prev.lessonState || {});
  if(lessonId){
    lessonState[lessonId] = Object.assign({}, lessonState[lessonId] || {}, extra || {}, { doneAt: now });
  }

  const next = {
    uid: me.uid,
    email: String(me.email || "").toLowerCase(),
    name: me.name || "",
    courseId: course.id,
    courseTitle: course.title || "",
    startedAt: prev.startedAt || now,
    updatedAt: now,
    lessonsDone: done,
    lessonState: lessonState,
    quizBest: prev.quizBest || {},
    total: dataLessonsOf(course).length
  };
  next.pct = dataPct(course, next);
  next.completedAt = dataIsComplete(course, next) ? (prev.completedAt || now) : null;

  await ref.set(next);
  return next;
}

/* Saves where someone got to in a video without marking it done, so the
   player can pick up where they left off. */
async function dataSavePosition(me, course, lessonId, seconds){
  if(!FB_ON || !db || !me || !me.uid) return;
  const key = dataProgressKey(me.uid, course.id);
  const patch = {};
  patch["lessonState." + lessonId + ".lastPos"] = Math.floor(seconds || 0);
  patch.updatedAt = Date.now();
  try{
    await db.collection("progress").doc(key).update(patch);
  }catch(e){
    /* No document yet. Create the shell so the next save has somewhere to go. */
    try{
      await db.collection("progress").doc(key).set({
        uid: me.uid, email: String(me.email||"").toLowerCase(), courseId: course.id,
        courseTitle: course.title || "", startedAt: Date.now(), updatedAt: Date.now(),
        pct: 0, lessonsDone: [], lessonState: { [lessonId]: { lastPos: Math.floor(seconds||0) } },
        quizBest: {}, completedAt: null
      });
    }catch(e2){}
  }
}

/* ---------- small formatters for the reporting views ---------- */

const dataWhen = (ms)=>{
  if(!ms) return "";
  return new Date(ms).toLocaleDateString("en-US",{ month:"short", day:"numeric" })
    + " at " + new Date(ms).toLocaleTimeString("en-US",{ hour:"numeric", minute:"2-digit" });
};

const dataDay = (ms)=> ms ? new Date(ms).toLocaleDateString("en-US",{ month:"short", day:"numeric" }) : "";

const dataClock = (secs)=>{
  const n = Math.max(0, Math.floor(secs || 0));
  const m = Math.floor(n / 60), s2 = n % 60;
  return m + "m " + (s2 < 10 ? "0" : "") + s2 + "s";
};

/* How far into a lesson somebody got without finishing it. Knowing a person
   stopped four minutes in is a different conversation from knowing they
   never opened it. */
function dataLessonDetail(lesson, prog){
  const st = (prog && prog.lessonState && prog.lessonState[lesson.id]) || null;
  const done = ((prog && prog.lessonsDone) || []).includes(lesson.id);
  if(done){
    return { state:"done", when: st && st.doneAt ? st.doneAt : null,
             note: st && st.adminOverride ? "marked by an admin" : "" };
  }
  if(st && st.lastPos) return { state:"partial", reached: st.lastPos };
  return { state:"none" };
}

/* ---------- can this lesson actually be finished? ----------
   Completion is earned, so every lesson needs a route to earning it. A
   guide with no video and no written steps has none, and a learner hitting
   that just sees a lesson that will not complete and assumes the tool is
   broken. This tells an admin before it ever reaches a learner. */

function dataLessonHealth(lesson, guides){
  const t = lesson.type;

  if(t === "quiz") return { ok:false, how:"Quizzes are not built yet", why:"Remove it or change the type until the next phase." };

  if(t === "video"){
    return lesson.videoUrl
      ? { ok:true, how:"Watch 90% of the video" }
      : { ok:false, how:"No video attached", why:"Paste a video link, or change the type to Written." };
  }

  if(t === "text"){
    return (lesson.body && String(lesson.body).trim())
      ? { ok:true, how:"Read to the end" }
      : { ok:false, how:"No content", why:"Write the lesson body." };
  }

  if(t === "guide"){
    const g = (guides || []).find(x=> x.id === lesson.guideId);
    if(!g) return { ok:false, how:"Guide missing from the library", why:"It was deleted in the authoring flow. Pick a different guide." };
    if(g.videoUrl) return { ok:true, how:"Watch 90% of the guide video" };
    const steps = Array.isArray(g.guideSteps) ? g.guideSteps : [];
    if(steps.length) return { ok:true, how:"Read to the end of the " + steps.length + " written steps" };
    return { ok:false, how:"This guide has no video and no written steps",
             why:"There is nothing for a learner to watch or read, so it can never complete. Finish the guide in the Library first." };
  }

  return { ok:false, how:"Unknown lesson type: " + t, why:"Change the type." };
}

/* ---------- gating ----------
   A course is locked when a prerequisite is unfinished or the learner has
   not reached the required level. Admins are never locked out, because
   they need to be able to look at what they built. */

function dataLockState(course, me, allCourses, progressByCourse){
  if(me && me.admin) return null;

  const need = (course.prereqCourseIds || []).filter(id=>{
    const p = progressByCourse[id];
    const c = (allCourses || []).find(x=> x.id === id);
    if(!c) return false;
    return !(p && dataIsComplete(c, p));
  });
  if(need.length){
    const names = need.map(id=>{
      const c = (allCourses || []).find(x=> x.id === id);
      return (c && c.title) || "another course";
    });
    return { reason:"prereq", label: "Finish " + names.join(" and ") + " first" };
  }

  const lvl = course.levelRequired || 1;
  const mine = (me && me.profile && me.profile.level) || 1;
  if(lvl > mine) return { reason:"level", label: "Unlocked at level " + lvl };

  return null;
}

/* ---------- a very small markdown renderer ----------
   Enough for written lessons: headings, bold, italic, code, links, lists,
   and paragraphs. Deliberately tiny, because pulling a markdown library in
   from a CDN would be another unpinned dependency to worry about.
   Everything is escaped first, so a lesson body cannot inject markup. */

function dataMarkdown(src){
  const esc = (s)=> String(s == null ? "" : s)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

  const inline = (s)=> esc(s)
    .replace(/`([^`]+)`/g, '<code style="background:var(--sand-100);padding:1px 5px;border-radius:4px;font-size:.9em">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:var(--teal-600)">$1</a>');

  const lines = String(src || "").replace(/\r\n/g,"\n").split("\n");
  const out = [];
  let list = null;

  const closeList = ()=>{ if(list){ out.push("</" + list + ">"); list = null; } };

  lines.forEach(raw=>{
    const line = raw.trimEnd();

    if(!line.trim()){ closeList(); return; }

    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if(h){
      closeList();
      const lvl = h[1].length;
      const size = [26,21,17,15][lvl-1];
      out.push('<h' + lvl + ' class="u" style="font-weight:800;font-size:' + size +
               'px;letter-spacing:.01em;color:var(--sand-900);margin:20px 0 8px">' + inline(h[2]) + '</h' + lvl + '>');
      return;
    }

    const ul = line.match(/^\s*[-*]\s+(.*)$/);
    if(ul){
      if(list !== "ul"){ closeList(); out.push('<ul style="margin:8px 0 8px 20px">'); list = "ul"; }
      out.push('<li style="margin:4px 0">' + inline(ul[1]) + "</li>");
      return;
    }

    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if(ol){
      if(list !== "ol"){ closeList(); out.push('<ol style="margin:8px 0 8px 20px">'); list = "ol"; }
      out.push('<li style="margin:4px 0">' + inline(ol[1]) + "</li>");
      return;
    }

    closeList();
    out.push('<p style="margin:10px 0">' + inline(line) + "</p>");
  });

  closeList();
  return out.join("");
}
