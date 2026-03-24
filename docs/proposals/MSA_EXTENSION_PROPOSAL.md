# 🏗️ flet_montrg MSA Extension Proposal

## 📋 Current state

### Existing services & ports (k8s `flet-montrg` namespace, NodePort mapping)
- ✅ **thresholds-service** (port 30001): threshold CRUD
- ✅ **location-service** (port 30002): location & sensor metadata
- ✅ **realtime-service** (port 30003): real-time reads (depends on thresholds, location)
- ✅ **aggregation-service** (port 30004): period aggregation
- ✅ **integrated-swagger-service** (ports 30005, 30006): unified API docs
- ✅ **alert-service** (port 30007): alert create & manage
- ✅ **alert-subscription-service** (port 30008): subscriptions
- ✅ **alert-notification-service** (port 30009): notifications & delivery history
- ✅ **sensor-threshold-mapping-service** (port 30011): per-sensor threshold mapping

### Available ports (k8s NodePort 80:3xxxx)
- **30010**: alert-evaluation-service (planned, internal — no public exposure required)
- **30012+**: reserved for future use (30011 used by sensor-threshold-mapping-service)

### New requirements (ERD-driven)
- 📊 **alerts**: store alert history
- 📧 **alert_subscriptions**: subscriptions (factory / building / floor / area)
- 📨 **alert_notifications**: email delivery history
- 🔗 **sensor_threshold_map**: per-sensor threshold mapping

---

## 🏗️ MSA extension architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Alert Domain Services                    │
└─────────────────────────────────────────────────────────────┘

1. alert-service (create & manage alerts)
   ├── Responsibility: create, list, status
   ├── Data: alerts table
   ├── Dependencies:
   │   ├── thresholds-service (threshold info)
   │   ├── location-service (location info)
   │   └── sensor-threshold-mapping-service (mappings)
   └── Port: 30006

2. alert-subscription-service (subscriptions)
   ├── Responsibility: subscription CRUD, subscriber filters
   ├── Data: alert_subscriptions table
   ├── Dependencies: location-service (hierarchy)
   └── Port: 30007

3. alert-notification-service (notifications)
   ├── Responsibility: send notifications, delivery history
   ├── Data: alert_notifications table
   ├── Dependencies:
   │   ├── alert-service (alerts)
   │   └── alert-subscription-service (subscriptions)
   └── Port: 30008

4. sensor-threshold-mapping-service (sensor ↔ threshold)
   ├── Responsibility: mapping CRUD per sensor
   ├── Data: sensor_threshold_map table
   ├── Dependencies:
   │   ├── thresholds-service
   │   └── location-service (sensors)
   └── Port: 30009

5. alert-evaluation-service (threshold evaluation worker) ⭐ NEW
   ├── Responsibility: continuous background threshold breach detection
   ├── Data: (read-only) temperature_raw
   ├── Execution:
   │   ├── Scheduler-based (e.g. every 1 minute)
   │   └── Or event-driven (after ETL)
   ├── Dependencies:
   │   ├── sensor-threshold-mapping-service
   │   ├── thresholds-service
   │   ├── location-service
   │   └── alert-service (create alert)
   └── Port: 30010 (internal — no public exposure)
```

---

## 🎯 Why split services + alert-evaluation-service

1. **Single responsibility**: each service has a clear role
2. **Independent scaling**: scale notification-service when load is high
3. **Failure isolation**: subscription issues do not block notifications
4. **Team boundaries**: different teams can own different services
5. **Continuous detection**: threshold checks run in the background, independent of API traffic ⭐

---

## 📐 Per-service design

### 1. alert-service

**API endpoints:**
```
POST   /api/v1/alerts                    # Create alert
GET    /api/v1/alerts                    # List alerts
GET    /api/v1/alerts/{alert_id}         # Get alert
GET    /api/v1/alerts/by-sensor/{sensor_id}  # By sensor
GET    /api/v1/alerts/by-location/{loc_id}   # By location
PUT    /api/v1/alerts/{alert_id}/resolve # Resolve
```

**Inter-service calls:**
```python
# sensor-threshold-mapping-service
GET /api/v1/mappings/sensor/{sensor_id}
→ active threshold mappings for sensor

# thresholds-service
GET /api/v1/thresholds/{threshold_id}
→ threshold details

# location-service
GET /api/v1/location/{sensor_id}
→ sensor location
```

**Alert creation logic:**
```python
# ❌ Legacy (not recommended): check on every realtime-service call
# ✅ Preferred: alert-evaluation-service validates continuously in background

# Inside alert-evaluation-service
async def evaluate_thresholds():
    # 1. Latest sensor data (temperature_raw)
    latest_data = await get_latest_temperature_data()

    # 2. Per-sensor mappings
    for sensor_data in latest_data:
        mappings = await sensor_threshold_mapping_client.get_active_mappings(
            sensor_id=sensor_data.sensor_id
        )

        # 3. Threshold breach?
        for mapping in mappings:
            threshold = await thresholds_client.get_threshold(mapping.threshold_id)
            if is_threshold_exceeded(sensor_data.value, threshold):
                # 4. Create alert
                await alert_service_client.create_alert({
                    "sensor_id": sensor_data.sensor_id,
                    "threshold_type": threshold.threshold_type,
                    "threshold_level": threshold.level,
                    "measured_value": sensor_data.value,
                    "threshold_id": threshold.threshold_id,
                    "threshold_map_id": mapping.map_id
                })
```

---

### 2. alert-subscription-service

**API endpoints:**
```
POST   /api/v1/subscriptions             # Create
GET    /api/v1/subscriptions             # List
GET    /api/v1/subscriptions/{subscription_id}  # Get
PUT    /api/v1/subscriptions/{subscription_id}   # Update
DELETE /api/v1/subscriptions/{subscription_id}  # Delete

# Location-based match (core)
GET    /api/v1/subscriptions/match
       ?factory=SinPyeong
       &building=F-2001
       &floor=1
       &area=Assembly2
```

**Location matching examples:**
```python
# factory only → all subscriptions for that factory
GET /api/v1/subscriptions/match?factory=SinPyeong

# factory + building
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001

# factory + building + floor
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001&floor=1

# full hierarchy
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001&floor=1&area=Assembly2
```

**Matching query:**
```sql
-- Subscriptions that match alert location
SELECT * FROM alert_subscriptions
WHERE enabled = true
  AND (
    (factory IS NULL OR factory = :factory)
    AND (building IS NULL OR building = :building)
    AND (floor IS NULL OR floor = :floor)
    AND (area IS NULL OR area = :area)
  )
  AND (sensor_id IS NULL OR sensor_id = :sensor_id)
  AND (threshold_type IS NULL OR threshold_type = :threshold_type)
  AND (min_level IS NULL OR min_level <= :alert_level)
```

---

### 3. alert-notification-service

**API endpoints:**
```
POST   /api/v1/notifications/send        # Send request
GET    /api/v1/notifications             # Delivery history
GET    /api/v1/notifications/{notification_id}  # Detail
GET    /api/v1/notifications/by-alert/{alert_id}  # By alert
PUT    /api/v1/notifications/{notification_id}/retry  # Retry
```

**Inter-service calls:**
```python
# alert-service
GET /api/v1/alerts/{alert_id}
→ alert payload

# alert-subscription-service
GET /api/v1/subscriptions/match?factory=...&building=...
→ subscribers for location
```

**Notification flow:**
```
1. alert-service creates alert
2. alert-service requests send from notification-service
   POST /api/v1/notifications/send
   {
       "alert_id": 123,
       "subscription_ids": [1, 2, 3]
   }
3. notification-service sends email/SMS
4. persist result in alert_notifications
```

---

### 4. sensor-threshold-mapping-service

**API endpoints:**
```
POST   /api/v1/mappings                 # Create
GET    /api/v1/mappings                 # List
GET    /api/v1/mappings/sensor/{sensor_id}  # By sensor
GET    /api/v1/mappings/threshold/{threshold_id}  # By threshold
PUT    /api/v1/mappings/{map_id}         # Update
DELETE /api/v1/mappings/{map_id}         # Delete
GET    /api/v1/mappings/active/sensor/{sensor_id}  # Active mappings
```

**Inter-service calls:**
```python
# thresholds-service
GET /api/v1/thresholds/{threshold_id}
→ threshold details

# location-service
GET /api/v1/location/{sensor_id}
→ sensor location
```

**Active mapping query:**
```sql
SELECT * FROM sensor_threshold_map
WHERE sensor_id = :sensor_id
  AND enabled = true
  AND (effective_from IS NULL OR effective_from <= NOW())
  AND (effective_to IS NULL OR effective_to >= NOW())
ORDER BY threshold_id
```

**Schema change:**
```sql
-- ❌ Old (hours only)
duration_hours int4 DEFAULT 1 NOT NULL

-- ✅ New (seconds — flexible)
duration_seconds int4 DEFAULT 60 NOT NULL  -- default 60s (1 min)

-- Examples:
-- 1s = 1, 1m = 60, 10m = 600, 1h = 3600, 24h = 86400
```

**Meaning of `duration_seconds`:**
- Minimum time the value must **stay** beyond the threshold before raising an alert (seconds)
- e.g. `duration_seconds = 300` → breach must persist 5 minutes before alert
- Used for deduplication and noise reduction

---

### 5. alert-evaluation-service (threshold worker)

**Role:**
- Scan `temperature_raw` in the background
- Evaluate per-sensor threshold breaches
- On breach, call alert-service to create alerts

**Execution:**
- **Scheduler**: APScheduler or Celery Beat
- **Interval**: e.g. every 1 minute (configurable)
- **Concurrency**: `max_instances=1` to avoid overlap

**Optional monitoring APIs:**
```
GET    /health                    # Health
GET    /status                    # Worker status
POST   /evaluate/trigger          # Manual trigger (tests)
GET    /metrics                   # Metrics (records processed, etc.)
```

**Inter-service calls:**
```python
# sensor-threshold-mapping-service
GET /api/v1/mappings/active/sensor/{sensor_id}
→ active mappings

# thresholds-service
GET /api/v1/thresholds/{threshold_id}

# location-service
GET /api/v1/location/{sensor_id}

# alert-service
POST /api/v1/alerts
→ create alert
```

**Core loop:**
```python
async def evaluate_thresholds():
    """Main threshold evaluation loop"""
    # 1. Rows newer than last checkpoint
    last_check_time = await get_last_check_time()
    new_data = await db.query(
        "SELECT * FROM flet_montrg.temperature_raw "
        "WHERE capture_dt > :last_check_time "
        "ORDER BY capture_dt DESC",
        last_check_time=last_check_time
    )

    # 2. Latest row per sensor
    sensor_latest = {}
    for row in new_data:
        if row.sensor_id not in sensor_latest:
            sensor_latest[row.sensor_id] = row

    # 3. Evaluate each sensor
    for sensor_id, data in sensor_latest.items():
        mappings = await mapping_client.get_active_mappings(sensor_id)

        for mapping in mappings:
            threshold = await thresholds_client.get_threshold(mapping.threshold_id)
            value = extract_value_by_type(data, threshold.threshold_type)

            if is_exceeded(value, threshold):
                if await check_duration_exceeded(
                    sensor_id,
                    mapping.threshold_id,
                    mapping.duration_seconds,
                    data.capture_dt
                ):
                    await alert_client.create_alert({
                        "sensor_id": sensor_id,
                        "loc_id": data.loc_id,
                        "threshold_type": threshold.threshold_type,
                        "threshold_level": threshold.level,
                        "measured_value": value,
                        "threshold_id": threshold.threshold_id,
                        "threshold_map_id": mapping.map_id,
                        "alert_time": data.capture_dt
                    })

    await update_last_check_time(datetime.now())
```

**Duration check:**
```python
async def check_duration_exceeded(
    sensor_id: str,
    threshold_id: int,
    duration_seconds: int,
    current_time: datetime
) -> bool:
    """
    True if breach persisted for at least duration_seconds.

    1. Load temperature_raw rows in [current_time - duration, current_time]
    2. All rows must still be in breach
    """
    start_time = current_time - timedelta(seconds=duration_seconds)

    recent_data = await db.query(
        """
        SELECT * FROM flet_montrg.temperature_raw
        WHERE sensor_id = :sensor_id
          AND capture_dt >= :start_time
          AND capture_dt <= :current_time
        ORDER BY capture_dt ASC
        """,
        sensor_id=sensor_id,
        start_time=start_time,
        current_time=current_time
    )

    if not recent_data:
        return False  # no data → no alert

    threshold = await thresholds_client.get_threshold(threshold_id)

    for data in recent_data:
        value = extract_value_by_type(data, threshold.threshold_type)
        if not is_exceeded(value, threshold):
            return False  # any in-range sample cancels alert

    return True

async def should_create_alert(
    sensor_id: str,
    threshold_id: int,
    alert_time: datetime
) -> bool:
    """Dedup: suppress duplicate alerts for same sensor+threshold within window"""
    last_alert = await alert_client.get_latest_alert(
        sensor_id=sensor_id,
        threshold_id=threshold_id
    )

    if last_alert:
        time_diff = alert_time - last_alert.alert_time
        if time_diff.total_seconds() < 300:  # 5 minutes
            return False

    return True
```

---

## 🔄 End-to-end alert flow

### Improved full flow

```
[Ingestion]
Airflow ETL (every 10 min)
    │
    └─→ append to temperature_raw
    │
    ▼
[Threshold evaluation — background worker]
[0] alert-evaluation-service (scheduler/worker)
    │
    ├─→ read latest temperature_raw (read-only)
    ├─→ sensor-threshold-mapping-service: active mappings
    │   GET /api/v1/mappings/active/sensor/{sensor_id}
    ├─→ thresholds-service: threshold details
    │   GET /api/v1/thresholds/{threshold_id}
    └─→ location-service: sensor location
        GET /api/v1/location/{sensor_id}
    │
    ▼ breach detected
    │
[1] alert-service
    │
    ├─→ POST /api/v1/alerts
    ├─→ alert-subscription-service: match subscriptions
    │   GET /api/v1/subscriptions/match?factory=...&building=...
    └─→ alert-notification-service: send
        POST /api/v1/notifications/send
        │
[2] alert-notification-service
    │
    ├─→ deliver per subscriber (email/SMS)
    └─→ persist to alert_notifications
```

### How to run alert-evaluation-service

**Option 1: Scheduler (recommended)**
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(
    evaluate_thresholds,
    'interval',
    minutes=1,
    max_instances=1
)
scheduler.start()
```

**Option 2: Event-driven**
```python
# Webhook after Airflow ETL
# Or DB triggers
# Or message bus (RabbitMQ, Kafka)
```

**Option 3: Kubernetes CronJob**
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: alert-evaluation
spec:
  schedule: "*/1 * * * *"  # every minute
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: alert-evaluation
            image: flet-montrg/alert-evaluation-service:latest
            command: ["python", "evaluate_thresholds.py"]
```

---

## 📦 Database ownership

### Tables per service

| Service | Owns | Access |
|---------|------|--------|
| **alert-service** | `alerts` | read/write |
| **alert-subscription-service** | `alert_subscriptions` | read/write |
| **alert-notification-service** | `alert_notifications` | read/write |
| **sensor-threshold-mapping-service** | `sensor_threshold_map` | read/write |
| **alert-evaluation-service** | — | read-only: `temperature_raw` |
| **thresholds-service** | `thresholds` | read/write |
| **location-service** | `locations`, `sensors` | read/write |
| **realtime-service** | — | read-only: `temperature_raw` |
| **aggregation-service** | — | read-only: `temperature_raw` |

**Rules:**
- Each service writes only its own tables
- Other tables are read via HTTP APIs only
- Consistency enforced via service calls

---

## 🚀 Implementation phases

### Phase 1: Core (1–2 weeks)
1. **sensor-threshold-mapping-service**
   - mapping CRUD
   - active mapping API
   - data migration

2. **alert-service**
   - create/list APIs
   - integrate mapping service

### Phase 2: Subscriptions & notifications (2–3 weeks)
3. **alert-subscription-service**
   - subscription CRUD
   - location matching
   - location-service integration

4. **alert-notification-service**
   - delivery engine (email/SMS)
   - history & retries

### Phase 3: Evaluation worker (1–2 weeks)
5. **alert-evaluation-service**
   - scheduler/worker
   - scan `temperature_raw`
   - breach detection → alert-service

### Phase 4: Integration & tuning (1–2 weeks)
6. **realtime-service**
   - remove inline threshold checks (moved to evaluation service)
   - simplify to read APIs

7. **Observability**
   - per-service monitoring
   - performance tuning
   - error handling
   - tune evaluation interval

---

## 🔧 Tech stack (unchanged)

- **Backend**: Python / FastAPI
- **Database**: PostgreSQL (schema per service where applicable)
- **Container**: Docker
- **Orchestration**: Kubernetes (Kind)
- **Service calls**: HTTP/REST (`httpx.AsyncClient`)
- **API docs**: OpenAPI / Swagger

---

## 📊 Kubernetes layout

```
flet_montrg/
├── k8s/
│   ├── alert/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── hpa.yaml
│   │   └── network-policy.yaml
│   ├── alert-subscription/
│   ├── alert-notification/
│   ├── sensor-threshold-mapping/
│   └── alert-evaluation/         # worker
```

---

## 🎯 Benefits

1. **Scale**: scale notification-service independently
2. **Maintainability**: deploy services independently
3. **Resilience**: isolate failures between services
4. **Org**: align teams to services
5. **Testability**: test each service in isolation

---

## ⚠️ Considerations

1. **Distributed transactions**: consistency between alert create and notify
   - Mitigation: events or Saga

2. **Dependencies**: avoid cycles
   - Mitigation: keep one direction (realtime → alert → notification)

3. **Consistency** across services
   - Mitigation: event sourcing or eventual consistency

4. **Performance**: HTTP overhead between services
   - Mitigation: async, caching, batching

---

## 📝 Next steps

1. Detailed OpenAPI per service
2. Finalize DB schema & migrations
3. Define inter-service contracts
4. Error handling & retry policy
5. Monitoring & logging strategy

---

## 🔧 DB schema: `sensor_threshold_map`

**Migration:**
```sql
-- Add new column, backfill from hours, then drop old column
ALTER TABLE flet_montrg.sensor_threshold_map
ADD COLUMN IF NOT EXISTS duration_seconds int4 DEFAULT 60 NOT NULL;

UPDATE flet_montrg.sensor_threshold_map
SET duration_seconds = duration_hours * 3600
WHERE duration_hours IS NOT NULL;

ALTER TABLE flet_montrg.sensor_threshold_map
DROP COLUMN IF EXISTS duration_hours;
```

**Resulting schema:**
```sql
CREATE TABLE flet_montrg.sensor_threshold_map (
    map_id bigserial NOT NULL,
    sensor_id varchar(50) NOT NULL,
    threshold_id int4 NOT NULL,
    duration_seconds int4 DEFAULT 60 NOT NULL,
    enabled bool DEFAULT true NOT NULL,
    effective_from timestamptz NULL,
    effective_to timestamptz NULL,
    upd_dt timestamptz DEFAULT CURRENT_TIMESTAMP NULL,
    CONSTRAINT sensor_threshold_map_pkey PRIMARY KEY (map_id),
    CONSTRAINT sensor_threshold_map_sensor_threshold_uk UNIQUE (sensor_id, threshold_id),
    CONSTRAINT sensor_threshold_map_sensor_fkey FOREIGN KEY (sensor_id)
        REFERENCES flet_montrg.sensors(sensor_id),
    CONSTRAINT sensor_threshold_map_threshold_fkey FOREIGN KEY (threshold_id)
        REFERENCES flet_montrg.thresholds(threshold_id)
);

CREATE INDEX idx_stm_effective ON flet_montrg.sensor_threshold_map
    USING btree (effective_from, effective_to);
CREATE INDEX idx_stm_enabled ON flet_montrg.sensor_threshold_map
    USING btree (enabled);
CREATE INDEX idx_stm_sensor ON flet_montrg.sensor_threshold_map
    USING btree (sensor_id);
CREATE INDEX idx_stm_threshold ON flet_montrg.sensor_threshold_map
    USING btree (threshold_id);
```

**Example payload:**
```python
# 1s = 1, 1m = 60, 5m = 300, 10m = 600, 30m = 1800, 1h = 3600, 24h = 86400

POST /api/v1/mappings
{
    "sensor_id": "S001",
    "threshold_id": 123,
    "duration_seconds": 300,
    "enabled": true,
    "effective_from": "2025-01-01T00:00:00Z",
    "effective_to": null
}
```
