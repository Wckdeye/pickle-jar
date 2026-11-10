/* The Pickle Jar — data core: phone storage, shared-database sync, and shop math. */
(() => {
"use strict";

/* ---------- small helpers ---------- */
const pad = n => String(n).padStart(2, "0");
const today = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const r2 = n => Math.round((+n || 0) * 100) / 100;
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() :
  "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)));
async function uuidFrom(text) { // same text always gives the same id (used so re-importing never duplicates)
  const h = new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode("pickle-jar:" + text)));
  h[6] = (h[6] & 0x0f) | 0x50; h[8] = (h[8] & 0x3f) | 0x80;
  const x = [...h.slice(0, 16)].map(b => b.toString(16).padStart(2, "0")).join("");
  return `${x.slice(0, 8)}-${x.slice(8, 12)}-${x.slice(12, 16)}-${x.slice(16, 20)}-${x.slice(20)}`;
}
const SETTINGS_ID = "00000000-0000-4000-8000-0000000000a1";
const custKey = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");

/* ---------- phone storage (IndexedDB) ---------- */
const idb = (() => {
  let dbp;
  const open = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open("pickle-jar", 1);
    r.onupgradeneeded = () => { const d = r.result; d.createObjectStore("records", {keyPath: "id"}); d.createObjectStore("meta"); };
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const run = (store, mode, fn) => open().then(d => new Promise((res, rej) => {
    const t = d.transaction(store, mode), s = t.objectStore(store); let out;
    const q = fn(s); if (q && "onsuccess" in q) q.onsuccess = () => { out = q.result; };
    t.oncomplete = () => res(out); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
  }));
  return {
    all: () => run("records", "readonly", s => s.getAll()),
    putMany: recs => run("records", "readwrite", s => { for (const r of recs) s.put(r); }),
    get: k => run("meta", "readonly", s => s.get(k)),
    set: (k, v) => run("meta", "readwrite", s => s.put(v, k)),
    wipe: () => Promise.all([run("records", "readwrite", s => s.clear()), run("meta", "readwrite", s => s.clear())])
  };
})();

/* ---------- shared database ---------- */
function supabaseApi() {
  const C = window.PJ_CONFIG;
  const sb = window.supabase.createClient(C.url, C.key, {auth: {persistSession: true, autoRefreshToken: true, storageKey: "pj-auth", detectSessionInUrl: true}});
  const chk = ({data, error}) => { if (error) throw error; return data; };
  return {
    async session() { const {data, error} = await sb.auth.getSession(); if (error) throw error; return data.session; },
    onAuth(cb) { sb.auth.onAuthStateChange((ev, s) => cb(ev, s)); },
    async signIn(email, password) { return chk(await sb.auth.signInWithPassword({email, password})).session; },
    async signUp(email, password, name) {
      return chk(await sb.auth.signUp({email, password, options: {data: {name}, emailRedirectTo: location.origin + location.pathname}})).session;
    },
    async resetPassword(email) { chk(await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname})); },
    async updatePassword(password) { chk(await sb.auth.updateUser({password})); },
    async signOut() { try { await sb.auth.signOut({scope: "local"}); } catch {} },
    async me(uid) { return chk(await sb.from("members").select("*").eq("user_id", uid).maybeSingle()); },
    async members() { return chk(await sb.from("members").select("*").order("created_at")); },
    async setRole(uid, role) { chk(await sb.from("members").update({role}).eq("user_id", uid)); },
    async push(rows) { return chk(await sb.from("records").upsert(rows, {onConflict: "id"}).select("id,updated_at")); },
    async pull(since, limit) {
      let q = sb.from("records").select("id,kind,data,deleted,updated_at,updated_by").order("updated_at", {ascending: true}).order("id").limit(limit);
      if (since) q = q.gt("updated_at", since);
      return chk(await q);
    }
  };
}

/* ---------- the shop's records, in memory + on the phone ---------- */
const S = {
  recs: new Map(), ver: 0, api: null, user: null, member: null,
  sync: {state: "idle", pending: 0, last: 0, error: "", busy: false},
  listeners: new Set()
};
const emit = () => { S.ver++; derived = null; for (const f of S.listeners) try { f(); } catch (e) { console.error(e); } };
const onChange = f => S.listeners.add(f);

async function loadLocal() {
  const all = await idb.all();
  S.recs = new Map(all.map(r => [r.id, r]));
  emit();
}
const get = id => { const r = S.recs.get(id); return r && !r.deleted ? r : null; };
const list = kind => { const out = []; for (const r of S.recs.values()) if (r.kind === kind && !r.deleted) out.push(r); return out; };

async function put(kind, data, id, {silent} = {}) {
  id = id || uuid();
  const prev = S.recs.get(id);
  const rec = {id, kind, data, deleted: false, updated_at: prev ? prev.updated_at : new Date().toISOString(),
    created_local: prev ? prev.created_local : new Date().toISOString(), _dirty: true, _v: (prev?._v || 0) + 1};
  S.recs.set(id, rec);
  await idb.putMany([rec]);
  if (!silent) { emit(); kick(); }
  return rec;
}
async function putMany(items) { // [{kind,data,id}]
  const recs = items.map(({kind, data, id}) => {
    const prev = S.recs.get(id);
    return {id, kind, data, deleted: false, updated_at: prev ? prev.updated_at : new Date().toISOString(), created_local: new Date().toISOString(), _dirty: true, _v: (prev?._v || 0) + 1};
  });
  for (const r of recs) S.recs.set(r.id, r);
  await idb.putMany(recs); emit(); kick();
}
async function remove(id) {
  const prev = S.recs.get(id); if (!prev) return;
  const rec = {...prev, deleted: true, _dirty: true, _v: (prev._v || 0) + 1};
  S.recs.set(id, rec); await idb.putMany([rec]); emit(); kick();
}

/* ---------- sync: push my changes, pull everyone else's ---------- */
let kickTimer = null, syncing = null;
function kick(delay = 700) { clearTimeout(kickTimer); kickTimer = setTimeout(() => syncNow(), delay); }
const pendingCount = () => { let n = 0; for (const r of S.recs.values()) if (r._dirty) n++; return n; };

async function syncNow() {
  if (syncing) return syncing;
  if (!S.api || !S.user) { S.sync.pending = pendingCount(); return; }
  syncing = (async () => {
    S.sync.busy = true; emit();
    try {
      // 1) push
      const dirty = [...S.recs.values()].filter(r => r._dirty);
      for (let i = 0; i < dirty.length; i += 200) {
        const chunk = dirty.slice(i, i + 200);
        const sent = new Map(chunk.map(r => [r.id, r._v]));
        let res;
        try { res = await S.api.push(chunk.map(r => ({id: r.id, kind: r.kind, data: r.data, deleted: r.deleted}))); }
        catch (e) {
          if (!isPermission(e)) throw e;
          // one record wasn't allowed (e.g. staff editing a product) — send one by one, drop the refused ones
          res = [];
          for (const r of chunk) {
            try { res.push(...await S.api.push([{id: r.id, kind: r.kind, data: r.data, deleted: r.deleted}])); }
            catch (e2) { if (!isPermission(e2)) throw e2; const cur = S.recs.get(r.id); if (cur) { cur._dirty = false; cur._refused = true; } await idb.set("cursor", null); }
          }
        }
        const changed = [];
        for (const row of res || []) {
          const cur = S.recs.get(row.id);
          if (!cur) continue;
          cur.updated_at = row.updated_at;
          if (cur._v === sent.get(row.id)) cur._dirty = false;
          changed.push(cur);
        }
        await idb.putMany(changed);
      }
      // 2) pull (overlap 2 minutes so nothing committed slightly late is missed)
      let cursor = await idb.get("cursor");
      let since = cursor ? new Date(new Date(cursor).getTime() - 120000).toISOString() : null;
      for (let page = 0; page < 200; page++) {
        const rows = await S.api.pull(since, 1000);
        if (!rows || !rows.length) break;
        const changed = [];
        for (const row of rows) {
          const cur = S.recs.get(row.id);
          if (cur && cur._dirty) continue;              // my unsent edit wins until it's sent
          if (cur && cur.updated_at === row.updated_at && !cur._refused) continue;
          const rec = {id: row.id, kind: row.kind, data: row.data, deleted: row.deleted, updated_at: row.updated_at,
            updated_by: row.updated_by, created_local: cur?.created_local || row.updated_at, _dirty: false, _v: cur?._v || 0};
          S.recs.set(row.id, rec); changed.push(rec);
        }
        if (changed.length) await idb.putMany(changed);
        const last = rows[rows.length - 1].updated_at;
        if (!cursor || last > cursor) cursor = last;
        since = last;
        if (rows.length < 1000) break;
      }
      if (cursor) await idb.set("cursor", cursor);
      S.sync.state = "ok"; S.sync.error = ""; S.sync.last = Date.now();
    } catch (e) {
      S.sync.state = navigator.onLine === false || isNetwork(e) ? "offline" : "err";
      S.sync.error = e && e.message ? e.message : String(e);
      if (isAuth(e) && S.onAuthLost) S.onAuthLost();
    } finally {
      S.sync.busy = false; S.sync.pending = pendingCount(); syncing = null; emit();
    }
  })();
  return syncing;
}
const isPermission = e => e && (e.code === "42501" || /row-level security|permission denied/i.test(e.message || ""));
const isNetwork = e => e && (e.name === "TypeError" || /fetch|network|Failed to fetch|Load failed/i.test(e.message || ""));
const isAuth = e => e && (e.status === 401 || e.code === "PGRST301" || /JWT|not authenticated/i.test(e.message || ""));

/* ---------- shop math (recomputed whenever records change) ---------- */
let derived = null;
const DEFAULT_SETTINGS = {shopName: "The Pickle Jar", minMargin: 15, receiptFooter: "Thank you! Serve something fresh.", categories: ["Paddles", "Balls", "Bags", "Accessories", "Apparel"]};

function derive() {
  if (derived) return derived;
  const settings = {...DEFAULT_SETTINGS, ...(get(SETTINGS_ID)?.data || {})};
  const products = list("product").map(r => ({id: r.id, ...r.data})).sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  const P = new Map(products.map(p => [p.id, p]));
  const stock = new Map(); // "pid|variant" -> qty
  const add = (pid, v, q) => { const k = pid + "|" + (v || ""); stock.set(k, (stock.get(k) || 0) + (+q || 0)); };
  const moves = new Map(); // pid -> [{date, qty, v, what, ref}]
  const mv = (pid, m) => { if (!moves.has(pid)) moves.set(pid, []); moves.get(pid).push(m); };

  const purchases = list("purchase").map(r => ({id: r.id, ...r.data})).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  for (const pu of purchases) if (pu.status === "received") for (const it of pu.items || []) {
    add(it.pid, it.v, it.qty); mv(it.pid, {date: pu.date, qty: +it.qty, v: it.v || "", what: "Restock " + (pu.ref || ""), sub: pu.supplier || "", kind: "purchase", ref: pu.id});
  }
  const adjusts = list("adjust").map(r => ({id: r.id, ...r.data}));
  for (const a of adjusts) { add(a.pid, a.v, a.qty); mv(a.pid, {date: a.date, qty: +a.qty, v: a.v || "", what: a.reason || "Adjustment", sub: a.notes || "", kind: "adjust", ref: a.id}); }

  const allSales = list("sale").map(r => ({id: r.id, ...r.data, _dirty: S.recs.get(r.id)._dirty}));
  allSales.sort((a, b) => (b.at || b.date || "").localeCompare(a.at || a.date || ""));
  const sales = allSales.filter(s => !s.voided);
  for (const s of sales) {
    for (const it of s.items || []) { add(it.pid, it.v, -it.qty); mv(it.pid, {date: s.date, qty: -it.qty, v: it.v || "", what: "Sold" + (s.customer ? " — " + s.customer : ""), sub: "#" + s.no, kind: "sale", ref: s.id}); }
    for (const it of s.freebies || []) { add(it.pid, it.v, -it.qty); mv(it.pid, {date: s.date, qty: -it.qty, v: it.v || "", what: "Freebie" + (s.customer ? " — " + s.customer : ""), sub: "#" + s.no, kind: "sale", ref: s.id}); }
  }
  for (const arr of moves.values()) arr.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const stockOf = (pid, v) => {
    if (v !== undefined) return stock.get(pid + "|" + (v || "")) || 0;
    let t = 0; for (const [k, q] of stock) if (k.startsWith(pid + "|")) t += q; return t;
  };

  // utang (customer credit)
  const payments = list("payment").map(r => ({id: r.id, ...r.data})).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const C = new Map();
  const cust = name => { const k = custKey(name); if (!k) return null; if (!C.has(k)) C.set(k, {key: k, name: String(name).trim(), sales: [], payments: [], charged: 0, paid: 0, owed: 0, last: ""}); return C.get(k); };
  for (const s of sales) { const c = cust(s.customer); if (!c) continue; c.sales.push(s); const credit = r2(s.total - (s.paid || 0)); if (credit > 0) c.charged = r2(c.charged + credit); if ((s.date || "") > c.last) c.last = s.date; }
  for (const p of payments) { const c = cust(p.customer); if (!c) continue; c.payments.push(p); c.paid = r2(c.paid + (+p.amount || 0)); if ((p.date || "") > c.last) c.last = p.date; }
  for (const c of C.values()) {
    c.owed = r2(c.charged - c.paid);
    // pay off the oldest unpaid sales first
    let pool = c.paid;
    c.open = [...c.sales].filter(s => r2(s.total - (s.paid || 0)) > 0).sort((a, b) => (a.at || a.date || "").localeCompare(b.at || b.date || ""))
      .map(s => { const due = r2(s.total - (s.paid || 0)); const used = Math.min(pool, due); pool = r2(pool - used); return {sale: s, due, left: r2(due - used)}; })
      .filter(x => x.left > 0);
  }
  const customers = [...C.values()].sort((a, b) => a.name.localeCompare(b.name));
  const saleLeft = new Map(); for (const c of customers) for (const o of c.open) saleLeft.set(o.sale.id, o.left);

  const expenses = list("expense").map(r => ({id: r.id, ...r.data})).sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  let units = 0, valueCost = 0, valueRetail = 0;
  for (const p of products) { const q = stockOf(p.id); if (q > 0) { units += q; valueCost += q * (+p.cost || 0); valueRetail += q * (+p.price || 0); } }

  derived = {settings, products, P, stockOf, moves, purchases, adjusts, sales, allSales, payments, customers, saleLeft, expenses,
    utang: r2(customers.reduce((t, c) => t + Math.max(0, c.owed), 0)), inv: {units, valueCost: r2(valueCost), valueRetail: r2(valueRetail)}};
  return derived;
}

/* report for a date range [from, to] inclusive (YYYY-MM-DD) */
function report(from, to) {
  const d = derive(); const inR = x => (!from || x >= from) && (!to || x <= to);
  const r = {sales: 0, count: 0, units: 0, cogs: 0, freebies: 0, discounts: 0, expenses: 0, credit: 0, collected: 0, byMethod: {}, byProduct: new Map(), expByCat: {}};
  for (const s of d.sales) if (inR(s.date)) {
    r.count++; r.sales += +s.total || 0; r.cogs += +s.cogs || 0; r.freebies += +s.freebieCost || 0; r.discounts += +s.disc || 0;
    r.credit += Math.max(0, (s.total || 0) - (s.paid || 0));
    if (s.paid > 0) { const m = s.method || "Cash"; r.byMethod[m] = (r.byMethod[m] || 0) + +s.paid; }
    for (const it of s.items || []) {
      r.units += +it.qty;
      const k = it.pid; const e = r.byProduct.get(k) || {pid: it.pid, name: it.name, qty: 0, sales: 0, profit: 0};
      e.qty += +it.qty; e.sales += it.qty * it.price; e.profit += it.qty * (it.price - (it.cost || 0)); r.byProduct.set(k, e);
    }
  }
  for (const p of d.payments) if (inR(p.date)) { r.collected += +p.amount || 0; const m = p.method || "Cash"; r.byMethod[m] = (r.byMethod[m] || 0) + +p.amount; }
  for (const e of d.expenses) if (inR(e.date)) { r.expenses += +e.amount || 0; r.expByCat[e.category || "Other"] = (r.expByCat[e.category || "Other"] || 0) + +e.amount; }
  r.gross = r2(r.sales - r.cogs - r.freebies);
  r.net = r2(r.gross - r.expenses);
  r.margin = r.sales ? r.gross / r.sales * 100 : 0;
  r.moneyIn = r2(Object.values(r.byMethod).reduce((a, b) => a + b, 0));
  r.top = [...r.byProduct.values()].sort((a, b) => b.sales - a.sales);
  return r;
}

/* landed cost: spread shipping + other costs across a restock's items */
function landed(pu) {
  const items = pu.items || [];
  const extra = (+pu.shipping || 0) + (+pu.other || 0);
  const base = items.reduce((t, it) => t + (pu.alloc === "qty" ? +it.qty || 0 : (+it.qty || 0) * (+it.unit || 0)), 0);
  return items.map(it => {
    const w = pu.alloc === "qty" ? +it.qty || 0 : (+it.qty || 0) * (+it.unit || 0);
    const share = base ? extra * w / base : 0;
    const per = it.qty ? share / it.qty : 0;
    return {...it, extraPer: r2(per), landed: r2((+it.unit || 0) + per)};
  });
}

/* ---------- import from the old Pickle Jar app's backup file ---------- */
async function importOld(json) {
  const d = typeof json === "string" ? JSON.parse(json) : json;
  if (!d || !Array.isArray(d.products) || !Array.isArray(d.sales)) throw new Error("This doesn't look like a Pickle Jar backup file.");
  const out = []; const pid = {}; const pinfo = {};
  for (const p of d.products) {
    const id = await uuidFrom("product:" + p.id); pid[p.id] = id; pinfo[p.id] = p;
    const variants = (p.variants || []).map(v => ({name: v.name, color: v.color || ""}));
    out.push({kind: "product", id, data: {name: p.name || "", brand: p.brand || "", category: p.category || "", model: p.variant || "", sku: p.sku || "",
      cost: r2(p.cost), price: r2(p.price), low: +p.low || 0, notes: p.notes || "", photo: p.photo || "", variants}});
  }
  for (const o of d.orders || []) {
    out.push({kind: "purchase", id: await uuidFrom("order:" + o.id), data: {ref: o.name || "", supplier: o.supplier || "", date: o.orderDate || o.arriveDate || "",
      shipping: +o.ship || 0, other: +o.other || 0, alloc: o.alloc === "qty" ? "qty" : "value", notes: o.notes || "", status: o.finalized ? "received" : "draft",
      items: (o.items || []).filter(i => pid[i.pid]).map(i => ({pid: pid[i.pid], v: i.vname || "", qty: +i.qty || 0, unit: r2(i.unitCost), landed: r2(i.landed)}))}});
  }
  const name = pidOld => pinfo[pidOld] ? pinfo[pidOld].name + (pinfo[pidOld].variant ? " " + pinfo[pidOld].variant : "") : "Item";
  for (const s0 of d.sales) {
    // apply the old app's returns: take returned items off the sale; a fully returned sale becomes voided
    const s = {...s0, items: (s0.items || []).map(i => ({...i})), freebies: (s0.freebies || []).map(i => ({...i}))};
    let returned = false;
    for (const rt of s0.returns || []) for (const [arr, from] of [[s.items, rt.items || []], [s.freebies, rt.freebies || []]]) for (const ri of from) {
      const it = arr.find(i => i.pid === ri.pid && (i.vname || "") === (ri.vname || "")); if (it) { it.qty -= +ri.qty || 0; returned = true; }
    }
    s.items = s.items.filter(i => i.qty > 0); s.freebies = s.freebies.filter(i => i.qty > 0);
    const credit = /credit|unpaid/i.test(s.pay || "");
    const owes = r2(+s.balance || 0) > 0;
    const total = r2(s.revenue ?? ((s.items || []).reduce((t, i) => t + i.qty * i.price, 0) - (s.disc || 0)));
    out.push({kind: "sale", id: await uuidFrom("sale:" + s.id), data: {
      no: "OLD-" + s.id, date: s.date, at: (s.date || today()) + "T12:00:00", customer: (s.customer || "").trim() || (owes ? "No name (old sale #" + s.id + ")" : ""),
      items: (s.items || []).filter(i => pid[i.pid]).map(i => ({pid: pid[i.pid], v: i.vname || "", name: name(i.pid), qty: +i.qty, price: r2(i.price), cost: r2(i.cost)})),
      freebies: (s.freebies || []).filter(i => pid[i.pid]).map(i => ({pid: pid[i.pid], v: i.vname || "", name: name(i.pid), qty: +i.qty, cost: r2(i.cost)})),
      disc: r2(s.disc), total, cogs: r2(s.cogs), freebieCost: r2(s.freebieCost), method: s.paid > 0 ? (credit ? "Collected (old app)" : s.pay || "Cash") : "",
      paid: r2(s.paid), notes: s.notes || "", by: "Imported",
      voided: returned && !s.items.length, voidReason: returned && !s.items.length ? "Returned" + (s0.returns[0]?.date ? " " + s0.returns[0].date : "") : ""}});
  }
  for (const e of d.expenses || []) {
    out.push({kind: "expense", id: await uuidFrom("expense:" + e.id), data: {date: e.date || today(), amount: r2(e.amount ?? e.amt), category: e.category || e.cat || "Other",
      method: e.method || e.pay || "Cash", notes: e.notes || e.desc || e.name || ""}});
  }
  // work out stock from the imported history, then add one "opening balance" fix per product/variant so counts match the old app exactly
  const st = {};
  const addq = (p, v, q) => { const k = p + "|" + (v || ""); st[k] = (st[k] || 0) + q; };
  for (const r of out) {
    if (r.kind === "purchase" && r.data.status === "received") for (const it of r.data.items) addq(it.pid, it.v, it.qty);
    if (r.kind === "sale" && !r.data.voided) { for (const it of r.data.items) addq(it.pid, it.v, -it.qty); for (const it of r.data.freebies) addq(it.pid, it.v, -it.qty); }
  }
  for (const p of d.products) {
    const id = pid[p.id]; const targets = {};
    if (p.variants && p.variants.length) { targets[""] = 0; for (const v of p.variants) targets[v.name] = +v.stock || 0; }
    else targets[""] = +p.stock || 0;
    for (const k of Object.keys(st)) if (k.startsWith(id + "|")) { const v = k.slice(id.length + 1); if (!(v in targets)) targets[v] = 0; }
    for (const [v, want] of Object.entries(targets)) {
      const have = st[id + "|" + v] || 0; const diff = want - have;
      if (diff) out.push({kind: "adjust", id: await uuidFrom("fix:" + p.id + ":" + v), data: {pid: id, v, qty: diff, date: (d.sales.at(-1)?.date) || today(), reason: "Imported stock count", notes: "Matches the old app's count"}});
    }
  }
  if (d.settings && !get(SETTINGS_ID)) out.push({kind: "setting", id: SETTINGS_ID, data: {...DEFAULT_SETTINGS, minMargin: +d.settings.minMargin || DEFAULT_SETTINGS.minMargin}});
  await putMany(out);
  const count = k => out.filter(r => r.kind === k).length;
  return {products: count("product"), purchases: count("purchase"), sales: count("sale"), expenses: count("expense"), fixes: count("adjust")};
}

function backup() {
  return JSON.stringify({app: "pickle-jar-v2", exported: new Date().toISOString(),
    records: [...S.recs.values()].filter(r => !r.deleted).map(r => ({id: r.id, kind: r.kind, data: r.data}))}, null, 1);
}

window.PJ = {S, idb, supabaseApi, loadLocal, get, list, put, putMany, remove, syncNow, kick, pendingCount, onChange, derive, report, landed,
  importOld, backup, uuid, uuidFrom, today, r2, custKey, SETTINGS_ID, DEFAULT_SETTINGS};
})();
