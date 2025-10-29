variable "project_name" {
  description = "Human readable name for the GCP project"
  type        = string
}

variable "project_id" {
  description = "Globally unique project ID"
  type        = string
}

variable "org_id" {
  description = "Organization ID for project placement"
  type        = string
}

variable "billing_account" {
  description = "Billing account ID"
  type        = string
}

variable "default_region" {
  description = "Primary region for Cloud Functions and Storage"
  type        = string
  default     = "us-central1"
}

variable "app_engine_location" {
  description = "Region for App Engine (required for Firestore)"
  type        = string
  default     = "us-central"
}

variable "firestore_location" {
  description = "Region for Firestore database"
  type        = string
  default     = "us-central"
}
