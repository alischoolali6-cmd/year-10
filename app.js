(() => {
  const KEY = "year10-data-v3";
  const TONES = ["#b4472d", "#1f2430", "#2f6b57", "#8a5a2b"];
  const CATS = ["Academic", "Sports", "Arts", "Leadership", "Community", "Whole class", "Other"];
  const NAMES = ["Abr","Danny","Adam","Ali Y","Ali G","Yusuf","Vish","Issy","Zahra","Fatima L","Fatima H","Talia","Shaikha","Ava","Mashal","Dana"];
  const DEFAULTS = {
    students: NAMES.map((name, i) => ({ id: i + 1, name, dream: "", quote: "" })),
    achievements: [], spotlight: null, shoutouts: [], messages: []
  };

  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || clone(DEFAULTS); } catch { data = clone(DEFAULTS); }
  data.messages = data.messages || [];
  data.removedSeeds = data.removedSeeds || [];
  const SEED = window.Y10_SEED || { achievements: [], gallery: [] };
  const allAch = () => SEED.achievements.filter(a => !data.removedSeeds.includes(a.id)).concat(data.achievements);
  const ids = a => a.studentIds || [a.studentId];
  // Views on THIS device only (no backend): count once per browser session.
  try {
    const v = +localStorage.getItem("year10-views") || 0;
    if (!sessionStorage.getItem("year10-counted")) { localStorage.setItem("year10-views", v + 1); sessionStorage.setItem("year10-counted", "1"); }
  } catch {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  const stu = id => data.students.find(s => s.id === id);
  const initials = n => n.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const tone = id => TONES[(id - 1) % TONES.length];
  const whoA = a => a.who || ids(a).map(id => id === 0 ? "Whole class" : (stu(id) ? stu(id).name : "")).filter(Boolean).join(", ");
  const fmt = d => { if (!d) return ""; try { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); } catch { return d; } };

  // Random order, but Ali Y and Mashal are always kept well apart (never side by side or stacked).
  function apartShuffle() {
    const ids = data.students.map(s => s.id);
    const a = (data.students.find(s => s.name === "Ali Y") || {}).id, b = (data.students.find(s => s.name === "Mashal") || {}).id;
    if (!a || !b) return shuffle(ids);
    let o;
    for (let i = 0; i < 200; i++) { o = shuffle(ids); if (Math.abs(o.indexOf(a) - o.indexOf(b)) >= 6) break; }
    return o;
  }
  let order = apartShuffle();
  let filter = "All", query = "";

  function renderMarquee() {
    const items = order.map(id => `<span>${esc(stu(id).name)}</span><span>·</span>`).join("");
    $("#marquee").innerHTML = items + items;
  }
  function renderPeople() {
    const q = query.toLowerCase();
    const list = order.map(stu).filter(s => s && s.name.toLowerCase().includes(q));
    $("#people").innerHTML = list.map(s => {
      const n = allAch().filter(a => ids(a).includes(s.id)).length;
      return `<article class="card person" data-id="${s.id}" tabindex="0">
        <div class="avatar" style="--bg-a:${tone(s.id)}">${esc(initials(s.name))}</div>
        <h3>${esc(s.name)}</h3><div class="count">${n} achievement${n === 1 ? "" : "s"}</div></article>`;
    }).join("") || `<p class="sub">Nobody matches that search.</p>`;
    reveal();
  }
  function renderHome() {
    $("#windows").innerHTML = order.map(id => `<div class="win">${esc(stu(id).name)}</div>`).join("");
  }
  function renderAch() {
    const cats = ["All", ...CATS];
    $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === filter ? "on" : ""}" data-c="${c}">${c}</button>`).join("");
    const list = allAch().filter(a => filter === "All" || a.cat === filter).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("#achGrid").innerHTML = list.length ? list.map(a => `
      <article class="card ach"><span class="tag">${esc(a.cat)}</span>
        <h3>${esc(a.title)}</h3>${a.desc ? `<p>${esc(a.desc)}</p>` : ""}
        ${(a.images || []).length ? `<div class="shots">${a.images.map(src => `<img src="${esc(src)}" alt="${esc(a.title)}" loading="lazy" data-lb="${esc(src)}" data-cap="${esc(a.title)}">`).join("")}</div>` : ""}
        <div class="meta">${esc(whoA(a))}${a.date ? ` <span>· ${fmt(a.date)}</span>` : ""}</div></article>`).join("")
      : `<div class="empty"><b>Be the first on the wall</b>Won something or did something as a class? Tell an admin and it goes up here.</div>`;
    reveal();
  }
  function renderSpot() {
    const sp = data.spotlight, s = sp && stu(sp.studentId);
    $("#spot").innerHTML = s
      ? `<div class="avatar">${esc(initials(s.name))}</div><div><span class="badge">Star of the Month</span><h2>${esc(s.name)}</h2><p>${esc(sp.why)}</p></div>`
      : `<div class="avatar">?</div><div><span class="badge">Star of the Month</span><h2>Coming soon</h2><p>An admin picks one star each month. Check back soon.</p></div>`;
  }
  function renderWall() {
    const opts = order.map(stu).map(s => `<option value="${esc(s.name)}">${esc(s.name)}</option>`).join("");
    $("#fromSel").innerHTML = `<option value="" disabled selected>From (you)</option>` + opts;
    $("#toSel").innerHTML = `<option value="" disabled selected>To</option>` + opts;
    $("#wall-list").innerHTML = data.shoutouts.length ? data.shoutouts.slice().reverse().map(n =>
      `<div class="note"><div class="to">To ${esc(n.to)}</div><p>${esc(n.msg)}</p><div class="from">from ${esc(n.from)}</div></div>`).join("")
      : `<div class="empty"><b>No shout-outs yet</b>Be the first to celebrate a classmate.</div>`;
  }
  function renderStats() {
    const vals = { students: data.students.length, achievements: allAch().length, shoutouts: data.shoutouts.length };
    $$("[data-count]").forEach(el => {
      const target = vals[el.dataset.count]; let n = 0;
      (function step() { if (n >= target) return void (el.textContent = target); n += Math.max(1, Math.ceil(target / 30)); el.textContent = Math.min(n, target); requestAnimationFrame(step); })();
    });
  }
  function reveal() {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .08 });
    $$(".card:not(.in)").forEach((c, i) => { c.style.transitionDelay = (i % 8) * 40 + "ms"; io.observe(c); });
  }

  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (b) { filter = b.dataset.c; renderAch(); } });
  $("#search").addEventListener("input", e => { query = e.target.value; renderPeople(); });

  const modal = $("#modal");
  function openStudent(id) {
    const s = stu(id); if (!s) return;
    const mine = allAch().filter(a => ids(a).includes(id));
    $("#modalBody").innerHTML = `<div class="m-head"><div class="avatar" style="--bg-a:${tone(id)}">${esc(initials(s.name))}</div>
      <h3>${esc(s.name)}</h3>${s.dream ? `<div class="muted">Could be: ${esc(s.dream)}</div>` : ""}
      ${s.quote ? `<p class="m-quote">“${esc(s.quote)}”</p>` : ""}</div>
      <div class="m-list">${mine.length ? mine.map(a => `<div><b>${esc(a.title)}</b><br><span class="muted">${esc(a.cat)}${a.date ? " · " + fmt(a.date) : ""}</span></div>`).join("") : `<div class="muted">No achievements yet. Their story is just starting.</div>`}</div>`;
    modal.showModal();
  }
  $("#people").addEventListener("click", e => { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); });
  $("#people").addEventListener("keydown", e => { if (e.key === "Enter") { const c = e.target.closest(".person"); if (c) openStudent(+c.dataset.id); } });
  $("#closeModal").onclick = () => modal.close();
  modal.addEventListener("click", e => { if (e.target === modal) modal.close(); });

  $("#shoutForm").addEventListener("submit", e => {
    e.preventDefault(); const f = new FormData(e.target);
    data.shoutouts.push({ from: f.get("from"), to: f.get("to"), msg: f.get("msg").trim() });
    save(); e.target.reset(); renderWall(); renderStats();
  });
  $("#msgForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.messages.push({ name: f.name.trim(), subject: f.subject.trim(), msg: f.msg.trim(), date: new Date().toISOString() });
    save(); e.target.reset(); $("#msgThanks").hidden = false; setTimeout(() => $("#msgThanks").hidden = true, 4000);
  });

  const words = ["leaders", "scientists", "artists", "founders", "champions", "doctors", "inventors", "legends"];
  let wi = 0, ci = 0, del = false;
  const rot = $("#rotator");
  (function type() {
    const w = words[wi];
    rot.textContent = w.slice(0, ci);
    if (!del && ci === w.length) { del = true; return setTimeout(type, 1500); }
    if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; }
    ci += del ? -1 : 1;
    setTimeout(type, del ? 40 : 90);
  })();

  $("#gallery").innerHTML = (SEED.gallery || []).map(g => `<figure><img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy" data-lb="${esc(g.src)}" data-cap="${esc(g.caption)}"><figcaption>${esc(g.caption)}</figcaption></figure>`).join("") || `<div class="empty"><b>Photos coming soon</b></div>`;
  const lb = $("#lightbox");
  document.addEventListener("click", e => { const i = e.target.closest("[data-lb]"); if (i) { $("#lbImg").src = i.dataset.lb; $("#lbCap").textContent = i.dataset.cap || ""; lb.showModal(); } });
  $("#closeLb").onclick = () => lb.close();
  lb.addEventListener("click", e => { if (e.target === lb) lb.close(); });

  addEventListener("scroll", () => $("#nav").classList.toggle("scrolled", scrollY > 20), { passive: true });
  renderMarquee(); renderPeople(); renderHome(); renderAch(); renderSpot(); renderWall(); renderStats();
})();
