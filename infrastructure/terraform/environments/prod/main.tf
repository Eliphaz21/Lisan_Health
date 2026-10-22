terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = "prod"
      Project     = "lisan-health"
      ManagedBy   = "Terraform"
    }
  }
}

module "vpc" {
  source             = "../../modules/vpc"
  project_name       = "lisan-health"
  environment        = "prod"
  cidr_block         = "10.100.0.0/16"
  availability_zones = ["af-south-1a", "af-south-1b"]
  cluster_name       = "lisan-health-prod-cluster"
}

module "eks" {
  source              = "../../modules/k8s_cluster"
  project_name        = "lisan-health"
  environment         = "prod"
  cluster_name        = "lisan-health-prod-cluster"
  kubernetes_version  = "1.30"
  subnet_ids          = module.vpc.private_subnet_ids
  node_instance_types = ["t3.large"]
  desired_node_count  = 3
  min_node_count      = 3
  max_node_count      = 12
}
