variable "project_name" {
  type        = string
  description = "Project identifier"
  default     = "lisan-health"
}

variable "environment" {
  type        = string
  description = "Deployment environment (dev, staging, prod)"
}

variable "cidr_block" {
  type        = string
  description = "VPC CIDR block"
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "List of availability zones for multi-AZ topology"
  default     = ["af-south-1a", "af-south-1b"]
}

variable "cluster_name" {
  type        = string
  description = "Kubernetes cluster name for subnet tagging"
  default     = "lisan-health-cluster"
}
