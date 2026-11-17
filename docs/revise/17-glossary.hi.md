---
title: "17 · Glossary (Shabdkosh)"
description: 100+ system design terms, ek-line Hinglish matlab aur chapter ke saath jahan har ek detail mein samjhaya gaya hai.
---

# 17 · Glossary (Shabdkosh)

<div class="chapter-meta" markdown>
<span>⏱ Reference</span>
<span>Kisi term pe jaane ke liye search box (upar right) use karo</span>
</div>

Terms theme se grouped hain. **Ch.** column batata hai ki detail mein kahan samjhaya gaya hai.

## Scaling & infrastructure

| Term | Matlab | Ch. |
|---|---|---|
| Availability | Kitne fraction time system sahi jawab deta hai; "nines" mein naapte hain | 1, 2 |
| Auto-scaling | Load ke hisaab se servers apne aap jodna/hatana | 1 |
| CDN | Edge servers ka network jo content users ke paas cache karta hai | 1, 14 |
| Edge location / POP | Users ke paas CDN ki jagah | 1, 14 |
| Failover | Primary fail ho toh standby component pe switch | 1 |
| GeoDNS | DNS jo user ki location ke hisaab se alag IP deta hai | 1 |
| Health check | Load balancer ki samay-samay ki jaanch jo mare hue servers pakadti hai | 1 |
| Horizontal scaling | Zyada machines jodna ("scale out") | 1 |
| Vertical scaling | Badi machine lena ("scale up") | 1 |
| Load balancer (L4/L7) | Requests servers mein baant-ta hai; L4 IP/port se, L7 HTTP content se | 1 |
| Latency | Ek request mein lagne waala time | 2 |
| Throughput | Unit time mein handle hui requests | 2 |
| QPS | Har second ki queries (requests) | 2 |
| Peak QPS | Sabse zyada expected QPS (aam taur pe average ka 2–5×) | 2 |
| SLA / SLO / SLI | Customers se vaada / internal target / naapi hui value | 2 |
| SPOF | Single point of failure — ek hissa jiske fail hone se poora system ruk jaaye | 1 |
| Stateless server | Requests ke beech client ka state nahi rakhta; koi bhi server kisi ko bhi serve kar sake | 1 |
| Sticky session | LB client ko hamesha same server pe bhejta hai | 1 |
| Multi-DC / multi-region | Latency aur disaster ke liye kai data centers mein chalana | 1 |
| Active-active / active-passive | Dono sites traffic serve karti hain / ek standby hai | 1 |
| Four golden signals | Latency, traffic, errors, saturation | 1 |
| Back-of-the-envelope | Jaldi se order-of-magnitude estimate | 2 |
| p99 latency | 99% requests is value se tez hain | 2 |

## Data & databases

| Term | Matlab | Ch. |
|---|---|---|
| ACID | Atomic, consistent, isolated, durable transactions | 1, 15 |
| RDBMS / SQL | Tables, schemas, joins, transactions (MySQL, Postgres) | 1 |
| NoSQL | Non-relational stores: key-value, document, wide-column, graph | 1 |
| Key-value store | Ek distributed `Map<key, value>` | 6 |
| Wide-column store | Row key → sorted columns; bhaari writes ke liye bana (Cassandra, HBase) | 6, 12 |
| Document store | JSON jaise documents store karta hai (MongoDB) | 1 |
| Graph DB | Nodes + edges, tez traversal (Neo4j) | 1, 11 |
| Replication | Data ki copies kai nodes pe rakhna | 1, 6 |
| Leader / follower | Writes leader pe; followers copy karke reads serve karte hain | 1 |
| Replication lag | Follower leader se kitna peeche hai | 1 |
| Read-your-writes | User ko hamesha apna latest write dikhe | 1 |
| Sharding / partitioning | Data todna taaki har node pe ek hissa ho | 1, 6 |
| Shard / partition key | Woh field jo decide kare row kis shard pe jaaye | 1 |
| Resharding | Partitioning badalna aur data move karna | 1, 5 |
| Hotspot / celebrity problem | Ek key ya shard pe bahut zyada traffic | 1, 11 |
| Denormalisation | Joins se bachne ke liye data duplicate karna | 1 |
| Index (B-tree) | Sorted structure jo column se lookup tez karta hai | 7 |
| Object / blob storage | Badi immutable files rakhta hai (S3, GCS) | 14, 15 |
| Cold storage | Kam access hone waale data ke liye sasta, slow tier | 15 |
| Tombstone | Deletion marker jo write ki tarah replicate hota hai | 6 |
| Compaction | Storage files merge karke purani/deleted entries hatana | 6 |
| Commit log / WAL | Changes lagane se pehle likha append-only log, crash recovery ke liye | 6 |
| Memtable | Recent writes ka in-memory sorted buffer | 6 |
| SSTable | Key-value pairs ki immutable, sorted disk file | 6 |
| LSM tree | Storage design: log + memtable + SSTables + compaction | 6 |

## Caching

| Term | Matlab | Ch. |
|---|---|---|
| Cache hit / miss | Cache mein mila / nahi mila | 1 |
| Cache-aside | App cache padhti hai, miss pe DB se laake cache bharti hai | 1 |
| Read-through | Miss pe cache library khud DB se laati hai | 1 |
| Write-through | Cache aur DB dono mein ek saath likho | 1 |
| Write-behind (write-back) | Abhi cache mein, DB mein baad mein batches mein | 1 |
| Write-around | Sirf DB mein likho; agle read pe cache bharega | 1 |
| TTL | Entry expire hone se pehle ka time-to-live | 1 |
| Eviction (LRU, LFU, FIFO) | Cache full hone pe kya hatana hai, uski policy | 1 |
| Cache stampede | Kai requests ek saath miss hoke DB ko overload karti hain | 1 |
| Cache invalidation | Stale cached entries hatana/update karna | 1 |

## Distributed systems

| Term | Matlab | Ch. |
|---|---|---|
| CAP theorem | Partition ke dauraan consistency ya availability chuno | 6 |
| PACELC | Warna (partition nahi), latency vs consistency trade karo | 6 |
| Network partition | Nodes aapas mein baat nahi kar paate | 6 |
| Strong consistency | Reads hamesha latest write dete hain | 6, 15 |
| Eventual consistency | Writes ruk jaayein toh replicas same value pe aa jaate hain | 6 |
| Quorum (N, W, R) | Replicas / write acks / read responses; W+R>N → overlap | 6 |
| Coordinator | Request ko replicas tak proxy karne waala node | 6 |
| Preference list | Key ke liye zimmedar N servers | 6 |
| Vector clock | Concurrent versions pakadne ke liye `[server, counter]` list | 6 |
| Last-write-wins (LWW) | Sabse latest timestamp waala version rakho | 6 |
| CRDT | Aisa data type jiske replicas apne aap merge hote hain | 6 |
| Gossip protocol | Nodes random peers se membership/heartbeat info share karte hain | 6 |
| Heartbeat | Samay-samay ka "main zinda hoon" signal | 6, 12 |
| Sloppy quorum | Designated nodes ki jagah pehle healthy nodes use karo | 6 |
| Hinted handoff | Doosre node ke writes temporarily rakho, baad mein lautao | 6 |
| Anti-entropy | Background process jo diverge hue replicas sync karta hai | 6 |
| Merkle tree | Alag data ranges sasta dhoondhne ke liye hash tree | 6 |
| Read repair | Read ke dauraan stale replicas theek karna | 6 |
| Consensus (Raft, Paxos) | Nodes ke beech sehmati, jaise leader election ke liye | 6 |
| Service discovery | Healthy service instances dhoondhne ki registry (ZooKeeper, etcd) | 12 |
| Idempotency | Operation dohrane ka asar ek baar karne jaisa | 1, 10 |
| Bloom filter | Probabilistic set: "pakka nahi" ya "shayad haan" | 6, 9 |

## Hashing & IDs

| Term | Matlab | Ch. |
|---|---|---|
| Consistent hashing | Ring-based mapping jahan membership badalne pe ~k/n keys move hoti hain | 5 |
| Hash ring | Hash space ko gol mod diya | 5 |
| Virtual node (vnode) | Ek server ring pe kai jagah | 5 |
| Rendezvous (HRW) hashing | Sabse bade hash(key, server) waala server chuno | 5 |
| Jump consistent hash | Numbered shards ke liye tez, bina memory ka bucket mapping | 5 |
| UUID (v4, v7) | 128-bit IDs; v4 random, v7 time-ordered | 7 |
| Snowflake ID | 64-bit time + datacenter + machine + sequence | 7 |
| Epoch (custom) | Shuruaati time jahan se timestamps gine jaate hain | 7 |
| Ticket server | IDs baantne waala central DB | 7 |
| Base-62 | 0-9, a-z, A-Z waali encoding | 8 |
| Fingerprint | Content pehchaanne waala chhota hash | 9 |
| SimHash / MinHash | Hashes jo near-duplicates ko milta-julta dikhate hain | 9 |

## Messaging & async

| Term | Matlab | Ch. |
|---|---|---|
| Message queue | Producers aur consumers ke beech durable buffer | 1, 10 |
| Producer / consumer | Messages likhta / padhta hai | 1 |
| Pub/sub | Publishers topics pe bhejte hain; saare subscribers ko milta hai | 12 |
| At-most / at-least / exactly-once | Delivery guarantees | 1, 10 |
| Dead-letter queue (DLQ) | Baar-baar fail hone waale messages yahan jaate hain | 1, 10 |
| Backpressure | Signal ki consumers peeche reh gaye | 1 |
| Consumer lag | Consumers producers se kitna peeche hain | 10 |
| Exponential backoff + jitter | Badhte aur random retry waits | 4, 10 |
| Fan-out | Ek event ko kai recipients tak pahunchana | 11 |

## Networking & protocols

| Term | Matlab | Ch. |
|---|---|---|
| DNS | Domain names ko IPs mein badalta hai | 1 |
| HTTP 301 / 302 | Permanent / temporary redirect | 8 |
| HTTP 429 | Too Many Requests (rate limited) | 4 |
| Polling | Client baar-baar updates poochta hai | 12 |
| Long polling | Server data aane tak request khuli rakhta hai | 12, 15 |
| WebSocket | Persistent, bi-directional connection | 12 |
| Pre-signed URL | Ek storage object ka time-limited access URL | 14, 15 |
| Resumable upload | Rukne ke baad aage chal sakne waala upload | 14, 15 |
| HLS / MPEG-DASH | Adaptive-bitrate streaming protocols | 14 |
| Adaptive bitrate (ABR) | Player bandwidth ke hisaab se har segment pe quality badalta hai | 14 |
| robots.txt | Crawlers ke liye site ke rules | 9 |
| APNs / FCM | Apple / Google ki push notification services | 10 |

## System-specific terms

| Term | Matlab | Ch. |
|---|---|---|
| Token / leaky bucket | Rate-limiting algorithms (bursty / smooth) | 4 |
| Fixed / sliding window | Time windows waale rate-limiting algorithms | 4 |
| URL frontier | Crawler ki prioritised, polite to-do list | 9 |
| Politeness | Crawl karte hue kisi host ko overload na karna | 9 |
| Spider trap | Page structure jo infinite URLs banata hai | 9 |
| Fan-out on write / read | Post time pe feeds mein push / read time pe feed banana | 11 |
| Hydration | Display ke liye IDs ko poore objects mein badalna | 11 |
| Cursor pagination | Page numbers ki jagah "X se purane items do" | 11 |
| Presence | Users ka online/offline status | 12 |
| Trie | Tez prefix lookups ke liye prefix tree | 13 |
| Top-k | Sabse upar ranked k items | 13 |
| Transcoding | Video ko doosre formats/resolutions mein badalna | 14 |
| Codec / container | Encoding algorithm / file ka wrapper | 14 |
| GOP | Group of pictures — frames ka khud decode hone waala run | 14 |
| DAG | Dependent tasks ka directed acyclic graph | 14 |
| DRM | Digital rights management (Widevine, FairPlay, PlayReady) | 14 |
| Block (file) | File ka fixed ya content-defined tukda | 15 |
| Delta sync | Sirf badle hue blocks bhejna | 15 |
| Deduplication | Identical data sirf ek baar store karna | 15 |
| Conflicted copy | Haara hua version jo user ke merge karne ke liye alag save hota hai | 15 |
| Namespace | Root folder (personal ya shared) | 15 |

[Aage: 18 · Seekhna Jaari Hai :material-arrow-right:](18-learning-continues.md){ .md-button .md-button--primary }
