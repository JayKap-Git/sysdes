---
title: "17 · Glossary"
description: 100+ system design terms with one-line meanings and the chapter where each is explained.
---

# 17 · Glossary

<div class="chapter-meta" markdown>
<span>⏱ Reference</span>
<span>Use the search box (top right) to jump to a term</span>
</div>

Terms are grouped by theme. The **Ch.** column says where it's explained in depth.

## Scaling & infrastructure

| Term | Meaning | Ch. |
|---|---|---|
| Availability | Fraction of time a system answers correctly; measured in "nines" | 1, 2 |
| Auto-scaling | Adding/removing servers automatically based on load | 1 |
| CDN | Network of edge servers caching content near users | 1, 14 |
| Edge location / POP | A CDN site close to users | 1, 14 |
| Failover | Switching to a standby component when the primary fails | 1 |
| GeoDNS | DNS that answers with different IPs depending on user location | 1 |
| Health check | Periodic probe a load balancer uses to detect dead servers | 1 |
| Horizontal scaling | Adding more machines ("scale out") | 1 |
| Vertical scaling | Using a bigger machine ("scale up") | 1 |
| Load balancer (L4/L7) | Spreads requests across servers; L4 by IP/port, L7 by HTTP content | 1 |
| Latency | Time taken by one request | 2 |
| Throughput | Requests handled per unit time | 2 |
| QPS | Queries (requests) per second | 2 |
| Peak QPS | Highest expected QPS (typically 2–5× average) | 2 |
| SLA / SLO / SLI | Promise to customers / internal target / measured value | 2 |
| SPOF | Single point of failure — one part whose failure stops the whole system | 1 |
| Stateless server | Keeps no client state between requests; any server can serve anyone | 1 |
| Sticky session | LB keeps sending a client to the same server | 1 |
| Multi-DC / multi-region | Running in several data centers for latency and disaster tolerance | 1 |
| Active-active / active-passive | Both sites serve traffic / one is a standby | 1 |
| Four golden signals | Latency, traffic, errors, saturation | 1 |
| Back-of-the-envelope | Quick order-of-magnitude estimation | 2 |
| p99 latency | 99% of requests are faster than this value | 2 |

## Data & databases

| Term | Meaning | Ch. |
|---|---|---|
| ACID | Atomic, consistent, isolated, durable transactions | 1, 15 |
| RDBMS / SQL | Tables, schemas, joins, transactions (MySQL, Postgres) | 1 |
| NoSQL | Non-relational stores: key-value, document, wide-column, graph | 1 |
| Key-value store | A distributed `Map<key, value>` | 6 |
| Wide-column store | Row key → sorted columns; built for heavy writes (Cassandra, HBase) | 6, 12 |
| Document store | Stores JSON-like documents (MongoDB) | 1 |
| Graph DB | Nodes + edges, fast traversals (Neo4j) | 1, 11 |
| Replication | Keeping copies of data on several nodes | 1, 6 |
| Leader / follower | Writes go to the leader; followers copy and serve reads | 1 |
| Replication lag | How far a follower is behind the leader | 1 |
| Read-your-writes | A user always sees their own latest write | 1 |
| Sharding / partitioning | Splitting data so each node holds a subset | 1, 6 |
| Shard / partition key | The field deciding which shard a row lives on | 1 |
| Resharding | Changing the partitioning and moving data | 1, 5 |
| Hotspot / celebrity problem | One key or shard gets disproportionate traffic | 1, 11 |
| Denormalisation | Duplicating data to avoid joins | 1 |
| Index (B-tree) | Sorted structure that speeds up lookups by a column | 7 |
| Object / blob storage | Stores large immutable files (S3, GCS) | 14, 15 |
| Cold storage | Cheap, slow storage tier for rarely accessed data | 15 |
| Tombstone | A deletion marker that replicates like a write | 6 |
| Compaction | Merging storage files and dropping old/deleted entries | 6 |
| Commit log / WAL | Append-only log written before applying changes, for crash recovery | 6 |
| Memtable | In-memory sorted buffer of recent writes | 6 |
| SSTable | Immutable, sorted on-disk file of key-value pairs | 6 |
| LSM tree | Storage design: log + memtable + SSTables + compaction | 6 |

## Caching

| Term | Meaning | Ch. |
|---|---|---|
| Cache hit / miss | Found / not found in cache | 1 |
| Cache-aside | App reads cache, on miss loads DB and fills cache | 1 |
| Read-through | The cache library loads from DB on a miss | 1 |
| Write-through | Write to cache and DB together | 1 |
| Write-behind (write-back) | Write to cache now, DB later in batches | 1 |
| Write-around | Write only to DB; cache fills on next read | 1 |
| TTL | Time-to-live before an entry expires | 1 |
| Eviction (LRU, LFU, FIFO) | Policy for what to drop when the cache is full | 1 |
| Cache stampede | Many requests miss at once and overload the DB | 1 |
| Cache invalidation | Removing/updating stale cached entries | 1 |

## Distributed systems

| Term | Meaning | Ch. |
|---|---|---|
| CAP theorem | During a partition, choose consistency or availability | 6 |
| PACELC | Else (no partition), trade latency vs consistency | 6 |
| Network partition | Nodes can't communicate with each other | 6 |
| Strong consistency | Reads always return the latest write | 6, 15 |
| Eventual consistency | Replicas converge if writes stop | 6 |
| Quorum (N, W, R) | Replicas / write acks / read responses; W+R>N → overlap | 6 |
| Coordinator | Node that proxies a request to replicas | 6 |
| Preference list | The N servers responsible for a key | 6 |
| Vector clock | `[server, counter]` list to detect concurrent versions | 6 |
| Last-write-wins (LWW) | Keep the version with the latest timestamp | 6 |
| CRDT | Data type whose replicas merge automatically | 6 |
| Gossip protocol | Nodes share membership/heartbeat info with random peers | 6 |
| Heartbeat | Periodic "I'm alive" signal | 6, 12 |
| Sloppy quorum | Use the first healthy nodes, not the designated ones | 6 |
| Hinted handoff | Temporarily store another node's writes, hand back later | 6 |
| Anti-entropy | Background process that syncs diverged replicas | 6 |
| Merkle tree | Hash tree to find differing data ranges cheaply | 6 |
| Read repair | Fix stale replicas during a read | 6 |
| Consensus (Raft, Paxos) | Agreement among nodes, e.g. for leader election | 6 |
| Service discovery | Registry to find healthy service instances (ZooKeeper, etcd) | 12 |
| Idempotency | Repeating an operation has the same effect as doing it once | 1, 10 |
| Bloom filter | Probabilistic set: "definitely not" or "probably yes" | 6, 9 |

## Hashing & IDs

| Term | Meaning | Ch. |
|---|---|---|
| Consistent hashing | Ring-based mapping where membership changes move ~k/n keys | 5 |
| Hash ring | The hash space bent into a circle | 5 |
| Virtual node (vnode) | A server placed at many ring positions | 5 |
| Rendezvous (HRW) hashing | Pick the server with the highest hash(key, server) | 5 |
| Jump consistent hash | Fast, memoryless bucket mapping for numbered shards | 5 |
| UUID (v4, v7) | 128-bit IDs; v4 random, v7 time-ordered | 7 |
| Snowflake ID | 64-bit time + datacenter + machine + sequence | 7 |
| Epoch (custom) | Starting time from which timestamps are counted | 7 |
| Ticket server | Central DB handing out IDs | 7 |
| Base-62 | Encoding with 0-9, a-z, A-Z | 8 |
| Fingerprint | Short hash identifying content | 9 |
| SimHash / MinHash | Hashes that make near-duplicates look similar | 9 |

## Messaging & async

| Term | Meaning | Ch. |
|---|---|---|
| Message queue | Durable buffer between producers and consumers | 1, 10 |
| Producer / consumer | Writes / reads messages | 1 |
| Pub/sub | Publishers send to topics; all subscribers receive | 12 |
| At-most / at-least / exactly-once | Delivery guarantees | 1, 10 |
| Dead-letter queue (DLQ) | Where repeatedly failing messages go | 1, 10 |
| Backpressure | Signal that consumers can't keep up | 1 |
| Consumer lag | How far consumers are behind producers | 10 |
| Exponential backoff + jitter | Retry waits that grow and are randomised | 4, 10 |
| Fan-out | Delivering one event to many recipients | 11 |

## Networking & protocols

| Term | Meaning | Ch. |
|---|---|---|
| DNS | Translates domain names to IPs | 1 |
| HTTP 301 / 302 | Permanent / temporary redirect | 8 |
| HTTP 429 | Too Many Requests (rate limited) | 4 |
| Polling | Client asks repeatedly for updates | 12 |
| Long polling | Server holds the request open until data arrives | 12, 15 |
| WebSocket | Persistent, bi-directional connection | 12 |
| Pre-signed URL | Time-limited URL granting access to one storage object | 14, 15 |
| Resumable upload | Upload that can continue after interruption | 14, 15 |
| HLS / MPEG-DASH | Adaptive-bitrate streaming protocols | 14 |
| Adaptive bitrate (ABR) | Player switches quality per segment based on bandwidth | 14 |
| robots.txt | Site's rules for crawlers | 9 |
| APNs / FCM | Apple / Google push notification services | 10 |

## System-specific terms

| Term | Meaning | Ch. |
|---|---|---|
| Token / leaky bucket | Rate-limiting algorithms (bursty / smooth) | 4 |
| Fixed / sliding window | Rate-limiting algorithms by time windows | 4 |
| URL frontier | The crawler's prioritised, polite to-do list | 9 |
| Politeness | Not overloading any host while crawling | 9 |
| Spider trap | Page structure generating infinite URLs | 9 |
| Fan-out on write / read | Push to feeds at post time / build feeds at read time | 11 |
| Hydration | Turning IDs into full objects for display | 11 |
| Cursor pagination | "Give me items older than X" instead of page numbers | 11 |
| Presence | Online/offline status of users | 12 |
| Trie | Prefix tree for fast prefix lookups | 13 |
| Top-k | The k highest-ranked items | 13 |
| Transcoding | Converting video to other formats/resolutions | 14 |
| Codec / container | Encoding algorithm / file wrapper | 14 |
| GOP | Group of pictures — independently decodable run of frames | 14 |
| DAG | Directed acyclic graph of dependent tasks | 14 |
| DRM | Digital rights management (Widevine, FairPlay, PlayReady) | 14 |
| Block (file) | Fixed or content-defined piece of a file | 15 |
| Delta sync | Transferring only changed blocks | 15 |
| Deduplication | Storing identical data only once | 15 |
| Conflicted copy | The losing version saved separately for the user to merge | 15 |
| Namespace | A root folder (personal or shared) | 15 |

[Next: 18 · The Learning Continues :material-arrow-right:](18-learning-continues.md){ .md-button .md-button--primary }
