variable "cluster_name" {
  type        = string
  description = "EKS Cluster Name"
}

variable "environment" {
  type        = string
  description = "Target environment"
}

variable "project_name" {
  type        = string
  description = "Project name"
  default     = "lisan-health"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes control plane version"
  default     = "1.30"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Subnet IDs for cluster and node groups"
}

variable "node_instance_types" {
  type        = list(string)
  description = "EC2 instance types for Kubernetes worker nodes"
  default     = ["t3.medium"]
}

variable "desired_node_count" {
  type        = number
  description = "Desired number of worker nodes"
  default     = 2
}

variable "min_node_count" {
  type        = number
  description = "Minimum number of worker nodes"
  default     = 2
}

variable "max_node_count" {
  type        = number
  description = "Maximum number of worker nodes"
  default     = 8
}
