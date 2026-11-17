---
title: "16 · Revision Cheat Sheet"
description: Everything from the site on one page — the interview method, the numbers, building-block decisions, and each case study's key idea, data store and hardest part.
---

# 16 · Revision Cheat Sheet

<div class="chapter-meta" markdown>
<span>⏱ 15 min read</span>
<span class="hot">🔥 Read this the night before</span>
</div>

!!! tip "How to use this page"
    Cover the right-hand column of each table and say the answer out loud. Anything you can't explain in one breath,
    go back to that chapter.

## The method (Chapter 3)

| Step | Time (45 min) | Must produce |
|---|---|---|
| ① Understand & scope | 5–8 min | Functional reqs · non-functional reqs · out of scope · numbers |
| ② High-level design | 10–15 min | Boxes + arrows, 2–4 APIs, core tables, one request walked through, interviewer buy-in |
| ③ Deep dive | 15–20 min | The 2–3 parts unique to this problem, with trade-offs |
| ④ Wrap up | 3–5 min | Bottlenecks, failures, monitoring, next 10× |

**Red flags:** jumping to a solution · over-engineering · silence · stubbornness · buzzwords without reasons.

## Numbers (Chapter 2)

| Fact | Value |
|---|---|
| Seconds/day | 86,400 ≈ **10⁵** |
| 1M requests/day | ≈ **12 QPS** |
| 1B requests/day | ≈ **12K QPS** |
| Memory read / SSD read / HDD seek / cross-continent RTT | ~100 ns / ~100 µs / ~10 ms / ~150 ms |
| 99.9% / 99.99% / 99.999% | 8.77 h / 52.6 min / 5.26 min down per year |
| 2¹⁰ / 2²⁰ / 2³⁰ / 2⁴⁰ / 2⁵⁰ | KB / MB / GB / TB / PB |
| Snowflake 41-bit ms timestamp | ~69 years |
| Base-62, 7 chars | 62⁷ ≈ 3.5 trillion |
| Bloom filter at 1% FP | ~10 bits per key |

```text
QPS      = DAU × actions/day ÷ 10^5          peak = ×2…5
Storage  = writes/day × size × days × replicas
Cache    ≈ 20% of daily hot data (80/20)
Servers  = peak QPS ÷ per-server QPS (+30% headroom)
```

## Scaling toolbox (Chapter 1)

| Problem | Reach for | Watch out for |
|---|---|---|
| One server overloaded | Separate DB; horizontal web tier behind a **load balancer** | LB itself must be redundant |
| DB reads too slow | **Read replicas**, **cache** (cache-aside + TTL) | Replication lag, invalidation, stampedes |
| Static files slow far away | **CDN** with versioned URLs | Cost per GB |
| Can't auto-scale web tier | **Stateless** servers, sessions in Redis | — |
| Slow work in request path | **Message queue** + workers | At-least-once → idempotent consumers |
| Region outage | **Multi-DC** + GeoDNS + async replication | Data loss window on failover |
| DB writes / size too big | **Sharding** (pick the key by the main query) | Hotspots, resharding, cross-shard joins |

## Building blocks (Chapters 4–7)

| Topic | Key idea | Say this in the interview |
|---|---|---|
| **Rate limiter** | Counters per (key, rule) in Redis; 429 + headers | Token bucket allows bursts; sliding-window counter is the cheap accurate default; Lua for atomicity; fail open |
| **Consistent hashing** | Servers and keys on a ring; first server clockwise | Moves only ~k/n keys; **virtual nodes** fix uneven arcs; TreeMap.ceilingEntry |
| **KV store** | AP + tunable consistency | N/W/R with W+R>N; vector clocks; gossip; sloppy quorum + hinted handoff; Merkle trees; LSM + Bloom filters |
| **Unique IDs** | Snowflake 1/41/5/5/12 | Time-sortable, 64-bit, no coordination; clock going backwards is the risk; UUIDv7 if 128 bits is OK |

### Rate-limiting algorithms in one line each

| Algorithm | One line |
|---|---|
| Token bucket | Refill at rate r up to capacity C; each request takes a token — bursts OK |
| Leaky bucket | FIFO queue drained at a fixed rate — smooth output |
| Fixed window | Counter per calendar window — 2× burst at edges |
| Sliding log | Timestamps per request — exact, memory-heavy |
| Sliding window counter | curr + prev × overlap — approximate, O(1) |

### Quorum quick reference (N = 3)

| W, R | Result |
|---|---|
| 2, 2 | Strong (overlap), balanced |
| 1, 3 | Fast writes |
| 3, 1 | Fast reads |
| 1, 1 | Eventual, fastest |

## Case studies (Chapters 8–15)

| System | Core idea | Main data store | The hard part to deep-dive |
|---|---|---|---|
| **URL shortener** | code → long URL map; 301/302 | Sharded KV by code + Redis cache | Code generation: hash+check vs ID→base-62 (permuted) vs key service |
| **Web crawler** | BFS loop with a smart frontier | Blob store for pages, Bloom filter for URLs | Frontier: priority front queues + per-host politeness back queues; traps |
| **Notification** | API → per-channel queues → workers → APNs/FCM/SMS/email | Relational (users, devices, settings) + log | At-least-once + dedup, retries/DLQ, preferences, rate limits, priority lanes |
| **News feed** | Publish → fan-out; read precomputed IDs → hydrate | Redis sorted sets (feed), post DB, graph store | Fan-out on write vs read; hybrid for celebrities; cursor pagination |
| **Chat** | WebSockets to stateful chat servers | Wide-column (Cassandra/HBase) keyed by chat | Routing between servers, per-chat ordered IDs, multi-device sync, presence |
| **Autocomplete** | Trie with cached top-k per node | Prefix → top-k KV, in-memory cache | Offline rebuild pipeline, browser caching, shard map, filter layer |
| **YouTube** | Pre-signed upload → transcoding DAG → CDN; HLS/DASH | Object storage + metadata DB | DAG scheduling, parallel/resumable upload, **CDN cost** (long tail) |
| **Google Drive** | Blocks + hashes; delta sync | Object storage for blocks; **strongly consistent** relational metadata | Sync flows, long-poll notifications, conflicts, dedup & version thinning |

## Classic follow-ups — 10-second answers

| Question | Answer |
|---|---|
| "What if the cache dies?" | Replicated cache; circuit breaker/rate limit to the DB; warm before full traffic; serve degraded |
| "Replica lag shows stale data?" | Read-your-writes from leader for that user briefly, or track replication position |
| "Hot key / celebrity?" | Cache in front, replicate the hot key, split it, or pull instead of push |
| "Exactly-once?" | Not end-to-end; at-least-once + idempotency keys / dedup |
| "How to choose a shard key?" | High cardinality, matches the main query, rarely changes |
| "Why not SQL?" / "Why not NoSQL?" | Name the access pattern, transactions/joins needed, scale of writes |
| "How to delete in an eventually consistent store?" | Tombstones + grace period before compaction |
| "Clock went backwards (Snowflake)?" | Detect; wait for small drift; refuse + alert for large |
| "How do you monitor this?" | Latency, traffic, errors, saturation + the system-specific lag metric (queue lag, fan-out lag, freshness) |

## The final 60-second self-check

- [ ] I can draw the "millions of users" architecture from memory.
- [ ] I can estimate QPS and storage for any prompt in under 3 minutes.
- [ ] For each case study, I can name the APIs, the data store, and the hardest part.
- [ ] For every component I add, I can say what it costs.

[Next: 17 · Glossary :material-arrow-right:](17-glossary.md){ .md-button .md-button--primary }
