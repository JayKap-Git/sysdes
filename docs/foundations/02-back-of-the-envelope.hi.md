---
title: "02 · Back-of-the-Envelope Estimation"
description: Powers of two, latency numbers, availability nines, aur QPS, storage, bandwidth, cache, servers nikaalne ke step-by-step recipes — paanch worked examples ke saath.
---

# 02 · Back-of-the-Envelope Estimation

<div class="chapter-meta" markdown>
<span>⏱ 35 min read</span>
<span class="hot">🔥 Lagbhag har design round mein poocha jaata hai</span>
<span>Book: Chapter 2</span>
</div>

!!! abstract "TL;DR"
    - Estimation ka matlab exact answer nahi — matlab hai **saaf process dikhana** aur sahi **order of magnitude** pe pahunchna (10× ka fark matter karta hai, 20% ka nahi).
    - Teen tables zubaani yaad rakho: **powers of two** (KB→PB), **latency numbers** (memory ≈ 100 ns, SSD ≈ 100 µs, cross-continent ≈ 150 ms), aur **availability nines** (99.9% ≈ saal mein 8.8 ghante down).
    - Core recipe: **DAU × actions per user ÷ 86,400 = average QPS**, peak ke liye × 2–3. **Storage = writes/day × size × retention × replicas.**
    - Bindaas round karo (86,400 ≈ 10⁵), **assumptions likh lo**, aur **har jagah units likho**.
    - Numbers se **decisions** lo: "40K QPS reads → cache chahiye", "55 PB → object storage chahiye, DB nahi".

## Intuition: estimate karte hi kyun hain?

Civil engineer jab pul (bridge) plan karta hai, toh paint ka colour pehle nahi chunta. Pehle poochta hai:
*kitne trucks, kitne bhaari, kitni baar?* Jawab decide karta hai ki footbridge chahiye ya steel ka suspension bridge.

Software mein estimation yahi kaam karta hai. "Twitter design karo" ka matlab **3 servers** bhi ho sakta hai aur **3,000** bhi —
aur dono bilkul alag designs hain. Paanch minute ka hisaab batata hai ki tum kaunsa bana rahe ho, aur interviewer ko
dikhata hai ki tum **requirements** se design karte ho, buzzwords se nahi.

---

## Table 1 · Powers of two

Data sizes powers of 2 hote hain, par estimation ke liye inhe powers of 10 maan lo — error 10% se kam hai.

| Power | Exact value | ≈ | Naam | Short |
|---|---|---|---|---|
| 2¹⁰ | 1,024 | 1 hazaar | Kilobyte | KB |
| 2²⁰ | 1,048,576 | 10 lakh (1 million) | Megabyte | MB |
| 2³⁰ | 1,073,741,824 | 100 crore (1 billion) | Gigabyte | GB |
| 2⁴⁰ | ≈ 1.1 × 10¹² | 1 trillion | Terabyte | TB |
| 2⁵⁰ | ≈ 1.1 × 10¹⁵ | 1 quadrillion | Petabyte | PB |

**Roz ki cheezon ka size** (roughly yaad rakho):

| Cheez | Size |
|---|---|
| 1 ASCII character | 1 byte |
| Ek `long` / Snowflake ID / timestamp | 8 bytes |
| Ek UUID | 16 bytes (string mein 36) |
| Tweet jitna text (280 chars) | ~300 bytes |
| Metadata ki typical DB row | 100 B – 1 KB |
| Compressed photo | 200 KB – 2 MB |
| 1080p video ka 1 minute | ~50–100 MB raw upload, har streamed rendition ~10–20 MB |

---

## Table 2 · Latency numbers jo har programmer ko pata hone chahiye

Yeh Jeff Dean ki famous list se hain (lagbhag 2010, aaj ke approximations ke saath). Hardware improve hone se exact values
badalti rehti hain; **ratios** matter karte hain.

| Operation | Approx. time | Aise socho… |
|---|---|---|
| L1 cache reference | 0.5–1 ns | — |
| Branch mispredict | 3–5 ns | — |
| L2 cache reference | 4–7 ns | — |
| Mutex lock/unlock | ~25 ns | — |
| **Main memory reference** | **~100 ns** | "fast" ka baseline |
| 1 KB compress (Snappy/zstd) | ~2–3 µs | sasta — bhejne se pehle compress karo! |
| 1 Gbps network pe 1 KB bhejna | ~10 µs | — |
| **SSD se random read** | **~16–100 µs** | memory se ~1,000× slow |
| Memory se 1 MB sequential read | ~5–10 µs | — |
| Same data center ke andar round trip | ~0.5 ms | — |
| SSD se 1 MB sequential read | ~50 µs – 1 ms | — |
| **Disk (HDD) seek** | **~2–10 ms** | random seeks se bacho! |
| HDD se 1 MB sequential read | ~1–5 ms | — |
| **Packet round trip CA → Netherlands → CA** | **~150 ms** | speed of light hi limit hai |

Units: 1 ns = 10⁻⁹ s · 1 µs = 1,000 ns · 1 ms = 1,000 µs = 10⁶ ns.

**Insaani time mein socho** — agar ek memory reference **1 second** leta:
toh SSD read lagbhag **1–2 din**, disk seek lagbhag **3 mahine**, aur cross-continent round trip lagbhag **5 saal** leta.
Isliye caches aur data locality itne important hain.

**Interview mein yeh takeaways zor se bolo:**

1. **Memory tez, disk slow** → hot data RAM mein cache karo.
2. **Disk seeks se bacho** → sequential I/O prefer karo (isi liye LSM-trees aur append-only logs bane — Chapter 6).
3. **Compression sasta hai** → network pe bhejne se pehle compress karo.
4. **Cross-region calls mehenge hain** (~100+ ms) → baatooni calls ek data center ke andar rakho; data users ke paas replicate karo.

---

## Table 3 · Availability numbers ("nines")

**Availability** = kitne fraction time system chal raha hai. **Service Level Agreement (SLA)** woh promise hai jo provider
customers se karta hai (AWS, GCP aur Azure zyada tar compute SLAs **99.9% ya upar** rakhte hain). Related terms: **SLO**
tumhara internal target hai, **SLI** actual measured value.

| Availability | Downtime / din | Downtime / hafta | Downtime / mahina | Downtime / saal |
|---|---|---|---|---|
| 99% ("two nines") | 14.4 min | 1.68 h | 7.31 h | 3.65 din |
| 99.9% ("three nines") | 1.44 min | 10.1 min | 43.8 min | 8.77 h |
| 99.99% ("four nines") | 8.64 s | 1.01 min | 4.38 min | 52.6 min |
| 99.999% ("five nines") | 864 ms | 6.05 s | 26.3 s | 5.26 min |
| 99.9999% ("six nines") | 86.4 ms | 605 ms | 2.63 s | 31.6 s |

**Availability jodna:**

- **Series mein** (saare parts chahiye): multiply karo. Teen 99.9% parts → 0.999³ ≈ **99.7%**. Har dependency availability *ghatati* hai.
- **Parallel mein** (koi ek kaafi hai): `1 − (1 − a)ⁿ`. Do 99% replicas → 1 − 0.01² = **99.99%**. Redundancy availability *badhati* hai.

Khud try karo:

<div class="sd-widget" data-widget="nines"></div>

---

## Estimation toolkit

### Kaam ke conversions

| Fact | Yeh use karo |
|---|---|
| Ek din mein seconds = 86,400 | **≈ 10⁵** (division aasaan) |
| Ek mahine mein seconds | ≈ 2.5 × 10⁶ |
| Ek saal mein seconds | ≈ 3 × 10⁷ |
| 10 lakh (1 million) requests/din | ≈ **12 QPS** |
| 100 crore (1 billion) requests/din | ≈ **12,000 QPS** |
| 1 request/sec lagatar | ≈ 86K/din ≈ 2.6M/mahina |

### Core recipes

```text
DAU                = MAU × (roz active hone ka fraction)
Average QPS        = DAU × (per user per day requests) / 86,400
Peak QPS           = Average QPS × (2 … 5)          ← traffic flat nahi hota
Read vs write QPS  = read:write ratio se split karo
Storage per day    = (writes per day) × (bytes per write)
Total storage      = storage per day × 365 × years × replication factor
Bandwidth          = QPS × bytes per request          (writes ke liye ingress, reads ke liye egress)
Cache memory       = daily read data ka ~20%          (80/20 rule: 20% items ko 80% reads milte hain)
Servers            = Peak QPS / (ek server kitna QPS sambhale)  + headroom
```

**Rule-of-thumb capacities** (bahut rough, ek commodity server ke liye):

| Component | Ballpark |
|---|---|
| Stateless web/app server | 1K – 10K simple requests/sec |
| Relational DB (single primary) | ~1K – 10K writes/sec, achhe indexes ke saath reads zyada |
| Redis / Memcached node | ~100K+ ops/sec |
| Kafka broker | ~100K+ messages/sec |
| Commodity server RAM | 64 – 512 GB |

### Interactive calculator

Koi bhi input badlo, poori chain dobara calculate hoti hai. Defaults neeche Worked Example 1 se match karte hain (100 KB *average* write hai: 20% posts × 500 KB image).

<div class="sd-widget" data-widget="estimator"></div>

---

## Worked example 1 · Ek microblogging service

*(Numbers practice ke liye banaye hue hain.)*

**Assumptions** — pehle board pe likho:

- 400 M monthly active users, 40% roz use karte hain.
- Har daily user **3** posts publish karta hai aur **~80** posts padhta hai (timeline loads).
- 20% posts mein ~500 KB ki image hai (video abhi ignore).
- Sab kuch 7 saal rakhna hai.

**QPS**

- DAU = 400 M × 40% = **160 M**
- Write QPS = 160 M × 3 / 86,400 ≈ 480 M / 10⁵ ≈ **4,800 posts/sec**; peak (×2) ≈ **~10,000**
- Read QPS = 160 M × 80 / 10⁵ ≈ **128,000 post reads/sec** → read-heavy (~27:1) → **caching aur precomputed timelines** zaroori (Chapter 11).

**Storage**

- Har post ka text + metadata: id 8 B + author id 8 B + text ~300 B + timestamps/counters ~100 B ≈ **~0.5 KB**
- Text/din = 480 M posts × 0.5 KB = **240 GB/din** → ×365×7 ≈ **~0.6 PB** (replication se pehle)
- Media/din = 480 M × 20% × 500 KB = **48 TB/din** → ×365×7 ≈ **~123 PB**

**Numbers kya bata rahe hain:** media text se ~200× bhaari hai. Text sharded database mein jaayega; media **object storage
(S3) + CDN** mein. Yeh ek observation poore architecture ko shape karta hai.

---

## Worked example 2 · WhatsApp jaisa chat

**Assumptions:** 2 B MAU, 50% daily → **1 B DAU**; har user **40 messages/din** bhejta hai; average message ~100 bytes; messages server pe 30 din store (deliver/backup hone tak).

- Messages/din = 1 B × 40 = **40 B/din**
- Average write QPS = 40 B / 10⁵ = **400,000 msgs/sec**; peak ×3 ≈ **1.2 M/sec**
- Storage/din = 40 B × 100 B = **4 TB/din** → 30 din ≈ **120 TB**, ×3 replicas ≈ **360 TB**
- Connections: peak pe 30% DAU online → **300 M concurrent WebSocket connections**. Ek achhe se tuned server pe ~1 M connections → sirf connections sambhalne ke liye **~300+ chat servers** (plus headroom).

**Decision:** bottleneck storage nahi, **concurrent connections aur message fan-out** hai → stateful chat servers + writes ke liye optimised key-value store (Chapter 12).

---

## Worked example 3 · YouTube jaisa video

**Assumptions:** 2 B MAU, 50% daily → **1 B DAU**; har user **5 videos/din** dekhta hai; 1% users **1 video/din** upload karte hain; average upload 300 MB (raw); hum ~4 renditions store karte hain jo milke raw ka ~1.5× hain.

- View QPS = 1 B × 5 / 10⁵ = **50,000 views/sec**
- Uploads/din = 1 B × 1% = **10 M videos/din** → ~**115 uploads/sec**
- Storage/din = 10 M × 300 MB × 1.5 ≈ **4.5 PB/din** (!)
- Egress: agar average view 100 MB stream karta hai → 5 B views × 100 MB = **500 PB/din** serve — yeh sirf **CDN** kar sakta hai.

**Decision:** cost pe **CDN egress aur storage** haavi hain. Optimisations — sirf popular videos CDN se, better compression,
unpopular videos ke kam renditions — first-class design topics ban jaate hain (Chapter 14).

---

## Worked example 4 · URL shortener

**Assumptions:** roz **40 M** naye short links; har link apni zindagi mein ~50 baar khulta hai (read:write = 50:1); links 15 saal rakhne hain; har record ~250 bytes (long URL + code + owner + timestamps).

- Write QPS = 40 M / 10⁵ ≈ **400/sec** (exactly ~460)
- Read QPS = ×50 ≈ **20,000–23,000/sec**; peak ×2 ≈ **~45K/sec**
- 15 saal mein records = 40 M × 365 × 15 ≈ **219 B** records
- Storage = 219 B × 250 B ≈ **55 TB** (replication se pehle)
- Short-code length: kam se kam 219 B unique codes chahiye. Base-62: 62⁶ ≈ 57 B (kam), **62⁷ ≈ 3.5 T** ✓ → **7 characters**.

**Decision:** chhote records, bahut zyada count, reads ≫ writes → sharded key-value store plus hot links ke liye aggressive cache.
(Poora design Chapter 8 mein.)

---

## Worked example 5 · Instagram jaisi photos — cache & servers

**Assumptions:** 500 M DAU; har user **50 photos/din** dekhta hai; **0.2 photos/din** upload karta hai, 2 MB ki; har photo ka metadata 1 KB; ek server **2,000 QPS** handle karta hai.

- Read QPS = 500 M × 50 / 10⁵ = **250,000/sec**; peak ×2 = **500K/sec**
- Write QPS = 500 M × 0.2 / 10⁵ = **1,000 uploads/sec**
- Photo storage/din = 100 M × 2 MB = **200 TB/din**
- **Metadata cache:** roz 25 B photo views; par unique photos jo dekhi gayi woh kahin kam. Agar hot set pichle 30 din ki photos ka ~20% hai: 100 M × 30 × 20% × 1 KB ≈ **600 GB** → 64 GB ke ~10 cache nodes (headroom/replicas ke saath).
- **API servers:** 500K / 2,000 = peak pe **250 servers**, + ~30% headroom ≈ **325**.

---

## Tips jo interviewer ko impress karte hain

!!! tip "Interview mein estimate kaise karein"
    1. **Pehle assumptions bolo**, aur confirm karo: "Main 100 M DAU maan raha hoon — theek lag raha hai?"
    2. **Bindaas round karo.** 48,213 × 6.8 → 50,000 × 7 = 350,000. Koi decimal precision expect nahi karta.
    3. **Har unit likho.** "5" ka koi matlab nahi; "5 MB/s" ka hai.
    4. **Reads aur writes alag karo** — dono alag components ki taraf le jaate hain (cache vs write-optimised storage).
    5. **Numbers ko decisions mein badlo** — "toh writes ek DB sambhal lega, par reads ko cache chahiye".
    6. **Sanity-check** karo kisi jaani-pehchaani cheez se: "global chat app ke liye 1.2 M msgs/sec plausible hai."
    7. **Zyada time mat lagao.** 3–5 minute, phir design pe chalo.

!!! interview "Aksar poochhe jaane waale estimates"
    QPS aur peak QPS · N saal mein storage · bandwidth (ingress/egress) · cache memory ·
    servers / connections ki ginti · ID space (kitne bits / characters).

---

## Interviewer follow-ups

??? question "Peak ke liye 2–5 se multiply kyun? Yeh arbitrary nahi hai?"
    Traffic daily cycles (shaam ka peak), weekly cycles aur events (cricket final, New Year, sale) follow karta hai.
    Consumer apps ke liye 2–3× peak-to-average common hai; event-driven spikes 10×+ ho sakte hain. Point yeh hai ki average
    nahi, peak ke liye design karo — aur batao multiplier *kyun* chuna ("user base India-heavy hai, toh shaam ka peak").

??? question "Tumhara storage estimate 55 PB hai. Design mein kya badlega?"
    Koi database itna economically nahi rakhega. Blobs ke liye **object storage** (S3/GCS/HDFS), database mein sirf
    **metadata** (URLs, owners, sizes), purana data **cold storage** pe (sasta, slow), identical uploads deduplicate karo,
    aur reads **CDN** se bhejo.

??? question "Kitna cache chahiye, yeh kaise estimate karoge?"
    80/20 rule: ~20% objects ko ~80% reads milte hain. Cache memory ≈ 20% × (roz padhe gaye unique objects) × object size.
    Phir overhead (~1.3–1.5× keys aur metadata ke liye) aur replicas jodo. Baad mein real **hit-ratio** metrics se validate karo.

??? question "1 B requests/din — kya yeh bahut hai?"
    Average ~12K QPS, peak pe shayad 30K — bada hai, par bilkul manageable: kuch dozen stateless servers, ek cache cluster,
    aur ek sharded/replicated DB. "Per day" ko "per second" mein badalna sabse tez tareeka hai yeh samajhne ka ki number kitna darawna hai.

---

## Practice

??? example "Practice 1 — Food delivery"
    India mein ek food-delivery app: 20 M DAU, har user din mein 4 baar app kholta hai aur har baar 10 API calls hoti hain.
    Orders: 3 M/din. Har order 5 KB likhta hai. 3 saal rakhna hai. Dinner pe peak average ka 4× hai. API peak QPS,
    order write QPS, aur 3× replication ke saath order storage nikalo.

    **Solution.** API: 20 M × 4 × 10 = 800 M/din → 800 M / 10⁵ = **8K QPS avg**, ×4 = **32K peak**.
    Orders: 3 M / 10⁵ ≈ **35/sec** avg (~140 peak) — DB ke liye kuch bhi nahi.
    Storage: 3 M × 5 KB = 15 GB/din × 365 × 3 ≈ 16.4 TB × 3 replicas ≈ **~50 TB**.
    Takeaway: API read path (menus, restaurant lists) ko caching chahiye; order writes aasaan hain.

??? example "Practice 2 — Snowflake bits"
    41-bit millisecond timestamp kitne saal ke IDs deta hai?

    **Solution.** 2⁴¹ ms ≈ 2.2 × 10¹² ms ≈ 2.2 × 10⁹ s ≈ 2.2 × 10⁹ / 3.15 × 10⁷ ≈ **~69.7 saal** (Chapter 7).

??? example "Practice 3 — Bandwidth"
    Ek video platform 50K concurrent streams 5 Mbps each pe serve karta hai. Egress kitna?

    **Solution.** 50,000 × 5 Mbps = 250,000 Mbps = **250 Gbps** ≈ 31 GB/s. Ek din mein ≈ 2.7 PB. CDN chahiye.

??? example "Practice 4 — Connections"
    Ek multiplayer game ke 10 M DAU hain; peak pe 10% online, har ek ek WebSocket rakhta hai. Ek gateway server
    200K connections rakhta hai. Kitne gateway servers?

    **Solution.** 10 M × 10% = 1 M connections / 200K = **5 servers**; N+2 redundancy aur headroom ke saath → **7–8**.

---

## Revision checklist

- [ ] KB se PB tak powers-of-two table likh sakta hoon.
- [ ] Memory ≈ 100 ns, SSD ≈ 100 µs, HDD seek ≈ 10 ms, cross-continent ≈ 150 ms yaad hai — aur 4 takeaways bhi.
- [ ] 99%, 99.9%, 99.99%, 99.999% ka downtime/saal pata hai, aur series vs parallel kaise jodte hain.
- [ ] Per-day ko per-second turant badal sakta hoon (÷ 10⁵) aur pata hai 1 M/din ≈ 12 QPS.
- [ ] QPS, peak, storage, bandwidth, cache size aur server count units ke saath estimate kar sakta hoon.
- [ ] Har number ko design decision mein badal sakta hoon.

[Aage: 03 · Interview ka Framework :material-arrow-right:](03-interview-framework.md){ .md-button .md-button--primary }
