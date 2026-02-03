# Alert Creation API Examples

> **Note**: All IDs, URLs, and values below are examples only. Replace with your actual service URLs (see MSA_EXTENSION_PROPOSAL.md for port allocation) and IDs from location-service, thresholds-service, and sensor-threshold-mapping-service.

## Real Data-based Examples

### 1. Green Level Alert (Within Normal Range)

```bash
curl -X POST "http://localhost:30006/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "ZONE-101",
    "sensor_id": "SENSOR-Z101",
    "alert_type": "pcv_temperature",
    "alert_level": "green",
    "threshold_id": 10,
    "threshold_type": "pcv_temperature",
    "threshold_level": "green",
    "measured_value": 22.0,
    "threshold_min": 0.00,
    "threshold_max": 28.00,
    "message": "Temperature within normal range (Zone A)"
  }'
```

### 2. Yellow Level Alert (Warning)

```bash
curl -X POST "http://localhost:30006/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "ZONE-102",
    "sensor_id": "SENSOR-Z102",
    "alert_type": "pcv_temperature",
    "alert_level": "yellow",
    "threshold_id": 20,
    "threshold_type": "pcv_temperature",
    "threshold_level": "yellow",
    "measured_value": 31.5,
    "threshold_min": 28.01,
    "threshold_max": 35.00,
    "message": "Temperature in warning range (Zone B)"
  }'
```

### 3. Orange Level Alert (Critical)

```bash
curl -X POST "http://localhost:30006/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "ZONE-103",
    "sensor_id": "SENSOR-Z103",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 30,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 38.2,
    "threshold_min": 35.01,
    "threshold_max": null,
    "message": "Temperature exceeded critical range (Zone C)"
  }'
```

## Python Examples

```python
import requests
from datetime import datetime

BASE_URL = "http://localhost:30006/api/v1/alerts"

# Example sensor and location data (replace with your actual data)
sensors = {
    "ZONE-101": {"sensor_id": "SENSOR-Z101", "area": "Zone A"},
    "ZONE-102": {"sensor_id": "SENSOR-Z102", "area": "Zone B"},
    "ZONE-103": {"sensor_id": "SENSOR-Z103", "area": "Zone C"},
    "ZONE-104": {"sensor_id": "SENSOR-Z104", "area": "Zone D"},
}

# Example threshold configuration
thresholds = {
    10: {"type": "pcv_temperature", "level": "green", "min": 0.00, "max": 28.00},
    20: {"type": "pcv_temperature", "level": "yellow", "min": 28.01, "max": 35.00},
    30: {"type": "pcv_temperature", "level": "orange", "min": 35.01, "max": None},
}

def create_alert(loc_id, measured_value, threshold_id):
    """Create alert"""
    sensor = sensors[loc_id]
    threshold = thresholds[threshold_id]
    
    # Select appropriate threshold based on measured value
    if measured_value <= 28.00:
        threshold_id = 10
        alert_level = "green"
    elif measured_value <= 35.00:
        threshold_id = 20
        alert_level = "yellow"
    else:
        threshold_id = 30
        alert_level = "orange"
    
    threshold = thresholds[threshold_id]
    
    data = {
        "loc_id": loc_id,
        "sensor_id": sensor["sensor_id"],
        "alert_type": "pcv_temperature",
        "alert_level": alert_level,
        "threshold_id": threshold_id,
        "threshold_type": threshold["type"],
        "threshold_level": threshold["level"],
        "measured_value": float(measured_value),
        "threshold_min": threshold["min"],
        "threshold_max": threshold["max"],
        "message": f"Temperature alert: {sensor['area']} - Measured: {measured_value}°C"
    }
    
    response = requests.post(BASE_URL, json=data)
    return response.json()

# Usage example
# create_alert("ZONE-101", 22.0, 10)  # Green
# create_alert("ZONE-102", 31.5, 20)  # Yellow
# create_alert("ZONE-103", 38.2, 30)  # Orange
```

## JavaScript Examples

```javascript
const BASE_URL = "http://localhost:30006/api/v1/alerts";

const sensors = {
  "ZONE-101": { sensor_id: "SENSOR-Z101", area: "Zone A" },
  "ZONE-102": { sensor_id: "SENSOR-Z102", area: "Zone B" },
  "ZONE-103": { sensor_id: "SENSOR-Z103", area: "Zone C" },
  "ZONE-104": { sensor_id: "SENSOR-Z104", area: "Zone D" },
};

const thresholds = {
  10: { type: "pcv_temperature", level: "green", min: 0.00, max: 28.00 },
  20: { type: "pcv_temperature", level: "yellow", min: 28.01, max: 35.00 },
  30: { type: "pcv_temperature", level: "orange", min: 35.01, max: null },
};

function createAlert(locId, measuredValue) {
  let thresholdId, alertLevel;
  
  if (measuredValue <= 28.00) {
    thresholdId = 10;
    alertLevel = "green";
  } else if (measuredValue <= 35.00) {
    thresholdId = 20;
    alertLevel = "yellow";
  } else {
    thresholdId = 30;
    alertLevel = "orange";
  }
  
  const threshold = thresholds[thresholdId];
  const sensor = sensors[locId];
  
  const data = {
    loc_id: locId,
    sensor_id: sensor.sensor_id,
    alert_type: "pcv_temperature",
    alert_level: alertLevel,
    threshold_id: thresholdId,
    threshold_type: threshold.type,
    threshold_level: threshold.level,
    measured_value: measuredValue,
    threshold_min: threshold.min,
    threshold_max: threshold.max,
    message: `Temperature alert: ${sensor.area} - Measured: ${measuredValue}°C`
  };
  
  return fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(response => response.json())
    .then(data => {
      console.log("Alert created:", data);
      return data;
    });
}

// Usage example
// createAlert("ZONE-101", 22.0);  // Green
// createAlert("ZONE-102", 31.5);  // Yellow
// createAlert("ZONE-103", 38.2);  // Orange
```

## Per-Sensor Examples

### SENSOR-Z101 - Zone A (Factory-X, Building-A, 1F)

```json
{
  "loc_id": "ZONE-101",
  "sensor_id": "SENSOR-Z101",
  "alert_type": "pcv_temperature",
  "alert_level": "green",
  "threshold_id": 10,
  "threshold_type": "pcv_temperature",
  "threshold_level": "green",
  "measured_value": 23.5,
  "threshold_min": 0.00,
  "threshold_max": 28.00,
  "message": "Zone A temperature normal"
}
```

### SENSOR-Z102 - Zone B (Factory-X, Building-A, 2F)

```json
{
  "loc_id": "ZONE-102",
  "sensor_id": "SENSOR-Z102",
  "alert_type": "pcv_temperature",
  "alert_level": "yellow",
  "threshold_id": 20,
  "threshold_type": "pcv_temperature",
  "threshold_level": "yellow",
  "measured_value": 31.0,
  "threshold_min": 28.01,
  "threshold_max": 35.00,
  "message": "Zone B temperature warning"
}
```

### SENSOR-Z103 - Zone C (Factory-X, Building-B, 1F)

```json
{
  "loc_id": "ZONE-103",
  "sensor_id": "SENSOR-Z103",
  "alert_type": "pcv_temperature",
  "alert_level": "orange",
  "threshold_id": 30,
  "threshold_type": "pcv_temperature",
  "threshold_level": "orange",
  "measured_value": 36.5,
  "threshold_min": 35.01,
  "threshold_max": null,
  "message": "Zone C temperature critical"
}
```

### SENSOR-Z104 - Zone D (Factory-X, Building-B, 2F)

```json
{
  "loc_id": "ZONE-104",
  "sensor_id": "SENSOR-Z104",
  "alert_type": "pcv_temperature",
  "alert_level": "orange",
  "threshold_id": 30,
  "threshold_type": "pcv_temperature",
  "threshold_level": "orange",
  "measured_value": 37.0,
  "threshold_min": 35.01,
  "threshold_max": null,
  "message": "Zone D temperature critical"
}
```

## Threshold Criteria (Example)

- **Green (threshold_id: 10)**: 0.00 ~ 28.00°C
- **Yellow (threshold_id: 20)**: 28.01 ~ 35.00°C
- **Orange (threshold_id: 30)**: 35.01°C and above

## Sensor-Threshold Mapping Information

Each sensor is typically mapped to **Yellow** and **Orange** thresholds. The following is a simplified example mapping.

### threshold_map_id by Sensor (Example)

| Sensor ID | Yellow (threshold_id: 20) | Orange (threshold_id: 30) |
| ------ | ------ | ------ |
| SENSOR-Z101 | map_id: 101 | map_id: 102 |
| SENSOR-Z102 | map_id: 103 | map_id: 104 |
| SENSOR-Z103 | map_id: 105 | map_id: 106 |
| SENSOR-Z104 | map_id: 107 | map_id: 108 |

**Note**: Replace with your actual mapping from sensor-threshold-mapping-service.

## Examples Including threshold_map_id

### Yellow Level Alert (with threshold_map_id)

```bash
curl -X POST "http://localhost:30006/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "ZONE-101",
    "sensor_id": "SENSOR-Z101",
    "alert_type": "pcv_temperature",
    "alert_level": "yellow",
    "threshold_id": 20,
    "threshold_map_id": 101,
    "threshold_type": "pcv_temperature",
    "threshold_level": "yellow",
    "measured_value": 31.0,
    "threshold_min": 28.01,
    "threshold_max": 35.00,
    "message": "Temperature in warning range (Zone A)"
  }'
```

### Orange Level Alert (with threshold_map_id)

```bash
curl -X POST "http://localhost:30006/api/v1/alerts" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "ZONE-101",
    "sensor_id": "SENSOR-Z101",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 30,
    "threshold_map_id": 102,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 37.5,
    "threshold_min": 35.01,
    "threshold_max": null,
    "message": "Temperature exceeded critical range (Zone A)"
  }'
```

## Python Example (with threshold_map_id)

```python
import requests

BASE_URL = "http://localhost:30006/api/v1/alerts"

# Example: Sensor-Threshold mapping (from sensor-threshold-mapping-service)
SENSOR_THRESHOLD_MAP = {
    "SENSOR-Z101": {"yellow": 101, "orange": 102},
    "SENSOR-Z102": {"yellow": 103, "orange": 104},
    "SENSOR-Z103": {"yellow": 105, "orange": 106},
    "SENSOR-Z104": {"yellow": 107, "orange": 108},
}

def create_alert_with_map(sensor_id, loc_id, measured_value, area_name):
    """Create alert including threshold_map_id"""
    # Select threshold based on measured value
    if measured_value <= 28.00:
        threshold_id = 10
        alert_level = "green"
        threshold_map_id = None  # Green has no mapping
    elif measured_value <= 35.00:
        threshold_id = 20
        alert_level = "yellow"
        threshold_map_id = SENSOR_THRESHOLD_MAP[sensor_id]["yellow"]
    else:
        threshold_id = 30
        alert_level = "orange"
        threshold_map_id = SENSOR_THRESHOLD_MAP[sensor_id]["orange"]
    
    thresholds = {
        10: {"type": "pcv_temperature", "level": "green", "min": 0.00, "max": 28.00},
        20: {"type": "pcv_temperature", "level": "yellow", "min": 28.01, "max": 35.00},
        30: {"type": "pcv_temperature", "level": "orange", "min": 35.01, "max": None},
    }
    
    threshold = thresholds[threshold_id]
    
    data = {
        "loc_id": loc_id,
        "sensor_id": sensor_id,
        "alert_type": "pcv_temperature",
        "alert_level": alert_level,
        "threshold_id": threshold_id,
        "threshold_map_id": threshold_map_id,
        "threshold_type": threshold["type"],
        "threshold_level": threshold["level"],
        "measured_value": float(measured_value),
        "threshold_min": threshold["min"],
        "threshold_max": threshold["max"],
        "message": f"Temperature alert: {area_name} - Measured: {measured_value}°C"
    }
    
    response = requests.post(BASE_URL, json=data)
    return response.json()

# Usage example
# create_alert_with_map("SENSOR-Z101", "ZONE-101", 31.0, "Zone A")  # Yellow
# create_alert_with_map("SENSOR-Z101", "ZONE-101", 37.5, "Zone A")  # Orange
```

## Available Sensor ID List

- Use sensor IDs and loc_ids from your location-service
- Each sensor is typically mapped to Yellow and Orange thresholds in sensor-threshold-mapping-service

---

## Notification Creation API Examples

### POST /api/v1/notifications/ Call Examples

#### 1. cURL Example

```bash
curl -X POST "http://localhost:30008/api/v1/notifications/send" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": 999,
    "subscription_ids": [101, 102],
    "notify_type": "email",
    "notify_id": "operator@example.org"
  }'
```

#### 2. Python (requests) Example

```python
import requests

url = "http://localhost:30008/api/v1/notifications/send"
headers = {"Content-Type": "application/json"}

data = {
    "alert_id": 999,
    "subscription_ids": [101, 102],
    "notify_type": "email",
    "notify_id": "operator@example.org"
}

response = requests.post(url, json=data, headers=headers)
print(response.status_code)
print(response.json())
```

#### 3. JavaScript (fetch) Example

```javascript
const url = "http://localhost:30008/api/v1/notifications/send";

const data = {
  alert_id: 999,
  subscription_ids: [101, 102],
  notify_type: "email",
  notify_id: "operator@example.org"
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(data)
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error("Error:", error));
```

## Examples by Notification Type

### Email Notification

```json
{
  "alert_id": 999,
  "subscription_ids": [101, 102],
  "notify_type": "email",
  "notify_id": "monitor@example.org"
}
```

### KakaoTalk Notification

```json
{
  "alert_id": 999,
  "subscription_ids": [101],
  "notify_type": "kakao",
  "notify_id": "sample_kakao_id"
}
```

### SMS Notification

```json
{
  "alert_id": 999,
  "subscription_ids": [101],
  "notify_type": "sms",
  "notify_id": "555-0199"
}
```

### App Notification

```json
{
  "alert_id": 999,
  "subscription_ids": [101],
  "notify_type": "app",
  "notify_id": "app_user_001"
}
```

## Real-world Usage Example

### Create Notification After Alert Creation

```python
import requests

ALERT_URL = "http://localhost:30006/api/v1/alerts"
NOTIFICATION_URL = "http://localhost:30008/api/v1/notifications/send"

# 1. Create Alert
alert_data = {
    "loc_id": "ZONE-103",
    "sensor_id": "SENSOR-Z103",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 30,
    "threshold_map_id": 106,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 37.0,
    "threshold_min": 35.01,
    "threshold_max": None,
    "message": "Temperature exceeded critical range"
}

alert_response = requests.post(ALERT_URL, json=alert_data)
alert = alert_response.json()
alert_id = alert["alert_id"]

# 2. Send Notification for the Alert
notification_data = {
    "alert_id": alert_id,
    "subscription_ids": [101, 102],  # Replace with actual subscription IDs
    "notify_type": "email",
    "notify_id": "operator@example.org"
}

notification_response = requests.post(NOTIFICATION_URL, json=notification_data)
notification = notification_response.json()
print(f"Notification created: {notification['notification_id']}")
```

## Response Example

```json
{
  "notification_id": 9001,
  "alert_id": 999,
  "subscription_id": 101,
  "notify_type": "email",
  "notify_id": "operator@example.org",
  "status": "PENDING",
  "try_count": 0,
  "created_time": "2025-02-03T10:00:00+09:00",
  "last_try_time": null,
  "sent_time": null,
  "fail_reason": null
}
```

## Field Descriptions

**Required fields:**

- `alert_id`: Alert ID (integer) - ID of the created alert
- `subscription_id`: Subscription ID (integer) - subscription_id from alert_subscriptions table
- `notify_type`: Notification type (enum: "email", "kakao", "sms", "app")
- `notify_id`: Notification ID (string)
  - email: Email address
  - kakao: KakaoTalk account name
  - sms: Phone number
  - app: App account name

**Auto-generated fields:**

- `notification_id`: Notification ID (auto-generated)
- `status`: Status (default: "PENDING")
- `try_count`: Retry count (default: 0)
- `created_time`: Creation time (returned in KST)
- `last_try_time`: Last attempt time (initial: null)
- `sent_time`: Sent time (initial: null)
- `fail_reason`: Failure reason (initial: null)

## Testing via Integrated Swagger UI

You can test the `/api/v1/notifications/send` endpoint in the `alert-notification-service` section at `http://localhost:30005/swagger`. Replace host/port with your actual deployment URL.
