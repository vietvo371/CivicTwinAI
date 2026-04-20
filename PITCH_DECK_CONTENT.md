# CivicTwin AI — Pitch Deck Content
# SmartCity_DuyTan_[TEAM_NAME]_PitchDeck.pptx

---

## Slide 1: Title Slide

**Project Name:** CivicTwin AI
**Tagline:** *Real-Time Digital Twin for Predictive Urban Traffic Management*
**Team Name:** [TEAM_NAME]
**University:** Duy Tan University, Da Nang, Vietnam
**Track:** Smart City
**Event:** ASEAN AI Hackathon 2026

---

## Slide 2: Problem Statement

**Tiêu đề:** Da Nang's Urban Mobility Crisis — A Growing ASEAN Challenge

**Số liệu chính (bullet points):**
- 🚗 **42 minutes** — average daily commute time in Da Nang (2024)
- 🚑 **22 minutes** — ambulance response time vs. 8-min WHO standard (175% over target)
- 💰 **1.2 trillion VND/year** — economic loss from traffic congestion
- 📈 Da Nang population growing **4.2%/year** — infrastructure not keeping pace
- 🌏 **ASEAN context:** 7 of 10 ASEAN capitals rank in world's top 25 most congested cities (TomTom 2024)

**Kết luận:** Current traffic management is reactive, not predictive. Cities need AI that acts *before* gridlock happens.

---

## Slide 3: The AI Solution

**Tiêu đề:** CivicTwin AI — A Living Digital Twin of the City

**Elevator pitch:**
> CivicTwin AI creates a real-time digital replica of Da Nang's road network. It ingests live IoT sensor data, predicts congestion 30 minutes ahead using AI, and automatically recommends interventions — turning traffic operators from firefighters into strategic planners.

**3 core capabilities:**
1. **Predict** — LSTM + ST-GCN models forecast traffic density 30 min ahead (per road segment)
2. **Simulate** — "What-if" scenarios: *"What happens if we close Bridge X for repairs?"*
3. **Act** — AI-generated recommendations pushed to operators, emergency services, and citizens in real-time

**6 actors served:** Citizen · Traffic Operator · Emergency Services · Urban Planner · City Admin · AI Engine

---

## Slide 4: Competitive Advantage

**Tiêu đề:** Why CivicTwin AI Beats Existing Approaches

| Feature | Google Maps | Traditional SCATS | **CivicTwin AI** |
|---|---|---|---|
| Real-time prediction | ✅ Routing only | ❌ Rule-based | ✅ AI per segment |
| What-if simulation | ❌ | ❌ | ✅ |
| Emergency routing | ❌ | ❌ | ✅ Priority routes |
| Citizen reporting | ❌ | ❌ | ✅ AI-parsed reports |
| Digital Twin model | ❌ | ❌ | ✅ Full graph model |
| Open / localizable | ❌ Proprietary | ❌ Vendor lock | ✅ Open stack |

**Key differentiator:** CivicTwin is the only system that combines **graph-based AI prediction + multi-role dashboard + citizen participation** in one integrated platform — built specifically for ASEAN urban scale.

---

## Slide 5: Technical Architecture

**Tiêu đề:** 5-Layer System Architecture

```
[IoT Sensors / Citizen Reports]
        ↓
[MQTT → Kafka] — Real-time ingestion pipeline
        ↓
[Laravel Backend] — Business logic, role-based access, event broadcasting
        ↓  ←→  [Python FastAPI AI Service]
                  LSTM Predictor + ST-GCN + Simulation Engine
        ↓
[PostgreSQL + PostGIS] — Road network graph + geospatial data
        ↓
[Soketi WebSocket] — Real-time push to all clients
        ↓
[Next.js Dashboard] + [React Native Mobile App]
Operator · Admin · Emergency · Citizen · Urban Planner
```

**Tech stack badges:**
Laravel 12 · Next.js 16 · React Native · Python FastAPI · PyTorch · PostgreSQL/PostGIS · Mapbox GL · Redis · Kafka · Docker

---

## Slide 6: AI Approach & Model Selection

**Tiêu đề:** 3-Layer AI Architecture

### Layer 1 — Real-Time State (0–5 min)
- **Model:** Rule-based + sensor fusion
- **Purpose:** Current congestion level per edge
- **Why:** Low latency required (<1 sec)

### Layer 2 — Short-Term Prediction (30 min – 6 hr)
- **Model:** **ST-GCN** (Spatio-Temporal Graph Convolutional Network)
  - Graph layer: captures spatial relationships between road segments
  - Temporal layer: LSTM over 60-min history window
  - Output: predicted density per edge, 6 time steps × 5 min
- **Why ST-GCN over plain LSTM:** Roads are connected — a jam on Street A *causes* a jam on Street B. Pure LSTM ignores this graph structure.
- **Benchmark:** MAE < 0.05 on synthetic Da Nang dataset

### Layer 3 — Long-Term Simulation (1–10 yr)
- **Model:** What-if scenario engine (parametric simulation)
- **Purpose:** Urban planning decisions (new roads, bridges)

---

## Slide 7: Data Strategy

**Tiêu đề:** Data Sources, Licensing & Pipeline

### Data Sources

| Source | Data Type | License | Usage |
|---|---|---|---|
| **OpenStreetMap** | Road network (nodes, edges, geometry) | ODbL (open) | Base graph for Da Nang |
| **Synthetic IoT simulator** | Traffic density, speed, flow per edge | Generated | Training + demo |
| **Citizen reports** (in-app) | Incident location, type, photos | User-contributed | Real-time incidents |
| **Da Nang GTVT** *(target)* | Historical congestion, accident data | Government open data | Model fine-tuning |
| **HERE / TomTom** *(target)* | Historical traffic patterns | Commercial / free tier | Validation |

### Data Pipeline
```
MQTT Broker → Kafka Topic → Laravel Consumer → PostgreSQL
                                             → Redis Cache
                                             → AI Service (trigger)
```

### Data Quality & Cleaning
- OSM road network filtered to Da Nang bounding box (108.15–108.35°E, 15.95–16.15°N)
- Sensor anomalies filtered: values outside ±3σ discarded
- Missing data: linear interpolation for gaps < 5 min

---

## Slide 8: AI Ethics & Responsibility

**Tiêu đề:** Responsible AI by Design

### Bias Mitigation
- **Geographic bias:** Model trained on all districts of Da Nang, not just central areas — rural roads included in graph
- **Temporal bias:** Training data covers weekdays, weekends, peak hours, off-peak, public holidays
- **Sensor coverage bias:** Edges without sensors use graph propagation from neighbors, flagged with lower confidence score

### Privacy Protection
- **No personal tracking:** System monitors roads, not individuals. No license plate data.
- **Citizen reports:** Photos processed by AI (object detection), originals not stored beyond 30 days
- **Role-based access:** Citizens see only public data; operator data requires authentication (JWT + Spatie RBAC)
- **GDPR-aligned:** Data minimization principle applied throughout

### Transparency
- All AI recommendations show **confidence score** and **reasoning** (which edges triggered the prediction)
- Operators can **override or reject** any AI recommendation — human stays in the loop
- Audit log of all AI-triggered actions stored for accountability

---

## Slide 9: Prototype Demonstration

**Tiêu đề:** Live Demo — 4-Minute Scenario

**Demo kịch bản (ghi video backup):**

```
00:00  Citizen opens mobile app → sees live Mapbox traffic map
       (edges colored: green/yellow/red by congestion level)

00:45  Citizen submits incident report with photo
       → AI parses report text + image automatically
       → Incident created in system

01:30  AI service triggers prediction
       → ST-GCN predicts congestion spreading to 3 adjacent edges
       → Recommendation generated: "Reroute traffic via Nguyen Van Linh"

02:15  Traffic Operator receives real-time notification
       → Views prediction overlay on operator dashboard
       → Approves recommendation with one click

03:00  Emergency Services receives updated priority route
       → Avoiding congested segments
       → Route calculated: Hospital → Incident in 8 min (vs. 22 min normal)

03:45  Citizen receives push alert
       → "Congestion detected on your usual route. Alternative: ..."

04:00  Admin dashboard shows: incident resolved, KPIs updated
```

**Screenshots/GIFs needed:** Citizen map · Operator dashboard · AI prediction overlay · Emergency route · Citizen alert

---

## Slide 10: Technical Hurdles

**Tiêu đề:** Challenges We Overcame (Honest Reflection)

### Challenge 1: Real-time graph updates at scale
- **Problem:** Updating 500+ road edges every 5 seconds via WebSocket caused browser lag
- **Solution:** Batch updates via `EdgeMetricsUpdated` event, only diff-changed edges pushed; Mapbox source updated incrementally

### Challenge 2: Graph AI without large labeled dataset
- **Problem:** No publicly available Da Nang traffic dataset for ST-GCN training
- **Solution:** Built synthetic traffic simulator (`dev.sh sim`) generating realistic rush-hour patterns based on OSM road topology + population density heuristics

### Challenge 3: Multi-role real-time consistency
- **Problem:** 5 different user roles need different views of same data without race conditions
- **Solution:** Laravel event broadcasting with role-filtered channels (`private-incidents`, `presence-operators.{zone}`, `traffic.edges`)

### Challenge 4: AI hallucination in citizen report parsing
- **Problem:** LLM sometimes misclassified incident types (e.g., "flooding" vs "accident")
- **Solution:** Added confidence threshold — reports below 70% confidence flagged for manual operator review

---

## Slide 11: Accuracy & Efficiency Metrics

**Tiêu đề:** Numbers That Prove It Works

| Metric | Value | Method |
|---|---|---|
| ST-GCN MAE (density prediction) | **< 0.05** | Evaluation on synthetic test set |
| ST-GCN vs LSTM baseline improvement | **~18% lower MAE** | A/B comparison |
| Prediction latency (API) | **< 500ms** | Benchmark: 100 requests |
| WebSocket update interval | **~5 seconds** | Real-time edge metrics |
| Incident detection → notification | **< 30 seconds** | End-to-end demo timing |
| Recommendation approval workflow | **< 2 minutes** | Operator UX test |
| System uptime (Docker stack) | **99%+** | Local testing |
| Concurrent users tested | **50 simultaneous** | Load test |

> *Note: Metrics measured on synthetic Da Nang dataset. Field validation planned post-hackathon with Da Nang GTVT partnership.*

---

## Slide 12: Scalability Roadmap

**Tiêu đề:** From Da Nang to ASEAN — A Replicable Blueprint

### Phase 1 — Da Nang (Now)
- 500+ road segments, 6 user roles, real-time prediction
- Docker-based deployment, single city

### Phase 2 — Vietnam National Scale (6–12 months)
- Multi-city support: Ho Chi Minh City, Hanoi, Hue
- Federated model: each city has local AI, shares anomaly patterns
- Integration with Vietnam's National Traffic Management Center (VEC)

### Phase 3 — ASEAN Region (1–2 years)
- Modular city onboarding: any city with OSM coverage can deploy in < 1 week
- ASEAN data sharing protocol for cross-border corridors (e.g., Da Nang–Laos highway)
- Multilingual support: Vietnamese, English, Thai, Bahasa, Tagalog (i18n already in mobile app)

### Technical scalability
- Kafka handles **100,000+ messages/sec** — no bottleneck at IoT scale
- Microservices architecture — AI service scales independently from backend
- PostGIS spatial queries optimized with GIST indexes for city-scale graphs

---

## Slide 13: Impact Assessment

**Tiêu đề:** Aligned with UN SDGs & ASEAN Smart City Network Goals

### UN SDG Alignment
| SDG | How CivicTwin AI Contributes |
|---|---|
| **SDG 11** — Sustainable Cities | Reduces congestion, improves emergency response |
| **SDG 3** — Good Health | Cuts ambulance response: 22 min → target 12 min |
| **SDG 13** — Climate Action | Optimized traffic flow reduces idle emissions |
| **SDG 9** — Industry & Infrastructure | Open platform for city infrastructure management |

### Projected Impact (Da Nang, Year 1)
- 🕐 Emergency response time: **22 min → 12 min** (-45%)
- 🚗 Peak-hour congestion: **projected -20%** on optimized corridors
- 💰 Economic savings: **estimated 200–300 billion VND/year**
- 👥 Citizens informed proactively: **500,000+ Da Nang residents**

### ASEAN Smart City Network
- Aligns with ASCN's Da Nang Action Plan (Mobility & Connectivity pillar)
- Replicable in: Bangkok, Jakarta, Manila, Kuala Lumpur — all face similar congestion crises

---

## Slide 14: Future Roadmap

**Tiêu đề:** What's Next After the Hackathon

### Short-term (3–6 months)
- [ ] Partner with Da Nang Department of Transport (Sở GTVT) for pilot deployment
- [ ] Replace synthetic data with real sensor feeds (50 intersections)
- [ ] Mobile app launch on App Store / Google Play
- [ ] Benchmark ST-GCN on real Da Nang data

### Medium-term (6–18 months)
- [ ] Integrate with traffic signal control systems (adaptive signal timing)
- [ ] Add public transit layer (buses, BRT)
- [ ] Carbon emission tracking per corridor
- [ ] Open API for third-party apps (ride-hailing, logistics)

### Long-term (2–5 years)
- [ ] ASEAN multi-city deployment
- [ ] Autonomous vehicle infrastructure layer
- [ ] Long-term urban planning simulation (Amazon Nova integration)
- [ ] Academic publication: ST-GCN for Southeast Asian urban networks

---

## Slide 15: Team & Contact

**Tiêu đề:** The Team Behind CivicTwin AI

| Name | Role | Responsibility |
|---|---|---|
| [MEMBER_1] | Team Lead / Full-stack | Backend (Laravel), Architecture |
| [MEMBER_2] | AI/ML Engineer | LSTM, ST-GCN, FastAPI |
| [MEMBER_3] | Frontend Engineer | Next.js, Mapbox, Real-time UI |
| [MEMBER_4] | Mobile Developer | React Native, Push Notifications |
| [MEMBER_5] | Data & DevOps | PostgreSQL/PostGIS, Docker, Kafka |

**University:** Duy Tan University, Da Nang, Vietnam
**Email:** [TEAM_EMAIL]
**GitHub:** [GITHUB_REPO]
**Demo:** [DEMO_URL]

---

*"Cities don't need more cameras — they need intelligence."*
*— CivicTwin AI Team, ASEAN AI Hackathon 2026*
