/* The Pickle Jar — shop app screens. */
(() => {
"use strict";
const PJ = window.PJ, S = PJ.S;
const VERSION = "1.0.0";

/* ================= helpers ================= */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"})[c]);
const r2 = PJ.r2;
const peso = (n, sign) => {
  n = r2(n); const neg = n < 0; const a = Math.abs(n);
  const s = a.toLocaleString("en-PH", {minimumFractionDigits: a % 1 ? 2 : 0, maximumFractionDigits: 2});
  return (neg ? "−" : sign && n > 0 ? "+" : "") + "₱" + s;
};
const num = v => { const n = parseFloat(String(v ?? "").replace(/[,₱\s]/g, "")); return isFinite(n) ? n : 0; };
const today = PJ.today;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fdate = d => { if (!d) return ""; const [y, m, dd] = d.slice(0, 10).split("-").map(Number); const t = today();
  if (d.slice(0, 10) === t) return "Today"; const yd = new Date(); yd.setDate(yd.getDate() - 1); if (d.slice(0, 10) === today(yd)) return "Yesterday";
  return `${MONTHS[m - 1]} ${dd}${y !== new Date().getFullYear() ? ", " + y : ""}`; };
const ftime = iso => { try { return new Date(iso).toLocaleTimeString("en-PH", {hour: "numeric", minute: "2-digit"}); } catch { return ""; } };
const monthLabel = ym => { const [y, m] = ym.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };
const shiftMonth = (ym, k) => { const [y, m] = ym.split("-").map(Number); const d = new Date(y, m - 1 + k, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const lastDay = ym => { const [y, m] = ym.split("-").map(Number); return `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`; };
const initials = s => String(s || "?").replace(/[^A-Za-z0-9 ]/g, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase() || "?";
const isOwner = () => S.member?.role === "owner";
const pname = (p, v) => p ? p.name + (p.model ? " " + p.model : "") + (v ? " — " + v : "") : "Deleted item";
const METHODS = ["Cash", "GCash", "Maya", "Bank transfer"];
const VCOLORS = ["#C5F03C", "#E7B65E", "#7FB2FF", "#FF8FB1", "#71E0A3", "#C59BFF", "#FF9F5A", "#5FD9E8"];
const pref = {get(k, d) { try { const v = localStorage.getItem("pj:" + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("pj:" + k, JSON.stringify(v)); } catch {} }};

const IC = {
  jar: '<path d="M7 3.5h10M8 3.5v2.2c0 .6-.4 1.1-.9 1.4C5.5 8 4.5 9.6 4.5 11.5V18a2.5 2.5 0 0 0 2.5 2.5h10a2.5 2.5 0 0 0 2.5-2.5v-6.5c0-1.9-1-3.5-2.6-4.4-.5-.3-.9-.8-.9-1.4V3.5"/><circle cx="9.5" cy="13" r="1.6"/><circle cx="14.5" cy="15.5" r="1.6"/><circle cx="13.5" cy="11" r="1.1"/>',
  home: '<path d="M3.5 11 12 4l8.5 7M5.5 9.5V20h13V9.5"/><path d="M10 20v-5.5h4V20"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3.5h2.6l2.2 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7.5H6"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/>',
  hand: '<path d="M4 14.5h3.2l3.6 2.3c.7.4 1.6.2 2-.4.4-.6.3-1.4-.3-1.9L10 12.8"/><path d="M2.5 13v6.5M7.2 19l5.6 1.6c1 .3 2 .1 2.8-.5l5.6-4.4c.7-.5.8-1.5.2-2.2-.5-.6-1.4-.7-2.1-.3l-3.6 2.1"/><circle cx="15" cy="6.5" r="3.5"/><path d="M15 5v3"/>',
  more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', x: '<path d="M6 6l12 12M18 6 6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', chev: '<path d="m9 5 7 7-7 7"/>',
  receipt: '<path d="M5.5 3h13v18l-2.2-1.5-2.1 1.5-2.2-1.5-2.2 1.5-2.1-1.5L5.5 21z"/><path d="M9 8h6M9 12h6M9 16h3"/>',
  wallet: '<path d="M19.5 7.5V6a2 2 0 0 0-2-2H5.5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-3"/><path d="M20.5 9.5h-4a2.5 2.5 0 0 0 0 5h4z"/>',
  truck: '<path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3v3h-7"/><circle cx="6.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  upload: '<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M4 15v4.5h16V15"/>',
  download: '<path d="M12 3.5V15M7.5 10.5 12 15l4.5-4.5M4 15v4.5h16V15"/>',
  out: '<path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16.5 5.5 12 10 7.5M5.5 12H15"/>',
  share: '<circle cx="18" cy="5.5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="18.5" r="2.5"/><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1"/>',
  gift: '<rect x="3.5" y="8" width="17" height="4" rx="1"/><path d="M5 12v8.5h14V12M12 8v12.5M12 8S10.5 3.5 8 4.2C6 4.8 7 8 12 8zm0 0s1.5-4.5 4-3.8C18 4.8 17 8 12 8z"/>',
  sync: '<path d="M20 11a8 8 0 0 0-14.3-4.6M4 5v4h4M4 13a8 8 0 0 0 14.3 4.6M20 19v-4h-4"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  camera: '<path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
};
const ic = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" aria-hidden="true">${IC[n] || ""}</svg>`;

function toast(msg, bad) {
  $$(".toast").forEach(t => t.remove());
  const t = document.createElement("div"); t.className = "toast" + (bad ? " bad" : ""); t.textContent = msg; t.setAttribute("role", "status");
  document.body.appendChild(t); setTimeout(() => t.remove(), bad ? 4200 : 2400);
}

/* ================= UI state ================= */
const U = {
  tab: pref.get("tab", "home"), sub: null, period: "today",
  sellQ: "", sellCat: "", stockQ: "", stockF: "all", utQ: "", utPaid: false,
  histQ: "", histMonth: today().slice(0, 7), expMonth: today().slice(0, 7),
  cart: pref.get("cart", null) || newCart(), offline: false
};
function newCart() { return {items: [], freebies: [], customer: "", disc: "", method: "Cash", paid: "", credit: false, notes: ""}; }
const saveCart = () => pref.set("cart", U.cart);

/* ================= sheets ================= */
let sheetClose = null;
function openSheet(title, body, mount, {wide} = {}) {
  closeSheet(true);
  const scrim = document.createElement("div"); scrim.className = "scrim";
  scrim.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="grab"></div>
    <div class="sh"><h2>${esc(title)}</h2><button class="x" data-x aria-label="Close">${ic("x")}</button></div><div class="sb">${body}</div></div>`;
  document.body.appendChild(scrim); document.body.style.overflow = "hidden";
  const sheet = $(".sheet", scrim);
  scrim.addEventListener("click", e => { if (e.target === scrim || e.target.closest("[data-x]")) closeSheet(); });
  sheetClose = () => { scrim.remove(); document.body.style.overflow = ""; };
  if (mount) mount($(".sb", sheet), sheet);
  if (!history.state?.sheet) history.pushState({sheet: 1}, "");
  return sheet;
}
let ignorePop = false;
function closeSheet(silent) {
  if (!sheetClose) return;
  const f = sheetClose; sheetClose = null; f();
  if (!silent) { if (history.state?.sheet) { ignorePop = true; history.back(); } }
  else setTimeout(() => { if (!sheetClose && history.state?.sheet) { ignorePop = true; history.back(); } }, 0);
}
window.addEventListener("popstate", () => {
  if (ignorePop) { ignorePop = false; return; }
  if (sheetClose) { const f = sheetClose; sheetClose = null; f(); } else if (U.sub) { U.sub = null; render(); }
});
function confirmSheet(title, msg, okLabel, onOk, danger) {
  openSheet(title, `<p class="note" style="font-size:14.5px;color:var(--ink)">${msg}</p><div class="btns" style="margin-top:16px">
    <button class="btn" data-x>Cancel</button><button class="btn ${danger ? "danger" : "primary"}" id="cf-ok">${esc(okLabel)}</button></div>`,
    b => { $("#cf-ok", b).onclick = async () => { closeSheet(); await onOk(); }; });
}
// keeps typing focus when part of the screen re-renders
function keepFocus(fn) {
  const a = document.activeElement; const id = a && a.id; const s = a && a.selectionStart, e = a && a.selectionEnd;
  fn();
  if (id) { const n = document.getElementById(id); if (n && n !== document.activeElement) { n.focus({preventScroll: true}); try { n.setSelectionRange(s, e); } catch {} } }
}

/* ================= boot & auth ================= */
const app = $("#app");
let booted = false;

async function boot() {
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  S.api = window.PJ_API || PJ.supabaseApi();
  await PJ.loadLocal().catch(() => {});
  const cached = await PJ.idb.get("me").catch(() => null);
  let session = null, failed = false;
  try { session = await Promise.race([S.api.session(), new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 5000))]); }
  catch { failed = true; }
  if (session) await enter(session.user, cached);
  else if (cached && (failed || navigator.onLine === false)) { S.user = {id: cached.user_id, email: cached.email}; S.member = cached; U.offline = true; }
  booted = true; render();
  S.api.onAuth(async (ev, s) => {
    if (ev === "PASSWORD_RECOVERY") { if (s) await enter(s.user, cached); render(); newPasswordSheet(); return; }
    if (ev === "SIGNED_IN" && s && (!S.user || S.user.id !== s.user.id)) { await enter(s.user, await PJ.idb.get("me").catch(() => null)); render(); }
    if (ev === "SIGNED_OUT" && S.user && !U.offline) { await wipeLocal(); render(); }
  });
  PJ.onChange(() => { if (booted) scheduleRender(); });
  window.addEventListener("online", () => { U.offline = false; refreshMe(); PJ.syncNow(); });
  window.addEventListener("offline", () => render());
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") { refreshMe(); PJ.syncNow(); } });
  setInterval(() => { if (document.visibilityState === "visible" && S.user) PJ.syncNow(); }, 20000);
  S.onAuthLost = async () => { try { const s = await S.api.session(); if (!s) toast("Please sign in again to keep syncing.", true); } catch {} };
}
async function enter(user, cached) {
  S.user = user; U.offline = false;
  let m = null;
  try { m = await S.api.me(user.id); } catch { m = cached && cached.user_id === user.id ? cached : null; }
  if (cached && cached.user_id !== user.id) { await PJ.idb.wipe(); await PJ.loadLocal(); }
  S.member = m || {user_id: user.id, email: user.email, role: "pending", name: ""};
  await PJ.idb.set("me", S.member).catch(() => {});
  if (["owner", "staff"].includes(S.member.role)) PJ.syncNow();
}
async function refreshMe() {
  if (!S.user || U.offline) return;
  try { const m = await S.api.me(S.user.id); if (m) { const changed = m.role !== S.member?.role; S.member = m; await PJ.idb.set("me", m); if (changed) { render(); if (["owner", "staff"].includes(m.role)) PJ.syncNow(); } } } catch {}
}
async function wipeLocal() { await PJ.idb.wipe().catch(() => {}); S.recs = new Map(); S.user = null; S.member = null; U.cart = newCart(); saveCart(); PJ.loadLocal(); }
async function signOut() {
  const n = PJ.pendingCount();
  const go = async () => { await S.api.signOut(); await wipeLocal(); U.tab = "home"; U.sub = null; render(); };
  if (n) confirmSheet("Sign out?", `${n} change${n > 1 ? "s haven't" : " hasn't"} been sent to the shop database yet. Connect to the internet first, or they'll be lost.`, "Sign out anyway", go, true);
  else go();
}

function authScreen(mode = "in", msg = "") {
  document.body.className = "no-nav";
  app.innerHTML = `<div class="auth">
    <div class="logo">${ic("jar")}</div>
    <div class="eyebrow">Shop app</div>
    <h1 style="margin:6px 0 8px">The Pickle Jar</h1>
    <p class="note" style="margin:0 0 22px">${mode === "up" ? "Create your account. The first account becomes the owner. Staff accounts wait for the owner to approve them." : mode === "reset" ? "We'll email you a link to set a new password." : "Sign in to sell, check stock and track utang."}</p>
    <form id="af">
      ${mode === "up" ? `<div class="field"><label for="a-name">Your name</label><input class="in-text" id="a-name" autocomplete="name" required></div>` : ""}
      <div class="field"><label for="a-email">Email</label><input class="in-text" id="a-email" type="email" autocomplete="email" inputmode="email" required></div>
      ${mode !== "reset" ? `<div class="field"><label for="a-pw">Password</label><input class="in-text" id="a-pw" type="password" autocomplete="${mode === "up" ? "new-password" : "current-password"}" minlength="6" required></div>` : ""}
      <div class="err" id="a-err" role="alert">${esc(msg)}</div>
      <button class="btn primary block" id="a-go" style="margin-top:8px">${mode === "up" ? "Create account" : mode === "reset" ? "Send reset link" : "Sign in"}</button>
    </form>
    <div style="display:flex;justify-content:space-between;margin-top:14px">
      <button class="link" id="a-sw">${mode === "in" ? "Create an account" : "Back to sign in"}</button>
      ${mode === "in" ? `<button class="link" id="a-rs" style="color:var(--muted)">Forgot password?</button>` : ""}
    </div></div>`;
  $("#a-sw").onclick = () => authScreen(mode === "in" ? "up" : "in");
  if ($("#a-rs")) $("#a-rs").onclick = () => authScreen("reset");
  $("#af").onsubmit = async e => {
    e.preventDefault(); const err = $("#a-err"); const btn = $("#a-go"); err.textContent = ""; btn.disabled = true;
    const email = $("#a-email").value.trim(), pw = $("#a-pw")?.value || "";
    try {
      if (mode === "reset") { await S.api.resetPassword(email); err.style.color = "var(--good)"; err.textContent = "Check your email for the reset link."; btn.disabled = false; return; }
      if (mode === "up") {
        const s = await S.api.signUp(email, pw, $("#a-name").value.trim());
        if (!s) { authScreen("in", ""); $("#a-email").value = email; const m = $("#a-err"); m.style.color = "var(--good)"; m.textContent = "Account created. Open the confirmation email we sent you, then sign in here."; return; }
        await enter(s.user, null);
      } else { const s = await S.api.signIn(email, pw); await enter(s.user, await PJ.idb.get("me").catch(() => null)); }
      render();
    } catch (ex) {
      btn.disabled = false;
      err.textContent = /Invalid login/i.test(ex.message) ? "Wrong email or password." : /not confirmed/i.test(ex.message) ? "Please confirm your email first (check your inbox), then sign in." :
        /fetch|network/i.test(ex.message) ? "No internet. You need internet to sign in the first time." : ex.message || "Something went wrong.";
    }
  };
}
function newPasswordSheet() {
  openSheet("Set a new password", `<form id="np"><div class="field"><label for="np-pw">New password</label><input class="in-text" id="np-pw" type="password" minlength="6" autocomplete="new-password" required></div>
    <div class="err" id="np-err"></div><button class="btn primary block">Save password</button></form>`, b => {
    $("#np", b).onsubmit = async e => { e.preventDefault(); try { await S.api.updatePassword($("#np-pw", b).value); closeSheet(); toast("Password updated"); } catch (ex) { $("#np-err", b).textContent = ex.message; } };
  });
}
function pendingScreen() {
  document.body.className = "no-nav";
  const removed = S.member.role === "removed";
  app.innerHTML = `<div class="auth"><div class="logo">${ic("jar")}</div><h1 style="margin-bottom:10px">${removed ? "No access" : "Almost there"}</h1>
    <p class="note" style="font-size:14.5px">${removed ? "The owner has removed this account from the shop." : `Your account <b>${esc(S.member.email || S.user.email)}</b> is waiting for the owner to approve it. Ask the owner to open <b>More › Team</b> and tap Approve.`}</p>
    <div class="btns" style="margin-top:18px"><button class="btn" id="p-out">${ic("out")} Sign out</button>${removed ? "" : `<button class="btn primary" id="p-chk">${ic("sync")} Check again</button>`}</div></div>`;
  $("#p-out").onclick = signOut;
  if ($("#p-chk")) $("#p-chk").onclick = async () => { await refreshMe(); if (S.member.role === "pending") toast("Not approved yet"); };
}

/* ================= main render ================= */
let rq = false;
function scheduleRender() { if (rq) return; rq = true; requestAnimationFrame(() => { rq = false; render(); }); }
function render() {
  if (!booted) return;
  if (!S.user) return authScreen();
  if (!["owner", "staff"].includes(S.member?.role)) return pendingScreen();
  if (!isOwner() && ["expenses", "purchases", "team", "settings", "import"].includes(U.sub)) U.sub = null;
  const D = PJ.derive();
  const tabs = [["home", "Home", "home"], ["stock", "Stock", "box"], ["sell", "Sell", "cart"], ["utang", "Utang", "hand"], ["more", "More", "more"]];
  const cartN = U.cart.items.reduce((t, i) => t + i.qty, 0);
  document.body.className = U.tab === "sell" && cartN && !U.sub ? "has-cart" : "";
  const y = window.scrollY;
  keepFocus(() => {
    app.innerHTML = `${header(D)}<main class="stack" id="main">${screen(D)}</main>
      ${U.tab === "sell" && cartN && !U.sub ? `<button class="cartbar" id="cartbar">${ic("cart")}<span class="grow" style="text-align:left">${cartN} item${cartN > 1 ? "s" : ""} · Review sale</span><span class="amt">${peso(cartTotals(D).total)}</span></button>` : ""}
      <nav class="tabs" aria-label="Main"><div class="in">${tabs.map(([k, l, i]) => `<button data-tab="${k}" class="${k === "sell" ? "sellbtn" : ""}" ${U.tab === k ? 'aria-current="page"' : ""}>${k === "sell" ? `<span class="pill">${ic(i)}</span>` : ic(i)}${l}</button>`).join("")}</div></nav>`;
  });
  if (renderedTab === U.tab + (U.sub || "")) window.scrollTo(0, y); else window.scrollTo(0, 0);
  renderedTab = U.tab + (U.sub || "");
  bind(D);
}
let renderedTab = "";

function header(D) {
  const n = PJ.pendingCount(), st = S.sync; const off = U.offline || navigator.onLine === false || st.state === "offline";
  const cls = st.busy ? "busy pending" : off ? (n ? "pending" : "") : st.state === "err" ? "err" : n ? "pending" : st.state === "ok" ? "ok" : "";
  const txt = st.busy ? "Syncing" : off ? (n ? `Offline · ${n} to send` : "Offline") : st.state === "err" ? "Sync issue" : n ? `${n} to send` : st.state === "ok" ? "Synced" : "Connecting";
  return `<header class="top"><div class="brand"><div class="jar">${ic("jar")}</div><div style="min-width:0"><h1>${esc(D.settings.shopName)}</h1><small>${esc(S.member.name || S.member.email || "")} · ${S.member.role}</small></div></div>
    <button class="sync ${cls}" id="syncbtn" aria-label="Sync status: ${txt}"><i></i>${txt}</button></header>`;
}

function screen(D) {
  if (U.sub === "sales") return salesScreen(D);
  if (U.sub === "expenses") return expensesScreen(D);
  if (U.sub === "purchases") return purchasesScreen(D);
  if (U.sub === "team") return teamScreen();
  if (U.sub === "settings") return settingsScreen(D);
  if (U.sub === "import") return importScreen(D);
  if (U.tab === "sell") return sellScreen(D);
  if (U.tab === "stock") return stockScreen(D);
  if (U.tab === "utang") return utangScreen(D);
  if (U.tab === "more") return moreScreen(D);
  return homeScreen(D);
}
const subHead = (title, extra = "") => `<div class="row" style="margin-top:2px"><button class="x" data-back aria-label="Back">${ic("back")}</button><h2 class="grow" style="font-size:22px;font-stretch:85%">${esc(title)}</h2>${extra}</div>`;

/* ================= home ================= */
const PERIODS = [["today", "Today"], ["week", "7 days"], ["month", "This month"], ["last", "Last month"], ["year", "This year"], ["all", "All time"]];
function periodRange(p) {
  const t = today(), d = new Date();
  if (p === "today") return [t, t];
  if (p === "week") { const s = new Date(); s.setDate(s.getDate() - 6); return [today(s), t]; }
  if (p === "month") return [t.slice(0, 8) + "01", t];
  if (p === "last") { const ym = shiftMonth(t.slice(0, 7), -1); return [ym + "-01", lastDay(ym)]; }
  if (p === "year") return [d.getFullYear() + "-01-01", t];
  return [null, null];
}
function homeScreen(D) {
  const own = isOwner(); const [f, t] = periodRange(U.period); const r = PJ.report(f, t);
  const low = D.products.filter(p => { const q = D.stockOf(p.id); return q <= (+p.low || 0); }).sort((a, b) => D.stockOf(a.id) - D.stockOf(b.id));
  const recent = D.allSales.slice(0, 6);
  const methods = Object.entries(r.byMethod).sort((a, b) => b[1] - a[1]);
  if (!D.products.length) return `<div class="card" style="padding:22px"><div class="eyebrow">Welcome</div><h2 style="font-size:24px;margin:6px 0 8px">Let's stock the shelves</h2>
    <p class="note" style="font-size:14px">${own ? "Bring over everything from your old Pickle Jar app, or start by adding products." : "The owner hasn't added products yet. Check back once they have."}</p>
    ${own ? `<div class="btns" style="margin-top:14px"><button class="btn primary" data-go="import">${ic("upload")} Import old app</button><button class="btn" data-act="new-product">${ic("plus")} Add product</button></div>` : ""}</div>`;
  return `
  <div class="chips" role="group" aria-label="Period">${PERIODS.map(([k, l]) => `<button class="chip" data-period="${k}" aria-pressed="${U.period === k}">${l}</button>`).join("")}</div>
  <section class="hero">
    <div class="eyebrow">Sales · ${esc(PERIODS.find(p => p[0] === U.period)[1])}</div>
    <div class="big">${peso(r.sales)}</div>
    <div class="muted" style="font-size:13px">${r.count} sale${r.count === 1 ? "" : "s"} · ${r.units} item${r.units === 1 ? "" : "s"}${r.discounts ? ` · ${peso(r.discounts)} discounts` : ""}</div>
    <div class="kpis">${own ? `
      <div><div class="eyebrow">Gross profit</div><div class="v gold">${peso(r.gross)}</div></div>
      <div><div class="eyebrow">Expenses</div><div class="v">${peso(r.expenses)}</div></div>
      <div><div class="eyebrow">Net profit</div><div class="v ${r.net < 0 ? "bad" : "good"}">${peso(r.net)}</div></div>` : `
      <div><div class="eyebrow">Money in</div><div class="v">${peso(r.moneyIn)}</div></div>
      <div><div class="eyebrow">New utang</div><div class="v warn">${peso(r.credit)}</div></div>
      <div><div class="eyebrow">Items</div><div class="v">${r.units}</div></div>`}
    </div>
  </section>
  <section class="card"><div class="section-h"><h2>Money in</h2><span class="amt">${peso(r.moneyIn)}</span></div>
    ${methods.length ? `<div class="list">${methods.map(([m, a]) => `<div class="li" style="padding:8px 2px"><span class="grow">${esc(m)}</span><span class="amt">${peso(a)}</span></div>`).join("")}</div>` : `<div class="note">No money received in this period.</div>`}
    <div class="sep"></div>
    <div class="row"><span class="grow note" style="font-size:13.5px">Utang collected: <b class="num" style="color:var(--ink)">${peso(r.collected)}</b></span><span class="note" style="font-size:13.5px">New utang: <b class="num warn">${peso(r.credit)}</b></span></div>
    <button class="li" data-tab="utang" style="padding-top:12px"><span class="grow"><span class="t">Total utang owed to the shop</span></span><span class="amt warn">${peso(D.utang)}</span>${ic("chev")}</button>
  </section>
  ${own ? `<section class="card"><div class="section-h"><h2>Inventory</h2><button class="link" data-tab="stock">Open stock</button></div>
    <div class="kpis" style="margin:0;padding:0;border:0"><div><div class="eyebrow">Units</div><div class="v">${D.inv.units}</div></div>
    <div><div class="eyebrow">At cost</div><div class="v">${peso(Math.round(D.inv.valueCost))}</div></div>
    <div><div class="eyebrow">At price</div><div class="v">${peso(Math.round(D.inv.valueRetail))}</div></div></div>
    ${r.sales ? `<div class="sep"></div><div class="row"><span class="grow note" style="font-size:13.5px">Average margin this period</span><span class="amt ${r.margin < D.settings.minMargin ? "warn" : "gold"}">${r.margin.toFixed(1)}%</span></div>` : ""}</section>` : ""}
  ${low.length ? `<section class="card"><div class="section-h"><h2>Restock soon</h2><button class="link" data-stockf="low">See all ${low.length}</button></div><div class="list">
    ${low.slice(0, 5).map(p => { const q = D.stockOf(p.id); return `<button class="li" data-product="${p.id}">${thumb(p)}<span class="grow"><span class="t ell" style="display:block">${esc(pname(p))}</span><span class="s">Alert at ${+p.low || 0}</span></span><span class="badge ${q <= 0 ? "out" : "low"}">${q <= 0 ? "Out" : q + " left"}</span></button>`; }).join("")}</div></section>` : ""}
  ${r.top.length ? `<section class="card"><div class="section-h"><h2>Best sellers</h2></div><div class="list">
    ${r.top.slice(0, 5).map(e => { const p = D.P.get(e.pid); return `<div class="li">${thumb(p || {name: e.name})}<span class="grow"><span class="t ell" style="display:block">${esc(p ? pname(p) : e.name)}</span><span class="s">${e.qty} sold${own ? ` · ${peso(e.profit)} profit` : ""}</span></span><span class="amt">${peso(e.sales)}</span></div>`; }).join("")}</div></section>` : ""}
  <section class="card"><div class="section-h"><h2>Latest sales</h2><button class="link" data-go="sales">All sales</button></div>
    ${recent.length ? `<div class="list">${recent.map(saleRow).join("")}</div>` : `<div class="empty">No sales yet. Tap <b>Sell</b> to make the first one.</div>`}</section>`;
}
function saleRow(s) {
  const left = PJ.derive().saleLeft.get(s.id) || 0;
  const n = (s.items || []).reduce((t, i) => t + i.qty, 0);
  return `<button class="li" data-sale="${s.id}"><span class="thumb" style="font-size:12px">${s.voided ? "✕" : initials(s.customer || "Walk in")}</span>
    <span class="grow"><span class="t ell" style="display:block;${s.voided ? "text-decoration:line-through;opacity:.6" : ""}">${esc(s.customer || "Walk-in")}</span>
    <span class="s">${fdate(s.date)}${s.at && !s.no?.startsWith("OLD") ? " " + ftime(s.at) : ""} · ${n} item${n === 1 ? "" : "s"} · ${s.voided ? "Voided" : esc(left > 0 ? "Utang" : s.method || "Cash")}${s._dirty ? " · not sent yet" : ""}</span></span>
    <span class="right"><span class="amt" style="display:block">${peso(s.total)}</span>${left > 0 && !s.voided ? `<span class="badge owe">${peso(left)} due</span>` : ""}</span></button>`;
}
function thumb(p) {
  if (p && p.photo) return `<span class="thumb"><img src="${esc(p.photo)}" alt="" loading="lazy"></span>`;
  return `<span class="thumb">${esc(initials(p?.brand || p?.name))}</span>`;
}

/* ================= sell ================= */
function categories(D) { const s = new Set(D.products.map(p => p.category).filter(Boolean)); return [...s].sort(); }
function sellScreen(D) {
  const cats = categories(D);
  return `<div class="search">${ic("search")}<input id="sell-q" type="search" placeholder="Search paddles, balls, bags…" value="${esc(U.sellQ)}" autocomplete="off" enterkeyhint="search"></div>
    ${cats.length > 1 ? `<div class="chips"><button class="chip" data-cat="" aria-pressed="${!U.sellCat}">All</button>${cats.map(c => `<button class="chip" data-cat="${esc(c)}" aria-pressed="${U.sellCat === c}">${esc(c)}</button>`).join("")}</div>` : ""}
    <div id="sell-res">${sellResults(D)}</div>`;
}
function sellResults(D) {
  const q = U.sellQ.trim().toLowerCase();
  const items = D.products.filter(p => (!U.sellCat || p.category === U.sellCat) && (!q || [p.name, p.brand, p.model, p.sku, p.category, ...(p.variants || []).map(v => v.name)].join(" ").toLowerCase().includes(q)));
  if (!D.products.length) return `<div class="empty">No products yet.${isOwner() ? ` <button class="link" data-act="new-product">Add one</button>` : ""}</div>`;
  if (!items.length) return `<div class="empty">Nothing matches “${esc(U.sellQ)}”.</div>`;
  items.sort((a, b) => (D.stockOf(b.id) > 0) - (D.stockOf(a.id) > 0));
  return `<div class="pgrid">${items.map(p => {
    const q = D.stockOf(p.id); const inCart = U.cart.items.filter(i => i.pid === p.id).reduce((t, i) => t + i.qty, 0);
    return `<button class="pcard" data-add="${p.id}">${inCart ? `<span class="incart">${inCart}</span>` : ""}
      <span class="img">${p.photo ? `<img src="${esc(p.photo)}" alt="" loading="lazy">` : esc(initials(p.brand || p.name))}</span>
      <span class="nm">${esc(pname(p))}</span>
      ${(p.variants || []).length ? `<span>${p.variants.map(v => `<span class="vchip"><i style="background:${esc(v.color || "var(--muted)")}"></i>${D.stockOf(p.id, v.name)}</span>`).join("")}</span>` : ""}
      <span class="row" style="margin-top:auto"><span class="pr grow">${peso(p.price)}</span><span class="badge ${q <= 0 ? "out" : q <= (+p.low || 0) ? "low" : ""}">${q <= 0 ? "Out" : q + " left"}</span></span></button>`;
  }).join("")}</div>`;
}
function addToCart(pid, v, list = "items") {
  const D = PJ.derive(); const p = D.P.get(pid); if (!p) return;
  const arr = U.cart[list]; const line = arr.find(i => i.pid === pid && (i.v || "") === (v || ""));
  if (line) line.qty++; else arr.push(list === "items" ? {pid, v: v || "", qty: 1, price: +p.price || 0} : {pid, v: v || "", qty: 1});
  saveCart();
}
function pickVariant(p, cb, title) {
  const D = PJ.derive();
  openSheet(title || pname(p), `<p class="note" style="margin-top:-6px">Which one?</p><div class="list">${p.variants.map(v => { const q = D.stockOf(p.id, v.name);
    return `<button class="li" data-v="${esc(v.name)}"><span class="thumb" style="background:${esc(v.color || "var(--surface-2)")};color:#111">${esc(initials(v.name))}</span><span class="grow t">${esc(v.name)}</span><span class="badge ${q <= 0 ? "out" : ""}">${q <= 0 ? "Out" : q + " left"}</span></button>`; }).join("")}
    ${D.stockOf(p.id, "") > 0 ? `<button class="li" data-v=""><span class="thumb">?</span><span class="grow t">Not specified</span><span class="badge">${D.stockOf(p.id, "")} left</span></button>` : ""}</div>`,
    b => $$("[data-v]", b).forEach(x => x.onclick = () => { closeSheet(); cb(x.dataset.v); }));
}
function cartTotals(D) {
  const c = U.cart; let sub = 0, cogs = 0, fc = 0;
  for (const i of c.items) { sub += i.qty * num(i.price); cogs += i.qty * (+D.P.get(i.pid)?.cost || 0); }
  for (const i of c.freebies) fc += i.qty * (+D.P.get(i.pid)?.cost || 0);
  const disc = Math.min(num(c.disc), sub); const total = r2(sub - disc);
  const paid = c.credit ? 0 : c.paid === "" ? total : Math.min(num(c.paid), total);
  return {sub: r2(sub), disc: r2(disc), total, paid: r2(paid), owe: r2(total - paid), cogs: r2(cogs), fc: r2(fc), profit: r2(total - cogs - fc)};
}
const doneLabel = t => `${t.owe > 0 ? "Save sale + utang" : "Complete sale"} · ${peso(t.total)}`;
function coTotals(t, c, own) {
  return `<span class="muted">Subtotal</span><span class="amt">${peso(t.sub)}</span>
        ${t.disc ? `<span class="muted">Discount</span><span class="amt">−${peso(t.disc)}</span>` : ""}
        <span class="grand">Total</span><span class="amt grand">${peso(t.total)}</span>
        <span class="muted">Paid now${t.paid ? " · " + esc(c.method) : ""}</span><span class="amt">${peso(t.paid)}</span>
        ${t.owe > 0 ? `<span class="warn" style="font-weight:700">Goes to utang</span><span class="amt warn">${peso(t.owe)}</span>` : ""}
        ${own ? `<span class="muted">Profit</span><span class="amt ${t.profit < 0 ? "bad" : "gold"}">${peso(t.profit)}</span>` : ""}`;
}
function checkoutSheet() {
  const D = PJ.derive();
  openSheet("Review sale", `<div id="co"></div>`, b => {
    const co = $("#co", b);
    const draw = () => keepFocus(() => {
      const D = PJ.derive(); const c = U.cart; const t = cartTotals(D); const own = isOwner();
      const custs = D.customers.map(x => x.name);
      co.innerHTML = `
      <div class="list">${c.items.map((i, k) => { const p = D.P.get(i.pid); const st = D.stockOf(i.pid, (p?.variants || []).length ? i.v : undefined);
        const m = num(i.price) ? (num(i.price) - (+p?.cost || 0)) / num(i.price) * 100 : 0;
        return `<div class="li" style="align-items:flex-start">${thumb(p)}<div class="grow"><div class="t">${esc(pname(p, i.v))}</div>
          <div class="row" style="margin-top:6px;gap:8px"><span class="muted" style="font-size:13px">₱</span><input class="in-text num" style="min-height:36px;padding:6px 10px;width:110px" id="pr-${k}" data-price="${k}" inputmode="decimal" value="${esc(i.price)}" aria-label="Price">
          ${own && p ? `<span class="badge ${m < D.settings.minMargin ? "low" : "ok"}" id="mg-${k}">${m.toFixed(0)}%</span>` : ""}</div>
          ${i.qty > st ? `<div class="s warn" style="margin-top:4px">Only ${Math.max(0, st)} in stock</div>` : ""}</div>
          <div class="stepper"><button data-dec="${k}" aria-label="Less">−</button><span>${i.qty}</span><button data-inc="${k}" aria-label="More">+</button></div></div>`; }).join("")}</div>
      <div class="sep"></div>
      <div class="section-h" style="margin:0 0 6px"><h2 style="font-size:15px">${ic("gift")} Freebies</h2><button class="link" id="add-free">+ Add freebie</button></div>
      ${c.freebies.length ? `<div class="list">${c.freebies.map((i, k) => { const p = D.P.get(i.pid); return `<div class="li"><span class="grow t" style="font-weight:600">${esc(pname(p, i.v))}</span>${own ? `<span class="s">cost ${peso((+p?.cost || 0) * i.qty)}</span>` : ""}<div class="stepper"><button data-fdec="${k}" aria-label="Less">−</button><span>${i.qty}</span><button data-finc="${k}" aria-label="More">+</button></div></div>`; }).join("")}</div>` : `<div class="note">Free grip, edge tape… they come out of stock but not out of the price.</div>`}
      <div class="sep"></div>
      <div class="field"><label for="co-cust">Customer <span id="co-cl">${t.owe > 0 ? '<span class="warn">(needed for utang)</span>' : "(optional)"}</span></label>
        <input class="in-text" id="co-cust" list="cust-list" value="${esc(c.customer)}" autocomplete="off" placeholder="Walk-in"><datalist id="cust-list">${custs.map(n => `<option value="${esc(n)}">`).join("")}</datalist></div>
      <div class="two"><div class="field"><label for="co-disc">Discount</label><input class="in-text num" id="co-disc" inputmode="decimal" value="${esc(c.disc)}" placeholder="0"></div>
        <div class="field"><label for="co-paid">Amount paid now</label><input class="in-text num" id="co-paid" inputmode="decimal" value="${esc(c.credit ? "0" : c.paid)}" placeholder="${t.total}" ${c.credit ? "disabled" : ""}></div></div>
      <div class="lbl" style="margin-bottom:6px">Paid by</div>
      <div class="seg" style="margin-bottom:10px">${METHODS.map(m => `<button class="chip" data-method="${m}" aria-pressed="${!c.credit && c.method === m}">${m}</button>`).join("")}<button class="chip" data-credit aria-pressed="${c.credit}">All utang</button></div>
      <div class="field"><label for="co-notes">Note (optional)</label><input class="in-text" id="co-notes" value="${esc(c.notes)}" placeholder="e.g. reserved, delivery"></div>
      <div class="card" style="background:var(--surface-2)"><div class="totals" id="co-tot">${coTotals(t, c, own)}</div></div>
      <div class="err" id="co-err" style="margin:8px 0"></div>
      <div class="btns"><button class="btn" id="co-clear">Clear</button><button class="btn primary" id="co-done" style="flex:2">${doneLabel(t)}</button></div>`;
      wire();
    });
    const wire = () => {
      const c = U.cart;
      $$("[data-inc]", co).forEach(x => x.onclick = () => { c.items[+x.dataset.inc].qty++; saveCart(); draw(); });
      $$("[data-dec]", co).forEach(x => x.onclick = () => { const k = +x.dataset.dec; if (--c.items[k].qty <= 0) c.items.splice(k, 1); saveCart(); if (!c.items.length) { closeSheet(); render(); } else draw(); });
      $$("[data-finc]", co).forEach(x => x.onclick = () => { c.freebies[+x.dataset.finc].qty++; saveCart(); draw(); });
      $$("[data-fdec]", co).forEach(x => x.onclick = () => { const k = +x.dataset.fdec; if (--c.freebies[k].qty <= 0) c.freebies.splice(k, 1); saveCart(); draw(); });
      $$("[data-price]", co).forEach(x => x.oninput = () => { c.items[+x.dataset.price].price = x.value; saveCart(); upd(); });
      $$("[data-method]", co).forEach(x => x.onclick = () => { c.method = x.dataset.method; c.credit = false; saveCart(); draw(); });
      $("[data-credit]", co).onclick = () => { c.credit = !c.credit; if (c.credit) c.paid = ""; saveCart(); draw(); };
      $("#co-cust", co).oninput = e => { c.customer = e.target.value; saveCart(); };
      $("#co-disc", co).oninput = e => { c.disc = e.target.value; saveCart(); upd(); };
      $("#co-paid", co).oninput = e => { c.paid = e.target.value; saveCart(); upd(); };
      $("#co-notes", co).oninput = e => { c.notes = e.target.value; saveCart(); };
      $("#co-clear", co).onclick = () => { U.cart = newCart(); saveCart(); closeSheet(); render(); };
      $("#add-free", co).onclick = () => productPicker("Add a freebie", (pid, v) => { addToCart(pid, v, "freebies"); checkoutSheet(); }, () => checkoutSheet());
      $("#co-done", co).onclick = completeSale;
    };
    // refresh just the numbers while typing (a full redraw would swallow the tap on "Complete sale")
    const upd = () => {
      const D = PJ.derive(); const c = U.cart; const t = cartTotals(D);
      $("#co-tot", co).innerHTML = coTotals(t, c, isOwner()); $("#co-done", co).textContent = doneLabel(t);
      $("#co-cl", co).innerHTML = t.owe > 0 ? '<span class="warn">(needed for utang)</span>' : "(optional)";
      $("#co-paid", co).placeholder = t.total;
      c.items.forEach((i, k) => { const el = $("#mg-" + k, co); const p = D.P.get(i.pid); if (!el || !p) return; const pr = num(i.price); const m = pr ? (pr - (+p.cost || 0)) / pr * 100 : 0;
        el.textContent = m.toFixed(0) + "%"; el.className = "badge " + (m < D.settings.minMargin ? "low" : "ok"); });
    };
    draw();
  });
}
function productPicker(title, cb, onCancel) {
  const D = PJ.derive();
  const rows = q => D.products.filter(p => !q || pname(p).toLowerCase().includes(q.toLowerCase())).sort((a, b) => (a.category === "Accessories" ? -1 : 0) - (b.category === "Accessories" ? -1 : 0))
    .map(p => `<button class="li" data-pick="${p.id}">${thumb(p)}<span class="grow"><span class="t ell" style="display:block">${esc(pname(p))}</span><span class="s">${esc(p.category || "")}</span></span><span class="badge">${D.stockOf(p.id)} left</span></button>`).join("") || `<div class="empty">No match</div>`;
  openSheet(title, `<div class="search" style="margin-bottom:8px">${ic("search")}<input id="pk-q" placeholder="Search" autocomplete="off"></div><div class="list" id="pk-l">${rows("")}</div>`, b => {
    const wire = () => $$("[data-pick]", b).forEach(x => x.onclick = () => { const p = D.P.get(x.dataset.pick); closeSheet(true);
      if ((p.variants || []).length) pickVariant(p, v => cb(p.id, v)); else cb(p.id, ""); });
    $("#pk-q", b).oninput = e => { $("#pk-l", b).innerHTML = rows(e.target.value); wire(); };
    $("[data-x]", b.parentElement).onclick = () => { closeSheet(true); if (onCancel) onCancel(); };
    wire();
  });
}
let saving = false;
async function completeSale() {
  if (saving) return;
  const D = PJ.derive(); const c = U.cart; const t = cartTotals(D); const err = $("#co-err");
  if (!c.items.length) return;
  if (t.owe > 0 && !c.customer.trim()) { err.textContent = "Add the customer's name so we know who owes the balance."; $("#co-cust").focus(); return; }
  if (c.items.some(i => num(i.price) <= 0)) { err.textContent = "Every item needs a price."; return; }
  saving = true;
  try {
    const d = new Date(); const no = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const data = {
      no, date: today(), at: d.toISOString(), customer: c.customer.trim(),
      items: c.items.map(i => { const p = D.P.get(i.pid); return {pid: i.pid, v: i.v || "", name: pname(p), qty: i.qty, price: r2(num(i.price)), cost: r2(+p?.cost || 0)}; }),
      freebies: c.freebies.map(i => { const p = D.P.get(i.pid); return {pid: i.pid, v: i.v || "", name: pname(p), qty: i.qty, cost: r2(+p?.cost || 0)}; }),
      disc: t.disc, total: t.total, cogs: t.cogs, freebieCost: t.fc, method: t.paid > 0 ? c.method : "", paid: t.paid, notes: c.notes.trim(),
      by: S.member.name || S.member.email || "", byId: S.user.id, voided: false
    };
    const rec = await PJ.put("sale", data);
    U.cart = newCart(); saveCart(); closeSheet(true);
    render(); receiptSheet({id: rec.id, ...data}, true);
  } finally { saving = false; }
}
function receiptText(s) {
  const D = PJ.derive(); const L = []; const left = D.saleLeft.get(s.id) ?? r2(s.total - s.paid);
  L.push(D.settings.shopName.toUpperCase(), `Receipt #${s.no}`, new Date(s.at || s.date).toLocaleString("en-PH", {dateStyle: "medium", timeStyle: s.no?.startsWith("OLD") ? undefined : "short"}));
  if (s.customer) L.push(`Customer: ${s.customer}`);
  L.push("------------------------------");
  for (const i of s.items) L.push(`${i.qty} × ${i.name}${i.v ? " (" + i.v + ")" : ""}`, `    ${peso(i.price)}${i.qty > 1 ? " each = " + peso(i.qty * i.price) : ""}`);
  for (const i of s.freebies || []) L.push(`FREE: ${i.qty} × ${i.name}${i.v ? " (" + i.v + ")" : ""}`);
  L.push("------------------------------");
  if (s.disc) L.push(`Discount: −${peso(s.disc)}`);
  L.push(`TOTAL: ${peso(s.total)}`);
  if (s.paid) L.push(`Paid${s.method ? " (" + s.method + ")" : ""}: ${peso(s.paid)}`);
  if (left > 0) L.push(`Balance due: ${peso(left)}`);
  if (D.settings.receiptFooter) L.push("", D.settings.receiptFooter);
  return L.join("\n");
}
async function shareText(text, title) {
  try { if (navigator.share) { await navigator.share({title, text}); return; } } catch (e) { if (e.name === "AbortError") return; }
  try { await navigator.clipboard.writeText(text); toast("Receipt copied — paste it in Messenger"); } catch { toast("Couldn't share on this phone", true); }
}
function receiptSheet(s, fresh) {
  const D = PJ.derive(); const own = isOwner(); const left = D.saleLeft.get(s.id) ?? r2(s.total - s.paid);
  const canVoid = !s.voided && (own || (s.byId === S.user.id && s.date === today()));
  const profit = r2(s.total - (s.cogs || 0) - (s.freebieCost || 0));
  openSheet(fresh ? "Sale saved ✓" : `Sale #${s.no}`, `
    ${s.voided ? `<div class="badge out" style="margin-bottom:10px">Voided${s.voidReason ? " — " + esc(s.voidReason) : ""}</div>` : ""}
    <div class="receipt">${esc(receiptText(s))}</div>
    <p class="note" style="margin:8px 0 0">Rung up by ${esc(s.by || "—")}${own && !s.voided ? ` · profit <b class="gold num">${peso(profit)}</b>` : ""}${PJ.S.recs.get(s.id)?._dirty ? " · waiting to sync" : ""}</p>
    <div class="btns" style="margin-top:14px"><button class="btn" id="rc-share">${ic("share")} Send receipt</button>${fresh ? `<button class="btn primary" data-x>New sale</button>` : left > 0 && !s.voided ? `<button class="btn primary" id="rc-pay">Record payment</button>` : ""}</div>
    ${canVoid && !fresh ? `<button class="btn danger block" id="rc-void" style="margin-top:10px">Void this sale</button>` : ""}`, b => {
    $("#rc-share", b).onclick = () => shareText(receiptText(s), "Receipt " + s.no);
    if ($("#rc-pay", b)) $("#rc-pay", b).onclick = () => { const c = D.customers.find(x => x.key === PJ.custKey(s.customer)); if (c) paymentSheet(c); };
    if ($("#rc-void", b)) $("#rc-void", b).onclick = () => openSheet("Void sale?", `<p class="note" style="font-size:14px;color:var(--ink)">The items go back into stock and the sale stops counting in reports${left > 0 ? " and utang" : ""}. ${s.paid ? `Return the ${peso(s.paid)} the customer paid if needed.` : ""}</p>
      <div class="field"><label for="vd-r">Reason</label><input class="in-text" id="vd-r" placeholder="e.g. wrong item, customer returned"></div>
      <div class="btns"><button class="btn" data-x>Keep sale</button><button class="btn danger" id="vd-ok">Void sale</button></div>`, b2 => {
      $("#vd-ok", b2).onclick = async () => { const rec = PJ.get(s.id); await PJ.put("sale", {...rec.data, voided: true, voidReason: $("#vd-r", b2).value.trim(), voidedBy: S.member.name || S.member.email, voidedAt: new Date().toISOString()}, s.id); closeSheet(); toast("Sale voided — stock returned"); };
    });
  });
}

/* ================= stock ================= */
function stockScreen(D) {
  const own = isOwner(); const cats = categories(D);
  return `<div class="row"><div class="grow"><div class="eyebrow">In stock</div><div class="num" style="font-size:26px;font-weight:600">${D.inv.units} <span class="muted" style="font-size:14px">units</span></div></div>
      ${own ? `<div class="right"><div class="eyebrow">Value at cost</div><div class="num" style="font-size:17px;font-weight:600">${peso(Math.round(D.inv.valueCost))}</div></div>` : ""}</div>
    <div class="row"><div class="search grow">${ic("search")}<input id="stock-q" type="search" placeholder="Search stock" value="${esc(U.stockQ)}" autocomplete="off"></div>${own ? `<button class="btn primary" data-act="new-product" aria-label="Add product">${ic("plus")}</button>` : ""}</div>
    <div class="chips">${[["all", "All"], ["low", "Low"], ["out", "Out"]].map(([k, l]) => `<button class="chip" data-stockf="${k}" aria-pressed="${U.stockF === k}">${l}</button>`).join("")}${cats.map(c => `<button class="chip" data-stockf="c:${esc(c)}" aria-pressed="${U.stockF === "c:" + c}">${esc(c)}</button>`).join("")}</div>
    <div id="stock-res">${stockResults(D)}</div>`;
}
function stockResults(D) {
  const own = isOwner(); const q = U.stockQ.trim().toLowerCase(); const f = U.stockF;
  const items = D.products.filter(p => {
    const s = D.stockOf(p.id);
    if (f === "low" && !(s <= (+p.low || 0))) return false;
    if (f === "out" && s > 0) return false;
    if (f.startsWith("c:") && p.category !== f.slice(2)) return false;
    return !q || [p.name, p.brand, p.model, p.sku, p.category].join(" ").toLowerCase().includes(q);
  });
  if (!items.length) return `<div class="empty">${D.products.length ? "Nothing here." : "No products yet."}</div>`;
  return `<div class="card" style="padding:4px 12px"><div class="list">${items.map(p => { const s = D.stockOf(p.id);
    return `<button class="li" data-product="${p.id}">${thumb(p)}<span class="grow"><span class="t ell" style="display:block">${esc(pname(p))}</span>
      <span class="s">${(p.variants || []).length ? p.variants.map(v => `<span class="vchip"><i style="background:${esc(v.color || "var(--muted)")}"></i>${esc(v.name)} ${D.stockOf(p.id, v.name)}</span>`).join("") : esc([p.brand, p.category].filter(Boolean).join(" · "))}</span></span>
      <span class="right"><span class="badge ${s <= 0 ? "out" : s <= (+p.low || 0) ? "low" : "ok"}">${s}</span><span class="s num" style="display:block;margin-top:3px">${peso(p.price)}</span>${own ? `<span class="s num" style="display:block">cost ${peso(Math.round(p.cost || 0))}</span>` : ""}</span></button>`; }).join("")}</div></div>`;
}
function productSheet(pid) {
  const D = PJ.derive(); const p = D.P.get(pid); if (!p) return;
  const own = isOwner(); const s = D.stockOf(p.id); const m = p.price ? (p.price - (p.cost || 0)) / p.price * 100 : 0;
  const mv = (D.moves.get(p.id) || []).slice(0, 40);
  openSheet(pname(p), `
    <div class="row" style="align-items:flex-start;gap:14px">
      <span class="thumb" style="width:84px;height:84px;border-radius:16px;font-size:26px">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : esc(initials(p.brand || p.name))}</span>
      <div class="grow"><div class="muted" style="font-size:13px">${esc([p.brand, p.category, p.sku].filter(Boolean).join(" · "))}</div>
        <div class="num" style="font-size:24px;font-weight:600;margin-top:4px">${peso(p.price)}</div>
        ${own ? `<div class="note">Cost ${peso(p.cost || 0)} · <span class="${m < D.settings.minMargin ? "warn" : "gold"}">${m.toFixed(1)}% margin</span> · ${peso((p.price || 0) - (p.cost || 0))} per sale</div>` : ""}
      </div></div>
    <div class="card" style="background:var(--surface-2);margin-top:14px"><div class="row"><span class="grow"><span class="eyebrow">On hand</span><div class="num" style="font-size:22px;font-weight:600">${s}</div></span>
      ${own ? `<span class="right"><span class="eyebrow">Value</span><div class="num" style="font-weight:600">${peso(r2(Math.max(0, s) * (p.cost || 0)))}</div></span>` : ""}</div>
      ${(p.variants || []).length ? `<div class="seg" style="margin-top:10px">${p.variants.map(v => `<span class="chip"><span class="dot" style="background:${esc(v.color || "var(--muted)")}"></span>${esc(v.name)}: <b class="num">${D.stockOf(p.id, v.name)}</b></span>`).join("")}${D.stockOf(p.id, "") ? `<span class="chip">Unassigned: <b class="num">${D.stockOf(p.id, "")}</b></span>` : ""}</div>` : ""}
    </div>
    ${p.notes ? `<p class="note">${esc(p.notes)}</p>` : ""}
    <div class="btns" style="margin-top:14px"><button class="btn primary" id="ps-sell">${ic("cart")} Sell</button>${own ? `<button class="btn" id="ps-adj">Adjust stock</button><button class="btn" id="ps-edit" aria-label="Edit">${ic("edit")}</button>` : ""}</div>
    <div class="section-h" style="margin-top:18px"><h2 style="font-size:15px">History</h2></div>
    ${mv.length ? `<div class="list">${mv.map(x => `<div class="li" style="padding:8px 2px"><span class="grow"><span class="t" style="font-weight:600;font-size:14px">${esc(x.what)}${x.v ? ` <span class="muted">(${esc(x.v)})</span>` : ""}</span><span class="s" style="display:block">${fdate(x.date)}${x.sub ? " · " + esc(x.sub) : ""}</span></span><span class="amt ${x.qty > 0 ? "good" : ""}">${x.qty > 0 ? "+" : ""}${x.qty}</span></div>`).join("")}</div>` : `<div class="note">No stock movements yet.</div>`}`, b => {
    $("#ps-sell", b).onclick = () => { closeSheet(true); const go = v => { addToCart(p.id, v); U.tab = "sell"; U.sub = null; pref.set("tab", "sell"); render(); toast("Added to sale"); };
      if ((p.variants || []).length) pickVariant(p, go); else go(""); };
    if ($("#ps-adj", b)) $("#ps-adj", b).onclick = () => adjustSheet(p);
    if ($("#ps-edit", b)) $("#ps-edit", b).onclick = () => productForm(p);
  });
}
function adjustSheet(p) {
  const D = PJ.derive(); const vs = p.variants || []; let mode = "set";
  const REASONS = ["Count correction", "Damaged", "Returned by customer", "Demo / personal use", "Other"];
  openSheet("Adjust stock", `<p class="note" style="margin-top:-6px">${esc(pname(p))}</p>
    ${vs.length ? `<div class="field"><label for="aj-v">Which variant</label><select class="in-text" id="aj-v">${vs.map(v => `<option value="${esc(v.name)}">${esc(v.name)} (${D.stockOf(p.id, v.name)})</option>`).join("")}${D.stockOf(p.id, "") ? `<option value="">Unassigned (${D.stockOf(p.id, "")})</option>` : ""}</select></div>` : ""}
    <div class="seg" style="margin-bottom:12px">${[["set", "Set count to"], ["add", "Add"], ["remove", "Remove"]].map(([k, l]) => `<button class="chip" data-mode="${k}" aria-pressed="${k === mode}">${l}</button>`).join("")}</div>
    <div class="field"><label for="aj-q" id="aj-ql">Actual count on the shelf</label><input class="in-text in-money" id="aj-q" inputmode="numeric" placeholder="0"></div>
    <div class="lbl" style="margin-bottom:6px">Reason</div><div class="seg" style="margin-bottom:12px">${REASONS.map((r, i) => `<button class="chip" data-reason="${r}" aria-pressed="${i === 0}">${r}</button>`).join("")}</div>
    <div class="field"><label for="aj-n">Note</label><input class="in-text" id="aj-n" placeholder="Optional"></div>
    <div class="err" id="aj-err"></div><button class="btn primary block" id="aj-ok">Save</button>`, b => {
    let reason = REASONS[0];
    $$("[data-mode]", b).forEach(x => x.onclick = () => { mode = x.dataset.mode; $$("[data-mode]", b).forEach(y => y.setAttribute("aria-pressed", y === x)); $("#aj-ql", b).textContent = mode === "set" ? "Actual count on the shelf" : mode === "add" ? "How many to add" : "How many to remove"; });
    $$("[data-reason]", b).forEach(x => x.onclick = () => { reason = x.dataset.reason; $$("[data-reason]", b).forEach(y => y.setAttribute("aria-pressed", y === x)); });
    $("#aj-ok", b).onclick = async () => {
      const v = vs.length ? $("#aj-v", b).value : ""; const n = Math.round(num($("#aj-q", b).value));
      const cur = vs.length ? D.stockOf(p.id, v) : D.stockOf(p.id, "");
      const qty = mode === "set" ? n - cur : mode === "add" ? n : -n;
      if ($("#aj-q", b).value.trim() === "" || (mode !== "set" && n <= 0)) return $("#aj-err", b).textContent = "Enter a number.";
      if (!qty) { closeSheet(); return toast("Count already matches"); }
      await PJ.put("adjust", {pid: p.id, v, qty, reason, notes: $("#aj-n", b).value.trim(), date: today(), by: S.member.name || S.member.email});
      closeSheet(); toast(`Stock ${qty > 0 ? "+" : ""}${qty}`);
    };
  });
}
function compressPhoto(file) {
  return new Promise((res, rej) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { const max = 480; const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); res(c.toDataURL("image/jpeg", .72)); };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("Couldn't read that photo")); }; img.src = url;
  });
}
function productForm(p) {
  const D = PJ.derive(); const isNew = !p; p = p ? {...p, variants: [...(p.variants || []).map(v => ({...v}))]} : {name: "", brand: "", category: "", model: "", sku: "", price: "", cost: "", low: 2, notes: "", photo: "", variants: []};
  const cats = [...new Set([...D.settings.categories, ...categories(D)])];
  openSheet(isNew ? "New product" : "Edit product", `
    <div class="row" style="gap:14px;margin-bottom:12px"><label class="thumb" style="width:76px;height:76px;border-radius:16px;cursor:pointer" id="pf-ph">${p.photo ? `<img src="${esc(p.photo)}" alt="">` : ic("camera")}<input type="file" accept="image/*" id="pf-file" hidden></label>
      <div class="grow"><div class="field" style="margin:0"><label for="pf-name">Name</label><input class="in-text" id="pf-name" value="${esc(p.name)}" placeholder="e.g. JOOLA Gen 5"></div></div></div>
    <div class="two"><div class="field"><label for="pf-brand">Brand</label><input class="in-text" id="pf-brand" value="${esc(p.brand)}"></div>
      <div class="field"><label for="pf-model">Model / edition</label><input class="in-text" id="pf-model" value="${esc(p.model)}" placeholder="optional"></div></div>
    <div class="two"><div class="field"><label for="pf-cat">Category</label><input class="in-text" id="pf-cat" list="pf-cats" value="${esc(p.category)}"><datalist id="pf-cats">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist></div>
      <div class="field"><label for="pf-sku">SKU / code</label><input class="in-text" id="pf-sku" value="${esc(p.sku)}" placeholder="optional"></div></div>
    <div class="two"><div class="field"><label for="pf-cost">Cost (landed)</label><input class="in-text num" id="pf-cost" inputmode="decimal" value="${esc(p.cost)}"></div>
      <div class="field"><label for="pf-price">Selling price</label><input class="in-text num" id="pf-price" inputmode="decimal" value="${esc(p.price)}"></div></div>
    <div class="row" style="margin:-4px 0 12px;gap:8px"><span class="note grow" id="pf-m"></span><span class="note">Price for</span><input class="in-text num" id="pf-mg" inputmode="decimal" style="width:64px;min-height:36px;padding:6px 8px" placeholder="${D.settings.minMargin}"><span class="note">% margin</span><button class="btn" id="pf-mgo" style="min-height:36px;padding:6px 10px">Set</button></div>
    <div class="field"><label for="pf-low">Warn me when stock is at or below</label><input class="in-text num" id="pf-low" inputmode="numeric" value="${esc(p.low)}"></div>
    <div class="lbl" style="margin-bottom:6px">Variants (colors / designs)</div>
    <div class="seg" id="pf-vs" style="margin-bottom:8px"></div>
    <div class="row" style="margin-bottom:12px"><input class="in-text grow" id="pf-vn" placeholder="e.g. Cherry Blossom"><button class="btn" id="pf-va">Add</button></div>
    <div class="field"><label for="pf-notes">Notes</label><input class="in-text" id="pf-notes" value="${esc(p.notes)}"></div>
    <div class="err" id="pf-err"></div>
    <button class="btn primary block" id="pf-save">${isNew ? "Add product" : "Save changes"}</button>
    ${!isNew ? `<button class="btn danger block" id="pf-del" style="margin-top:10px">Delete product</button>` : ""}`, b => {
    const drawV = () => { $("#pf-vs", b).innerHTML = p.variants.map((v, i) => `<span class="chip"><span class="dot" style="background:${esc(v.color)}"></span>${esc(v.name)} <button data-vx="${i}" aria-label="Remove ${esc(v.name)}" style="border:0;background:none;padding:0 0 0 6px;color:var(--muted)">✕</button></span>`).join("") || `<span class="note">None — leave empty if there's only one design.</span>`;
      $$("[data-vx]", b).forEach(x => x.onclick = () => { const v = p.variants[+x.dataset.vx]; if (!isNew && PJ.derive().stockOf(p.id, v.name)) return toast(`Can't remove ${v.name}: it still has stock`, true); p.variants.splice(+x.dataset.vx, 1); drawV(); }); };
    const drawM = () => { const c = num($("#pf-cost", b).value), pr = num($("#pf-price", b).value); $("#pf-m", b).innerHTML = pr ? `Margin <b class="${(pr - c) / pr * 100 < D.settings.minMargin ? "warn" : "gold"}">${((pr - c) / pr * 100).toFixed(1)}%</b>` : ""; };
    drawV(); drawM();
    $("#pf-cost", b).oninput = drawM; $("#pf-price", b).oninput = drawM;
    $("#pf-mgo", b).onclick = () => { const mg = num($("#pf-mg", b).value || D.settings.minMargin); const c = num($("#pf-cost", b).value); if (!c || mg >= 100) return; $("#pf-price", b).value = Math.ceil(c / (1 - mg / 100) / 10) * 10; drawM(); };
    $("#pf-va", b).onclick = () => { const n = $("#pf-vn", b).value.trim(); if (!n || p.variants.some(v => v.name.toLowerCase() === n.toLowerCase())) return; p.variants.push({name: n, color: VCOLORS[p.variants.length % VCOLORS.length]}); $("#pf-vn", b).value = ""; drawV(); };
    $("#pf-vn", b).onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); $("#pf-va", b).click(); } };
    $("#pf-file", b).onchange = async e => { const f = e.target.files[0]; if (!f) return; try { p.photo = await compressPhoto(f); $("#pf-ph", b).firstChild.replaceWith(Object.assign(document.createElement("img"), {src: p.photo, alt: ""})); } catch (ex) { toast(ex.message, true); } };
    $("#pf-save", b).onclick = async () => {
      const data = {name: $("#pf-name", b).value.trim(), brand: $("#pf-brand", b).value.trim(), model: $("#pf-model", b).value.trim(), category: $("#pf-cat", b).value.trim(), sku: $("#pf-sku", b).value.trim(),
        cost: r2(num($("#pf-cost", b).value)), price: r2(num($("#pf-price", b).value)), low: Math.round(num($("#pf-low", b).value)), notes: $("#pf-notes", b).value.trim(), photo: p.photo || "", variants: p.variants};
      if (!data.name) return $("#pf-err", b).textContent = "Give the product a name.";
      if (!data.price) return $("#pf-err", b).textContent = "Add a selling price.";
      await PJ.put("product", data, isNew ? undefined : p.id); closeSheet(); toast(isNew ? "Product added" : "Saved");
    };
    if ($("#pf-del", b)) $("#pf-del", b).onclick = () => { const st = PJ.derive().stockOf(p.id);
      confirmSheet("Delete product?", `${esc(pname(p))} will disappear from Sell and Stock.${st ? ` It still shows <b>${st}</b> in stock.` : ""} Past sales keep their records.`, "Delete", async () => { await PJ.remove(p.id); toast("Product deleted"); }, true); };
  });
}

/* ================= utang ================= */
function utangScreen(D) {
  const q = U.utQ.trim().toLowerCase();
  const owing = D.customers.filter(c => c.owed > 0.004).sort((a, b) => b.owed - a.owed);
  const settled = D.customers.filter(c => c.owed <= 0.004 && (c.charged > 0 || c.paid > 0));
  const f = arr => arr.filter(c => !q || c.name.toLowerCase().includes(q));
  return `<section class="hero"><div class="eyebrow">Owed to the shop</div><div class="big warn">${peso(D.utang)}</div>
      <div class="muted" style="font-size:13px">${owing.length} customer${owing.length === 1 ? "" : "s"} with a balance</div></section>
    <div class="search">${ic("search")}<input id="ut-q" type="search" placeholder="Search customer" value="${esc(U.utQ)}" autocomplete="off"></div>
    <div id="ut-res">${utResults(f(owing), f(settled))}</div>`;
}
function utResults(owing, settled) {
  const row = c => `<button class="li" data-cust="${esc(c.key)}"><span class="thumb" style="font-size:13px">${esc(initials(c.name))}</span><span class="grow"><span class="t ell" style="display:block">${esc(c.name)}</span>
    <span class="s">${c.open.length ? `${c.open.length} unpaid sale${c.open.length > 1 ? "s" : ""} · since ${fdate(c.open[0].sale.date)}` : "Paid up"}</span></span><span class="amt ${c.owed > 0 ? "warn" : "good"}">${c.owed > 0 ? peso(c.owed) : "✓"}</span></button>`;
  return `${owing.length ? `<div class="card" style="padding:4px 12px"><div class="list">${owing.map(row).join("")}</div></div>` : `<div class="empty">No one owes the shop anything. 🎉</div>`}
    ${settled.length ? `<button class="link" id="ut-paid" style="margin-top:4px">${U.utPaid ? "Hide" : "Show"} paid-up customers (${settled.length})</button>${U.utPaid ? `<div class="card" style="padding:4px 12px;margin-top:8px"><div class="list">${settled.map(row).join("")}</div></div>` : ""}` : ""}`;
}
function customerSheet(key) {
  const D = PJ.derive(); const c = D.customers.find(x => x.key === key); if (!c) return;
  const hist = [...c.sales.map(s => ({d: s.at || s.date, date: s.date, t: "sale", s})), ...c.payments.map(p => ({d: p.date + "T23:59", date: p.date, t: "pay", p}))].sort((a, b) => b.d.localeCompare(a.d));
  openSheet(c.name, `
    <div class="card" style="background:var(--surface-2)"><div class="eyebrow">Balance</div><div class="num ${c.owed > 0 ? "warn" : "good"}" style="font-size:30px;font-weight:600">${c.owed > 0 ? peso(c.owed) : c.owed < 0 ? peso(-c.owed) + " credit" : "Paid up"}</div>
      <div class="note">${peso(c.charged)} on utang · ${peso(c.paid)} paid back</div></div>
    <div class="btns" style="margin-top:12px">${c.owed > 0 ? `<button class="btn primary" id="cs-pay">Record payment</button><button class="btn" id="cs-remind">${ic("share")} Remind</button>` : `<button class="btn" id="cs-pay">Record payment</button>`}</div>
    ${isOwner() ? `<button class="link" id="cs-ren" style="margin-top:6px">${ic("edit")} Rename customer</button>` : ""}
    ${c.open.length ? `<div class="section-h" style="margin-top:16px"><h2 style="font-size:15px">Unpaid sales</h2></div><div class="list">${c.open.map(o => `<button class="li" data-sale="${o.sale.id}"><span class="grow"><span class="t" style="font-size:14px">#${esc(o.sale.no)}</span><span class="s" style="display:block">${fdate(o.sale.date)} · ${esc(o.sale.items.map(i => i.name).join(", "))}</span></span><span class="right"><span class="amt warn" style="display:block">${peso(o.left)}</span><span class="s">of ${peso(o.due)}</span></span></button>`).join("")}</div>` : ""}
    <div class="section-h" style="margin-top:16px"><h2 style="font-size:15px">History</h2></div>
    <div class="list">${hist.map(h => h.t === "sale" ? `<button class="li" data-sale="${h.s.id}"><span class="grow"><span class="t" style="font-size:14px">Bought · #${esc(h.s.no)}</span><span class="s" style="display:block">${fdate(h.date)} · paid ${peso(h.s.paid)}${h.s.method ? " " + esc(h.s.method) : ""}</span></span><span class="amt">${peso(h.s.total)}</span></button>`
      : `<button class="li" data-pay="${h.p.id}"><span class="grow"><span class="t good" style="font-size:14px">Paid ${esc(h.p.method || "")}</span><span class="s" style="display:block">${fdate(h.date)}${h.p.notes ? " · " + esc(h.p.notes) : ""}${h.p.by ? " · by " + esc(h.p.by) : ""}</span></span><span class="amt good">−${peso(h.p.amount)}</span></button>`).join("")}</div>`, b => {
    $("#cs-pay", b).onclick = () => paymentSheet(c);
    if ($("#cs-ren", b)) $("#cs-ren", b).onclick = () => openSheet("Rename customer", `<p class="note" style="margin-top:-6px">Changes the name on all ${c.sales.length + c.payments.length} of their sales and payments. Use an existing name to merge two customers.</p>
      <div class="field"><label for="rn-n">Name</label><input class="in-text" id="rn-n" value="${esc(c.name)}" list="rn-l"><datalist id="rn-l">${D.customers.map(x => `<option value="${esc(x.name)}">`).join("")}</datalist></div><button class="btn primary block" id="rn-ok">Save name</button>`, b2 => {
      $("#rn-ok", b2).onclick = async () => { const n = $("#rn-n", b2).value.trim(); if (!n) return;
        const items = [...c.sales.map(x => ({kind: "sale", id: x.id, data: {...PJ.get(x.id).data, customer: n}})), ...c.payments.map(x => ({kind: "payment", id: x.id, data: {...PJ.get(x.id).data, customer: n}}))];
        await PJ.putMany(items); closeSheet(true); toast("Renamed"); customerSheet(PJ.custKey(n)); };
    });
    if ($("#cs-remind", b)) $("#cs-remind", b).onclick = () => shareText(`Hi ${c.name}! Friendly reminder from ${D.settings.shopName}: your balance is ${peso(c.owed)}.\n${c.open.map(o => `• #${o.sale.no} (${fdate(o.sale.date)}): ${peso(o.left)}`).join("\n")}\nGCash / bank transfer / cash is fine. Thank you!`, "Balance reminder");
    $$("[data-sale]", b).forEach(x => x.onclick = () => { const s = D.allSales.find(y => y.id === x.dataset.sale); if (s) receiptSheet(s); });
    $$("[data-pay]", b).forEach(x => x.onclick = () => { const p = D.payments.find(y => y.id === x.dataset.pay); if (p) paymentSheet(c, p); });
  });
}
function paymentSheet(c, edit) {
  let method = edit?.method || "Cash";
  openSheet(edit ? "Edit payment" : "Payment from " + c.name, `
    <div class="field"><label for="py-a">Amount received</label><input class="in-text in-money" id="py-a" inputmode="decimal" value="${edit ? edit.amount : c.owed > 0 ? c.owed : ""}"></div>
    <div class="lbl" style="margin-bottom:6px">Paid by</div><div class="seg" style="margin-bottom:12px">${METHODS.map(m => `<button class="chip" data-m="${m}" aria-pressed="${m === method}">${m}</button>`).join("")}</div>
    <div class="two"><div class="field"><label for="py-d">Date</label><input class="in-text" type="date" id="py-d" value="${edit?.date || today()}"></div>
      <div class="field"><label for="py-n">Note</label><input class="in-text" id="py-n" value="${esc(edit?.notes || "")}" placeholder="Ref no. etc."></div></div>
    <div class="err" id="py-err"></div><button class="btn primary block" id="py-ok">${edit ? "Save" : "Save payment"}</button>
    ${edit ? `<button class="btn danger block" id="py-del" style="margin-top:10px">Delete payment</button>` : ""}`, b => {
    $$("[data-m]", b).forEach(x => x.onclick = () => { method = x.dataset.m; $$("[data-m]", b).forEach(y => y.setAttribute("aria-pressed", y === x)); });
    $("#py-ok", b).onclick = async () => {
      const amount = r2(num($("#py-a", b).value)); if (amount <= 0) return $("#py-err", b).textContent = "Enter the amount.";
      const owedNow = c.owed + (edit ? +edit.amount : 0);
      if (amount > owedNow + 0.004 && !$("#py-ok", b).dataset.sure) { $("#py-err", b).textContent = `That's more than the ${peso(owedNow)} owed. Tap save again to record it anyway.`; $("#py-ok", b).dataset.sure = 1; return; }
      await PJ.put("payment", {customer: c.name, amount, method, date: $("#py-d", b).value || today(), notes: $("#py-n", b).value.trim(), by: edit?.by || S.member.name || S.member.email}, edit?.id);
      closeSheet(true); toast(`${peso(amount)} received`); customerSheet(c.key);
    };
    if ($("#py-del", b)) $("#py-del", b).onclick = async () => { await PJ.remove(edit.id); closeSheet(true); toast("Payment deleted"); customerSheet(c.key); };
  });
}

/* ================= more ================= */
function moreScreen(D) {
  const own = isOwner(); const n = PJ.pendingCount();
  const item = (go, icon, t, s) => `<button class="li" data-go="${go}"><span class="thumb">${ic(icon)}</span><span class="grow"><span class="t" style="display:block">${t}</span><span class="s">${s}</span></span>${ic("chev")}</button>`;
  const mExp = D.expenses.filter(e => e.date.startsWith(today().slice(0, 7))).reduce((t, e) => t + +e.amount, 0);
  return `<div class="card" style="padding:4px 12px"><div class="list">
      ${item("sales", "receipt", "Sales history", `${D.allSales.length} sales · void, resend receipts`)}
      ${own ? item("expenses", "wallet", "Expenses", `${peso(mExp)} this month`) : ""}
      ${own ? item("purchases", "truck", "Restock & landed cost", `${D.purchases.length} batch${D.purchases.length === 1 ? "" : "es"} · shipping spread into cost`) : ""}
      ${own ? item("team", "users", "Team", "Approve staff, remove access") : ""}
      ${own ? item("settings", "gear", "Shop settings", "Name, margin warning, receipt") : ""}
    </div></div>
    ${own ? `<div class="card" style="padding:4px 12px"><div class="list">
      ${item("import", "upload", "Import from old app", "Bring over products, batches and sales")}
      <button class="li" data-act="backup"><span class="thumb">${ic("download")}</span><span class="grow"><span class="t" style="display:block">Download a backup</span><span class="s">A copy of all shop data as a file</span></span></button>
    </div></div>` : ""}
    <div class="card"><div class="row"><span class="grow"><span class="t" style="font-weight:700;display:block">${esc(S.member.name || "No name")}</span><span class="s muted" style="font-size:13px">${esc(S.member.email || S.user.email || "")} · ${S.member.role}</span></span><button class="btn" id="m-out">${ic("out")} Sign out</button></div>
      <div class="sep"></div>
      <div class="note">${n ? `<b class="warn">${n} change${n > 1 ? "s" : ""} waiting to send.</b> They'll go up automatically when there's internet.` : "Everything on this phone is saved to the shop database."}
      ${S.sync.last ? ` Last synced ${ftime(new Date(S.sync.last).toISOString())}.` : ""}${S.sync.state === "err" ? `<br><span class="bad">${esc(S.sync.error)}</span>` : ""}</div>
      <button class="btn block" data-act="sync" style="margin-top:10px">${ic("sync")} Sync now</button>
      <p class="note" style="text-align:center;margin:12px 0 0">Pickle Jar app v${VERSION} · works offline</p></div>`;
}

/* ---- sales history ---- */
function salesScreen(D) {
  const ym = U.histMonth; const q = U.histQ.trim().toLowerCase();
  const rows = D.allSales.filter(s => (q ? true : (s.date || "").startsWith(ym)) && (!q || [s.customer, s.no, ...(s.items || []).map(i => i.name)].join(" ").toLowerCase().includes(q)));
  const days = new Map(); for (const s of rows) { if (!days.has(s.date)) days.set(s.date, []); days.get(s.date).push(s); }
  const tot = rows.filter(s => !s.voided).reduce((t, s) => t + s.total, 0);
  return `${subHead("Sales history")}
    <div class="search">${ic("search")}<input id="hist-q" type="search" placeholder="Search customer, item, receipt #" value="${esc(U.histQ)}" autocomplete="off"></div>
    ${q ? "" : `<div class="row"><button class="x" data-hm="-1" aria-label="Previous month">${ic("back")}</button><div class="grow" style="text-align:center"><b>${monthLabel(ym)}</b><div class="num muted" style="font-size:13px">${peso(tot)} · ${rows.filter(s => !s.voided).length} sales</div></div><button class="x" data-hm="1" aria-label="Next month" ${ym >= today().slice(0, 7) ? "disabled" : ""}>${ic("chev")}</button></div>`}
    <div id="hist-res">${rows.length ? [...days].map(([d, ss]) => `<div class="section-h" style="margin:8px 0 4px"><span class="eyebrow">${fdate(d)}</span><span class="amt muted" style="font-size:13px">${peso(ss.filter(s => !s.voided).reduce((t, s) => t + s.total, 0))}</span></div><div class="card" style="padding:2px 12px"><div class="list">${ss.map(saleRow).join("")}</div></div>`).join("") : `<div class="empty">No sales ${q ? "match" : "this month"}.</div>`}</div>`;
}

/* ---- expenses ---- */
const EXP_CATS = ["Rent", "Utilities", "Salaries", "Shipping & delivery", "Marketing", "Supplies", "Repairs", "Fees & permits", "Other"];
function expensesScreen(D) {
  const ym = U.expMonth; const rows = D.expenses.filter(e => (e.date || "").startsWith(ym));
  const tot = rows.reduce((t, e) => t + +e.amount, 0);
  const by = {}; for (const e of rows) by[e.category || "Other"] = (by[e.category || "Other"] || 0) + +e.amount;
  const cats = Object.entries(by).sort((a, b) => b[1] - a[1]);
  return `${subHead("Expenses", `<button class="btn primary" data-act="new-exp">${ic("plus")} Add</button>`)}
    <div class="row"><button class="x" data-em="-1" aria-label="Previous month">${ic("back")}</button><div class="grow" style="text-align:center"><b>${monthLabel(ym)}</b><div class="num" style="font-size:22px;font-weight:600">${peso(tot)}</div></div><button class="x" data-em="1" aria-label="Next month" ${ym >= today().slice(0, 7) ? "disabled" : ""}>${ic("chev")}</button></div>
    ${cats.length ? `<div class="card">${cats.map(([c, a]) => `<div style="margin-bottom:10px"><div class="row" style="font-size:13.5px"><span class="grow">${esc(c)}</span><span class="amt">${peso(a)}</span></div><div class="bar" style="margin-top:4px"><i style="width:${(a / tot * 100).toFixed(1)}%"></i></div></div>`).join("")}</div>` : ""}
    ${rows.length ? `<div class="card" style="padding:2px 12px"><div class="list">${rows.map(e => `<button class="li" data-exp="${e.id}"><span class="grow"><span class="t" style="display:block">${esc(e.notes || e.category)}</span><span class="s">${fdate(e.date)} · ${esc(e.category)} · ${esc(e.method || "")}</span></span><span class="amt">${peso(e.amount)}</span></button>`).join("")}</div></div>`
      : `<div class="empty">No expenses this month. Rent, salaries, ads, delivery — anything that isn't stock goes here.</div>`}`;
}
function expenseSheet(e) {
  let cat = e?.category || "Rent", method = e?.method || "Cash";
  openSheet(e ? "Edit expense" : "New expense", `
    <div class="field"><label for="ex-a">Amount</label><input class="in-text in-money" id="ex-a" inputmode="decimal" value="${e ? e.amount : ""}"></div>
    <div class="lbl" style="margin-bottom:6px">Category</div><div class="seg" style="margin-bottom:12px">${EXP_CATS.map(c => `<button class="chip" data-c="${c}" aria-pressed="${c === cat}">${c}</button>`).join("")}</div>
    <div class="field"><label for="ex-n">What for</label><input class="in-text" id="ex-n" value="${esc(e?.notes || "")}" placeholder="e.g. November rent"></div>
    <div class="lbl" style="margin-bottom:6px">Paid with</div><div class="seg" style="margin-bottom:12px">${METHODS.map(m => `<button class="chip" data-m="${m}" aria-pressed="${m === method}">${m}</button>`).join("")}</div>
    <div class="field"><label for="ex-d">Date</label><input class="in-text" type="date" id="ex-d" value="${e?.date || today()}"></div>
    <div class="err" id="ex-err"></div><button class="btn primary block" id="ex-ok">Save</button>
    ${e ? `<button class="btn danger block" id="ex-del" style="margin-top:10px">Delete</button>` : ""}`, b => {
    $$("[data-c]", b).forEach(x => x.onclick = () => { cat = x.dataset.c; $$("[data-c]", b).forEach(y => y.setAttribute("aria-pressed", y === x)); });
    $$("[data-m]", b).forEach(x => x.onclick = () => { method = x.dataset.m; $$("[data-m]", b).forEach(y => y.setAttribute("aria-pressed", y === x)); });
    $("#ex-ok", b).onclick = async () => { const amount = r2(num($("#ex-a", b).value)); if (amount <= 0) return $("#ex-err", b).textContent = "Enter the amount.";
      await PJ.put("expense", {amount, category: cat, method, notes: $("#ex-n", b).value.trim(), date: $("#ex-d", b).value || today()}, e?.id); closeSheet(); toast("Expense saved"); };
    if ($("#ex-del", b)) $("#ex-del", b).onclick = async () => { await PJ.remove(e.id); closeSheet(); toast("Deleted"); };
  });
}

/* ---- restock / purchases ---- */
function purchasesScreen(D) {
  return `${subHead("Restock", `<button class="btn primary" data-act="new-po">${ic("plus")} New</button>`)}
    <p class="note" style="margin:0">Enter what you bought, plus shipping and other charges. The app spreads those charges into each item's cost so your profit is real.</p>
    ${D.purchases.length ? `<div class="card" style="padding:2px 12px"><div class="list">${D.purchases.map(pu => { const L = PJ.landed(pu); const tot = L.reduce((t, i) => t + i.qty * i.landed, 0); const u = L.reduce((t, i) => t + +i.qty, 0);
      return `<button class="li" data-po="${pu.id}"><span class="thumb">${ic("truck")}</span><span class="grow"><span class="t" style="display:block">${esc(pu.ref || "Restock")} · ${esc(pu.supplier || "")}</span><span class="s">${pu.date ? fdate(pu.date) + " · " : ""}${u} units</span></span><span class="right"><span class="amt" style="display:block">${peso(Math.round(tot))}</span><span class="badge ${pu.status === "received" ? "ok" : "low"}">${pu.status === "received" ? "In stock" : "Draft"}</span></span></button>`; }).join("")}</div></div>`
      : `<div class="empty">No restocks yet.</div>`}`;
}
const poTotals = (L, pu) => { const base = L.reduce((t, i) => t + i.qty * i.unit, 0), tot = L.reduce((t, i) => t + i.qty * i.landed, 0);
  return `<span class="muted">Products</span><span class="amt">${peso(base)}</span><span class="muted">Shipping + other</span><span class="amt">${peso(num(pu.shipping) + num(pu.other))}</span><span class="grand">Landed total</span><span class="amt grand">${peso(tot)}</span>`; };
function purchaseSheet(existing, working) {
  const D = PJ.derive();
  const pu = working || (existing ? JSON.parse(JSON.stringify(existing)) : {ref: "BATCH-" + String(D.purchases.length + 1).padStart(3, "0"), supplier: "", date: today(), shipping: "", other: "", alloc: "value", notes: "", status: "draft", items: []});
  const locked = pu.status === "received";
  openSheet(locked ? pu.ref : existing ? "Edit restock" : "New restock", `<div id="po"></div>`, b => {
    const po = $("#po", b);
    const draw = () => keepFocus(() => {
      const D = PJ.derive(); const L = PJ.landed(pu); const base = L.reduce((t, i) => t + i.qty * i.unit, 0); const tot = L.reduce((t, i) => t + i.qty * i.landed, 0);
      po.innerHTML = locked ? `
        <p class="note" style="margin-top:-6px">${esc(pu.supplier)} · ${fdate(pu.date)} · received into stock</p>
        <div class="list">${L.map(i => { const p = D.P.get(i.pid); return `<div class="li"><span class="grow"><span class="t" style="font-size:14px">${esc(pname(p, i.v))}</span><span class="s" style="display:block">${i.qty} × ${peso(i.unit)} + ${peso(i.extraPer)} shipping/other</span></span><span class="right"><span class="amt" style="display:block">${peso(i.landed)}</span><span class="s">landed each</span></span></div>`; }).join("")}</div>
        <div class="card" style="background:var(--surface-2);margin-top:10px"><div class="totals"><span class="muted">Products</span><span class="amt">${peso(base)}</span><span class="muted">Shipping + other</span><span class="amt">${peso((+pu.shipping || 0) + (+pu.other || 0))}</span><span class="grand">Landed total</span><span class="amt grand">${peso(tot)}</span></div></div>
        ${pu.notes ? `<p class="note">${esc(pu.notes)}</p>` : ""}
        <button class="btn danger block" id="po-undo" style="margin-top:12px">Undo this restock</button>` : `
        <div class="two"><div class="field"><label for="po-ref">Batch name</label><input class="in-text" id="po-ref" value="${esc(pu.ref)}"></div><div class="field"><label for="po-date">Date</label><input class="in-text" type="date" id="po-date" value="${esc(pu.date)}"></div></div>
        <div class="field"><label for="po-sup">Supplier</label><input class="in-text" id="po-sup" list="po-sups" value="${esc(pu.supplier)}"><datalist id="po-sups">${[...new Set(D.purchases.map(x => x.supplier).filter(Boolean))].map(s => `<option value="${esc(s)}">`).join("")}</datalist></div>
        <div class="section-h" style="margin:4px 0 6px"><h2 style="font-size:15px">Items</h2><button class="link" id="po-add">+ Add item</button></div>
        ${pu.items.length ? `<div class="list">${L.map((i, k) => { const p = D.P.get(i.pid); return `<div class="li" style="align-items:flex-start"><div class="grow"><div class="t" style="font-size:14px">${esc(pname(p, i.v))}</div>
          <div class="row" style="margin-top:6px;gap:6px"><input class="in-text num" style="width:64px;min-height:36px;padding:6px 8px" id="q-${k}" data-q="${k}" inputmode="numeric" value="${i.qty}" aria-label="Quantity"><span class="muted">×</span>
          <input class="in-text num" style="width:110px;min-height:36px;padding:6px 8px" id="u-${k}" data-u="${k}" inputmode="decimal" value="${i.unit}" aria-label="Unit cost" placeholder="unit cost"></div>
          <div class="s" style="margin-top:4px">Landed: <b class="num" style="color:var(--ink)" id="ld-${k}">${peso(i.landed)}</b> each${p && p.price ? ` · sells ${peso(p.price)} (${((p.price - i.landed) / p.price * 100).toFixed(0)}%)` : ""}</div></div>
          <button class="x" data-rm="${k}" aria-label="Remove">${ic("x")}</button></div>`; }).join("")}</div>` : `<div class="note">Add the products in this delivery.</div>`}
        <div class="sep"></div>
        <div class="two"><div class="field"><label for="po-ship">Shipping (all)</label><input class="in-text num" id="po-ship" inputmode="decimal" value="${esc(pu.shipping)}" placeholder="0"></div><div class="field"><label for="po-oth">Other charges</label><input class="in-text num" id="po-oth" inputmode="decimal" value="${esc(pu.other)}" placeholder="customs, fees"></div></div>
        <div class="lbl" style="margin-bottom:6px">Spread charges by</div><div class="seg" style="margin-bottom:12px"><button class="chip" data-al="value" aria-pressed="${pu.alloc !== "qty"}">Item value</button><button class="chip" data-al="qty" aria-pressed="${pu.alloc === "qty"}">Number of items</button></div>
        <div class="field"><label for="po-notes">Notes</label><input class="in-text" id="po-notes" value="${esc(pu.notes)}" placeholder="e.g. VND rate used"></div>
        <div class="card" style="background:var(--surface-2)"><div class="totals" id="po-tot">${poTotals(L, pu)}</div></div>
        <div class="err" id="po-err" style="margin:8px 0"></div>
        <div class="btns"><button class="btn" id="po-draft">Save draft</button><button class="btn primary" id="po-recv" style="flex:1.6">Receive into stock</button></div>
        ${existing ? `<button class="btn danger block" id="po-del" style="margin-top:10px">Delete draft</button>` : ""}`;
      wire();
    });
    const read = () => { if (locked) return; pu.ref = $("#po-ref", po).value.trim(); pu.date = $("#po-date", po).value; pu.supplier = $("#po-sup", po).value.trim(); pu.shipping = num($("#po-ship", po).value) || ""; pu.other = num($("#po-oth", po).value) || ""; pu.notes = $("#po-notes", po).value.trim(); };
    const wire = () => {
      if (locked) {
        $("#po-undo", po).onclick = () => confirmSheet("Undo restock?", `These items come back out of stock. Product costs that were averaged in stay as they are — fix them by hand if needed.`, "Undo restock", async () => { await PJ.remove(existing.id); toast("Restock removed"); }, true);
        return;
      }
      $$("input", po).forEach(x => { if (!x.dataset.q && !x.dataset.u) x.oninput = () => { read(); upd(); }; });
      $$("[data-q]", po).forEach(x => x.oninput = () => { pu.items[+x.dataset.q].qty = Math.max(0, Math.round(num(x.value))); upd(); });
      $$("[data-u]", po).forEach(x => x.oninput = () => { pu.items[+x.dataset.u].unit = r2(num(x.value)); upd(); });
      $$("[data-rm]", po).forEach(x => x.onclick = () => { pu.items.splice(+x.dataset.rm, 1); read(); draw(); });
      $$("[data-al]", po).forEach(x => x.onclick = () => { pu.alloc = x.dataset.al; read(); draw(); });
      $("#po-add", po).onclick = () => { read(); const snap = pu; productPicker("Add to restock", (pid, v) => { const p = PJ.derive().P.get(pid); const prev = snap.items.find(i => i.pid === pid && i.v === v);
          if (prev) prev.qty++; else snap.items.push({pid, v, qty: 1, unit: r2(p?.lastUnit || p?.cost || 0)}); reopen(snap); }, () => reopen(snap)); };
      $("#po-draft", po).onclick = async () => { read(); await save("draft"); };
      $("#po-recv", po).onclick = () => { read(); if (!pu.items.length || pu.items.some(i => !i.qty)) return $("#po-err", po).textContent = "Add items with a quantity first.";
        if (pu.items.some(i => !i.unit)) return $("#po-err", po).textContent = "Every item needs its unit cost.";
        confirmSheet("Receive into stock?", `${pu.items.reduce((t, i) => t + i.qty, 0)} units go into stock and each product's cost is updated to the average landed cost.`, "Receive", () => save("received")); };
      if ($("#po-del", po)) $("#po-del", po).onclick = async () => { await PJ.remove(existing.id); closeSheet(); toast("Draft deleted"); };
    };
    const upd = () => { const L = PJ.landed(pu); L.forEach((i, k) => { const el = $("#ld-" + k, po); if (el) el.textContent = peso(i.landed); }); const t = $("#po-tot", po); if (t) t.innerHTML = poTotals(L, pu); };
    const save = async status => {
      const D = PJ.derive(); const L = PJ.landed(pu);
      const data = {...pu, shipping: num(pu.shipping), other: num(pu.other), status, items: L.map(i => ({pid: i.pid, v: i.v || "", qty: +i.qty, unit: r2(i.unit), landed: i.landed}))};
      if (status === "received") {
        data.receivedAt = new Date().toISOString();
        const byP = new Map(); for (const i of data.items) { const e = byP.get(i.pid) || {q: 0, v: 0, unit: 0}; e.q += i.qty; e.v += i.qty * i.landed; e.unit = i.unit; byP.set(i.pid, e); }
        const ups = [];
        for (const [pid, e] of byP) { const p = D.P.get(pid); if (!p) continue; const q0 = Math.max(0, D.stockOf(pid)); const c0 = +p.cost || 0;
          const cost = r2((q0 * c0 + e.v) / (q0 + e.q)); const {id, ...rest} = p; ups.push({kind: "product", id: pid, data: {...rest, cost, lastUnit: e.unit}}); }
        await PJ.putMany([{kind: "purchase", id: existing?.id || PJ.uuid(), data}, ...ups]);
      } else await PJ.put("purchase", data, existing?.id);
      closeSheet(); toast(status === "received" ? "Received — stock and costs updated" : "Draft saved");
    };
    draw();
  });
  function reopen(snap) { purchaseSheet(existing, snap); }
}

/* ---- team ---- */
let team = null, teamErr = "";
async function loadTeam() { try { team = await S.api.members(); teamErr = ""; } catch (e) { teamErr = navigator.onLine === false ? "Connect to the internet to manage your team." : e.message; } render(); }
function teamScreen() {
  if (!team && !teamErr) { loadTeam(); return `${subHead("Team")}<div class="empty">Loading…</div>`; }
  const rows = (team || []).filter(m => m.role !== "removed" || true);
  const pend = rows.filter(m => m.role === "pending");
  return `${subHead("Team", `<button class="x" data-act="team-reload" aria-label="Refresh">${ic("sync")}</button>`)}
    ${teamErr ? `<div class="card bad">${esc(teamErr)}</div>` : ""}
    <div class="card"><b>Add a staff member</b><p class="note" style="margin:6px 0 0">Send them this app's link. They tap <b>Create an account</b>, then show up here for you to approve. Staff can sell, record utang payments and check stock — they can't see costs, profit or expenses.</p>
      <button class="btn block" id="tm-share" style="margin-top:10px">${ic("share")} Share app link</button></div>
    ${pend.length ? `<div class="section-h"><h2>Waiting for approval</h2></div><div class="card" style="padding:2px 12px"><div class="list">${pend.map(m => `<div class="li"><span class="thumb">${esc(initials(m.name || m.email))}</span><span class="grow"><span class="t ell" style="display:block">${esc(m.name || "—")}</span><span class="s">${esc(m.email)}</span></span><button class="btn" data-role="${m.user_id}:removed" style="min-height:38px;padding:6px 12px">Decline</button><button class="btn primary" data-role="${m.user_id}:staff" style="min-height:38px;padding:6px 12px">Approve</button></div>`).join("")}</div></div>` : ""}
    <div class="section-h"><h2>Members</h2></div>
    <div class="card" style="padding:2px 12px"><div class="list">${rows.filter(m => m.role !== "pending").map(m => `<div class="li"><span class="thumb">${esc(initials(m.name || m.email))}</span><span class="grow"><span class="t ell" style="display:block">${esc(m.name || "—")}${m.user_id === S.user.id ? " (you)" : ""}</span><span class="s">${esc(m.email)}</span></span>
      <span class="badge ${m.role === "owner" ? "ok" : m.role === "removed" ? "out" : ""}">${m.role}</span>
      ${m.user_id !== S.user.id && m.role === "staff" ? `<button class="btn danger" data-role="${m.user_id}:removed" style="min-height:36px;padding:6px 10px">Remove</button>` : m.role === "removed" ? `<button class="btn" data-role="${m.user_id}:staff" style="min-height:36px;padding:6px 10px">Restore</button>` : ""}</div>`).join("")}</div></div>`;
}

/* ---- settings ---- */
function settingsScreen(D) {
  const s = D.settings;
  return `${subHead("Shop settings")}<div class="card">
    <div class="field"><label for="st-name">Shop name</label><input class="in-text" id="st-name" value="${esc(s.shopName)}"></div>
    <div class="field"><label for="st-mm">Warn me when a sale's margin is below (%)</label><input class="in-text num" id="st-mm" inputmode="decimal" value="${esc(s.minMargin)}"></div>
    <div class="field"><label for="st-ft">Receipt footer</label><input class="in-text" id="st-ft" value="${esc(s.receiptFooter)}"></div>
    <div class="field"><label for="st-cat">Product categories (comma separated)</label><input class="in-text" id="st-cat" value="${esc(s.categories.join(", "))}"></div>
    <button class="btn primary block" id="st-save">Save settings</button></div>`;
}

/* ---- import ---- */
function importScreen(D) {
  return `${subHead("Import from old app")}
    <div class="card"><ol class="note" style="font-size:14px;padding-left:18px;margin:0;color:var(--ink)">
      <li>Open your <b>old Pickle Jar app</b> and use its <b>Backup / Export</b> button to download a <b>.json</b> file. Do this today so your latest sales are in it.</li>
      <li>Tap <b>Choose backup file</b> below and pick that file.</li>
      <li>Check the numbers, then tap Import. Stock counts will match the old app exactly.</li></ol></div>
    <label class="btn primary block">${ic("upload")} Choose backup file<input type="file" id="im-file" accept=".json,application/json" hidden></label>
    <div id="im-prev"></div>
    <p class="note">Importing the same file twice won't duplicate anything. It does reset those imported records to what's in the file, so import once, then use this app from here on.</p>`;
}

/* ================= events ================= */
function bind(D) {
  $$("[data-tab]").forEach(b => b.onclick = () => { U.tab = b.dataset.tab; U.sub = null; pref.set("tab", U.tab); if (U.tab === "stock") U.stockF = U.stockF || "all"; render(); });
  $$("[data-go]").forEach(b => b.onclick = () => { U.sub = b.dataset.go; if (U.sub === "team") team = null; history.pushState({sub: 1}, ""); render(); });
  $$("[data-back]").forEach(b => b.onclick = () => history.back());
  $$("[data-period]").forEach(b => b.onclick = () => { U.period = b.dataset.period; render(); });
  $$("[data-stockf]").forEach(b => b.onclick = () => { U.stockF = b.dataset.stockf; U.tab = "stock"; U.sub = null; render(); });
  $$("[data-cat]").forEach(b => b.onclick = () => { U.sellCat = b.dataset.cat; render(); });
  $$("[data-act=new-product]").forEach(b => b.onclick = () => productForm(null));
  bindLists();
  const sb = $("#syncbtn"); if (sb) sb.onclick = () => { PJ.syncNow().then(() => { const n = PJ.pendingCount(); toast(S.sync.state === "ok" ? (n ? `${n} still waiting` : "All synced") : navigator.onLine === false ? "You're offline — changes are saved on this phone" : "Couldn't sync: " + S.sync.error, S.sync.state === "err"); }); };
  const cb = $("#cartbar"); if (cb) cb.onclick = checkoutSheet;
  const live = (id, key, part, fn) => { const el = $("#" + id); if (el) el.oninput = e => { U[key] = e.target.value; const box = $("#" + part); if (box) { box.innerHTML = fn(PJ.derive()); bindLists(); } }; };
  live("sell-q", "sellQ", "sell-res", sellResults);
  live("stock-q", "stockQ", "stock-res", stockResults);
  const hq = $("#hist-q"); if (hq) hq.oninput = e => { U.histQ = e.target.value; render(); };
  const ut = $("#ut-q"); if (ut) ut.oninput = e => { U.utQ = e.target.value; render(); };
  const up = $("#ut-paid"); if (up) up.onclick = () => { U.utPaid = !U.utPaid; render(); };
  $$("[data-hm]").forEach(b => b.onclick = () => { U.histMonth = shiftMonth(U.histMonth, +b.dataset.hm); render(); });
  $$("[data-em]").forEach(b => b.onclick = () => { U.expMonth = shiftMonth(U.expMonth, +b.dataset.em); render(); });
  $$("[data-act=new-exp]").forEach(b => b.onclick = () => expenseSheet(null));
  $$("[data-exp]").forEach(b => b.onclick = () => expenseSheet(D.expenses.find(e => e.id === b.dataset.exp)));
  $$("[data-act=new-po]").forEach(b => b.onclick = () => purchaseSheet(null));
  $$("[data-po]").forEach(b => b.onclick = () => purchaseSheet(D.purchases.find(p => p.id === b.dataset.po)));
  $$("[data-act=sync]").forEach(b => b.onclick = () => $("#syncbtn").click());
  $$("[data-act=backup]").forEach(b => b.onclick = () => { const blob = new Blob([PJ.backup()], {type: "application/json"}); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `pickle-jar-backup-${today()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); });
  $$("[data-act=team-reload]").forEach(b => b.onclick = () => { team = null; teamErr = ""; render(); });
  $$("[data-role]").forEach(b => b.onclick = async () => { const [uid, role] = b.dataset.role.split(":"); b.disabled = true; try { await S.api.setRole(uid, role); toast(role === "staff" ? "Approved" : "Access removed"); } catch (e) { toast(e.message, true); } loadTeam(); });
  const ts = $("#tm-share"); if (ts) ts.onclick = () => shareText(`Join ${D.settings.shopName} on our shop app: ${location.origin + location.pathname}\nTap "Create an account", then tell me so I can approve you.`, "Pickle Jar app");
  const mo = $("#m-out"); if (mo) mo.onclick = signOut;
  const ss = $("#st-save"); if (ss) ss.onclick = async () => { await PJ.put("setting", {...D.settings, shopName: $("#st-name").value.trim() || "The Pickle Jar", minMargin: num($("#st-mm").value), receiptFooter: $("#st-ft").value.trim(), categories: $("#st-cat").value.split(",").map(s => s.trim()).filter(Boolean)}, PJ.SETTINGS_ID); toast("Settings saved"); };
  const fi = $("#im-file"); if (fi) fi.onchange = async e => {
    const f = e.target.files[0]; if (!f) return; let d;
    try { d = JSON.parse(await f.text()); if (!Array.isArray(d.products)) throw 0; } catch { return toast("That file isn't a Pickle Jar backup", true); }
    const units = d.products.reduce((t, p) => t + (+p.stock || 0), 0); const owed = d.sales.reduce((t, s) => t + (+s.balance || 0), 0);
    $("#im-prev").innerHTML = `<div class="card"><b>${esc(f.name)}</b><div class="totals" style="margin-top:10px">
      <span class="muted">Products</span><span class="amt">${d.products.length}</span><span class="muted">Units in stock</span><span class="amt">${units}</span>
      <span class="muted">Restock batches</span><span class="amt">${(d.orders || []).length}</span><span class="muted">Sales</span><span class="amt">${d.sales.length}</span>
      <span class="muted">Utang in the file</span><span class="amt warn">${peso(owed)}</span><span class="muted">Expenses</span><span class="amt">${(d.expenses || []).length}</span></div>
      <button class="btn primary block" id="im-go" style="margin-top:12px">Import all of this</button></div>`;
    $("#im-go").onclick = async () => { $("#im-go").disabled = true; try { const r = await PJ.importOld(d); toast(`Imported ${r.products} products, ${r.sales} sales`); U.sub = null; U.tab = "home"; render(); } catch (ex) { toast(ex.message, true); $("#im-go").disabled = false; } };
  };
}
function bindLists() {
  const D = PJ.derive();
  $$("[data-add]").forEach(b => b.onclick = () => { const p = D.P.get(b.dataset.add); const go = v => { addToCart(p.id, v); render(); };
    if ((p.variants || []).length) pickVariant(p, go); else go(""); });
  $$("#main [data-product]").forEach(b => b.onclick = () => productSheet(b.dataset.product));
  $$("#main [data-sale]").forEach(b => b.onclick = () => { const s = D.allSales.find(x => x.id === b.dataset.sale); if (s) receiptSheet(s); });
  $$("#main [data-cust]").forEach(b => b.onclick = () => customerSheet(b.dataset.cust));
}

boot();
})();
