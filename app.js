(() => {
  const KEY = "year10-data-v1";
  const COLORS = { Academic:"#7c5cff", Sports:"#22d3ee", Arts:"#ff4fa3", Leadership:"#ffd24a", Community:"#4ade80" };
  const ICONS  = { Academic:"🎓", Sports:"🏆", Arts:"🎨", Leadership:"⭐", Community:"💚" };

  // Sample data: replace via Teacher login (bottom of page) or edit here.
  const DEFAULTS = {
    students: [
      { id:1, name:"Amira Hassan",  dream:"Heart Surgeon",     quote:"Small steps still move you forward.", emoji:"🩺" },
      { id:2, name:"Omar Khalid",   dream:"Game Developer",    quote:"Build the thing you wish existed.",   emoji:"🎮" },
      { id:3, name:"Layla Yusuf",   dream:"Astronaut",         quote:"The sky is just the beginning.",      emoji:"🚀" },
      { id:4, name:"Zayed Ahmed",   dream:"Footballer",        quote:"Train when no one is watching.",      emoji:"⚽" },
      { id:5, name:"Noor Ibrahim",  dream:"Fashion Designer",  quote:"Be your own brand.",                  emoji:"👗" },
      { id:6, name:"Yusuf Ali",     dream:"Entrepreneur",      quote:"Fail fast, learn faster.",            emoji:"💡" },
      { id:7, name:"Mariam Saleh",  dream:"Marine Biologist",  quote:"Protect what you love.",              emoji:"🐬" },
      { id:8, name:"Hamad Nasser",  dream:"Pilot",             quote:"Always aim higher.",                  emoji:"✈️" }
    ],
    achievements: [
      { id:1, studentId:1, title:"Top of the class in Science",     cat:"Academic",   date:"2026-10-12", desc:"Highest score in the term 1 Science assessment." },
      { id:2, studentId:2, title:"Built a working class quiz game", cat:"Academic",   date:"2026-10-28", desc:"Coded a quiz game the whole class played." },
      { id:3, studentId:4, title:"Inter-school football winners",   cat:"Sports",     date:"2026-11-03", desc:"Captained the team to a 3–1 final victory." },
      { id:4, studentId:5, title:"Art exhibition feature",          cat:"Arts",       date:"2026-09-20", desc:"Her design was displayed in the school gallery." },
      { id:5, studentId:3, title:"Student Council Representative",  cat:"Leadership", date:"2026-09-05", desc:"Elected by the year group to speak for Year 10." },
      { id:6, studentId:7, title:"Beach clean-up organiser",        cat:"Community",  date:"2026-11-08", desc:"Led 30 students to clear a local beach." },
      { id:7, studentId:6, title:"Sold out the bake sale",          cat:"Leadership", date:"2026-10-15", desc:"Raised funds for the class trip in one lunchtime." },
      { id:8, studentId:8, title:"100% attendance this term",       cat:"Academic",   date:"2026-11-12", desc:"Never missed a day." }
    ],
    spotlight: { studentId:3, why:"For leading with kindness, helping classmates with homework, and never giving up on a tough problem." },
    shoutouts: [
      { from:"Omar", to:"Layla",  msg:"Thanks for explaining the maths homework three times without getting annoyed!" },
      { from:"Noor", to:"Zayed",  msg:"That goal in the final was unreal. Proud of you." },
      { from:"Hamad", to:"Amira", msg:"Best study partner in the whole year." }
    ],
    goals: [
      { label:"Class average attendance 98%", pct:92 },
      { label:"Raise funds for the class trip", pct:68 },
      { label:"Everyone earns an achievement", pct:75 },
      { label:"Community service hours", pct:40 }
    ],
    timeline: [
      { date:"September", title:"Welcome to Year 10", text:"A new chapter begins. We choose our class goals together." },
      { date:"October",   title:"Term 1 assessments", text:"Our first big test of the year. We showed up and delivered." },
      { date:"November",  title:"Inter-school sports day", text:"Year 10 brought the energy and the trophies." },
      { date:"December",  title:"Class celebration", text:"We look back at everything we achieved so far." },
      { date:"Next",      title:"Who we could be", text:"Exams, careers, dreams. The best is still ahead." }
    ]
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || clone(DEFAULTS); } catch { data = clone(DEFAULTS); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  const nextId = arr => arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  const stu = id => data.students.find(s => s.id === id);
  const initials = n => n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const fmt = d => { try { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); } catch { return d; } };

  let filter = "All", query = "";

  /* ---------- Render ---------- */
  function renderAch() {
    const cats = ["All", ...Object.keys(COLORS)];
    $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
    const list = data.achievements.filter(a => filter === "All" || a.cat === filter)
      .sort((a, b) => b.date.localeCompare(a.date));
    $("#achGrid").innerHTML = list.length ? list.map(a => {
      const s = stu(a.studentId);
      return `<article class="card" style="--col:${COLORS[a.cat] || "#7c5cff"}">
        <div class="ico">${ICONS[a.cat] || "🏅"}<span class="tag">${esc(a.cat)}</span></div>
        <h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>
        <div class="meta">${esc(s ? s.name : "Class")} · ${fmt(a.date)}</div></article>`;
    }).join("") : `<p class="sub">No achievements here yet. Be the first!</p>`;
    reveal();
  }

  function renderPeople() {
    const q = query.toLowerCase();
    const list = data.students.filter(s => (s.name + " " + s.dream).toLowerCase().includes(q));
    $("#people").innerHTML = list.map((s, i) => {
      const n = data.achievements.filter(a => a.studentId === s.id).length;
      const col = Object.values(COLORS)[i % 5];
      return `<article class="card person" data-id="${s.id}" style="--col:${col}" tabindex="0">
        <div class="avatar">${esc(s.emoji || initials(s.name))}</div>
        <h3>${esc(s.name)}</h3><div class="dream">Could be: ${esc(s.dream)}</div>
        <div class="count">${n} achievement${n === 1 ? "" : "s"}</div></article>`;
    }).join("") || `<p class="sub">Nobody matches that search.</p>`;
    reveal();
  }

  function renderSpot() {
    const s = stu(data.spotlight?.studentId);
    $("#spot").innerHTML = s ? `
      <div class="avatar">${esc(s.emoji || initials(s.name))}</div>
      <div><div class="badge">★ Student of the Month</div><h2>${esc(s.name)}</h2>
      <p>${esc(data.spotlight.why)}</p></div>` : `<p class="sub">No spotlight set yet.</p>`;
  }

  function renderGoals() {
    $("#goals-list").innerHTML = data.goals.map(g =>
      `<div><div class="goal-top"><span>${esc(g.label)}</span><span>${g.pct}%</span></div><div class="bar"><i data-w="${g.pct}"></i></div></div>`).join("");
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { $$("i", e.target).forEach(i => i.style.width = i.dataset.w + "%"); io.unobserve(e.target); }
    }), { threshold: .3 });
    io.observe($("#goals-list"));
  }

  function renderTimeline() {
    $("#timeline").innerHTML = data.timeline.map(t =>
      `<li><em>${esc(t.date)}</em><b>${esc(t.title)}</b><p>${esc(t.text)}</p></li>`).join("");
  }

  function renderWall() {
    $("#wall-list").innerHTML = data.shoutouts.slice().reverse().map((n, i) =>
      `<div class="note" style="--rot:${((i * 37) % 5) - 2}deg"><div class="to">To ${esc(n.to)} 💬</div><p>${esc(n.msg)}</p><div class="from">from ${esc(n.from)}</div></div>`).join("");
  }

  function renderStats() {
    const vals = {
      students: data.students.length, achievements: data.achievements.length,
      shoutouts: data.shoutouts.length, dreams: new Set(data.students.map(s => s.dream.toLowerCase())).size
    };
    $$("[data-count]").forEach(el => {
      const target = vals[el.dataset.count]; let n = 0;
      const step = () => { n += Math.max(1, Math.ceil(target / 30)); if (n >= target) { el.textContent = target; return; } el.textContent = n; requestAnimationFrame(step); };
      step();
    });
  }

  function renderAll() { renderAch(); renderPeople(); renderSpot(); renderGoals(); renderTimeline(); renderWall(); renderStats(); }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }), { threshold: .1 });
    $$(".card:not(.in)").forEach((c, i) => { c.style.transitionDelay = (i % 6) * 60 + "ms"; io.observe(c); });
  }

  /* ---------- Events ---------- */
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.c; renderAch(); } });
  $("#search").addEventListener("input", e => { query = e.target.value; renderPeople(); });

  const modal = $("#modal");
  function openStudent(id) {
    const s = stu(id); if (!s) return;
    const mine = data.achievements.filter(a => a.studentId === id);
    $("#modalBody").innerHTML = `<div class="m-head"><div class="avatar">${esc(s.emoji || initials(s.name))}</div>
      <h3>${esc(s.name)}</h3><div class="dream muted">Could be: ${esc(s.dream)}</div>
      ${s.quote ? `<p class="m-quote">“${esc(s.quote)}”</p>` : ""}</div>
      <div class="m-list">${mine.length ? mine.map(a => `<div>${ICONS[a.cat] || "🏅"} <b>${esc(a.title)}</b><br><span class="muted">${fmt(a.date)}</span></div>`).join("") : `<div class="muted">No achievements yet. Their story is just starting.</div>`}</div>`;
    modal.showModal();
  }
  $("#people").addEventListener("click", e => { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); });
  $("#people").addEventListener("keydown", e => { if (e.key === "Enter") { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); } });
  $("#closeModal").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

  $("#shoutForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    data.shoutouts.push({ from: f.get("from").trim(), to: f.get("to").trim(), msg: f.get("msg").trim() });
    save(); renderWall(); renderStats(); e.target.reset();
  });

  /* ---------- Admin ---------- */
  const admin = $("#admin");
  const PASS = "year10teacher"; // change this to your own passcode
  function fillSelects() {
    const opts = data.students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    $("#achStudent").innerHTML = opts; $("#spotStudent").innerHTML = opts;
  }
  function renderManage() {
    $("#manage").innerHTML =
      data.students.map(s => `<div class="rm"><span>👤 ${esc(s.name)}</span><button data-del="s" data-id="${s.id}">remove</button></div>`).join("") +
      data.achievements.map(a => `<div class="rm"><span>🏅 ${esc(a.title)}</span><button data-del="a" data-id="${a.id}">remove</button></div>`).join("") +
      data.shoutouts.map((n, i) => `<div class="rm"><span>💬 ${esc(n.to)}: ${esc(n.msg.slice(0, 30))}…</span><button data-del="n" data-id="${i}">remove</button></div>`).join("");
  }
  $("#adminBtn").onclick = () => {
    const p = prompt("Teacher passcode:");
    if (p === null) return;
    if (p !== PASS) return alert("Wrong passcode.");
    fillSelects(); renderManage(); admin.showModal();
  };
  $("#closeAdmin").onclick = () => admin.close();
  $$(".tabs button").forEach(b => b.onclick = () => {
    $$(".tabs button, .tab").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); $("#" + b.dataset.tab).classList.add("on");
  });
  $("#a-student").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.students.push({ id: nextId(data.students), name: f.name.trim(), dream: f.dream.trim(), quote: f.quote.trim(), emoji: f.emoji.trim() });
    save(); e.target.reset(); fillSelects(); renderManage(); renderAll();
  });
  $("#a-ach").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.achievements.push({ id: nextId(data.achievements), studentId: +f.student, title: f.title.trim(), cat: f.cat, date: f.date, desc: f.desc.trim() });
    save(); e.target.reset(); renderManage(); renderAll();
  });
  $("#a-spot").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.spotlight = { studentId: +f.student, why: f.why.trim() };
    save(); e.target.reset(); renderSpot();
  });
  $("#manage").addEventListener("click", e => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const id = +b.dataset.id, t = b.dataset.del;
    if (t === "s") { data.students = data.students.filter(s => s.id !== id); data.achievements = data.achievements.filter(a => a.studentId !== id); }
    if (t === "a") data.achievements = data.achievements.filter(a => a.id !== id);
    if (t === "n") data.shoutouts.splice(id, 1);
    save(); fillSelects(); renderManage(); renderAll();
  });
  $("#exportBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "year10-data.json"; a.click();
  };
  $("#importBtn").onclick = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = "application/json";
    i.onchange = async () => { try { data = JSON.parse(await i.files[0].text()); save(); fillSelects(); renderManage(); renderAll(); } catch { alert("That file isn't valid."); } };
    i.click();
  };
  $("#resetBtn").onclick = () => { if (confirm("Reset everything to sample data?")) { data = clone(DEFAULTS); save(); fillSelects(); renderManage(); renderAll(); } };

  /* ---------- Hero flair ---------- */
  const words = ["leaders", "scientists", "artists", "founders", "champions", "doctors", "inventors", "legends"];
  let wi = 0, ci = 0, del = false;
  const rot = $("#rotator");
  (function type() {
    const w = words[wi];
    rot.textContent = w.slice(0, ci);
    if (!del && ci === w.length) { del = true; return setTimeout(type, 1400); }
    if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; }
    ci += del ? -1 : 1;
    setTimeout(type, del ? 40 : 90);
  })();

  addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 20), { passive: true });

  // Starfield
  const cv = $("#stars"), cx = cv.getContext("2d");
  let stars = [];
  function sizeStars() {
    cv.width = innerWidth; cv.height = innerHeight;
    stars = Array.from({ length: Math.min(120, innerWidth / 8) }, () => ({
      x: Math.random() * cv.width, y: Math.random() * cv.height, r: Math.random() * 1.6 + .3, v: Math.random() * .25 + .05,
      c: ["#7c5cff", "#ff4fa3", "#22d3ee", "#ffffff"][Math.floor(Math.random() * 4)]
    }));
  }
  sizeStars(); addEventListener("resize", sizeStars);
  (function draw() {
    cx.clearRect(0, 0, cv.width, cv.height);
    for (const s of stars) {
      s.y -= s.v; if (s.y < 0) { s.y = cv.height; s.x = Math.random() * cv.width; }
      cx.globalAlpha = .6; cx.fillStyle = s.c; cx.beginPath(); cx.arc(s.x, s.y, s.r, 0, 7); cx.fill();
    }
    requestAnimationFrame(draw);
  })();

  renderAll();
})();
