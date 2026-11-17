(() => {
  const KEY = "year10-data-v2";
  const PAL = ["#ff3d81", "#2f7bff", "#00c98d", "#ff7a1a", "#8b5cf6", "#22d3ee"];
  const PASTEL = ["#ffe3ee", "#dfeaff", "#d6f7ea", "#ffe8d3", "#ece4ff", "#d8f6fc"];
  const CATS = { Academic:"🎓", Sports:"🏆", Arts:"🎨", Leadership:"⭐", Community:"💚" };
  const NAMES = ["Abr","Danny","Adam","Ali Y","Ali G","Yusuf","Vish","Issy","Zahra","Fatima L","Fatima H","Talia","Shaikha","Ava","Mashal","Dana"];

  const DEFAULTS = {
    students: NAMES.map((name, i) => ({ id: i + 1, name, dream: "", quote: "", emoji: "" })),
    achievements: [],
    spotlight: null,
    shoutouts: [],
    messages: [],
    timeline: [
      { date:"Now",  title:"Year 10 starts here", text:"A class with its own website. Nobody else has one." },
      { date:"Soon", title:"Our first achievements", text:"Every win goes on the wall. Tell your teacher what you did!" },
      { date:"This year", title:"Building our home", text:"Room 10 is ours: we look out for each other." },
      { date:"Next", title:"Who we could be", text:"Exams, careers, dreams. The best is still ahead." }
    ]
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
  const colorOf = id => PAL[(id - 1) % PAL.length];
  const pastelOf = id => PASTEL[(id - 1) % PASTEL.length];
  const fmt = d => { try { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); } catch { return d; } };

  let order = shuffle(data.students.map(s => s.id));   // shuffled on every visit
  let filter = "All", query = "";

  /* ---------- Confetti ---------- */
  function confetti(x = innerWidth / 2, y = innerHeight / 3, n = 70) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    for (let i = 0; i < n; i++) {
      const p = document.createElement("i");
      p.className = "confetti";
      p.style.background = PAL.concat(["#ffd21f"])[i % 7];
      document.body.appendChild(p);
      const ang = Math.random() * Math.PI * 2, v = 200 + Math.random() * 420;
      const dx = Math.cos(ang) * v, dy = Math.sin(ang) * v - 300;
      p.animate([
        { transform: `translate(${x}px,${y}px) rotate(0)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy + 700}px) rotate(${Math.random() * 900}deg)`, opacity: 0 }
      ], { duration: 1600 + Math.random() * 900, easing: "cubic-bezier(.2,.7,.3,1)" }).onfinish = () => p.remove();
    }
  }

  /* ---------- Render ---------- */
  function renderMarquee() {
    const items = order.map(id => `<span>${esc(stu(id).name)}</span><span>✦</span>`).join("");
    $("#marquee").innerHTML = items + items;
  }

  function renderPeople() {
    const q = query.toLowerCase();
    const list = order.map(stu).filter(s => s && s.name.toLowerCase().includes(q));
    $("#people").innerHTML = list.map(s => {
      const n = data.achievements.filter(a => a.studentId === s.id).length;
      return `<article class="card person" data-id="${s.id}" tabindex="0" style="--c:${colorOf(s.id)};--bg-c:${pastelOf(s.id)}">
        <div class="avatar">${esc(s.emoji || initials(s.name))}</div>
        <h3>${esc(s.name)}</h3>
        <div class="count">${n} achievement${n === 1 ? "" : "s"}</div></article>`;
    }).join("") || `<p class="sub">Nobody matches that search.</p>`;
    reveal();
  }

  function renderHome() {
    $("#windows").innerHTML = order.map((id, i) => {
      const s = stu(id);
      return `<div class="win" style="--i:${i}" title="${esc(s.name)}'s window"><b>${esc(s.emoji || ["🌟","🚀","🎨","⚡","🌈","🎵","🔥","🍀"][i % 8])}</b><span>${esc(s.name)}</span></div>`;
    }).join("");
  }

  function renderAch() {
    const cats = ["All", ...Object.keys(CATS)];
    $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
    const list = data.achievements.filter(a => filter === "All" || a.cat === filter).sort((a, b) => b.date.localeCompare(a.date));
    $("#achGrid").innerHTML = list.length ? list.map(a => {
      const s = stu(a.studentId);
      return `<article class="card ach" style="--bg-c:${pastelOf(a.studentId || 1)}">
        <div class="ico">${CATS[a.cat] || "🏅"}</div><span class="tag">${esc(a.cat)}</span>
        <h3>${esc(a.title)}</h3><p>${esc(a.desc)}</p>
        <div class="meta">${esc(s ? s.name : "Class")} · ${fmt(a.date)}</div></article>`;
    }).join("") : `<div class="empty"><b>Be the first on the wall! 🏆</b>Won something? Tell your teacher and your name goes up here.</div>`;
    reveal();
  }

  function renderSpot(pick) {
    const sp = pick || data.spotlight;
    const s = sp && stu(sp.studentId);
    $("#spot").innerHTML = s ? `
      <div class="avatar" style="--c:${colorOf(s.id)}">${esc(s.emoji || initials(s.name))}</div>
      <div><span class="badge">★ Star of the Month</span><h2>${esc(s.name)}</h2>
      <p>${esc(sp.why)}</p><button class="btn" id="spinBtn">🎲 Pick a random star</button></div>`
    : `<div class="avatar" style="--c:#ffd21f">?</div>
      <div><span class="badge">★ Star of the Month</span><h2>Coming soon…</h2>
      <p>Your teacher picks one star each month. Want a sneak peek? Spin the wheel.</p><button class="btn" id="spinBtn">🎲 Pick a random star</button></div>`;
  }

  function renderTimeline() {
    $("#timeline").innerHTML = data.timeline.map((t, i) =>
      `<li style="--c:${PAL[i % PAL.length]}"><em>${esc(t.date)}</em><b>${esc(t.title)}</b><p>${esc(t.text)}</p></li>`).join("");
  }

  function renderWall() {
    const opts = order.map(stu).map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
    const cur = [$("#fromSel").value, $("#toSel").value];
    $("#fromSel").innerHTML = `<option value="" disabled ${cur[0] ? "" : "selected"}>From (you)…</option>` + opts;
    $("#toSel").innerHTML = `<option value="" disabled ${cur[1] ? "" : "selected"}>To…</option>` + opts;
    if (cur[0]) $("#fromSel").value = cur[0]; if (cur[1]) $("#toSel").value = cur[1];
    $("#wall-list").innerHTML = data.shoutouts.length ? data.shoutouts.slice().reverse().map((n, i) =>
      `<div class="note" style="--rot:${((i * 37) % 5) - 2}deg;--bg-c:${PASTEL[i % 6]}"><div class="to">To ${esc(n.to)} 💬</div><p>${esc(n.msg)}</p><div class="from">from ${esc(n.from)}</div></div>`).join("")
      : `<div class="empty"><b>No shout-outs yet 💌</b>Be the first to celebrate a classmate!</div>`;
  }

  function renderStats() {
    const vals = { students: data.students.length, achievements: data.achievements.length, shoutouts: data.shoutouts.length };
    $$("[data-count]").forEach(el => {
      const target = vals[el.dataset.count]; let n = 0;
      (function step() { if (n >= target) return void (el.textContent = target); n += Math.max(1, Math.ceil(target / 30)); el.textContent = Math.min(n, target); requestAnimationFrame(step); })();
    });
  }

  function renderAll() { renderMarquee(); renderPeople(); renderHome(); renderAch(); renderSpot(); renderTimeline(); renderWall(); renderStats(); }

  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    $$(".card:not(.in)").forEach((c, i) => { c.style.transitionDelay = (i % 8) * 50 + "ms"; io.observe(c); });
  }

  /* ---------- Events ---------- */
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.c; renderAch(); } });
  $("#search").addEventListener("input", e => { query = e.target.value; renderPeople(); });
  $("#shuffleBtn").onclick = e => {
    order = shuffle(order); query = ""; $("#search").value = "";
    $("#people").style.opacity = 0;
    setTimeout(() => { renderMarquee(); renderPeople(); renderHome(); $("#people").style.opacity = 1; }, 180);
    const r = e.currentTarget.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top, 40);
  };
  $("#partyBtn").onclick = () => { confetti(innerWidth / 2, innerHeight / 2, 140); };
  $(".door").onclick = e => { const r = e.currentTarget.getBoundingClientRect(); confetti(r.left + 45, r.top + 30, 50); };
  $("#spot").addEventListener("click", e => {
    if (!e.target.closest("#spinBtn")) return;
    const s = data.students[Math.floor(Math.random() * data.students.length)];
    renderSpot({ studentId: s.id, why: "Picked by the wheel just for fun. Everyone in Year 10 is a star! ✨" });
    const r = $("#spot").getBoundingClientRect(); confetti(r.left + r.width / 2, Math.max(r.top, 100), 80);
  });

  // 3D tilt on cards
  document.addEventListener("pointermove", e => {
    const c = e.target.closest && e.target.closest(".person");
    if (!c) return;
    const r = c.getBoundingClientRect();
    c.style.setProperty("--tx", ((e.clientX - r.left) / r.width - .5) * 8 + "deg");
  }, { passive: true });

  const modal = $("#modal");
  function openStudent(id) {
    const s = stu(id); if (!s) return;
    const mine = data.achievements.filter(a => a.studentId === id);
    $("#modalBody").innerHTML = `<div class="m-head"><div class="avatar" style="--c:${colorOf(id)}">${esc(s.emoji || initials(s.name))}</div>
      <h3>${esc(s.name)}</h3>${s.dream ? `<div class="muted">Could be: ${esc(s.dream)}</div>` : ""}
      ${s.quote ? `<p class="m-quote">“${esc(s.quote)}”</p>` : ""}</div>
      <div class="m-list">${mine.length ? mine.map(a => `<div>${CATS[a.cat] || "🏅"} <b>${esc(a.title)}</b><br><span class="muted">${fmt(a.date)}</span></div>`).join("") : `<div class="muted">No achievements yet. Their story is just starting! 🌱</div>`}</div>`;
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
    save(); e.target.reset(); renderWall(); renderStats(); confetti(innerWidth / 2, innerHeight / 2, 90);
  });

  /* ---------- Admin ---------- */
  const admin = $("#admin");
  const PASS = "year10teacher"; // change this to your own passcode
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
    confetti(innerWidth / 2, innerHeight / 2, 60);
  });
  function renderManage() {
    $("#manage").innerHTML =
      data.students.map(s => `<div class="rm"><span>👤 ${esc(s.name)}</span><button data-del="s" data-id="${s.id}">remove</button></div>`).join("") +
      data.achievements.map(a => `<div class="rm"><span>🏅 ${esc(a.title)}</span><button data-del="a" data-id="${a.id}">remove</button></div>`).join("") +
      data.shoutouts.map((n, i) => `<div class="rm"><span>💬 ${esc(n.to)}: ${esc(n.msg.slice(0, 30))}…</span><button data-del="n" data-id="${i}">remove</button></div>`).join("");
  }
  function refresh() { order = shuffle(data.students.map(s => s.id)); fillSelects(); renderManage(); renderAll(); }
  const openAdmin = () => {
    const p = prompt("Teacher passcode:");
    if (p === null) return;
    if (p !== PASS) return alert("Wrong passcode.");
    fillSelects(); renderManage(); renderOverview(); admin.showModal();
  };
  $("#adminBtn").onclick = openAdmin;
  $("#navAdmin").onclick = openAdmin;
  $("#closeAdmin").onclick = () => admin.close();
  $$(".tabs button").forEach(b => b.onclick = () => {
    $$(".tabs button, .tab").forEach(x => x.classList.remove("on"));
    b.classList.add("on"); $("#" + b.dataset.tab).classList.add("on");
  });
  $("#a-student").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.students.push({ id: nextId(data.students), name: f.name.trim(), dream: f.dream.trim(), quote: f.quote.trim(), emoji: f.emoji.trim() });
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
  const COLS = ["#ff3d81", "#ffd21f", "#2f7bff", "#00c98d", "#ff7a1a", "#8b5cf6", "#22d3ee", "#ff3d81"];
  $("#title").innerHTML = "Year 10".split("").map((ch, i) =>
    ch === " " ? `<span class="sp"></span>` : `<span class="L" style="--i:${i};color:${COLS[i]}">${ch}</span>`).join("");

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

  $("#floaters").innerHTML = Array.from({ length: 14 }, (_, i) =>
    `<span class="fl" style="left:${(i * 7.3 + 3) % 98}%;--s:${22 + (i * 11) % 26}px;--d:${14 + (i * 3) % 12}s;--dl:${-(i * 2.3)}s">${["⭐","🎈","✨","💛","🚀","🎨","⚡","🌈"][i % 8]}</span>`).join("");

  addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 20), { passive: true });

  renderAll();
})();
