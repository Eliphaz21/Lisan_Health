# LisanHealth Infrastructure & DevOps Engineering Guide

Welcome to the **LisanHealth Platform Infrastructure** repository. This folder provides an enterprise-grade, multi-cloud and local orchestration setup adhering to modern SRE and DevOps best practices.

---

## Architecture Topology

```mermaid
graph TD
    subgraph PublicInternet [Public Ingress & DNS]
        DNS[Route53 / Cloudflare DNS]
        IngressController[Nginx Ingress Controller + cert-manager TLS]
    end

    subgraph KubernetesCluster [Production Kubernetes Cluster]
        subgraph Namespaces [Namespace: lisan-health]
            FrontendDeploy[lisan-frontend Deployment (Nginx SPA)]
            BackendDeploy[lisan-backend Deployment (TypeScript Express)]
            ConfigMap[(lisan-config ConfigMap)]
            HPA[HorizontalPodAutoscalers]
        end
    end

    subgraph ObservabilityStack [Monitoring & Telemetry]
        Prometheus[Prometheus Server (15s scrape)]
        Grafana[Grafana Dashboards]
        Alerts[AlertManager: 5xx & p95 latency alerts]
    end

    subgraph GitOpsDelivery [GitOps & Delivery]
        GitHubActions[GitHub Actions CI/CD]
        ArgoCD[ArgoCD GitOps Sync]
    end

    DNS --> IngressController
    IngressController -->|lisanhealth.et| FrontendDeploy
    IngressController -->|api.lisanhealth.et| BackendDeploy
    BackendDeploy --> ConfigMap
    HPA -.-> BackendDeploy
    HPA -.-> FrontendDeploy

    Prometheus -->|Scrape metrics| BackendDeploy
    Grafana --> Prometheus
    Alerts --> Prometheus

    GitHubActions -->|Push Containers & Overlays| ArgoCD
    ArgoCD -->|Sync Manifests| Namespaces
```

---

## Directory Layout

```
infrastructure/
├── k8s/                        # Kubernetes Kustomize manifests
│   ├── base/                  # Core resource definitions (Namespace, Deployments, Services)
│   ├── overlays/              # Environment-specific configuration
│   │   ├── dev/               # NodePort exposure, 1 replica
│   │   └── prod/              # Ingress with TLS, HPA, 3+ replicas
│   └── kind/                  # Local cluster topology
├── helm/                      # Production Helm 3 chart
│   └── lisan-health/
│       ├── Chart.yaml
│       ├── values.yaml        # Baseline values
│       ├── values-dev.yaml    # Local dev overrides
│       ├── values-prod.yaml   # Production overrides
│       └── templates/         # Parametrized Kubernetes resources
├── terraform/                 # Infrastructure as Code (IaC)
│   ├── modules/
│   │   ├── vpc/               # Multi-AZ VPC with public and private subnets
│   │   └── k8s_cluster/       # AWS EKS cluster with managed auto-scaling node groups
│   └── environments/
│       └── prod/              # Production environment root module
├── monitoring/                # Prometheus & Grafana Observability
│   ├── prometheus/            # Scrape configs & alert rules
│   └── grafana/               # Automated datasources & prebuilt overview dashboard
├── gitops/                    # GitOps declarative applications
│   └── argocd/                # ArgoCD Application & AppProject manifests
└── docker/                    # Multi-container Compose setups
    └── docker-compose.monitoring.yml # Local Prometheus + Grafana stack
```

---

## Quick Start Runbooks

### 1. Local Kubernetes Testing with Kind & Kustomize
To spin up a local multi-node Kind cluster and deploy the development overlay:
```powershell
# Using the automation script:
.\scripts\k8s-deploy-local.ps1

# Or manually with kubectl:
kubectl apply -k infrastructure/k8s/overlays/dev
```
Access the application at `http://localhost:3000` and API at `http://localhost:8000`.

---

### 2. Helm Deployment
```bash
# Lint the chart
helm lint infrastructure/helm/lisan-health

# Deploy to staging/development
helm upgrade --install lisan-dev infrastructure/helm/lisan-health \
  -f infrastructure/helm/lisan-health/values-dev.yaml \
  --namespace lisan-health --create-namespace

# Deploy to production with TLS & autoscaling
helm upgrade --install lisan-prod infrastructure/helm/lisan-health \
  -f infrastructure/helm/lisan-health/values-prod.yaml \
  --namespace lisan-health --create-namespace
```

---

### 3. Monitoring & Observability Stack
To run Prometheus and Grafana locally with Docker Compose:
```bash
docker compose -f docker-compose.yml -f infrastructure/docker/docker-compose.monitoring.yml up -d
```
- **Grafana UI:** `http://localhost:3001` (Credentials: `admin` / `admin`)
- **Prometheus UI:** `http://localhost:9090`
- **Preloaded Dashboard:** `LisanHealth Service Observability & SLOs` tracking request rate, p95/p99 latency, error rates, and speech cache hit rates.

---

### 4. Terraform Cloud Provisioning
```bash
cd infrastructure/terraform/environments/prod
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```

---

### 5. GitOps with ArgoCD
Apply the ArgoCD project and applications to your management cluster:
```bash
kubectl apply -f infrastructure/gitops/argocd/project.yaml
kubectl apply -f infrastructure/gitops/argocd/application-dev.yaml
kubectl apply -f infrastructure/gitops/argocd/application-prod.yaml
```
ArgoCD continuously monitors this Git repository and automatically synchronizes cluster state with zero manual drift.
