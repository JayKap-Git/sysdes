---
title: "18 · The Learning Continues"
description: Where to go after this site — the papers behind these designs, books, engineering blogs, more practice problems with hints, and a 30-day plan.
---

# 18 · The Learning Continues

<div class="chapter-meta" markdown>
<span>⏱ 15 min read</span>
<span>Book: Chapter 16</span>
</div>

Finishing fifteen designs is a start, not the end. Real systems knowledge comes from three things: **reading how
real companies built things**, **practising new problems out loud**, and **going one level deeper** into the
distributed-systems ideas you met here.

## 1 · Read the papers behind the chapters

Most designs in this site are simplified versions of systems described in public papers. Reading even the
introduction and architecture sections is worth it.

| Paper (year) | What it teaches | Chapters |
|---|---|---|
| **Dynamo** — Amazon (2007) | Consistent hashing, quorums, vector clocks, sloppy quorum, Merkle trees | 5, 6 |
| **Bigtable** — Google (2006) | Wide-column model, SSTables, memtables, tablets | 6, 12 |
| **Cassandra** — Facebook (2009) | Dynamo-style distribution + Bigtable-style storage | 6, 12 |
| **GFS** — Google (2003) | Chunked file storage, single master + replicas | 15 |
| **MapReduce** — Google (2004) | Batch processing at scale — the "aggregator" in autocomplete | 13 |
| **Scaling Memcache at Facebook** (2013) | Cache invalidation, leases, regional caches | 1, 11 |
| **TAO** — Facebook (2013) | Social-graph storage and caching | 11 |
| **Kafka** — LinkedIn (2011) | The log as a message queue | 1, 10 |
| **Chubby** (2006) / **ZooKeeper** (2010) | Coordination, locks, service discovery | 7, 12 |
| **Raft** (2014) | Understandable consensus and leader election | 1, 6 |
| **Spanner** — Google (2012) | Globally consistent transactions with synchronised clocks | 6, 7 |
| **Borg** — Google (2015) | Cluster scheduling — the ancestor of Kubernetes | 14 |

## 2 · Books for the next level

| Book | Why |
|---|---|
| *Designing Data-Intensive Applications* — Martin Kleppmann | The best single book on replication, partitioning, transactions, consistency and stream processing. Read it after this site. |
| *System Design Interview Volume 2* — Alex Xu & Sahn Lam | 13 more problems (see the list below) in the same style. |
| *Understanding Distributed Systems* — Roberto Vitillo | Short, practical bridge between interview designs and production reality. |
| *Database Internals* — Alex Petrov | B-trees, LSM trees, replication and consensus from the inside. |
| *Site Reliability Engineering* — Google | How large systems are actually run: SLOs, monitoring, incident response. |

## 3 · Engineering blogs worth following

Search for these companies' engineering blogs; read posts about architecture, migrations and outages
(post-mortems teach the most):

- **Global:** Netflix, Uber, Meta, Google, Amazon (AWS Architecture), Discord, Cloudflare, Stripe, Shopify, Slack, Dropbox, Pinterest, Airbnb, LinkedIn, Figma.
- **India:** Flipkart, Swiggy, Zomato, Razorpay, PhonePe, Zerodha, Hotstar/JioCinema (live-streaming scale stories), CRED.

!!! tip "How to read an engineering blog post"
    For each post, write three lines: **the problem** (with numbers), **the design choice**, and **what they gave up**.
    That's exactly the shape of a good interview answer.

## 4 · More problems to practise

Use the 4-step framework and a 35-minute timer. Hints are deliberately short — expand only after you've tried.

??? example "Proximity service (nearby restaurants / Yelp)"
    Read-heavy; static-ish data. Index locations with **geohash** or a **quadtree**; cache popular areas; search neighbouring cells.

??? example "Nearby friends (live locations)"
    Frequent location updates over WebSockets; pub/sub channel per user; only fan out to friends within radius; TTL on stale locations.

??? example "Google Maps"
    Map tiles pre-rendered and served via CDN; routing on a graph partitioned into tiles; ETA from historical + live traffic.

??? example "Distributed message queue (Kafka-like)"
    Partitioned append-only logs on disk; consumer groups with offsets; replication with leader/followers and in-sync replicas.

??? example "Metrics monitoring & alerting"
    Time-series DB; push vs pull collection; downsampling and retention tiers; alert rules evaluated on streams.

??? example "Ad click aggregation"
    Stream processing with windows (Flink); exactly-once-ish via idempotent sinks; reconcile with batch for accuracy.

??? example "Hotel / ticket reservation"
    Strong consistency on inventory; prevent double booking (row locks / optimistic concurrency); idempotent payments; holds that expire.

??? example "Distributed email service"
    SMTP ingestion, spam filtering, per-user mailbox storage, search index, attachments in object storage.

??? example "S3-like object storage"
    Separate metadata service from data nodes; erasure coding vs replication; multipart upload; versioning.

??? example "Real-time gaming leaderboard"
    Redis sorted sets per leaderboard; shard by game/region; periodic snapshots to durable storage.

??? example "Payment system & digital wallet"
    Double-entry ledger; idempotency keys everywhere; reconciliation with the payment provider; exactly-once effects via state machines.

??? example "Stock exchange"
    Single-threaded matching engine per symbol for determinism; sequencer; extreme low latency; replay from an event log.

??? example "Collaborative document editing (Google Docs)"
    Operational transformation or CRDTs; per-document session server; presence cursors; snapshots + operation log.

??? example "Ride-hailing (driver matching)"
    Driver locations in a geo index (geohash cells in Redis); matching service per city; surge pricing from supply/demand per cell.

## 5 · A 30-day practice plan

| Days | Do this |
|---|---|
| 1–3 | Re-draw Chapter 1's architecture from memory; redo all Chapter 2 practice problems without looking. |
| 4–7 | Building blocks: implement the token bucket, consistent hash ring and Snowflake in Java from scratch. |
| 8–15 | One case study per day, timed, out loud. Compare with the chapter; write down what you missed. |
| 16–25 | One new problem per day from the list above. Record yourself; listen back for silences and hand-waving. |
| 26–28 | Two mock interviews with a friend (swap roles — interviewing teaches as much as being interviewed). |
| 29–30 | Read the Cheat Sheet; re-attempt your two weakest problems. |

## 6 · Beyond high-level design

- **Low-level design (LLD) / object-oriented design** — class diagrams, design patterns (strategy, observer, factory…), SOLID, concurrency. Many interviews include an LLD round (parking lot, elevator, rate limiter class design).
- **Hands-on** — run Redis, Kafka and Postgres locally with Docker; build a tiny URL shortener with a cache and a load test; watch what breaks.
- **Operate what you build** — set up monitoring (Prometheus + Grafana) on something you run and practise reading its graphs.

---

## Closing thought

Every chapter here came down to the same few questions: *what's the access pattern, what are the numbers, what
breaks first, and what are we willing to give up?* If you can ask those calmly and reason through the answers out
loud, you're ready for the interview — and, more importantly, for the job.

[Back to Home :material-home:](../index.md){ .md-button } [Revision Cheat Sheet :material-lightning-bolt:](16-cheat-sheet.md){ .md-button .md-button--primary }
