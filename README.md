# 📊 flet-montrg Project

IoT sensor-based apparent temperature data monitoring and notification system

## 📁 Project Structure

```text
flet_montrg/
├── services/                              # Microservices source code
│   ├── thresholds-service/              # Threshold CRUD API
│   ├── location-service/                 # Sensor location information API
│   ├── realtime-service/                 # Real-time status API
│   ├── aggregation-service/             # Period query API
│   ├── alert-service/                    # Alert creation and management
│   ├── alert-subscription-service/      # Alert subscription management
│   ├── alert-notification-service/       # Notification delivery management
│   ├── sensor-threshold-mapping-service/ # Sensor-threshold mapping management
│   └── integrated-swagger-service/       # Integrated API documentation and proxy
├── k8s/                                  # K8s deployment files
│   ├── thresholds/                       # thresholds-service deployment
│   ├── location/                         # location-service deployment
│   ├── realtime/                         # realtime-service deployment
│   ├── aggregation/                      # aggregation-service deployment
│   ├── alert/                            # alert-service deployment
│   ├── alert-subscription/                # alert-subscription-service deployment
│   ├── alert-notification/                # alert-notification-service deployment
│   ├── sensor-threshold-mapping/          # sensor-threshold-mapping-service deployment
│   └── integrated-swagger/                # integrated-swagger-service deployment
├── config/                               # Common configuration files
└── README.md                             # Project documentation
```

## 🔌 Service Ports

### Data Services

- **30001**: thresholds-service (Threshold CRUD API)
- **30002**: location-service (Sensor location information API)
- **30003**: realtime-service (Real-time status API)
- **30004**: aggregation-service (Period query API)

### Alert Services

- **30007**: alert-service (Alert creation and management)
- **30008**: alert-subscription-service (Alert subscription management)
- **30009**: alert-notification-service (Notification delivery management)

### Mapping Services

- **30011**: sensor-threshold-mapping-service (Sensor-threshold mapping management)

### Integrated Services

- **30005**: integrated-swagger-service (Integrated API documentation and proxy)

## 🎯 Key Features

### Data Management

- **Threshold Management**: Set and query thresholds per sensor
- **Location Information**: Manage sensor location hierarchy (factory > building > floor > area)
- **Real-time Monitoring**: Query current sensor data
- **Period Aggregation**: Time-based data aggregation and analysis

### Alert System

- **Alert Generation**: Automatic alert generation when thresholds are exceeded
- **Subscription Management**: Alert subscription settings by location/sensor/threshold type
- **Notification Delivery**: Automatic notification generation and delivery management per subscriber
- **Hierarchical Matching**: Subscription matching based on factory > building > floor > area hierarchy

### Mapping Management

- **Sensor-Threshold Mapping**: Set applicable thresholds per sensor
- **Validity Period Management**: Set mapping valid start/end times
- **Activation Control**: Manage mapping activation/deactivation

### Integrated API

- **Integrated Documentation**: Provide integrated Swagger UI for all services
- **API Proxy**: Access all services through a single endpoint
- **Service Discovery**: Kubernetes-based automatic service discovery

## 🛠️ Technology Stack

- 🐍 **Backend**: Python/FastAPI
- 🐳 **Container**: Docker
- ☸️ **Orchestration**: Kubernetes (Kind)
- 📊 **Monitoring**: Kubernetes Dashboard, Prometheus
- 🗄️ **Database**: PostgreSQL

## 🧭 Development Environment

- **K8s Cluster**: Kind (flet-cluster)
- **Dashboard**: https://<K8S_INGRESS>:8083/
- **namespace**: flet-montrg

## 🚀 Deployment Method

### Individual Service Deployment

You can deploy using the `deploy.sh` script in each service directory:

```bash
# Data Services
cd k8s/thresholds && ./deploy.sh
cd k8s/location && ./deploy.sh
cd k8s/realtime && ./deploy.sh
cd k8s/aggregation && ./deploy.sh

# Alert Services
cd k8s/alert && ./deploy.sh
cd k8s/alert-subscription && ./deploy.sh
cd k8s/alert-notification && ./deploy.sh

# Mapping Services
cd k8s/sensor-threshold-mapping && ./deploy.sh

# Integrated Services
cd k8s/integrated-swagger && ./deploy.sh
```

### Integrated API Documentation

All service APIs can be accessed through the integrated Swagger UI:

- **Swagger UI**: http://<K8S_INGRESS>:30005/
- **Proxy API**: http://<K8S_INGRESS>:30005/api/{resource}/

Examples:

- `/api/thresholds/` → thresholds-service
- `/api/location/` → location-service
- `/api/alerts/` → alert-service
- `/api/subscriptions/` → alert-subscription-service
- `/api/notifications/` → alert-notification-service
- `/api/mappings/` → sensor-threshold-mapping-service
