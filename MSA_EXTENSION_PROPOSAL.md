# flet-montrg MSA Extension Proposal

> **Note**: Ports below are **proposed sequential** allocation. Current deployment may differ (see [README.md](README.md)); migrate NodePorts in `k8s/` when applying this scheme.
>
> **⚠️ alert-evaluation-service**: **Not implemented** (no `services/alert-evaluation-service/` or `k8s/alert-evaluation/`). Threshold **check** for display only exists in **realtime-service** (`_check_thresholds()`); it does not create alerts. Automatic alert creation would require this worker or the same logic inside realtime/alert-service.

---

## 📋 Current Situation & Port Allocation (Sequential)

| Port | Service | Role |
| --- | --- | --- |
| 30000 | web-service | Dashboard Web UI (main entry) |
| 30001 | integrated-swagger-service | API docs + proxy |
| 30002 | thresholds-service | Threshold CRUD |
| 30003 | location-service | Location/sensor info |
| 30004 | realtime-service | Real-time data (uses thresholds for display) |
| 30005 | aggregation-service | Period aggregation |
| 30006 | alert-service | Alert CRUD, notification trigger |
| 30007 | alert-subscription-service | Subscription CRUD, location match |
| 30008 | alert-notification-service | Notification delivery, history |
| 30009 | sensor-threshold-mapping-service | Sensor–threshold mapping |
| 30010 | alert-evaluation-service (planned) | **Not implemented** — internal; background threshold validation → alert creation |

**New tables (ERD)**: `alerts`, `alert_subscriptions`, `alert_notifications`, `sensor_threshold_map`.

---

## 🏗️ Architecture (Alert Domain)

- **alert-service**: Alert CRUD; on create → call subscription match → call notification send.
- **alert-subscription-service**: Subscription CRUD; location-based match (factory/building/floor/area).
- **alert-notification-service**: Send email/SMS; store delivery history; retry.
- **sensor-threshold-mapping-service**: Mapping CRUD; active mappings by sensor (effective_from/to, enabled).
- **alert-evaluation-service (planned, 30010)**: Read temperature_raw → get active mappings + thresholds → if exceeded for duration_seconds → POST alert-service. Run as scheduler (e.g. 1 min) or CronJob; internal only.

**Rationale**: Single responsibility, independent scaling, fault isolation, optional background evaluation.

---

## 📐 Service Design (Summary)

| Service | Key APIs | Dependencies |
| --- | --- | --- |
| alert-service | POST/GET /api/v1/alerts, PUT …/resolve | mapping, thresholds, location (optional); subscription match + notification send on create |
| alert-subscription-service | CRUD /api/v1/subscriptions, GET …/match?factory=&building=&floor=&area= | location-service |
| alert-notification-service | POST /api/v1/notifications/send, GET history, retry | alert-service, alert-subscription-service |
| sensor-threshold-mapping-service | CRUD /api/v1/mappings, GET …/active/sensor/{id} | thresholds, location |
| alert-evaluation (planned) | (internal) Scan raw → validate → create alert | mapping, thresholds, location, alert-service |

**Subscription match**: `(factory IS NULL OR = :factory) AND …` for hierarchy; optional sensor_id, threshold_type, min_level.

**duration_seconds** (sensor_threshold_map): Min time threshold must be exceeded continuously before creating alert (e.g. 60=1min, 300=5min). Migration: ADD duration_seconds → UPDATE from duration_hours → DROP duration_hours.

---

## 🔄 End-to-End Flow

```text
ETL → temperature_raw
  → [alert-evaluation-service] (planned) read raw, mappings, thresholds → if exceeded → POST /alerts
  → alert-service: create alert → GET subscriptions/match → POST /notifications/send
  → alert-notification-service: send email/SMS, store history
```

---

## 📦 Data Ownership

| Service | Owned Tables | Access |
| --- | --- | --- |
| alert-service | `alerts` | R/W |
| alert-subscription-service | `alert_subscriptions` | R/W |
| alert-notification-service | `alert_notifications` | R/W |
| sensor-threshold-mapping-service | `sensor_threshold_map` | R/W |
| alert-evaluation-service | (none) | Read-only temperature_raw |
| thresholds / location / realtime / aggregation / web | (as today) | Per existing design |

---

## 🚀 Implementation Phases

1. **Phase 1**: sensor-threshold-mapping-service (CRUD, active API, migration); alert-service (create, query, optional integration).
2. **Phase 2**: alert-subscription-service (CRUD, match); alert-notification-service (send, history, retry).
3. **Phase 3**: alert-evaluation-service (scheduler or CronJob, scan raw, duration check, create alert) — or embed in realtime-service/alert-service.
4. **Phase 4**: realtime-service cleanup (optional removal of display-only threshold logic); monitoring and tuning.

---

## 📊 K8s Structure

`k8s/{thresholds,location,realtime,aggregation,alert,alert-subscription,alert-notification,sensor-threshold-mapping,integrated-swagger,web-service}`; `alert-evaluation` when implemented.

---

## ⚠️ Considerations

- **Consistency**: Alert create vs notification delivery — consider idempotency, retries, or event-driven/Saga.
- **Dependencies**: Keep flow unidirectional (e.g. evaluation → alert → notification).
- **Performance**: Use async, caching, batch where needed.

---

## 📝 Further Implementation Recommendations

1. **Health & readiness**: `/health`, `/ready` per service; K8s probes and dependency checks.
2. **Structured logging**: JSON logs with trace_id/correlation_id across alert → subscription → notification for debugging.
3. **Circuit breaker / retries**: When calling alert-service, notification-service (e.g. tenacity, backoff) to handle transient failures.
4. **API versioning**: Keep `/api/v1/`; document policy for v2 (e.g. deprecation window).
5. **E2E / integration tests**: One flow: create subscription → trigger alert (or mock evaluation) → assert notification created and (if applicable) email sent.
6. **Alert deduplication**: In alert-service or evaluation: same sensor+threshold within N minutes → skip or merge (already suggested in proposal as 5 min window).
7. **Config externalisation**: DB URLs, notification provider (SMTP etc.), evaluation interval in ConfigMap/Secret per service.
8. **Metrics**: Count of alerts created, notifications sent/failed, evaluation runs; expose `/metrics` (Prometheus) for alert-evaluation when implemented.

---

## 🔧 DB Migration (sensor_threshold_map)

Run in order: (1) `ADD COLUMN duration_seconds int4 DEFAULT 60 NOT NULL`, (2) `UPDATE … SET duration_seconds = duration_hours * 3600 WHERE duration_hours IS NOT NULL`, (3) `DROP COLUMN duration_hours`. Keep existing indexes.
