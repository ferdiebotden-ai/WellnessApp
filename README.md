# Wellness OS Infrastructure Provisioning (Mission 001)

Mission 001 establishes the foundational cloud infrastructure for Wellness OS V3.2. This repository contains infrastructure-as-code, environment configuration templates, and validation scripts that can be executed to provision the required managed services and verify cross-service authentication flows.

## Repository Structure

```
frontend/          # Next.js 14 application scaffold (App Router)
functions/         # Google Cloud Functions source (Node.js 20 + TypeScript)
infra/             # Terraform configuration for GCP + Firebase provisioning
supabase/          # Database migrations, RLS policies, and seeds
scripts/           # Automation scripts for developer tooling
```

## Mission 001 Outcomes

* Terraform templates to provision the GCP project, Firebase services, and supporting IAM roles.
* Firebase Authentication defined as the system IdP with configuration templates for tenant settings.
* Supabase schema + RLS policies wired to Firebase JWT claims via custom JWT minting.
* Reference Google Cloud Function that verifies Firebase JWTs and queries Supabase through RLS.

Follow the documentation inside each directory to deploy the infrastructure in your target environment.

