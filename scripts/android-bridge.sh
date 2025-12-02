#!/bin/bash
# =============================================================================
# Android ADB Bridge for WSL2
# =============================================================================
# Connects WSL2 to the Android emulator running on Windows host via ADB.
# Requires: WSL2 mirrored networking mode enabled in .wslconfig
#
# Usage: source ./android-bridge.sh
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configure ADB to connect to Windows host
# With mirrored networking, localhost points to Windows
export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037

# Check if netcat is available
if ! command -v nc &> /dev/null; then
    echo -e "${YELLOW}Installing netcat for connectivity checks...${NC}"
    sudo apt-get update && sudo apt-get install -y netcat-openbsd
fi

# Check if ADB server is running on Windows
if ! nc -z 127.0.0.1 5037 2>/dev/null; then
    echo -e "${RED}ERROR: ADB server not detected on Windows${NC}"
    echo ""
    echo "Please complete these steps first:"
    echo "  1. Open Android Studio on Windows"
    echo "  2. Go to Device Manager (More Actions > Virtual Device Manager)"
    echo "  3. Start an Android Virtual Device (AVD)"
    echo "  4. Wait for the emulator to fully boot"
    echo ""
    echo "The ADB server starts automatically when you launch an emulator."
    exit 1
fi

echo -e "${GREEN}ADB bridge configured successfully${NC}"
echo ""

# Show connected devices
echo "Connected devices:"
adb devices 2>/dev/null || echo -e "${YELLOW}Note: adb command not found in PATH. Install Android SDK platform-tools in WSL or use Windows adb.${NC}"
