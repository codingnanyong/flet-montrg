# 🔔 Alert & notification API examples

## 📊 Alert create API — real-world samples

### 1. 🟢 Green level (within normal range)

```bash
curl -X POST "http://localhost:30007/api/v1/alerts/" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "A011",
    "sensor_id": "TEMPIOT-A011",
    "alert_type": "pcv_temperature",
    "alert_level": "green",
    "threshold_id": 1,
    "threshold_type": "pcv_temperature",
    "threshold_level": "green",
    "measured_value": 25.5,
    "threshold_min": 0.00,
    "threshold_max": 30.90,
    "message": "Temperature within normal range (materials warehouse)"
  }'
```

### 2. 🟡 Yellow level (warning)

```bash
curl -X POST "http://localhost:30007/api/v1/alerts/" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "A015",
    "sensor_id": "TEMPIOT-A015",
    "alert_type": "pcv_temperature",
    "alert_level": "yellow",
    "threshold_id": 2,
    "threshold_type": "pcv_temperature",
    "threshold_level": "yellow",
    "measured_value": 32.0,
    "threshold_min": 31.00,
    "threshold_max": 32.90,
    "message": "Temperature in warning range (HF workshop)"
  }'
```

### 3. 🟠 Orange level (critical)

```bash
curl -X POST "http://localhost:30007/api/v1/alerts/" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "A027",
    "sensor_id": "TEMPIOT-A027",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 3,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 35.5,
    "threshold_min": 33.00,
    "threshold_max": null,
    "message": "Temperature exceeded critical threshold (CTM line 1)"
  }'
```

## 🐍 Python example

```python
import requests
from datetime import datetime

BASE_URL = "http://localhost:30007/api/v1/alerts/"

# Sample sensors & locations
sensors = {
    "A011": {"sensor_id": "TEMPIOT-A011", "area": "Materials warehouse"},
    "A015": {"sensor_id": "TEMPIOT-A015", "area": "HF workshop"},
    "A027": {"sensor_id": "TEMPIOT-A027", "area": "[3P] CTM line 1"},
    "A034": {"sensor_id": "TEMPIOT-A034", "area": "Spray booth"},
}

thresholds = {
    1: {"type": "pcv_temperature", "level": "green", "min": 0.00, "max": 30.90},
    2: {"type": "pcv_temperature", "level": "yellow", "min": 31.00, "max": 32.90},
    3: {"type": "pcv_temperature", "level": "orange", "min": 33.00, "max": None},
}

def create_alert(loc_id, measured_value, threshold_id):
    """Create an alert from measured value."""
    sensor = sensors[loc_id]

    if measured_value <= 30.90:
        threshold_id = 1
        alert_level = "green"
    elif measured_value <= 32.90:
        threshold_id = 2
        alert_level = "yellow"
    else:
        threshold_id = 3
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
        "message": f"Temperature alert: {sensor['area']} — reading {measured_value}°C"
    }

    response = requests.post(BASE_URL, json=data)
    return response.json()

# create_alert("A011", 25.5, 1)  # Green
# create_alert("A015", 32.0, 2)  # Yellow
# create_alert("A027", 35.5, 3)  # Orange
```

## 📜 JavaScript example

```javascript
const BASE_URL = "http://localhost:30007/api/v1/alerts/";

const sensors = {
  A011: { sensor_id: "TEMPIOT-A011", area: "Materials warehouse" },
  A015: { sensor_id: "TEMPIOT-A015", area: "HF workshop" },
  A027: { sensor_id: "TEMPIOT-A027", area: "[3P] CTM line 1" },
  A034: { sensor_id: "TEMPIOT-A034", area: "Spray booth" },
};

const thresholds = {
  1: { type: "pcv_temperature", level: "green", min: 0.0, max: 30.9 },
  2: { type: "pcv_temperature", level: "yellow", min: 31.0, max: 32.9 },
  3: { type: "pcv_temperature", level: "orange", min: 33.0, max: null },
};

function createAlert(locId, measuredValue) {
  let thresholdId, alertLevel;

  if (measuredValue <= 30.9) {
    thresholdId = 1;
    alertLevel = "green";
  } else if (measuredValue <= 32.9) {
    thresholdId = 2;
    alertLevel = "yellow";
  } else {
    thresholdId = 3;
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
    message: `Temperature alert: ${sensor.area} — reading ${measuredValue}°C`,
  };

  return fetch(BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log("Alert created:", data);
      return data;
    });
}
```

## 📍 Per-sensor JSON samples

### A011 — Materials warehouse (CSI, SinPyeong, MX-1, 1F)

```json
{
  "loc_id": "A011",
  "sensor_id": "TEMPIOT-A011",
  "alert_type": "pcv_temperature",
  "alert_level": "green",
  "threshold_id": 1,
  "threshold_type": "pcv_temperature",
  "threshold_level": "green",
  "measured_value": 22.5,
  "threshold_min": 0.0,
  "threshold_max": 30.9,
  "message": "Materials warehouse temperature OK"
}
```

### A015 — HF workshop (CSI, SinPyeong, MX-1, 2F)

```json
{
  "loc_id": "A015",
  "sensor_id": "TEMPIOT-A015",
  "alert_type": "pcv_temperature",
  "alert_level": "yellow",
  "threshold_id": 2,
  "threshold_type": "pcv_temperature",
  "threshold_level": "yellow",
  "measured_value": 32.5,
  "threshold_min": 31.0,
  "threshold_max": 32.9,
  "message": "HF workshop temperature warning"
}
```

### A027 — [3P] CTM line 1 (CSI, SinPyeong, PW Center, 1F)

```json
{
  "loc_id": "A027",
  "sensor_id": "TEMPIOT-A027",
  "alert_type": "pcv_temperature",
  "alert_level": "orange",
  "threshold_id": 3,
  "threshold_type": "pcv_temperature",
  "threshold_level": "orange",
  "measured_value": 35.0,
  "threshold_min": 33.0,
  "threshold_max": null,
  "message": "CTM line 1 temperature critical"
}
```

### A034 — Spray booth (CSI, JangNim, Bottom, 1F)

```json
{
  "loc_id": "A034",
  "sensor_id": "TEMPIOT-A034",
  "alert_type": "pcv_temperature",
  "alert_level": "orange",
  "threshold_id": 3,
  "threshold_type": "pcv_temperature",
  "threshold_level": "orange",
  "measured_value": 34.5,
  "threshold_min": 33.0,
  "threshold_max": null,
  "message": "Spray booth temperature critical"
}
```

## 📏 Threshold bands

- **🟢 Green (threshold_id: 1)**: 0.00 ~ 30.90°C
- **🟡 Yellow (threshold_id: 2)**: 31.00 ~ 32.90°C
- **🟠 Orange (threshold_id: 3)**: ≥ 33.00°C

## 🔗 Sensor–threshold mapping

Each sensor maps to **Yellow (threshold_id: 2)** and **Orange (threshold_id: 3)**.

### `threshold_map_id` per sensor

| Sensor ID    | Yellow (threshold_id: 2) | Orange (threshold_id: 3) |
| ------------ | ------------------------ | ------------------------ |
| TEMPIOT-A011 | map_id: 1                | map_id: 2                |
| TEMPIOT-A012 | map_id: 3                | map_id: 4                |
| TEMPIOT-A013 | map_id: 5                | map_id: 6                |
| TEMPIOT-A014 | map_id: 7                | map_id: 8                |
| TEMPIOT-A015 | map_id: 9                | map_id: 10               |
| TEMPIOT-A016 | map_id: 11               | map_id: 12               |
| TEMPIOT-A017 | map_id: 13               | map_id: 14               |
| TEMPIOT-A018 | map_id: 15               | map_id: 16               |
| TEMPIOT-A019 | map_id: 17               | map_id: 18               |
| TEMPIOT-A020 | map_id: 19               | map_id: 20               |
| TEMPIOT-A021 | map_id: 21               | map_id: 22               |
| TEMPIOT-A022 | map_id: 23               | map_id: 24               |
| TEMPIOT-A023 | map_id: 25               | map_id: 26               |
| TEMPIOT-A024 | map_id: 27               | map_id: 28               |
| TEMPIOT-A025 | map_id: 29               | map_id: 30               |
| TEMPIOT-A026 | map_id: 31               | map_id: 32               |
| TEMPIOT-A027 | map_id: 33               | map_id: 34               |
| TEMPIOT-A028 | map_id: 35               | map_id: 36               |
| TEMPIOT-A029 | map_id: 37               | map_id: 38               |
| TEMPIOT-A030 | map_id: 39               | map_id: 40               |
| TEMPIOT-A031 | map_id: 41               | map_id: 42               |
| TEMPIOT-A032 | map_id: 43               | map_id: 44               |
| TEMPIOT-A033 | map_id: 45               | map_id: 46               |
| TEMPIOT-A034 | map_id: 47               | map_id: 48               |
| TEMPIOT-A035 | map_id: 49               | map_id: 50               |
| TEMPIOT-A036 | map_id: 51               | map_id: 52               |
| TEMPIOT-A037 | map_id: 53               | map_id: 54               |
| TEMPIOT-A038 | map_id: 55               | map_id: 56               |

**ℹ️ Note:** All mappings use `enabled=true`.

## 📎 Examples including `threshold_map_id`

### 🟡 Yellow alert (with `threshold_map_id`)

```bash
curl -X POST "http://localhost:30007/api/v1/alerts/" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "A011",
    "sensor_id": "TEMPIOT-A011",
    "alert_type": "pcv_temperature",
    "alert_level": "yellow",
    "threshold_id": 2,
    "threshold_map_id": 1,
    "threshold_type": "pcv_temperature",
    "threshold_level": "yellow",
    "measured_value": 32.0,
    "threshold_min": 31.00,
    "threshold_max": 32.90,
    "message": "Temperature in warning range (materials warehouse)"
  }'
```

### 🟠 Orange alert (with `threshold_map_id`)

```bash
curl -X POST "http://localhost:30007/api/v1/alerts/" \
  -H "Content-Type: application/json" \
  -d '{
    "loc_id": "A011",
    "sensor_id": "TEMPIOT-A011",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 3,
    "threshold_map_id": 2,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 35.5,
    "threshold_min": 33.00,
    "threshold_max": null,
    "message": "Temperature exceeded critical threshold (materials warehouse)"
  }'
```

## 🐍 Python — with `threshold_map_id`

```python
import requests

BASE_URL = "http://localhost:30007/api/v1/alerts/"

SENSOR_THRESHOLD_MAP = {
    "TEMPIOT-A011": {"yellow": 1, "orange": 2},
    "TEMPIOT-A012": {"yellow": 3, "orange": 4},
    "TEMPIOT-A013": {"yellow": 5, "orange": 6},
    "TEMPIOT-A014": {"yellow": 7, "orange": 8},
    "TEMPIOT-A015": {"yellow": 9, "orange": 10},
    "TEMPIOT-A016": {"yellow": 11, "orange": 12},
    "TEMPIOT-A017": {"yellow": 13, "orange": 14},
    "TEMPIOT-A018": {"yellow": 15, "orange": 16},
    "TEMPIOT-A019": {"yellow": 17, "orange": 18},
    "TEMPIOT-A020": {"yellow": 19, "orange": 20},
    "TEMPIOT-A021": {"yellow": 21, "orange": 22},
    "TEMPIOT-A022": {"yellow": 23, "orange": 24},
    "TEMPIOT-A023": {"yellow": 25, "orange": 26},
    "TEMPIOT-A024": {"yellow": 27, "orange": 28},
    "TEMPIOT-A025": {"yellow": 29, "orange": 30},
    "TEMPIOT-A026": {"yellow": 31, "orange": 32},
    "TEMPIOT-A027": {"yellow": 33, "orange": 34},
    "TEMPIOT-A028": {"yellow": 35, "orange": 36},
    "TEMPIOT-A029": {"yellow": 37, "orange": 38},
    "TEMPIOT-A030": {"yellow": 39, "orange": 40},
    "TEMPIOT-A031": {"yellow": 41, "orange": 42},
    "TEMPIOT-A032": {"yellow": 43, "orange": 44},
    "TEMPIOT-A033": {"yellow": 45, "orange": 46},
    "TEMPIOT-A034": {"yellow": 47, "orange": 48},
    "TEMPIOT-A035": {"yellow": 49, "orange": 50},
    "TEMPIOT-A036": {"yellow": 51, "orange": 52},
    "TEMPIOT-A037": {"yellow": 53, "orange": 54},
    "TEMPIOT-A038": {"yellow": 55, "orange": 56},
}

def create_alert_with_map(sensor_id, loc_id, measured_value, area_name):
    """Create alert including threshold_map_id."""
    if measured_value <= 30.90:
        threshold_id = 1
        alert_level = "green"
        threshold_map_id = None  # Green: no mapping row
    elif measured_value <= 32.90:
        threshold_id = 2
        alert_level = "yellow"
        threshold_map_id = SENSOR_THRESHOLD_MAP[sensor_id]["yellow"]
    else:
        threshold_id = 3
        alert_level = "orange"
        threshold_map_id = SENSOR_THRESHOLD_MAP[sensor_id]["orange"]

    thresholds = {
        1: {"type": "pcv_temperature", "level": "green", "min": 0.00, "max": 30.90},
        2: {"type": "pcv_temperature", "level": "yellow", "min": 31.00, "max": 32.90},
        3: {"type": "pcv_temperature", "level": "orange", "min": 33.00, "max": None},
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
        "message": f"Temperature alert: {area_name} — reading {measured_value}°C"
    }

    response = requests.post(BASE_URL, json=data)
    return response.json()

# create_alert_with_map("TEMPIOT-A011", "A011", 32.0, "Materials warehouse")
# create_alert_with_map("TEMPIOT-A011", "A011", 35.5, "Materials warehouse")
```

## 📋 Supported sensor IDs

- `TEMPIOT-A011` … `TEMPIOT-A038`
- Each pairs with `loc_id` `A011` … `A038`
- Each maps to Yellow (threshold_id: 2) and Orange (threshold_id: 3)

## 📬 Notification create API examples

### `POST /api/v1/notifications/`

#### 1. cURL

```bash
curl -X POST "http://localhost:30009/api/v1/notifications/" \
  -H "Content-Type: application/json" \
  -d '{
    "alert_id": 1,
    "subscription_id": 1,
    "notify_type": "email",
    "notify_id": "user@example.com"
  }'
```

#### 2. Python (`requests`)

```python
import requests

url = "http://localhost:30009/api/v1/notifications/"
headers = {"Content-Type": "application/json"}

data = {
    "alert_id": 1,
    "subscription_id": 1,
    "notify_type": "email",
    "notify_id": "user@example.com"
}

response = requests.post(url, json=data, headers=headers)
print(response.status_code)
print(response.json())
```

#### 3. JavaScript (`fetch`)

```javascript
const url = "http://localhost:30009/api/v1/notifications/";

const data = {
  alert_id: 1,
  subscription_id: 1,
  notify_type: "email",
  notify_id: "user@example.com",
};

fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
})
  .then((response) => response.json())
  .then((data) => console.log(data))
  .catch((error) => console.error("Error:", error));
```

## 📣 Notify types

### 📧 Email

```json
{
  "alert_id": 1,
  "subscription_id": 1,
  "notify_type": "email",
  "notify_id": "admin@company.com"
}
```

#### 💬 KakaoTalk

```json
{
  "alert_id": 1,
  "subscription_id": 1,
  "notify_type": "kakao",
  "notify_id": "kakao_account_name"
}
```

#### 📱 SMS

```json
{
  "alert_id": 1,
  "subscription_id": 1,
  "notify_type": "sms",
  "notify_id": "010-1234-5678"
}
```

#### 📲 App push

```json
{
  "alert_id": 1,
  "subscription_id": 1,
  "notify_type": "app",
  "notify_id": "app_user_account"
}
```

### 🔗 End-to-end: alert then notification

```python
import requests

ALERT_URL = "http://localhost:30007/api/v1/alerts/"
NOTIFICATION_URL = "http://localhost:30009/api/v1/notifications/"

# 1. Create alert
alert_data = {
    "loc_id": "A011",
    "sensor_id": "TEMPIOT-A011",
    "alert_type": "pcv_temperature",
    "alert_level": "orange",
    "threshold_id": 3,
    "threshold_map_id": 2,
    "threshold_type": "pcv_temperature",
    "threshold_level": "orange",
    "measured_value": 35.5,
    "threshold_min": 33.00,
    "threshold_max": None,
    "message": "Temperature exceeded critical threshold"
}

alert_response = requests.post(ALERT_URL, json=alert_data)
alert = alert_response.json()
alert_id = alert["alert_id"]

# 2. Create notification for that alert
notification_data = {
    "alert_id": alert_id,
    "subscription_id": 1,
    "notify_type": "email",
    "notify_id": "admin@company.com"
}

notification_response = requests.post(NOTIFICATION_URL, json=notification_data)
notification = notification_response.json()
print(f"Notification created: {notification['notification_id']}")
```

### 📤 Sample response

```json
{
  "notification_id": 1,
  "alert_id": 1,
  "subscription_id": 1,
  "notify_type": "email",
  "notify_id": "user@example.com",
  "status": "PENDING",
  "try_count": 0,
  "created_time": "2024-01-23T17:00:00+09:00",
  "last_try_time": null,
  "sent_time": null,
  "fail_reason": null
}
```

### 📝 Field reference

**Required:**

- `alert_id` (int) — ID of the created alert
- `subscription_id` (int) — `subscription_id` in `alert_subscriptions`
- `notify_type` — one of `"email"`, `"kakao"`, `"sms"`, `"app"`
- `notify_id` (string) — channel-specific identifier:
  - **email:** address
  - **kakao:** Kakao account id / name
  - **sms:** phone number
  - **app:** app user id

**Auto-filled:**

- `notification_id`
- `status` (default `"PENDING"`)
- `try_count` (default `0`)
- `created_time` (KST in responses)
- `last_try_time`, `sent_time`, `fail_reason` (nullable)

### 🧪 Try in integrated Swagger UI

Open `http://localhost:30005/swagger` → **alert-notification-service** → `POST /api/v1/notifications/`.
