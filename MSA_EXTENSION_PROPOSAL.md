# flet_montrg MSA Extension Proposal

## 📋 Current Situation Analysis

### Existing Service Structure and Port Allocation

- ✅ **thresholds-service** (Port 30001): Threshold CRUD management
- ✅ **location-service** (Port 30002): Location and sensor information management
- ✅ **realtime-service** (Port 30003): Real-time data query (depends on thresholds, location)
- ✅ **aggregation-service** (Port 30004): Period-based aggregated data query
- ✅ **integrated-swagger-service** (Port 30005): Integrated API documentation

### Available Ports

- **30006**: alert-service (planned)
- **30007**: alert-subscription-service (planned)
- **30008**: alert-notification-service (planned)
- **30009**: sensor-threshold-mapping-service (planned)
- **30010**: alert-evaluation-service (planned, internal service - no external exposure needed)
- **30011+**: For future expansion

### New Requirements (Based on ERD)

- 📊 **alerts**: Store alert occurrence history
- 📧 **alert_subscriptions**: Alert subscription management (factory/building/floor/area levels)
- 📨 **alert_notifications**: Email delivery history
- 🔗 **sensor_threshold_map**: Sensor-specific threshold mapping

---

## 🏗️ MSA Extension Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Alert Domain Services                    │
└─────────────────────────────────────────────────────────────┘

1. alert-service (Alert creation and management)
   ├── Responsibility: Alert creation, query, status management
   ├── Data: alerts table
   ├── Dependencies: 
   │   ├── thresholds-service (threshold information)
   │   ├── location-service (location information)
   │   └── sensor-threshold-mapping-service (mapping information)
   └── Port: 30006

2. alert-subscription-service (Subscription management)
   ├── Responsibility: Subscription CRUD, subscriber filtering
   ├── Data: alert_subscriptions table
   ├── Dependencies: location-service (location hierarchy)
   └── Port: 30007

3. alert-notification-service (Notification delivery)
   ├── Responsibility: Notification delivery, delivery history management
   ├── Data: alert_notifications table
   ├── Dependencies:
   │   ├── alert-service (alert information)
   │   └── alert-subscription-service (subscription information)
   └── Port: 30008

4. sensor-threshold-mapping-service (Sensor-threshold mapping)
   ├── Responsibility: Sensor-specific threshold mapping management
   ├── Data: sensor_threshold_map table
   ├── Dependencies:
   │   ├── thresholds-service (threshold information)
   │   └── location-service (sensor information)
   └── Port: 30009

5. alert-evaluation-service (Threshold validation worker) ⭐ NEW
   ├── Responsibility: Continuously detect threshold violations in background
   ├── Data: (read-only) temperature_raw
   ├── Execution method: 
   │   ├── Scheduler-based (periodic execution, e.g., every 1 minute)
   │   └── Or event-based (triggered after ETL completion)
   ├── Dependencies:
   │   ├── sensor-threshold-mapping-service (mapping information)
   │   ├── thresholds-service (threshold information)
   │   ├── location-service (location information)
   │   └── alert-service (alert creation)
   └── Port: 30010 (internal service, no external exposure needed)
```

---

## 🎯 Segmentation + alert-evaluation-service

### Rationale

1. **Single Responsibility Principle**: Each service has clear responsibility
2. **Independent Scaling**: Scale only notification-service when notification volume is high
3. **Fault Isolation**: Subscription management issues don't affect notification delivery
4. **Team Separation**: Each service can be managed by different teams
5. **Real-time Detection**: Continuous threshold validation in background independent of API calls ⭐

---

## 📐 Detailed Service Design

### 1. alert-service

**API Endpoints:**

```bash
POST   /api/v1/alerts                    # Create alert
GET    /api/v1/alerts                    # Query alert list
GET    /api/v1/alerts/{alert_id}         # Query alert details
GET    /api/v1/alerts/by-sensor/{sensor_id}  # Query alerts by sensor
GET    /api/v1/alerts/by-location/{loc_id}   # Query alerts by location
PUT    /api/v1/alerts/{alert_id}/resolve # Resolve alert
```

**Inter-service Communication:**

```python
# Call sensor-threshold-mapping-service
GET /api/v1/mappings/sensor/{sensor_id}
→ Retrieve threshold mapping applied to sensor

# Call thresholds-service
GET /api/v1/thresholds/{threshold_id}
→ Retrieve threshold details

# Call location-service
GET /api/v1/location/{sensor_id}
→ Retrieve sensor location information
```

**Alert Creation Logic:**

```python
# ❌ Legacy approach (not recommended): Check on each realtime-service API call
# ✅ New approach: alert-evaluation-service continuously validates in background

# alert-evaluation-service internal logic
async def evaluate_thresholds():
    # 1. Retrieve latest sensor data (temperature_raw)
    latest_data = await get_latest_temperature_data()
    
    # 2. Retrieve threshold mapping for each sensor
    for sensor_data in latest_data:
        mappings = await sensor_threshold_mapping_client.get_active_mappings(
            sensor_id=sensor_data.sensor_id
        )
        
        # 3. Check if threshold is exceeded
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

**API Endpoints:**

```bash
POST   /api/v1/subscriptions             # Create subscription
GET    /api/v1/subscriptions             # List subscriptions
GET    /api/v1/subscriptions/{subscription_id}  # Get subscription details
PUT    /api/v1/subscriptions/{subscription_id}   # Update subscription
DELETE /api/v1/subscriptions/{subscription_id}  # Delete subscription

# Location-based subscription query (core feature)
GET    /api/v1/subscriptions/match       # Query subscriptions by location match
       ?factory=SinPyeong
       &building=F-2001
       &floor=1
       &area=Assembly2
```

**Location Matching Logic:**

```python
# Specify factory only → Subscriptions for entire factory
GET /api/v1/subscriptions/match?factory=SinPyeong

# factory+building → Specific building only
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001

# factory+building+floor → Specific floor only
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001&floor=1

# factory+building+floor+area → Specific area only
GET /api/v1/subscriptions/match?factory=SinPyeong&building=F-2001&floor=1&area=Assembly2
```

**Matching Algorithm:**

```sql
-- Verify if subscription conditions match alert location
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

**API Endpoints:**

```bash
POST   /api/v1/notifications/send        # Request notification delivery
GET    /api/v1/notifications             # Query delivery history
GET    /api/v1/notifications/{notification_id}  # Get delivery details
GET    /api/v1/notifications/by-alert/{alert_id}  # Delivery history by alert
PUT    /api/v1/notifications/{notification_id}/retry  # Retry delivery
```

**Inter-service Communication:**

```python
# Call alert-service
GET /api/v1/alerts/{alert_id}
→ Retrieve alert information

# Call alert-subscription-service
GET /api/v1/subscriptions/match?factory=...&building=...
→ Retrieve subscriber list for the location
```

**Notification Delivery Flow:**

```bash
1. Alert created in alert-service
2. alert-service requests notification-service to send
   POST /api/v1/notifications/send
   {
       "alert_id": 123,
       "subscription_ids": [1, 2, 3]
   }
3. notification-service sends email/SMS
4. Store delivery result in alert_notifications table
```

---

### 4. sensor-threshold-mapping-service

**API Endpoints:**

```bash
POST   /api/v1/mappings                 # Create mapping
GET    /api/v1/mappings                 # List mappings
GET    /api/v1/mappings/sensor/{sensor_id}  # Get mappings by sensor
GET    /api/v1/mappings/threshold/{threshold_id}  # Get mappings by threshold
PUT    /api/v1/mappings/{map_id}         # Update mapping
DELETE /api/v1/mappings/{map_id}         # Delete mapping
GET    /api/v1/mappings/active/sensor/{sensor_id}  # Get active mappings
```

**Inter-service Communication:**

```python
# Call thresholds-service
GET /api/v1/thresholds/{threshold_id}
→ Threshold details

# Call location-service
GET /api/v1/location/{sensor_id}
→ Sensor location information
```

**Active Mapping Query Logic:**

```sql
SELECT * FROM sensor_threshold_map
WHERE sensor_id = :sensor_id
  AND enabled = true
  AND (effective_from IS NULL OR effective_from <= NOW())
  AND (effective_to IS NULL OR effective_to >= NOW())
ORDER BY threshold_id
```

**Schema Changes:**

```sql
-- ❌ Legacy (hours only)
duration_hours int4 DEFAULT 1 NOT NULL

-- ✅ Updated (seconds/minutes/hours supported)
duration_seconds int4 DEFAULT 60 NOT NULL  -- Default: 60 seconds (1 minute)

-- Usage examples:
-- 1 second = 1
-- 1 minute = 60
-- 10 minutes = 600
-- 1 hour = 3600
-- 24 hours = 86400
```

**Meaning of duration_seconds:**

- Minimum time (in seconds) that the threshold must be **exceeded continuously** before triggering an alert
- Example: With `duration_seconds = 300` (5 minutes), the threshold must be exceeded for 5+ minutes to trigger an alert
- Used for duplicate alert prevention and noise filtering

---

### 5. alert-evaluation-service (Threshold Validation Worker)

**Role:**

- Continuously scan temperature_raw data in the background
- Validate threshold exceedance per sensor
- Request alert creation from alert-service when threshold is exceeded

**Execution Method:**

- **Scheduler-based**: Use APScheduler or Celery Beat
- **Execution interval**: Every 1 minute (configurable)
- **Concurrent execution prevention**: max_instances=1

**API Endpoints (optional - for monitoring):**

```bash
GET    /health                    # Health check
GET    /status                    # Worker status
POST   /evaluate/trigger          # Manual trigger (for testing)
GET    /metrics                   # Metrics (e.g., records processed)
```

**Inter-service Communication:**

```python
# Call sensor-threshold-mapping-service
GET /api/v1/mappings/active/sensor/{sensor_id}
→ Retrieve active threshold mapping for sensor

# Call thresholds-service
GET /api/v1/thresholds/{threshold_id}
→ Retrieve threshold details

# Call location-service
GET /api/v1/location/{sensor_id}
→ Retrieve sensor location information

# Call alert-service
POST /api/v1/alerts
→ Request alert creation
```

**Core Logic:**

```python
async def evaluate_thresholds():
    """Main threshold validation logic"""
    # 1. Retrieve new data since last check
    last_check_time = await get_last_check_time()
    new_data = await db.query(
        "SELECT * FROM flet_montrg.temperature_raw "
        "WHERE capture_dt > :last_check_time "
        "ORDER BY capture_dt DESC",
        last_check_time=last_check_time
    )
    
    # 2. Group by sensor and use latest value only
    sensor_latest = {}
    for row in new_data:
        if row.sensor_id not in sensor_latest:
            sensor_latest[row.sensor_id] = row
    
    # 3. Validate threshold for each sensor
    for sensor_id, data in sensor_latest.items():
        # Retrieve active mappings for sensor
        mappings = await mapping_client.get_active_mappings(sensor_id)
        
        for mapping in mappings:
            threshold = await thresholds_client.get_threshold(mapping.threshold_id)
            
            # Extract value by threshold type
            value = extract_value_by_type(data, threshold.threshold_type)
            
            # Check if threshold exceeded
            if is_exceeded(value, threshold):
                # duration_seconds check: verify exceedance lasts long enough
                if await check_duration_exceeded(
                    sensor_id, 
                    mapping.threshold_id, 
                    mapping.duration_seconds,
                    data.capture_dt
                ):
                    # Create alert
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
    
    # 4. Update last check time
    await update_last_check_time(datetime.now())
```

**Duration Check Based on duration_seconds:**

```python
async def check_duration_exceeded(
    sensor_id: str, 
    threshold_id: int, 
    duration_seconds: int,
    current_time: datetime
) -> bool:
    """
    Verify if threshold has been exceeded for duration_seconds or longer.
    
    Logic:
    1. Query temperature_raw for the last duration_seconds
    2. Verify all records are in exceeded state
    3. Return True if all exceeded
    """
    # Compute time duration_seconds ago
    start_time = current_time - timedelta(seconds=duration_seconds)
    
    # Query recent data for duration_seconds
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
        return False  # No alert if no data
    
    # Retrieve threshold info
    threshold = await thresholds_client.get_threshold(threshold_id)
    
    # Verify all records are in exceeded state
    for data in recent_data:
        value = extract_value_by_type(data, threshold.threshold_type)
        if not is_exceeded(value, threshold):
            return False  # No alert if any is within normal range
    
    # All exceeded for duration_seconds
    return True

async def should_create_alert(
    sensor_id: str, 
    threshold_id: int, 
    alert_time: datetime
) -> bool:
    """
    Duplicate alert prevention: avoid duplicate alerts for the same
    sensor+threshold within a time window.
    """
    last_alert = await alert_client.get_latest_alert(
        sensor_id=sensor_id,
        threshold_id=threshold_id
    )
    
    if last_alert:
        # Prevent duplicates within 5 minutes of last alert
        time_diff = alert_time - last_alert.alert_time
        if time_diff.total_seconds() < 300:  # 5 minutes
            return False
    
    return True
```

---

## 🔄 Inter-service Communication Flow

### End-to-end Alert Flow (Improved Version)

```text
[Data Collection]
Airflow ETL (every 10 minutes)
    │
    └─→ Load data into temperature_raw table
    │
    ▼
[Threshold Validation - Background Worker]
[0] alert-evaluation-service (scheduler/worker)
    │
    ├─→ Query latest temperature_raw data (read-only)
    ├─→ sensor-threshold-mapping-service: active mappings per sensor
    │   GET /api/v1/mappings/active/sensor/{sensor_id}
    ├─→ thresholds-service: threshold details
    │   GET /api/v1/thresholds/{threshold_id}
    └─→ location-service: sensor location info
        GET /api/v1/location/{sensor_id}
    │
    ▼ Threshold exceedance detected
    │
[1] alert-service
    │
    ├─→ POST /api/v1/alerts (create alert)
    ├─→ alert-subscription-service: location-based subscription query
    │   GET /api/v1/subscriptions/match?factory=...&building=...
    └─→ alert-notification-service: notification delivery request
        POST /api/v1/notifications/send
        │
[2] alert-notification-service
    │
    ├─→ Send notifications to subscribers (email/SMS)
    └─→ Store delivery history in alert_notifications table
```

### alert-evaluation-service Execution Options

#### **Option 1: Scheduler-based (Recommended)**

```python
# FastAPI + APScheduler or Celery Beat
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(
    evaluate_thresholds,
    'interval',
    minutes=1,  # Run every 1 minute
    max_instances=1  # Prevent concurrent execution
)
scheduler.start()
```

#### **Option 2: Event-based**

```python
# Webhook after Airflow ETL completion
# Or database trigger
# Or message queue (RabbitMQ, Kafka)
```

#### **Option 3: Kubernetes CronJob**

```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: alert-evaluation
spec:
  schedule: "*/1 * * * *"  # Every 1 minute
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

## 📦 Database Ownership Separation

### Data Ownership by Service

| Service | Owned Tables | Access |
| ------ | ------ | ------ |
| **alert-service** | `alerts` | Read/Write |
| **alert-subscription-service** | `alert_subscriptions` | Read/Write |
| **alert-notification-service** | `alert_notifications` | Read/Write |
| **sensor-threshold-mapping-service** | `sensor_threshold_map` | Read/Write |
| **alert-evaluation-service** | (none) | Read-only: `temperature_raw` |
| **thresholds-service** | `thresholds` | Read/Write |
| **location-service** | `locations`, `sensors` | Read/Write |
| **realtime-service** | (none) | Read-only: `temperature_raw` |
| **aggregation-service** | (none) | Read-only: `temperature_raw` |

**Principles:**

- Each service has write access only to its own tables
- Other services' tables are read only via HTTP API
- Data consistency is ensured through inter-service communication

---

## 🚀 Implementation Phases

### Phase 1: Core Services (1-2 weeks)

1. **sensor-threshold-mapping-service** implementation
   - Sensor-threshold mapping CRUD
   - Active mapping query API
   - Data migration

2. **alert-service** basic implementation
   - Alert creation API
   - Alert query API
   - sensor-threshold-mapping-service integration

### Phase 2: Subscription and Notification (2-3 weeks)

3. **alert-subscription-service** implementation
   - Subscription CRUD API
   - Location-based matching logic
   - location-service integration

4. **alert-notification-service** implementation

   - Notification delivery engine (email/SMS)
   - Delivery history management
   - Retry logic

### Phase 3: Threshold Validation Worker (1-2 weeks)

5. **alert-evaluation-service** implementation
   - Background scheduler/worker
   - temperature_raw data scan logic
   - Threshold exceedance detection algorithm
   - alert-service integration

### Phase 4: Integration and Optimization (1-2 weeks)

6. **realtime-service** cleanup
   - Remove threshold validation logic (move to alert-evaluation-service)
   - Simplify API to read-only

7. **Monitoring and Optimization**

   - Monitoring setup for each service
   - Performance tuning
   - Error handling improvements
   - alert-evaluation-service execution interval optimization

---

## 🔧 Technology Stack (unchanged)

- **Backend**: Python/FastAPI
- **Database**: PostgreSQL (schema separation per service)
- **Container**: Docker
- **Orchestration**: Kubernetes (Kind)
- **Service Communication**: HTTP/REST (httpx.AsyncClient)
- **API Documentation**: OpenAPI/Swagger

---

## 📊 Kubernetes Deployment Structure

```text
flet_montrg/
├── k8s/
│   ├── alert/                    # alert-service
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   ├── hpa.yaml
│   │   └── network-policy.yaml
│   ├── alert-subscription/       # alert-subscription-service
│   ├── alert-notification/       # alert-notification-service
│   ├── sensor-threshold-mapping/ # sensor-threshold-mapping-service
│   └── alert-evaluation/         # alert-evaluation-service (worker)
```

---

## 🎯 Benefits

1. **Scalability**: Scale only notification-service when notification volume is high
2. **Maintainability**: Each service can be developed and deployed independently
3. **Fault Isolation**: Impact of one service failure on others is minimized
4. **Team Separation**: Different teams can own different services
5. **Testability**: Each service can be tested independently

---

## ⚠️ Considerations

1. **Distributed Transactions**: Consistency between alert creation and notification delivery
   - Solution: Consider event-driven architecture or Saga pattern

2. **Inter-service Dependencies**: Avoid circular dependencies
   - Solution: Maintain unidirectional flow (realtime → alert → notification)

3. **Data Consistency**: Consistency across multiple services
   - Solution: Accept event sourcing or eventual consistency

4. **Performance**: HTTP call overhead between services
   - Solution: Async processing, caching, batch processing

---

## 📝 Next Steps

1. Detailed API spec for each service
2. Finalize database schema and migration
3. Define inter-service communication protocol
4. Define error handling and retry strategy
5. Define monitoring and logging strategy

---

## 🔧 Database Schema Changes

### sensor_threshold_map Table Changes

**Changes:**

```sql
-- Drop legacy column
ALTER TABLE flet_montrg.sensor_threshold_map 
DROP COLUMN IF EXISTS duration_hours;

-- Add new column (seconds)
ALTER TABLE flet_montrg.sensor_threshold_map 
ADD COLUMN duration_seconds int4 DEFAULT 60 NOT NULL;

-- Migrate existing data (hours → seconds)
UPDATE flet_montrg.sensor_threshold_map 
SET duration_seconds = duration_hours * 3600 
WHERE duration_hours IS NOT NULL;

-- Keep existing indexes (sensor_id, threshold_id)
```

**Updated Schema:**

```sql
CREATE TABLE flet_montrg.sensor_threshold_map (
    map_id bigserial NOT NULL,
    sensor_id varchar(50) NOT NULL,
    threshold_id int4 NOT NULL,
    duration_seconds int4 DEFAULT 60 NOT NULL,  -- ⭐ Updated: seconds
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

-- Indexes
CREATE INDEX idx_stm_effective ON flet_montrg.sensor_threshold_map 
    USING btree (effective_from, effective_to);
CREATE INDEX idx_stm_enabled ON flet_montrg.sensor_threshold_map 
    USING btree (enabled);
CREATE INDEX idx_stm_sensor ON flet_montrg.sensor_threshold_map 
    USING btree (sensor_id);
CREATE INDEX idx_stm_threshold ON flet_montrg.sensor_threshold_map 
    USING btree (threshold_id);
```

**duration_seconds Usage Example:**

```python
# 1 second = 1
# 1 minute = 60
# 5 minutes = 300
# 10 minutes = 600
# 30 minutes = 1800
# 1 hour = 3600
# 24 hours = 86400

# API request example
POST /api/v1/mappings
{
    "sensor_id": "S001",
    "threshold_id": 123,
    "duration_seconds": 300,  # Alert triggered after 5 minutes of exceedance
    "enabled": true,
    "effective_from": "2025-01-01T00:00:00Z",
    "effective_to": null
}
```
