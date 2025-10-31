# Terraform Provisioning (Mission 001)

The Terraform module provisions the core Google Cloud + Firebase infrastructure required by Wellness OS:

* GCP project with mandated APIs enabled
* Firebase project linkage
* Firestore (native mode) database
* Firebase Storage bucket
* Cloud Functions service account with necessary IAM bindings

## Usage

1. Copy the example variables file and edit with organization-specific values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

2. Initialize and apply Terraform:

```bash
terraform init
terraform plan
terraform apply
```

The project, Firebase resources, and IAM bindings will be created. Firestore is provisioned in native mode using the specified region.

## Post-Provisioning Steps

1. **Firebase Authentication** – Configure sign-in providers and multi-factor requirements inside the Firebase console. Export the JSON configuration and store it in Secret Manager for CI workflows.
2. **Supabase Credentials** – Store Supabase service role keys and JWT secret in Secret Manager for Cloud Functions to consume.
3. **Cloud Functions Deployment** – Deploy the `test-auth` function with the IAM service account created by Terraform.

