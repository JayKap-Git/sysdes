/* ==========================================================================
   SysDes interactive widgets
   Usage in markdown:  <div class="sd-widget" data-widget="estimator"></div>
   Widgets: estimator, nines, token-bucket, hash-ring, snowflake, base62, trie
   ========================================================================== */
(function () {
  "use strict";

  // ---------- helpers ----------
  const h = (tag, attrs = {}, html = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (html) el.innerHTML = html;
    return el;
  };
  const fmt = (n, d = 1) => {
    if (!isFinite(n)) return "—";
    const abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(d) + " T";
    if (abs >= 1e9) return (n / 1e9).toFixed(d) + " B";
    if (abs >= 1e6) return (n / 1e6).toFixed(d) + " M";
    if (abs >= 1e3) return (n / 1e3).toFixed(d) + " K";
    return n.toFixed(abs < 10 ? 2 : 0);
  };
  const bytes = (b) => {
    const u = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
    let i = 0;
    while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; }
    return b.toFixed(b < 10 ? 2 : 1) + " " + u[i];
  };
  const stat = (label, id, hint = "") =>
    `<div class="sd-stat"><small>${label}</small><b id="${id}">—</b>${hint ? `<small>${hint}</small>` : ""}</div>`;
  // FNV-1a 32-bit hash -> [0, 2^32)
  const fnv = (str) => {
    let x = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      x ^= str.charCodeAt(i);
      x = Math.imul(x, 0x01000193);
    }
    // final avalanche (murmur3 fmix32) for better spread
    x ^= x >>> 16; x = Math.imul(x, 0x85ebca6b);
    x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
  };
  const PALETTE = ["#12657a", "#e36414", "#8e44ad", "#2e8b57", "#c0392b", "#2c7be5", "#b8860b", "#d63384", "#5f6b7a", "#16a085"];

  // ---------- 1. Back-of-the-envelope estimator ----------
  function estimator(root) {
    root.innerHTML = `
      <div class="sd-w-title">Back-of-the-envelope calculator</div>
      <div class="sd-w-row">
        <label>Daily active users<input type="number" data-k="dau" value="160000000"></label>
        <label>Reads / user / day<input type="number" data-k="reads" value="80"></label>
        <label>Writes / user / day<input type="number" data-k="writes" value="3"></label>
        <label>Peak factor (×avg)<input type="number" data-k="peak" value="2" step="0.5"></label>
      </div>
      <div class="sd-w-row">
        <label>Avg write size (KB)<input type="number" data-k="size" value="100"></label>
        <label>Retention (years)<input type="number" data-k="years" value="7"></label>
        <label>Replication factor<input type="number" data-k="rf" value="3"></label>
        <label>QPS one server handles<input type="number" data-k="srv" value="1000"></label>
      </div>
      <div class="sd-out">
        ${stat("Read QPS (avg)", "rq")}${stat("Write QPS (avg)", "wq")}${stat("Peak total QPS", "pq")}
        ${stat("New storage / day", "sd")}${stat("Total storage (with replicas)", "st")}
        ${stat("Write bandwidth", "bw")}${stat("App servers @ peak", "sv")}
      </div>
      <div class="sd-log" data-o="steps"></div>`;
    const q = (k) => parseFloat(root.querySelector(`[data-k="${k}"]`).value) || 0;
    const o = (id) => root.querySelector("#" + id);
    const calc = () => {
      const dau = q("dau"), r = q("reads"), w = q("writes"), pk = q("peak");
      const size = q("size") * 1e3, yrs = q("years"), rf = q("rf"), srv = q("srv") || 1;
      const rq = (dau * r) / 86400, wq = (dau * w) / 86400, peak = (rq + wq) * pk;
      const perDay = dau * w * size, total = perDay * 365 * yrs * rf;
      o("rq").textContent = fmt(rq); o("wq").textContent = fmt(wq); o("pq").textContent = fmt(peak);
      o("sd").textContent = bytes(perDay); o("st").textContent = bytes(total);
      o("bw").textContent = bytes(wq * size) + "/s"; o("sv").textContent = Math.ceil(peak / srv);
      root.querySelector('[data-o="steps"]').innerHTML =
        `read QPS  = ${fmt(dau, 0)} × ${r} / 86,400 ≈ ${fmt(rq)}<br>` +
        `write QPS = ${fmt(dau, 0)} × ${w} / 86,400 ≈ ${fmt(wq)}<br>` +
        `peak      = (${fmt(rq)} + ${fmt(wq)}) × ${pk} ≈ ${fmt(peak)}<br>` +
        `storage/day = ${fmt(dau * w, 0)} writes × ${q("size")} KB ≈ ${bytes(perDay)}<br>` +
        `total     = ${bytes(perDay)} × 365 × ${yrs} × RF ${rf} ≈ ${bytes(total)}`;
    };
    root.querySelectorAll("input").forEach((i) => i.addEventListener("input", calc));
    calc();
  }

  // ---------- 2. Availability nines ----------
  function nines(root) {
    root.innerHTML = `
      <div class="sd-w-title">Availability → allowed downtime</div>
      <div class="sd-w-row">
        <label>Availability %<input type="number" data-k="a" value="99.99" step="0.001" min="0" max="100"></label>
        <label>…or two components in series<select data-k="mode">
          <option value="1">single component</option>
          <option value="series">A and B in series (both needed)</option>
          <option value="parallel">A or B in parallel (either works)</option>
        </select></label>
      </div>
      <div class="sd-out">${stat("Effective availability", "ea")}${stat("Downtime / year", "y")}${stat("Downtime / month", "m")}${stat("Downtime / week", "w")}${stat("Downtime / day", "d")}</div>`;
    const span = (s) => {
      if (s >= 86400) return (s / 86400).toFixed(2) + " days";
      if (s >= 3600) return (s / 3600).toFixed(2) + " h";
      if (s >= 60) return (s / 60).toFixed(2) + " min";
      return s.toFixed(2) + " s";
    };
    const calc = () => {
      let a = (parseFloat(root.querySelector('[data-k="a"]').value) || 0) / 100;
      const mode = root.querySelector('[data-k="mode"]').value;
      if (mode === "series") a = a * a;
      if (mode === "parallel") a = 1 - (1 - a) * (1 - a);
      const down = 1 - a;
      root.querySelector("#ea").textContent = (a * 100).toFixed(6).replace(/0+$/, "").replace(/\.$/, "") + " %";
      root.querySelector("#y").textContent = span(down * 365 * 86400);
      root.querySelector("#m").textContent = span(down * 30 * 86400);
      root.querySelector("#w").textContent = span(down * 7 * 86400);
      root.querySelector("#d").textContent = span(down * 86400);
    };
    root.querySelectorAll("input,select").forEach((i) => i.addEventListener("input", calc));
    calc();
  }

  // ---------- 3. Token bucket simulator ----------
  function tokenBucket(root) {
    root.innerHTML = `
      <div class="sd-w-title">Token bucket simulator</div>
      <div class="sd-w-row">
        <label>Bucket size (capacity)<input type="number" data-k="cap" value="4" min="1" max="50"></label>
        <label>Refill rate (tokens/sec)<input type="number" data-k="rate" value="2" min="0" step="0.5"></label>
        <label>Auto traffic (req/sec)<input type="range" data-k="auto" min="0" max="10" value="0"><span data-o="autov">0</span></label>
      </div>
      <div class="sd-w-row">
        <button class="primary" data-a="one">Send 1 request</button>
        <button data-a="burst">Burst of 6</button>
        <button data-a="reset">Reset</button>
      </div>
      <svg viewBox="0 0 420 70" data-o="svg"></svg>
      <div class="sd-out">${stat("Tokens now", "tk")}${stat("Allowed", "ok")}${stat("Throttled (429)", "no")}</div>
      <div class="sd-log" data-o="log"></div>`;
    let tokens, last, allowed, dropped, autoTimer = null, autoAcc = 0;
    const cap = () => Math.max(1, parseInt(root.querySelector('[data-k="cap"]').value) || 1);
    const rate = () => Math.max(0, parseFloat(root.querySelector('[data-k="rate"]').value) || 0);
    const log = (msg, cls) => {
      const l = root.querySelector('[data-o="log"]');
      const t = new Date().toLocaleTimeString();
      l.insertAdjacentHTML("afterbegin", `<div class="${cls}">[${t}] ${msg}</div>`);
      while (l.children.length > 40) l.lastChild.remove();
    };
    const refill = () => {
      const now = performance.now();
      tokens = Math.min(cap(), tokens + ((now - last) / 1000) * rate());
      last = now;
    };
    const draw = () => {
      const c = cap(), svg = root.querySelector('[data-o="svg"]');
      const w = Math.min(36, 380 / c);
      let s = `<text x="0" y="12" font-size="10">bucket (capacity ${c})</text>`;
      for (let i = 0; i < c; i++) {
        const fill = Math.max(0, Math.min(1, tokens - i));
        s += `<rect x="${i * (w + 4)}" y="20" width="${w}" height="40" rx="5" fill="none" stroke="#12657a" stroke-width="1.5"/>`;
        s += `<rect x="${i * (w + 4)}" y="${20 + 40 * (1 - fill)}" width="${w}" height="${40 * fill}" rx="5" fill="#e36414" opacity="0.85"/>`;
      }
      svg.innerHTML = s;
      root.querySelector("#tk").textContent = tokens.toFixed(2);
      root.querySelector("#ok").textContent = allowed;
      root.querySelector("#no").textContent = dropped;
    };
    const request = (src = "manual") => {
      refill();
      if (tokens >= 1) { tokens -= 1; allowed++; log(`${src}: allowed ✓ (1 token used)`, "ok"); }
      else { dropped++; log(`${src}: rejected ✗ 429 Too Many Requests`, "bad"); }
      draw();
    };
    const reset = () => { tokens = cap(); last = performance.now(); allowed = 0; dropped = 0; root.querySelector('[data-o="log"]').innerHTML = ""; draw(); };
    root.querySelector('[data-a="one"]').onclick = () => request();
    root.querySelector('[data-a="burst"]').onclick = () => { for (let i = 0; i < 6; i++) request("burst"); };
    root.querySelector('[data-a="reset"]').onclick = reset;
    root.querySelector('[data-k="cap"]').oninput = reset;
    root.querySelector('[data-k="auto"]').oninput = (e) => { root.querySelector('[data-o="autov"]').textContent = e.target.value; };
    const tick = () => {
      refill();
      const r = parseFloat(root.querySelector('[data-k="auto"]').value) || 0;
      autoAcc += r / 10;
      while (autoAcc >= 1) { autoAcc -= 1; request("auto"); }
      draw();
    };
    reset();
    autoTimer = setInterval(() => { if (document.body.contains(root)) tick(); else clearInterval(autoTimer); }, 100);
  }

  // ---------- 4. Consistent hashing ring ----------
  function hashRing(root) {
    root.innerHTML = `
      <div class="sd-w-title">Consistent hashing ring — add/remove servers and watch keys move</div>
      <div class="sd-w-row">
        <label>Virtual nodes per server<input type="range" data-k="v" min="1" max="60" value="1"><span data-o="vv">1</span></label>
        <label>Keys<input type="range" data-k="n" min="20" max="400" step="20" value="120"><span data-o="nv">120</span></label>
        <button class="primary" data-a="add">+ Add server</button>
        <button data-a="rm">− Remove last server</button>
      </div>
      <svg viewBox="0 0 420 420" data-o="svg"></svg>
      <div class="sd-out">${stat("Servers", "sc")}${stat("Keys moved on last change", "mv")}${stat("If we used hash % N instead", "mod")}${stat("Load spread (max/avg)", "sp")}</div>
      <div class="sd-log" data-o="load"></div>`;
    let servers = ["s0", "s1", "s2", "s3"], nextId = 4, prevOwner = null, prevMod = null;
    const V = () => parseInt(root.querySelector('[data-k="v"]').value);
    const N = () => parseInt(root.querySelector('[data-k="n"]').value);
    const MAX = 4294967296;
    const build = () => {
      const pts = [];
      servers.forEach((s) => { for (let i = 0; i < V(); i++) pts.push({ h: fnv(`${s}#vn${i}`), s }); });
      pts.sort((a, b) => a.h - b.h);
      return pts;
    };
    const owner = (pts, h) => {
      let lo = 0, hi = pts.length;
      while (lo < hi) { const m = (lo + hi) >> 1; if (pts[m].h < h) lo = m + 1; else hi = m; }
      return pts[lo % pts.length].s;
    };
    const render = (changed) => {
      const pts = build(), keys = [];
      for (let i = 0; i < N(); i++) { const h = fnv("key-" + i); keys.push({ id: i, h, s: owner(pts, h), m: "s" + (fnv("key-" + i) % servers.length) }); }
      const ownerMap = Object.fromEntries(keys.map((k) => [k.id, k.s]));
      const modMap = Object.fromEntries(keys.map((k) => [k.id, servers[(fnv("key-" + k.id)) % servers.length]]));
      if (changed && prevOwner) {
        const moved = keys.filter((k) => prevOwner[k.id] !== ownerMap[k.id]).length;
        const movedMod = keys.filter((k) => prevMod[k.id] !== modMap[k.id]).length;
        root.querySelector("#mv").textContent = `${moved} / ${keys.length} (${((100 * moved) / keys.length).toFixed(0)}%)`;
        root.querySelector("#mod").textContent = `${movedMod} / ${keys.length} (${((100 * movedMod) / keys.length).toFixed(0)}%)`;
      } else if (!changed) {
        root.querySelector("#mv").textContent = "—"; root.querySelector("#mod").textContent = "—";
      }
      prevOwner = ownerMap; prevMod = modMap;
      const color = (s) => PALETTE[parseInt(s.slice(1)) % PALETTE.length];
      const cx = 210, cy = 210, R = 170;
      const pos = (h, r) => { const a = (h / MAX) * 2 * Math.PI - Math.PI / 2; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
      let s = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#888" stroke-opacity="0.4" stroke-width="2"/>`;
      keys.forEach((k) => { const [x, y] = pos(k.h, R - 16); s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" fill="${color(k.s)}" opacity="0.8"/>`; });
      pts.forEach((p) => { const [x, y] = pos(p.h, R); s += `<rect x="${(x - 5).toFixed(1)}" y="${(y - 5).toFixed(1)}" width="10" height="10" rx="2" fill="${color(p.s)}" stroke="#fff" stroke-width="1"/>`; });
      servers.forEach((sv, i) => { s += `<rect x="${cx - 60}" y="${cy - 50 + i * 14}" width="9" height="9" rx="2" fill="${color(sv)}"/><text x="${cx - 46}" y="${cy - 42 + i * 14}" font-size="10" fill="currentColor">${sv}</text>`; });
      s += `<text x="${cx}" y="${cy + 70}" font-size="9" text-anchor="middle" fill="currentColor" opacity="0.7">■ server (virtual) nodes · ● keys (colour = owner)</text>`;
      root.querySelector('[data-o="svg"]').innerHTML = s;
      const load = {}; servers.forEach((sv) => (load[sv] = 0)); keys.forEach((k) => load[k.s]++);
      const avg = keys.length / servers.length, mx = Math.max(...Object.values(load));
      root.querySelector("#sc").textContent = servers.length;
      root.querySelector("#sp").textContent = (mx / avg).toFixed(2) + "×";
      root.querySelector('[data-o="load"]').innerHTML = servers.map((sv) => `${sv}: ${"█".repeat(Math.round((load[sv] / keys.length) * 60))} ${load[sv]} keys`).join("<br>");
    };
    root.querySelector('[data-a="add"]').onclick = () => { if (servers.length < 10) { servers.push("s" + nextId++); render(true); } };
    root.querySelector('[data-a="rm"]').onclick = () => { if (servers.length > 1) { servers.pop(); nextId = Math.max(servers.length, 1); render(true); } };
    root.querySelector('[data-k="v"]').oninput = (e) => { root.querySelector('[data-o="vv"]').textContent = e.target.value; render(false); };
    root.querySelector('[data-k="n"]').oninput = (e) => { root.querySelector('[data-o="nv"]').textContent = e.target.value; render(false); };
    render(false);
  }

  // ---------- 5. Snowflake ID builder / decoder ----------
  function snowflake(root) {
    const EPOCH = 1288834974657n; // Twitter epoch (Nov 04 2010)
    root.innerHTML = `
      <div class="sd-w-title">Snowflake ID — build one, then decode it</div>
      <div class="sd-w-row">
        <label>Timestamp (ms since Unix epoch)<input type="number" data-k="ts" style="width:12rem"></label>
        <label>Datacenter ID (0–31)<input type="number" data-k="dc" value="7" min="0" max="31"></label>
        <label>Machine ID (0–31)<input type="number" data-k="mc" value="19" min="0" max="31"></label>
        <label>Sequence (0–4095)<input type="number" data-k="seq" value="42" min="0" max="4095"></label>
        <button data-a="now">Use now</button>
      </div>
      <div class="bits" data-o="bits"></div>
      <div class="sd-out">${stat("64-bit ID (decimal)", "id")}${stat("Time part (41 bits)", "tp")}${stat("Max IDs / ms / machine", "mx", "2^12")}</div>
      <div class="sd-w-row" style="margin-top:.8rem">
        <label>Decode any Snowflake ID<input type="text" data-k="dec" style="width:14rem;padding:.3rem .45rem;border-radius:6px;border:1px solid var(--sd-card-border);background:var(--md-default-bg-color);color:var(--md-default-fg-color)" placeholder="e.g. 1541815603606036480"></label>
        <span data-o="decout"></span>
      </div>`;
    const v = (k) => root.querySelector(`[data-k="${k}"]`);
    v("ts").value = Date.now();
    const calc = () => {
      const ts = BigInt(Math.max(0, parseInt(v("ts").value) || 0));
      const dc = BigInt(Math.min(31, Math.max(0, parseInt(v("dc").value) || 0)));
      const mc = BigInt(Math.min(31, Math.max(0, parseInt(v("mc").value) || 0)));
      const sq = BigInt(Math.min(4095, Math.max(0, parseInt(v("seq").value) || 0)));
      const t = ts - EPOCH < 0n ? 0n : ts - EPOCH;
      const id = (t << 22n) | (dc << 17n) | (mc << 12n) | sq;
      const bin = id.toString(2).padStart(64, "0");
      const cls = (i) => (i === 0 ? "b-sign" : i <= 41 ? "b-ts" : i <= 46 ? "b-dc" : i <= 51 ? "b-mc" : "b-seq");
      root.querySelector('[data-o="bits"]').innerHTML = [...bin].map((b, i) => `<span class="${cls(i)}" title="bit ${63 - i}">${b}</span>`).join("") +
        `<div style="width:100%;margin-top:.3rem;opacity:.8">grey = sign (1) · teal = timestamp (41) · orange = datacenter (5) · purple = machine (5) · green = sequence (12)</div>`;
      root.querySelector("#id").textContent = id.toString();
      root.querySelector("#tp").textContent = t.toString() + " ms";
      root.querySelector("#mx").textContent = "4096";
    };
    const decode = () => {
      const raw = v("dec").value.trim(), out = root.querySelector('[data-o="decout"]');
      if (!/^\d+$/.test(raw)) { out.textContent = ""; return; }
      const id = BigInt(raw);
      const t = (id >> 22n) + EPOCH, dc = (id >> 17n) & 31n, mc = (id >> 12n) & 31n, sq = id & 4095n;
      out.innerHTML = `→ time <b>${new Date(Number(t)).toISOString()}</b>, dc <b>${dc}</b>, machine <b>${mc}</b>, seq <b>${sq}</b>`;
    };
    root.querySelectorAll("input").forEach((i) => i.addEventListener("input", () => { calc(); decode(); }));
    root.querySelector('[data-a="now"]').onclick = () => { v("ts").value = Date.now(); calc(); };
    calc();
  }

  // ---------- 6. Base-62 converter ----------
  function base62(root) {
    const A = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    root.innerHTML = `
      <div class="sd-w-title">Base-62 encoder (ID → short code)</div>
      <div class="sd-w-row">
        <label>Numeric ID<input type="text" data-k="n" value="2009215674938" style="width:12rem;padding:.3rem .45rem;border-radius:6px;border:1px solid var(--sd-card-border);background:var(--md-default-bg-color);color:var(--md-default-fg-color)"></label>
        <label>Short code<input type="text" data-k="c" style="width:9rem;padding:.3rem .45rem;border-radius:6px;border:1px solid var(--sd-card-border);background:var(--md-default-bg-color);color:var(--md-default-fg-color)"></label>
      </div>
      <div class="sd-log" data-o="steps"></div>`;
    const n = root.querySelector('[data-k="n"]'), c = root.querySelector('[data-k="c"]'), st = root.querySelector('[data-o="steps"]');
    const enc = () => {
      if (!/^\d+$/.test(n.value.trim())) return;
      let x = BigInt(n.value.trim()), s = "", steps = [];
      if (x === 0n) s = "0";
      while (x > 0n) { const r = x % 62n; steps.push(`${x} % 62 = ${r} → '${A[Number(r)]}'`); s = A[Number(r)] + s; x /= 62n; }
      c.value = s;
      st.innerHTML = steps.join("<br>") + `<br>read remainders bottom→top: <b>${s}</b> (${s.length} chars)`;
    };
    const dec = () => {
      const s = c.value.trim(); let x = 0n;
      for (const ch of s) { const i = A.indexOf(ch); if (i < 0) return; x = x * 62n + BigInt(i); }
      n.value = x.toString(); st.innerHTML = `decoded '${s}' → ${x}`;
    };
    n.addEventListener("input", enc); c.addEventListener("input", dec); enc();
  }

  // ---------- 7. Trie autocomplete ----------
  function trie(root) {
    const seed = "tree 10\ntrue 35\ntry 29\ntoy 14\nwish 25\nwin 50\nwinter 18\ntrip 22\ntruck 9\ntrain 31\ntrending 44\ntwitter 40\ntweet 27";
    root.innerHTML = `
      <div class="sd-w-title">Trie autocomplete — top-k by frequency</div>
      <div class="sd-w-row">
        <label>Query log (word frequency per line)<textarea data-k="words" rows="6" style="width:14rem;font-family:var(--md-code-font-family);font-size:.66rem;border-radius:6px;border:1px solid var(--sd-card-border);background:var(--md-default-bg-color);color:var(--md-default-fg-color)">${seed}</textarea></label>
        <div style="display:flex;flex-direction:column;gap:.5rem">
          <label>Type a prefix<input type="text" data-k="p" value="tr" style="width:10rem;padding:.3rem .45rem;border-radius:6px;border:1px solid var(--sd-card-border);background:var(--md-default-bg-color);color:var(--md-default-fg-color)"></label>
          <label>k<input type="number" data-k="k" value="5" min="1" max="10"></label>
        </div>
      </div>
      <div class="sd-out">${stat("Suggestions", "sug")}${stat("Trie nodes", "nodes")}${stat("Nodes visited (cached top-k)", "vis", "= prefix length")}</div>
      <div class="sd-log" data-o="path"></div>`;
    const build = () => {
      const rootN = { c: {}, top: [] }; let count = 1;
      const lines = root.querySelector('[data-k="words"]').value.split("\n").map((l) => l.trim().split(/\s+/)).filter((p) => p[0]);
      const K = parseInt(root.querySelector('[data-k="k"]').value) || 5;
      for (const [w, f] of lines) {
        const freq = parseInt(f) || 1; let n = rootN;
        const push = (node) => { node.top.push([w, freq]); node.top.sort((a, b) => b[1] - a[1]); node.top = node.top.slice(0, K); };
        push(n);
        for (const ch of w) { if (!n.c[ch]) { n.c[ch] = { c: {}, top: [] }; count++; } n = n.c[ch]; push(n); }
      }
      return [rootN, count];
    };
    const run = () => {
      const [t, count] = build();
      const p = root.querySelector('[data-k="p"]').value.trim();
      let n = t, path = ["(root)"];
      for (const ch of p) { n = n && n.c[ch]; path.push(ch); }
      root.querySelector("#nodes").textContent = count;
      root.querySelector("#vis").textContent = p.length;
      root.querySelector("#sug").innerHTML = n ? n.top.map(([w, f]) => `${w} <small>(${f})</small>`).join("<br>") || "—" : "no match";
      root.querySelector('[data-o="path"]').innerHTML = `walk: ${path.join(" → ")}<br>each node stores its own top-${root.querySelector('[data-k="k"]').value} list, so the answer is read directly from the last node — no subtree traversal needed.`;
    };
    root.querySelectorAll("input,textarea").forEach((i) => i.addEventListener("input", run));
    run();
  }

  const REGISTRY = { estimator, nines, "token-bucket": tokenBucket, "hash-ring": hashRing, snowflake, base62, trie };

  const init = () => {
    document.querySelectorAll(".sd-widget[data-widget]:not([data-ready])").forEach((el) => {
      const fn = REGISTRY[el.dataset.widget];
      if (fn) { try { fn(el); el.dataset.ready = "1"; } catch (e) { el.textContent = "Widget failed to load: " + e.message; } }
    });
  };

  if (typeof window.document$ !== "undefined" && window.document$.subscribe) {
    window.document$.subscribe(init);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
