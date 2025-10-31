#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${FIREBASE_ID_TOKEN:-}" ]]; then
  echo "FIREBASE_ID_TOKEN environment variable is required" >&2
  exit 1
fi

if [[ -z "${FUNCTION_URL:-}" ]]; then
  echo "FUNCTION_URL environment variable is required" >&2
  exit 1
fi

curl -sS -X POST \
  -H "Authorization: Bearer ${FIREBASE_ID_TOKEN}" \
  "${FUNCTION_URL}"
