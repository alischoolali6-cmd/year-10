(() => {
  const KEY = "year10-data-v3"; // bumped to clear any old sample data
  const TONES = [["#f1dfd5","#b5573a"],["#e3e9e0","#5d7560"],["#ece3d6","#7a6246"],["#e8e1ee","#6b5a82"]];
  const CATS = { Academic:1, Sports:1, Arts:1, Leadership:1, Community:1 };
  const NAMES = ["Abr","Danny","Adam","Ali Y","Ali G","Yusuf","Vish","Issy","Zahra","Fatima L","Fatima H","Talia","Shaikha","Ava","Mashal","Dana"];

  const DEFAULTS = {
    students: NAMES.map((name, i) => ({ id: i + 1, name, dream: "", quote: "", emoji: "" })),
    achievements: [],
    spotlight: null,
    shoutouts: [],
    messages: [],
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || clone(DEFAULTS); } catch { data = clone(DEFAULTS); }
  data.messages = data.messages || [];
  // Views on THIS device only (no backend): count once per browser session.
  let views = 0;
  try {
    views = +localStorage.getItem("year10-views") || 0;
    if (!sessionStorage.getItem("year10-counted")) { views++; localStorage.setItem("year10-views", views); sessionStorage.setItem("year10-counted", "1"); }
  } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  const nextId = arr => arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  const stu = id => data.students.find(s => s.id === id);
  const initials = n => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const toneOf = id => TONES[(id - 1) % TONES.length];
  const avStyle = id => `--bg-a:${toneOf(id)[0]};--fg-a:${toneOf(id)[1]}`;
  const fmt = d => { try { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); } catch { return d; } };

  let order = shuffle(data.students.map(s => s.id));   // shuffled on every visit
  let filter = "All", query = "";

  /* ---------- Render ---------- */
  function renderMarquee() {
    const items = order.map(id => `<span>${esc(stu(id).name)}</span><span>·</span>`).join("");
    $("#marquee").innerHTML = items + items;
  }

  function renderPeople() {
    const q = query.toLowerCase();
    const list = order.map(stu).filter(s => s && s.name.toLowerCase().includes(q));
    $("#people").innerHTML = list.map(s => {
      const n = data.achievements.filter(a => a.studentId === s.id).length;
      return `<article class="card person" data-id="${s.id}" tabindex="0" style="${avStyle(s.id)}">
        <div class="avatar">${esc(initials(s.name))}</div>
        <h3>${esc(s.name)}</h3>
        <div class="count">${n} achievement${n === 1 ? "" : "s"}</div></article>`;
    }).join("") || `<p class="sub">Nobody matches that search.</p>`;
    reveal();
  }

  function renderHome() {
    $("#windows").innerHTML = order.map((id, i) => {
      const s = stu(id);
      return `<div class="win" style="--i:${i}">${esc(s.name)}</div>`;
    }).join("");
  }

  function renderAch() {
    const cats = ["All", ...Object.keys(CATS)];
    $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
    const list = data.achievements.filter(a => filter === "All" || a.cat === filter).sort((a, b) => b.date.localeCompare(a.date));
    $("#achGrid").innerHTML = list.length ? list.map(a => {
      const s = stu(a.studentId);
      return `<article class="card ach"><span class="tag">${esc(a.cat)}</span>
        <h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>
        <div class="meta">${esc(s ? s.name : "Class")} · ${fmt(a.date)}</div></article>`;
    }).join("") : `<div class="empty"><b>Be the first on the wall</b>Won something? Tell an admin and your name goes up here.</div>`;
    reveal();
  }

  function renderSpot() {
    const sp = data.spotlight;
    const s = sp && stu(sp.studentId);
    $("#spot").innerHTML = s ? `
      <div class="avatar">${esc(initials(s.name))}</div>
      <div><span class="badge">Star of the Month</span><h2>${esc(s.name)}</h2><p>${esc(sp.why)}</p></div>`
    : `<div class="avatar">?</div>
      <div><span class="badge">Star of the Month</span><h2>Coming soon</h2><p>An admin picks one star each month. Check back soon.</p></div>`;
  }

  function renderWall() {
    const opts = order.map(stu).map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
    const cur = [$("#fromSel").value, $("#toSel").value];
    $("#fromSel").innerHTML = `<option value="" disabled ${cur[0] ? "" : "selected"}>From (you)…</option>` + opts;
    $("#toSel").innerHTML = `<option value="" disabled ${cur[1] ? "" : "selected"}>To…</option>` + opts;
    if (cur[0]) $("#fromSel").value = cur[0]; if (cur[1]) $("#toSel").value = cur[1];
    $("#wall-list").innerHTML = data.shoutouts.length ? data.shoutouts.slice().reverse().map((n, i) =>
      `<div class="note"><div class="to">To ${esc(n.to)}</div><p>${esc(n.msg)}</p><div class="from">from ${esc(n.from)}</div></div>`).join("")
      : `<div class="empty"><b>No shout-outs yet</b>Be the first to celebrate a classmate!</div>`;
  }

  function renderStats() {
    const vals = { students: data.students.length, achievements: data.achievements.length, shoutouts: data.shoutouts.length };
    $$("[data-count]").forEach(el => {
      const target = vals[el.dataset.count]; let n = 0;
      (function step() { if (n >= target) return void (el.textContent = target); n += Math.max(1, Math.ceil(target / 30)); el.textContent = Math.min(n, target); requestAnimationFrame(step); })();
    });
  }

  function renderAll() { renderMarquee(); renderPeople(); renderHome(); renderAch(); renderSpot(); renderWall(); renderStats(); }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    $$(".card:not(.in)").forEach((c, i) => { c.style.transitionDelay = (i % 8) * 50 + "ms"; io.observe(c); });
  }

  /* ---------- Events ---------- */
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.c; renderAch(); } });
  $("#search").addEventListener("input", e => { query = e.target.value; renderPeople(); });


  const modal = $("#modal");
  function openStudent(id) {
    const s = stu(id); if (!s) return;
    const mine = data.achievements.filter(a => a.studentId === id);
    $("#modalBody").innerHTML = `<div class="m-head"><div class="avatar" style="${avStyle(id)}">${esc(initials(s.name))}</div>
      <h3>${esc(s.name)}</h3>${s.dream ? `<div class="muted">Could be: ${esc(s.dream)}</div>` : ""}
      ${s.quote ? `<p class="m-quote">“${esc(s.quote)}”</p>` : ""}</div>
      <div class="m-list">${mine.length ? mine.map(a => `<div><b>${esc(a.title)}</b><br><span class="muted">${fmt(a.date)}</span></div>`).join("") : `<div class="muted">No achievements yet. Their story is just starting.</div>`}</div>`;
    modal.showModal();
  }
  $("#people").addEventListener("click", e => { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); });
  $("#people").addEventListener("keydown", e => { if (e.key === "Enter") { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); } });
  $("#closeModal").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

  $("#shoutForm").addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(e.target);
    data.shoutouts.push({ from: f.get("from"), to: f.get("to"), msg: f.get("msg").trim() });
    save(); e.target.reset(); renderWall(); renderStats();
  });

  /* ---------- Admin ---------- */
  const admin = $("#admin");
  const USER = "Admin", PASS = "Admin67"; // visible in page code, so only a casual lock
  function fillSelects() {
    const opts = data.students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    $("#achStudent").innerHTML = opts; $("#spotStudent").innerHTML = opts;
  }
  function renderOverview() {
    data.messages = data.messages || [];
    $("#ovViews").textContent = views;
    $("#ovShouts").textContent = data.shoutouts.length;
    $("#ovMsgs").textContent = data.messages.length;
    $("#msgList").innerHTML = data.messages.length ? data.messages.slice().reverse().map((m, i) =>
      `<div class="msg"><b>${esc(m.subject)}</b><small>from ${esc(m.name)} · ${fmt(m.date)}</small>${esc(m.msg)}
       <div><button class="link" data-delmsg="${data.messages.length - 1 - i}">delete</button></div></div>`).join("")
      : `<p class="muted">No messages yet.</p>`;
  }
  $("#msgList").addEventListener("click", e => {
    const b = e.target.closest("[data-delmsg]"); if (!b) return;
    data.messages.splice(+b.dataset.delmsg, 1); save(); renderOverview();
  });
  $("#msgForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.messages.push({ name: f.name.trim(), subject: f.subject.trim(), msg: f.msg.trim(), date: new Date().toISOString() });
    save(); e.target.reset(); $("#msgThanks").hidden = false; setTimeout(() => $("#msgThanks").hidden = true, 4000);
  });
  function renderManage() {
    $("#manage").innerHTML =
      data.students.map(s => `<div class="rm"><span>${esc(s.name)}</span><button data-del="s" data-id="${s.id}">remove</button></div>`).join("") +
      data.achievements.map(a => `<div class="rm"><span>${esc(a.title)}</span><button data-del="a" data-id="${a.id}">remove</button></div>`).join("") +
      data.shoutouts.map((n, i) => `<div class="rm"><span>${esc(n.to)}: ${esc(n.msg.slice(0, 30))}…</span><button data-del="n" data-id="${i}">remove</button></div>`).join("");
  }
  function refresh() { order = shuffle(data.students.map(s => s.id)); fillSelects(); renderManage(); renderAll(); }
  const openAdmin = () => { $("#loginErr").hidden = true; $("#loginForm").reset(); $("#login").showModal(); };
  $("#closeLogin").onclick = () => $("#login").close();
  $("#loginForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    if (f.user !== USER || f.pass !== PASS) { $("#loginErr").hidden = false; return; }
    $("#login").close(); fillSelects(); renderManage(); renderOverview(); admin.showModal();
  });
  $("#adminBtn").onclick = openAdmin;
  $("#navAdmin").onclick = openAdmin;
  $("#closeAdmin").onclick = () => admin.close();
  $$(".tabs button").forEach(b => b.onclick = () => {
    $$(".tabs button, .tab").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); $("#" + b.dataset.tab).classList.add("on");
  });
  $("#a-student").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.students.push({ id: nextId(data.students), name: f.name.trim(), dream: f.dream.trim(), quote: f.quote.trim(), emoji: "" });
    save(); e.target.reset(); refresh();
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
    if (t === "s") { data.students = data.students.filter(s => s.id !== id); data.achievements = data.achievements.filter(a => a.studentId !== id); if (data.spotlight?.studentId === id) data.spotlight = null; }
    if (t === "a") data.achievements = data.achievements.filter(a => a.id !== id);
    if (t === "n") data.shoutouts.splice(id, 1);
    save(); refresh();
  });
  $("#exportBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "year10-data.json"; a.click();
  };
  $("#importBtn").onclick = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = "application/json";
    i.onchange = async () => { try { data = JSON.parse(await i.files[0].text()); save(); refresh(); } catch { alert("That file isn't valid."); } };
    i.click();
  };
  $("#resetBtn").onclick = () => { if (confirm("Reset everything back to the class list?")) { data = clone(DEFAULTS); save(); refresh(); } };

  /* ---------- Motion flair ---------- */
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

  renderAll();
})();
