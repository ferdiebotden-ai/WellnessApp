terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = ">= 5.0.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.default_region
}

provider "google-beta" {
  project = var.project_id
  region  = var.default_region
}

resource "google_project" "wellness_os" {
  name            = var.project_name
  project_id      = var.project_id
  org_id          = var.org_id
  billing_account = var.billing_account
}

locals {
  required_apis = [
    "cloudbuild.googleapis.com",
    "cloudfunctions.googleapis.com",
    "firebase.googleapis.com",
    "firestore.googleapis.com",
    "iam.googleapis.com",
    "run.googleapis.com",
    "secretmanager.googleapis.com",
    "storage.googleapis.com"
  ]
}

resource "google_project_service" "enabled" {
  for_each = toset(local.required_apis)
  service  = each.value
  project  = google_project.wellness_os.project_id
  disable_on_destroy = false
}

resource "google_firebase_project" "default" {
  provider = google-beta
  project  = google_project.wellness_os.project_id
  depends_on = [google_project_service.enabled]
}

resource "google_app_engine_application" "default" {
  provider      = google-beta
  project       = google_project.wellness_os.project_id
  location_id   = var.app_engine_location
  database_type = "CLOUD_FIRESTORE"
  depends_on    = [google_firebase_project.default]
}

resource "google_firestore_database" "default" {
  project     = google_project.wellness_os.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"
  depends_on  = [google_app_engine_application.default]
}

resource "google_storage_bucket" "firebase_storage" {
  name                        = "${var.project_id}-firebase-storage"
  location                    = var.default_region
  uniform_bucket_level_access = true
  force_destroy               = false
}

resource "google_service_account" "gcf_runtime" {
  account_id   = "gcf-runtime"
  display_name = "GCF Runtime Service Account"
}

resource "google_project_iam_member" "gcf_invoker" {
  project = google_project.wellness_os.project_id
  role    = "roles/run.invoker"
  member  = "serviceAccount:${google_service_account.gcf_runtime.email}"
}

resource "google_project_iam_member" "gcf_token_creator" {
  project = google_project.wellness_os.project_id
  role    = "roles/iam.serviceAccountTokenCreator"
  member  = "serviceAccount:${google_service_account.gcf_runtime.email}"
}

output "project_number" {
  value = google_project.wellness_os.number
}

data "google_project" "current" {
  project_id = google_project.wellness_os.project_id
  depends_on = [google_project.wellness_os]
}

output "firebase_project_id" {
  value = data.google_project.current.project_id
}
