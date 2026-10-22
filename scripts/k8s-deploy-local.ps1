# LisanHealth Local Kubernetes (Kind) Deployment Script
# PowerShell helper to spin up a Kind cluster and apply manifests

param (
    [string]$ClusterName = "lisan-health-cluster",
    [switch]$Recreate = $false
)

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "  LisanHealth Local Kubernetes Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check prerequisites
$hasKind = Get-Command kind -ErrorAction SilentlyContinue
$hasKubectl = Get-Command kubectl -ErrorAction SilentlyContinue

if (-not $hasKind) {
    Write-Warning "kind CLI is not found in PATH. Please install Kind: https://kind.sigs.k8s.io/"
}
if (-not $hasKubectl) {
    Write-Warning "kubectl CLI is not found in PATH. Please install kubectl: https://kubernetes.io/docs/tasks/tools/"
}

if ($hasKind) {
    $existingCluster = kind get clusters 2>$null | Where-Object { $_ -eq $ClusterName }
    if ($existingCluster -and $Recreate) {
        Write-Host "Deleting existing cluster $ClusterName..." -ForegroundColor Yellow
        kind delete cluster --name $ClusterName
        $existingCluster = $null
    }

    if (-not $existingCluster) {
        Write-Host "Creating Kind cluster '$ClusterName' from infrastructure/k8s/kind/kind-config.yaml..." -ForegroundColor Green
        kind create cluster --config infrastructure/k8s/kind/kind-config.yaml
    } else {
        Write-Host "Kind cluster '$ClusterName' is already running." -ForegroundColor Green
    }
}

if ($hasKubectl) {
    Write-Host "Applying Kubernetes manifests via Kustomize (infrastructure/k8s/overlays/dev/)..." -ForegroundColor Green
    kubectl apply -k infrastructure/k8s/overlays/dev/

    Write-Host "Checking rollout status for lisan-backend..." -ForegroundColor Cyan
    kubectl rollout status deployment/lisan-backend -n lisan-health --timeout=60s

    Write-Host "Checking rollout status for lisan-frontend..." -ForegroundColor Cyan
    kubectl rollout status deployment/lisan-frontend -n lisan-health --timeout=60s

    Write-Host "`nPods running in namespace 'lisan-health':" -ForegroundColor Green
    kubectl get pods -n lisan-health
}

Write-Host "`nLisanHealth Local K8s deployment complete!" -ForegroundColor Cyan
