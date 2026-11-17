---
title: "16 · Revision Cheat Sheet"
description: Poori site ek page pe — interview method, numbers, building-block decisions, aur har case study ka key idea, data store aur sabse mushkil hissa.
---

# 16 · Revision Cheat Sheet

<div class="chapter-meta" markdown>
<span>⏱ 15 min read</span>
<span class="hot">🔥 Interview se pehli raat yeh padho</span>
</div>

!!! tip "Is page ko kaise use karein"
    Har table ka right column dhak do aur jawab zor se bolo. Jo cheez ek saans mein na samjha pao, us chapter pe wapas jao.

## Method (Chapter 3)

| Step | Time (45 min) | Kya banana hai |
|---|---|---|
| ① Samjho & scope | 5–8 min | Functional reqs · non-functional reqs · out of scope · numbers |
| ② High-level design | 10–15 min | Boxes + arrows, 2–4 APIs, core tables, ek request ka walk-through, interviewer ka buy-in |
| ③ Deep dive | 15–20 min | Is problem ke 2–3 unique hisse, trade-offs ke saath |
| ④ Wrap up | 3–5 min | Bottlenecks, failures, monitoring, agla 10× |

**Red flags:** seedha solution pe koodna · over-engineering · khamoshi · zid · bina reason ke buzzwords.

## Numbers (Chapter 2)

| Fact | Value |
|---|---|
| Seconds/din | 86,400 ≈ **10⁵** |
| 1M requests/din | ≈ **12 QPS** |
| 1B requests/din | ≈ **12K QPS** |
| Memory read / SSD read / HDD seek / cross-continent RTT | ~100 ns / ~100 µs / ~10 ms / ~150 ms |
| 99.9% / 99.99% / 99.999% | saal mein 8.77 h / 52.6 min / 5.26 min down |
| 2¹⁰ / 2²⁰ / 2³⁰ / 2⁴⁰ / 2⁵⁰ | KB / MB / GB / TB / PB |
| Snowflake 41-bit ms timestamp | ~69 saal |
| Base-62, 7 chars | 62⁷ ≈ 3.5 trillion |
| 1% FP pe Bloom filter | har key ~10 bits |

```text
QPS      = DAU × actions/din ÷ 10^5          peak = ×2…5
Storage  = writes/din × size × din × replicas
Cache    ≈ roz ke hot data ka 20% (80/20)
Servers  = peak QPS ÷ per-server QPS (+30% headroom)
```

## Scaling toolbox (Chapter 1)

| Problem | Kya lagao | Kis cheez ka dhyaan |
|---|---|---|
| Ek server overloaded | DB alag; **load balancer** ke peeche horizontal web tier | LB khud redundant hona chahiye |
| DB reads slow | **Read replicas**, **cache** (cache-aside + TTL) | Replication lag, invalidation, stampedes |
| Door ke users ke liye static files slow | Versioned URLs ke saath **CDN** | Per GB cost |
| Web tier auto-scale nahi hota | **Stateless** servers, sessions Redis mein | — |
| Request path mein slow kaam | **Message queue** + workers | At-least-once → idempotent consumers |
| Region outage | **Multi-DC** + GeoDNS + async replication | Failover pe data loss window |
| DB writes / size bahut bada | **Sharding** (key main query se chuno) | Hotspots, resharding, cross-shard joins |

## Building blocks (Chapters 4–7)

| Topic | Key idea | Interview mein yeh bolo |
|---|---|---|
| **Rate limiter** | Redis mein har (key, rule) ke counters; 429 + headers | Token bucket bursts allow karta hai; sliding-window counter sasta accurate default; atomicity ke liye Lua; fail open |
| **Consistent hashing** | Servers aur keys ek ring pe; clockwise pehla server | Sirf ~k/n keys move; **virtual nodes** uneven arcs fix karte hain; TreeMap.ceilingEntry |
| **KV store** | AP + tunable consistency | W+R>N ke saath N/W/R; vector clocks; gossip; sloppy quorum + hinted handoff; Merkle trees; LSM + Bloom filters |
| **Unique IDs** | Snowflake 1/41/5/5/12 | Time-sortable, 64-bit, coordination nahi; ghadi peeche jaana risk hai; 128 bits chalein toh UUIDv7 |

### Rate-limiting algorithms ek-ek line mein

| Algorithm | Ek line |
|---|---|
| Token bucket | Rate r se capacity C tak refill; har request ek token — bursts chalenge |
| Leaky bucket | Fixed rate pe khaali hone waali FIFO queue — smooth output |
| Fixed window | Har calendar window ka counter — edges pe 2× burst |
| Sliding log | Har request ka timestamp — exact, memory bhaari |
| Sliding window counter | curr + prev × overlap — approximate, O(1) |

### Quorum quick reference (N = 3)

| W, R | Result |
|---|---|
| 2, 2 | Strong (overlap), balanced |
| 1, 3 | Tez writes |
| 3, 1 | Tez reads |
| 1, 1 | Eventual, sabse tez |

## Case studies (Chapters 8–15)

| System | Core idea | Main data store | Deep dive ka mushkil hissa |
|---|---|---|---|
| **URL shortener** | code → long URL map; 301/302 | Code se sharded KV + Redis cache | Code generation: hash+check vs ID→base-62 (permuted) vs key service |
| **Web crawler** | Smart frontier ke saath BFS loop | Pages ke liye blob store, URLs ke liye Bloom filter | Frontier: priority front queues + har host ki politeness back queues; traps |
| **Notification** | API → har channel ki queue → workers → APNs/FCM/SMS/email | Relational (users, devices, settings) + log | At-least-once + dedup, retries/DLQ, preferences, rate limits, priority lanes |
| **News feed** | Publish → fan-out; precomputed IDs padho → hydrate | Redis sorted sets (feed), post DB, graph store | Fan-out on write vs read; celebrities ke liye hybrid; cursor pagination |
| **Chat** | Stateful chat servers se WebSockets | Chat se keyed wide-column (Cassandra/HBase) | Servers ke beech routing, har chat ki ordered IDs, multi-device sync, presence |
| **Autocomplete** | Har node pe cached top-k waala trie | Prefix → top-k KV, in-memory cache | Offline rebuild pipeline, browser caching, shard map, filter layer |
| **YouTube** | Pre-signed upload → transcoding DAG → CDN; HLS/DASH | Object storage + metadata DB | DAG scheduling, parallel/resumable upload, **CDN cost** (long tail) |
| **Google Drive** | Blocks + hashes; delta sync | Blocks ke liye object storage; **strongly consistent** relational metadata | Sync flows, long-poll notifications, conflicts, dedup & version thinning |

## Classic follow-ups — 10-second jawab

| Sawaal | Jawab |
|---|---|
| "Cache mar gaya toh?" | Replicated cache; DB tak circuit breaker/rate limit; full traffic se pehle warm; degraded serve karo |
| "Replica lag se stale data?" | Us user ke liye thodi der leader se read-your-writes, ya replication position track karo |
| "Hot key / celebrity?" | Aage cache, hot key replicate, tod do, ya push ki jagah pull |
| "Exactly-once?" | End-to-end nahi; at-least-once + idempotency keys / dedup |
| "Shard key kaise chunein?" | High cardinality, main query se match, kam badle |
| "SQL kyun nahi?" / "NoSQL kyun nahi?" | Access pattern, chahiye transactions/joins, writes ka scale — naam lo |
| "Eventually consistent store mein delete kaise?" | Tombstones + compaction se pehle grace period |
| "Ghadi peeche gayi (Snowflake)?" | Detect karo; chhote drift pe wait; bade pe mana + alert |
| "Ise monitor kaise karoge?" | Latency, traffic, errors, saturation + system-specific lag metric (queue lag, fan-out lag, freshness) |

## Aakhri 60-second self-check

- [ ] "Millions of users" waala architecture yaad se bana sakta hoon.
- [ ] Kisi bhi prompt ke liye 3 minute mein QPS aur storage estimate kar sakta hoon.
- [ ] Har case study ke APIs, data store, aur sabse mushkil hissa bata sakta hoon.
- [ ] Jo bhi component jodta hoon, uski keemat bata sakta hoon.

[Aage: 17 · Glossary :material-arrow-right:](17-glossary.md){ .md-button .md-button--primary }
