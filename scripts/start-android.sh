#!/bin/bash
# =============================================================================
# Android Development Launcher for WSL2
# =============================================================================
# One-command script to start Expo development with Android emulator.
# Automatically configures ADB bridge and launches Expo.
#
# Usage: ./start-android.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "========================================"
echo "  Apex OS - Android Development"
echo "========================================"
echo ""

# Source the ADB bridge configuration
source "$SCRIPT_DIR/android-bridge.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "Starting Expo development server..."
    echo "The app will automatically open on the connected emulator."
    echo ""
    echo "Hot reload is enabled - changes will reflect automatically."
    echo "Press 'r' to reload, 'j' to open debugger, 'q' to quit."
    echo ""

    cd "$PROJECT_ROOT/client"
    npx expo start --android
fi
