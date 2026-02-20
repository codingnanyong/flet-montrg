# 📊 flet-montrg Project

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-supported-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Kind-326CE5?logo=kubernetes&logoColor=white)](https://kubernetes.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Svelte](https://img.shields.io/badge/Svelte-4+-FF3E00?logo=svelte&logoColor=white)](https://svelte.dev/)
[![Vite](https://img.shields.io/badge/Vite-5+-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

IoT sensor-based apparent temperature data monitoring and notification system.

## 📁 Project Structure

```text
flet-montrg/
├── services/                              # Microservices source code
│   ├── thresholds-service/               # Threshold CRUD API
│   ├── location-service/                 # Sensor location information API
│   ├── realtime-service/                 # Real-time status API
│   ├── aggregation-service/              # Period query API
│   ├── alert-service/                    # Alert creation and management
│   ├── alert-subscription-service/       # Alert subscription management
│   ├── alert-notification-service/       # Notification delivery management
│   ├── sensor-threshold-mapping-service/ # Sensor-threshold mapping management
│   ├── integrated-swagger-service/       # Integrated API documentation and proxy
│   └── web-service/                      # Dashboard Web UI (Svelte + Vite)
├── k8s/                                  # K8s deployment files
│   ├── thresholds/                       # thresholds-service deployment
│   ├── location/                         # location-service deployment
│   ├── realtime/                         # realtime-service deployment
│   ├── aggregation/                      # aggregation-service deployment
│   ├── alert/                            # alert-service deployment
│   ├── alert-subscription/               # alert-subscription-service deployment
│   ├── alert-notification/               # alert-notification-service deployment
│   ├── sensor-threshold-mapping/         # sensor-threshold-mapping-service deployment
│   ├── integrated-swagger/               # integrated-swagger-service deployment
│   └── web-service/                      # web-service (dashboard) deployment
├── scripts/                              # Cluster and deployment scripts
│   ├── recreate-cluster.sh
│   └── redeploy-all.sh
└── README.md                             # Project documentation
```

## 🔌 Service Ports

(순차 배치: 30000 web-service → 30009 sensor-threshold-mapping-service)

### Web & Integrated

- **30000**: web-service (Dashboard Web UI — Overview, Swagger; proxies to integrated-swagger)
- **30001**: integrated-swagger-service (Integrated API documentation and proxy)

### Data Services

- **30002**: thresholds-service (Threshold CRUD API)
- **30003**: location-service (Sensor location information API)
- **30004**: realtime-service (Real-time status API)
- **30005**: aggregation-service (Period query API)

### Alert Services

- **30006**: alert-service (Alert creation and management)
- **30007**: alert-subscription-service (Alert subscription management)
- **30008**: alert-notification-service (Notification delivery management)

### Mapping Services

- **30009**: sensor-threshold-mapping-service (Sensor-threshold mapping management)

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

### Integrated API & Web UI

- **Integrated Documentation**: Integrated Swagger UI for all services (via integrated-swagger-service)
- **API Proxy**: Access all services through a single endpoint (`/api/{resource}/`)
- **Service Discovery**: Kubernetes-based automatic service discovery
- **Dashboard (web-service)**: Svelte-based Web UI — Overview page and embedded Swagger; uses integrated-swagger-service for API proxy

## 🛠️ Technology Stack

- 🐍 **Backend**: Python/FastAPI
- 🌐 **Frontend**: Svelte 4, Vite 5 (web-service)
- 🐳 **Container**: Docker
- ☸️ **Orchestration**: Kubernetes (Kind)
- 📊 **Monitoring**: Kubernetes Dashboard, Prometheus
- 🗄️ **Database**: PostgreSQL + TimeScaleDB

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

# Integrated & Web
cd k8s/integrated-swagger && ./deploy.sh
cd k8s/web-service && ./deploy.sh
```

### Web UI & Integrated API

- **Dashboard (recommended entry)**: http://<K8S_INGRESS>:30012/ — Overview + Swagger (web-service).
- **Integrated Swagger only**: http://<K8S_INGRESS>:30001/ (integrated-swagger-service).
- **Proxy API**: http://<K8S_INGRESS>:30001/api/{resource}/ or via web-service proxy.

| Path                  | Target service                     |
|-----------------------|------------------------------------|
| `/api/thresholds/`    | thresholds-service                 |
| `/api/location/`      | location-service                   |
| `/api/alerts/`        | alert-service                      |
| `/api/subscriptions/` | alert-subscription-service         |
| `/api/notifications/` | alert-notification-service         |
| `/api/mappings/`      | sensor-threshold-mapping-service   |
