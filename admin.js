(() => {
  const KEY = "year10-data-v3";
  const USER = "Admin", PASS = "Admin67"; // visible in page code, so only a casual lock
  const CATS = ["Academic", "Sports", "Arts", "Leadership", "Community", "Whole class", "Other"];
  const NAMES = ["Abr","Danny","Adam","Ali Y","Ali G","Yusuf","Vish","Issy","Zahra","Fatima L","Fatima H","Talia","Shaikha","Ava","Mashal","Dana"];
  const DEFAULTS = { students: NAMES.map((name, i) => ({ id: i + 1, name, dream: "", quote: "" })), achievements: [], spotlight: null, shoutouts: [], messages: [] };

  const clone = o => JSON.parse(JSON.stringify(o));
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fmt = d => { try { return new Date(d).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" }); } catch { return d || ""; } };

  let data;
  try { data = JSON.parse(localStorage.getItem(KEY)) || clone(DEFAULTS); } catch { data = clone(DEFAULTS); }
  data.messages = data.messages || []; data.shoutouts = data.shoutouts || []; data.achievements = data.achievements || [];
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {} };
  const nextId = arr => arr.reduce((m, x) => Math.max(m, x.id || 0), 0) + 1;
  const stu = id => data.students.find(s => s.id === id);
  const who = id => id === 0 ? "Whole class" : (stu(id) ? stu(id).name : "Unknown");

  /* ---- login ---- */
  const show = ok => { $("#gate").hidden = ok; $("#dash").hidden = !ok; if (ok) renderAll(); };
  try { show(sessionStorage.getItem("year10-admin") === "1"); } catch { show(false); }
  $("#loginForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    if (f.user !== USER || f.pass !== PASS) { $("#loginErr").hidden = false; return; }
    try { sessionStorage.setItem("year10-admin", "1"); } catch {}
    show(true);
  });
  $("#logout").onclick = () => { try { sessionStorage.removeItem("year10-admin"); } catch {} location.href = "index.html"; };

  /* ---- navigation ---- */
  $("#sideNav").addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    $$("#sideNav button").forEach(x => x.classList.toggle("on", x === b));
    $$(".pane").forEach(p => p.classList.toggle("on", p.id === "p-" + b.dataset.p));
  });

  /* ---- render ---- */
  const empty = t => `<p class="empty-note">${t}</p>`;
  function renderAll() {
    let views = 0; try { views = +localStorage.getItem("year10-views") || 0; } catch {}
    $("#ovViews").textContent = views; $("#ovStu").textContent = data.students.length;
    $("#ovAch").textContent = data.achievements.length; $("#ovShouts").textContent = data.shoutouts.length; $("#ovMsgs").textContent = data.messages.length;

    $("#achWho").innerHTML = `<option value="0">Whole class</option>` + data.students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");
    $("#achCat").innerHTML = CATS.map(c => `<option>${c}</option>`).join("");
    $("#spotWho").innerHTML = data.students.map(s => `<option value="${s.id}">${esc(s.name)}</option>`).join("");

    const ach = data.achievements.slice().sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    $("#achList").innerHTML = ach.length ? ach.map(a => `<div class="item"><div><b>${esc(a.title)}</b><small>${esc(who(a.studentId))} · ${esc(a.cat)} · ${fmt(a.date)}</small>${a.desc ? `<p>${esc(a.desc)}</p>` : ""}</div><button data-del="ach" data-id="${a.id}">Delete</button></div>`).join("") : empty("No achievements yet. Add the first one above.");
    $("#stuList").innerHTML = data.students.map(s => `<div class="item"><div><b>${esc(s.name)}</b>${s.dream ? `<small>Could be: ${esc(s.dream)}</small>` : ""}</div><button data-del="stu" data-id="${s.id}">Remove</button></div>`).join("");
    $("#msgList").innerHTML = data.messages.length ? data.messages.map((m, i) => `<div class="item"><div><b>${esc(m.subject)}</b><small>from ${esc(m.name)} · ${fmt(m.date)}</small><p>${esc(m.msg)}</p></div><button data-del="msg" data-id="${i}">Delete</button></div>`).reverse().join("") : empty("No messages yet.");
    $("#shoutList").innerHTML = data.shoutouts.length ? data.shoutouts.map((n, i) => `<div class="item"><div><b>To ${esc(n.to)}</b><small>from ${esc(n.from)}</small><p>${esc(n.msg)}</p></div><button data-del="shout" data-id="${i}">Delete</button></div>`).reverse().join("") : empty("No shout-outs yet.");
  }

  /* ---- actions ---- */
  $("#achForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.achievements.push({ id: nextId(data.achievements), studentId: +f.student, title: f.title.trim(), cat: f.cat, date: f.date, desc: f.desc.trim() });
    save(); e.target.reset(); renderAll();
  });
  $("#stuForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.students.push({ id: nextId(data.students), name: f.name.trim(), dream: f.dream.trim(), quote: f.quote.trim() });
    save(); e.target.reset(); renderAll();
  });
  $("#spotForm").addEventListener("submit", e => {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.target));
    data.spotlight = { studentId: +f.student, why: f.why.trim() }; save(); e.target.reset(); alert("Star of the month saved.");
  });
  $("#clearSpot").onclick = () => { data.spotlight = null; save(); alert("Star cleared."); };
  $("#dash").addEventListener("click", e => {
    const b = e.target.closest("[data-del]"); if (!b) return;
    const id = +b.dataset.id, t = b.dataset.del;
    if (t === "ach") data.achievements = data.achievements.filter(a => a.id !== id);
    if (t === "stu") { if (!confirm("Remove this student and their achievements?")) return; data.students = data.students.filter(s => s.id !== id); data.achievements = data.achievements.filter(a => a.studentId !== id); if (data.spotlight?.studentId === id) data.spotlight = null; }
    if (t === "msg") data.messages.splice(id, 1);
    if (t === "shout") data.shoutouts.splice(id, 1);
    save(); renderAll();
  });
  $("#exportBtn").onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    a.download = "year10-data.json"; a.click();
  };
  $("#importBtn").onclick = () => {
    const i = document.createElement("input"); i.type = "file"; i.accept = "application/json";
    i.onchange = async () => { try { data = JSON.parse(await i.files[0].text()); save(); renderAll(); } catch { alert("That file isn't valid."); } };
    i.click();
  };
  $("#resetBtn").onclick = () => { if (confirm("Reset everything back to just the class list?")) { data = clone(DEFAULTS); save(); renderAll(); } };
})();
