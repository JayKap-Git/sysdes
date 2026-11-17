---
title: "02 · Back-of-the-Envelope Estimation"
description: Powers of two, latency numbers, availability nines, and step-by-step recipes for QPS, storage, bandwidth, cache and server counts — with five worked examples.
---

# 02 · Back-of-the-Envelope Estimation

<div class="chapter-meta" markdown>
<span>⏱ 35 min read</span>
<span class="hot">🔥 Asked in almost every design round</span>
<span>Book: Chapter 2</span>
</div>

!!! abstract "TL;DR"
    - Estimation isn't about the exact answer — it's about **showing a clear process** and landing within the right **order of magnitude** (10× matters, 20% doesn't).
    - Know three tables cold: **powers of two** (KB→PB), **latency numbers** (memory ≈ 100 ns, SSD ≈ 100 µs, cross-continent ≈ 150 ms), and **availability nines** (99.9% ≈ 8.8 h/year down).
    - Core recipe: **DAU × actions per user ÷ 86,400 = average QPS**, × 2–3 for peak. **Storage = writes/day × size × retention × replicas.**
    - Round aggressively (86,400 ≈ 10⁵), **write assumptions down**, and **always label units**.
    - Use the numbers to make **decisions**: "40K QPS of reads → needs a cache", "55 PB → needs object storage, not a DB".

## The intuition: why estimate at all?

When a civil engineer plans a bridge, they don't start by choosing the paint. They first ask:
*how many trucks, how heavy, how often?* The answer decides whether you need a footbridge or a
steel suspension bridge.

Estimation does the same for software. "Design Twitter" could need **3 servers** or **3,000** —
and those are completely different designs. Five minutes of arithmetic tells you which one you're building,
and it tells the interviewer that you design from **requirements**, not from buzzwords.

---

## Table 1 · Powers of two

Data sizes are powers of 2, but for estimation treat them as powers of 10 — the error is under 10%.

| Power | Exact value | ≈ | Name | Short |
|---|---|---|---|---|
| 2¹⁰ | 1,024 | 1 thousand | Kilobyte | KB |
| 2²⁰ | 1,048,576 | 1 million | Megabyte | MB |
| 2³⁰ | 1,073,741,824 | 1 billion | Gigabyte | GB |
| 2⁴⁰ | ≈ 1.1 × 10¹² | 1 trillion | Terabyte | TB |
| 2⁵⁰ | ≈ 1.1 × 10¹⁵ | 1 quadrillion | Petabyte | PB |

**Size of everyday things** (memorise roughly):

| Thing | Size |
|---|---|
| 1 ASCII character | 1 byte |
| A `long` / a Snowflake ID / a timestamp | 8 bytes |
| A UUID | 16 bytes (36 as a string) |
| A tweet-length text (280 chars) | ~300 bytes |
| A typical DB row of metadata | 100 B – 1 KB |
| A compressed photo | 200 KB – 2 MB |
| 1 minute of 1080p video | ~50–100 MB raw upload, ~10–20 MB per streamed rendition |

---

## Table 2 · Latency numbers every programmer should know

These come from Jeff Dean's famous list (circa 2010, with modern approximations). Exact values drift
as hardware improves; the **ratios** are what matter.

| Operation | Approx. time | Think of it as… |
|---|---|---|
| L1 cache reference | 0.5–1 ns | — |
| Branch mispredict | 3–5 ns | — |
| L2 cache reference | 4–7 ns | — |
| Mutex lock/unlock | ~25 ns | — |
| **Main memory reference** | **~100 ns** | baseline "fast" |
| Compress 1 KB (Snappy/zstd) | ~2–3 µs | cheap — compress before sending! |
| Send 1 KB over 1 Gbps network | ~10 µs | — |
| **Random read from SSD** | **~16–100 µs** | ~1,000× slower than memory |
| Read 1 MB sequentially from memory | ~5–10 µs | — |
| Round trip within same data center | ~0.5 ms | — |
| Read 1 MB sequentially from SSD | ~50 µs – 1 ms | — |
| **Disk (HDD) seek** | **~2–10 ms** | avoid random seeks! |
| Read 1 MB sequentially from HDD | ~1–5 ms | — |
| **Packet round trip CA → Netherlands → CA** | **~150 ms** | the speed of light is the limit |

Units: 1 ns = 10⁻⁹ s · 1 µs = 1,000 ns · 1 ms = 1,000 µs = 10⁶ ns.

**Scaled to human time** — if a memory reference took **1 second**:
an SSD read takes about **1–2 days**, a disk seek about **3 months**, and a cross-continent round
trip about **5 years**. That's why caches and data locality matter so much.

**Takeaways you should say out loud in interviews:**

1. **Memory is fast, disk is slow** → cache hot data in RAM.
2. **Avoid disk seeks** → prefer sequential I/O (this is why LSM-trees and append-only logs exist — Chapter 6).
3. **Compression is cheap** → compress before sending over the network.
4. **Cross-region calls are expensive** (~100+ ms) → keep chatty calls inside one data center; replicate data closer to users.

---

## Table 3 · Availability numbers ("the nines")

**Availability** = fraction of time a system is operational. A **Service Level Agreement (SLA)** is the
promise a provider makes to customers (AWS, GCP and Azure set most compute SLAs at **99.9% or higher**).
Related terms: an **SLO** is your internal target, an **SLI** is the actual measured value.

| Availability | Downtime / day | Downtime / week | Downtime / month | Downtime / year |
|---|---|---|---|---|
| 99% ("two nines") | 14.4 min | 1.68 h | 7.31 h | 3.65 days |
| 99.9% ("three nines") | 1.44 min | 10.1 min | 43.8 min | 8.77 h |
| 99.99% ("four nines") | 8.64 s | 1.01 min | 4.38 min | 52.6 min |
| 99.999% ("five nines") | 864 ms | 6.05 s | 26.3 s | 5.26 min |
| 99.9999% ("six nines") | 86.4 ms | 605 ms | 2.63 s | 31.6 s |

**Composing availability:**

- **In series** (all parts needed): multiply. Three 99.9% parts → 0.999³ ≈ **99.7%**. Every dependency *lowers* availability.
- **In parallel** (any one is enough): `1 − (1 − a)ⁿ`. Two 99% replicas → 1 − 0.01² = **99.99%**. Redundancy *raises* it.

Try it:

<div class="sd-widget" data-widget="nines"></div>

---

## The estimation toolkit

### Handy conversions

| Fact | Use this |
|---|---|
| Seconds in a day = 86,400 | **≈ 10⁵** (makes division trivial) |
| Seconds in a month | ≈ 2.5 × 10⁶ |
| Seconds in a year | ≈ 3 × 10⁷ |
| 1 million requests/day | ≈ **12 QPS** |
| 1 billion requests/day | ≈ **12,000 QPS** |
| 1 request/sec sustained | ≈ 86K/day ≈ 2.6M/month |

### The core recipes

```text
DAU                = MAU × (fraction active daily)
Average QPS        = DAU × (requests per user per day) / 86,400
Peak QPS           = Average QPS × (2 … 5)          ← traffic isn't flat
Read vs write QPS  = split by read:write ratio
Storage per day    = (writes per day) × (bytes per write)
Total storage      = storage per day × 365 × years × replication factor
Bandwidth          = QPS × bytes per request          (ingress for writes, egress for reads)
Cache memory       = ~20% of daily read data          (80/20 rule: 20% of items get 80% of reads)
Servers            = Peak QPS / (QPS one server can handle)  + headroom
```

**Rule-of-thumb capacities** (very rough, for a single commodity server):

| Component | Ballpark |
|---|---|
| Stateless web/app server | 1K – 10K simple requests/sec |
| Relational DB (single primary) | ~1K – 10K writes/sec, more reads with good indexes |
| Redis / Memcached node | ~100K+ ops/sec |
| Kafka broker | ~100K+ messages/sec |
| Commodity server RAM | 64 – 512 GB |

### Interactive calculator

Change any input and the whole chain recomputes. The defaults match Worked Example 1 below (100 KB is the *average* write: 20% of posts × 500 KB image).

<div class="sd-widget" data-widget="estimator"></div>

---

## Worked example 1 · A microblogging service

*(Numbers are invented for practice.)*

**Assumptions** — write these on the board first:

- 400 M monthly active users, 40% use it daily.
- Each daily user publishes **3** posts and reads **~80** posts (timeline loads).
- 20% of posts carry an image of ~500 KB (ignore video for now).
- Keep everything for 7 years.

**QPS**

- DAU = 400 M × 40% = **160 M**
- Write QPS = 160 M × 3 / 86,400 ≈ 480 M / 10⁵ ≈ **4,800 posts/sec**; peak (×2) ≈ **~10,000**
- Read QPS = 160 M × 80 / 10⁵ ≈ **128,000 post reads/sec** → read-heavy (~27:1) → **caching and precomputed timelines** are mandatory (Chapter 11).

**Storage**

- Text + metadata per post: id 8 B + author id 8 B + text ~300 B + timestamps/counters ~100 B ≈ **~0.5 KB**
- Text/day = 480 M posts × 0.5 KB = **240 GB/day** → ×365×7 ≈ **~0.6 PB** (before replication)
- Media/day = 480 M × 20% × 500 KB = **48 TB/day** → ×365×7 ≈ **~123 PB**

**What the numbers tell us:** media outweighs text by ~200×. Text belongs in a sharded database; media
belongs in **object storage (S3) + CDN**. That single observation shapes the whole architecture.

---

## Worked example 2 · WhatsApp-style chat

**Assumptions:** 2 B MAU, 50% daily → **1 B DAU**; each sends **40 messages/day**; average message ~100 bytes; messages stored on server for 30 days (until delivered/backed up).

- Messages/day = 1 B × 40 = **40 B/day**
- Average write QPS = 40 B / 10⁵ = **400,000 msgs/sec**; peak ×3 ≈ **1.2 M/sec**
- Storage/day = 40 B × 100 B = **4 TB/day** → 30 days ≈ **120 TB**, ×3 replicas ≈ **360 TB**
- Connections: if 30% of DAU are online at peak → **300 M concurrent WebSocket connections**. At ~1 M connections per well-tuned server → **~300+ chat servers** just to hold connections (plus headroom).

**Decision:** the bottleneck isn't storage, it's **concurrent connections and message fan-out** → stateful chat servers + a key-value store optimised for writes (Chapter 12).

---

## Worked example 3 · YouTube-style video

**Assumptions:** 2 B MAU, 50% daily → **1 B DAU**; each watches **5 videos/day**; 1% of users upload **1 video/day**; average upload 300 MB (raw); we store ~4 renditions totalling ~1.5× the raw size.

- View QPS = 1 B × 5 / 10⁵ = **50,000 views/sec**
- Uploads/day = 1 B × 1% = **10 M videos/day** → ~**115 uploads/sec**
- Storage/day = 10 M × 300 MB × 1.5 ≈ **4.5 PB/day** (!)
- Egress: if an average view streams 100 MB → 5 B views × 100 MB = **500 PB/day** served — only a **CDN** can do this.

**Decision:** cost is dominated by **CDN egress and storage**. Optimisations — serve only popular videos from CDN,
compress better, store fewer renditions for unpopular videos — become first-class design topics (Chapter 14).

---

## Worked example 4 · URL shortener

**Assumptions:** **40 M** new short links/day; each link is opened ~50 times over its life (read:write = 50:1); keep links for 15 years; ~250 bytes per record (long URL + code + owner + timestamps).

- Write QPS = 40 M / 10⁵ ≈ **400/sec** (precisely ~460)
- Read QPS = ×50 ≈ **20,000–23,000/sec**; peak ×2 ≈ **~45K/sec**
- Records over 15 years = 40 M × 365 × 15 ≈ **219 B** records
- Storage = 219 B × 250 B ≈ **55 TB** (before replication)
- Short-code length: need ≥ 219 B unique codes. Base-62: 62⁶ ≈ 57 B (too few), **62⁷ ≈ 3.5 T** ✓ → **7 characters**.

**Decision:** small records, huge count, reads ≫ writes → a sharded key-value store plus an aggressive cache for hot
links. (Full design in Chapter 8.)

---

## Worked example 5 · Instagram-style photos — cache & servers

**Assumptions:** 500 M DAU; each views **50 photos/day**; uploads **0.2 photos/day** at 2 MB; metadata 1 KB per photo; a server handles **2,000 QPS**.

- Read QPS = 500 M × 50 / 10⁵ = **250,000/sec**; peak ×2 = **500K/sec**
- Write QPS = 500 M × 0.2 / 10⁵ = **1,000 uploads/sec**
- Photo storage/day = 100 M × 2 MB = **200 TB/day**
- **Metadata cache:** daily reads = 25 B photo views; but unique photos viewed are far fewer. If the hot set is ~20% of the last 30 days of photos: 100 M × 30 × 20% × 1 KB ≈ **600 GB** → ~10 cache nodes of 64 GB (with headroom/replicas).
- **API servers:** 500K / 2,000 = **250 servers** at peak, + ~30% headroom ≈ **325**.

---

## Tips that impress interviewers

!!! tip "How to estimate in an interview"
    1. **State assumptions first**, and confirm them: "I'll assume 100 M DAU — does that sound right?"
    2. **Round ruthlessly.** 48,213 × 6.8 → 50,000 × 7 = 350,000. Nobody expects decimal precision.
    3. **Label every unit.** "5" is meaningless; "5 MB/s" isn't.
    4. **Separate reads from writes** — they lead to different components (cache vs. write-optimised storage).
    5. **Translate numbers into decisions** — "so a single DB can handle the writes, but reads need a cache".
    6. **Sanity-check** with something you know: "1.2 M msgs/sec is plausible for a global chat app."
    7. **Don't over-spend time.** 3–5 minutes, then move to the design.

!!! interview "Commonly asked estimates"
    QPS and peak QPS · storage over N years · bandwidth (ingress/egress) · cache memory ·
    number of servers / connections · ID space (how many bits / characters).

---

## Interviewer follow-ups

??? question "Why multiply by 2–5 for peak? Isn't that arbitrary?"
    Traffic follows daily cycles (evening peaks), weekly cycles and events (cricket finals, New Year, a sale).
    A peak-to-average ratio of 2–3× is common for consumer apps; event-driven spikes can be 10×+. The point is to
    design for peak, not average — and to say *why* you chose the multiplier ("India-heavy user base, so evening peak").

??? question "Your storage estimate is 55 PB. What does that change in the design?"
    No database will hold that economically. Use **object storage** (S3/GCS/HDFS) for blobs, keep only **metadata**
    (URLs, owners, sizes) in a database, tier old data to **cold storage** (cheaper, slower), deduplicate identical
    uploads, and push reads through a **CDN**.

??? question "How do you estimate how much cache you need?"
    Use the 80/20 rule: ~20% of objects get ~80% of reads. Cache memory ≈ 20% × (daily unique objects read) × object size.
    Then add overhead (~1.3–1.5× for keys and metadata) and replicas. Validate later with real **hit-ratio** metrics.

??? question "1 B requests/day — is that a lot?"
    It's ~12K QPS average, maybe 30K at peak — large, but very manageable: a few dozen stateless servers, a cache cluster,
    and a sharded/replicated DB. Converting "per day" to "per second" is the fastest way to calibrate how scary a number really is.

---

## Practice

??? example "Practice 1 — Food delivery"
    A food-delivery app in India: 20 M DAU, each opens the app 4 times/day and each open triggers 10 API calls.
    Orders: 3 M/day. Each order writes 5 KB. Keep 3 years. Peak at dinner is 4× average. Compute API peak QPS,
    order write QPS, and order storage with 3× replication.

    **Solution.** API: 20 M × 4 × 10 = 800 M/day → 800 M / 10⁵ = **8K QPS avg**, ×4 = **32K peak**.
    Orders: 3 M / 10⁵ ≈ **35/sec** avg (~140 peak) — tiny for a DB.
    Storage: 3 M × 5 KB = 15 GB/day × 365 × 3 ≈ 16.4 TB × 3 replicas ≈ **~50 TB**.
    Takeaway: the API read path (menus, restaurant lists) needs caching; order writes are easy.

??? example "Practice 2 — Snowflake bits"
    How many years of IDs does a 41-bit millisecond timestamp give you?

    **Solution.** 2⁴¹ ms ≈ 2.2 × 10¹² ms ≈ 2.2 × 10⁹ s ≈ 2.2 × 10⁹ / 3.15 × 10⁷ ≈ **~69.7 years** (Chapter 7).

??? example "Practice 3 — Bandwidth"
    A video platform serves 50K concurrent streams at 5 Mbps each. What's the egress?

    **Solution.** 50,000 × 5 Mbps = 250,000 Mbps = **250 Gbps** ≈ 31 GB/s. Over a day ≈ 2.7 PB. You need a CDN.

??? example "Practice 4 — Connections"
    A multiplayer game has 10 M DAU; 10% are online at peak, each holding one WebSocket. A gateway server holds
    200K connections. How many gateway servers?

    **Solution.** 10 M × 10% = 1 M connections / 200K = **5 servers**; with N+2 redundancy and headroom → **7–8**.

---

## Revision checklist

- [ ] I can write the powers-of-two table from KB to PB.
- [ ] I can recall memory ≈ 100 ns, SSD ≈ 100 µs, HDD seek ≈ 10 ms, cross-continent ≈ 150 ms — and the 4 takeaways.
- [ ] I know downtime/year for 99%, 99.9%, 99.99%, 99.999%, and how to combine series vs parallel.
- [ ] I can convert per-day to per-second instantly (÷ 10⁵) and know 1 M/day ≈ 12 QPS.
- [ ] I can estimate QPS, peak, storage, bandwidth, cache size and server count with labelled units.
- [ ] I can turn each number into a design decision.

[Next: 03 · The Interview Framework :material-arrow-right:](03-interview-framework.md){ .md-button .md-button--primary }
