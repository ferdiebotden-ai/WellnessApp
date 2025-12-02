#!/bin/bash
# =============================================================================
# Android Development Setup Verification
# =============================================================================
# Checks all prerequisites for Android development in WSL2.
# Run this script to diagnose setup issues.
#
# Usage: ./check-android-setup.sh
# =============================================================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}========================================"
echo "  Android Development Setup Check"
echo "========================================${NC}"
echo ""

ISSUES_FOUND=0

# -----------------------------------------------------------------------------
# Check 1: WSL2 Mirrored Networking
# -----------------------------------------------------------------------------
echo -e "${CYAN}[1/4] WSL2 Networking Mode${NC}"

# Find the Windows username and check .wslconfig
WINDOWS_USER=$(cmd.exe /c "echo %USERNAME%" 2>/dev/null | tr -d '\r\n')
WSLCONFIG_PATH="/mnt/c/Users/$WINDOWS_USER/.wslconfig"

if [ -f "$WSLCONFIG_PATH" ]; then
    if grep -qi "networkingMode.*=.*mirrored" "$WSLCONFIG_PATH" 2>/dev/null; then
        echo -e "  ${GREEN}Mirrored networking: ENABLED${NC}"
    else
        echo -e "  ${RED}Mirrored networking: NOT CONFIGURED${NC}"
        echo -e "  ${YELLOW}Fix: Add the following to $WSLCONFIG_PATH:${NC}"
        echo "       [wsl2]"
        echo "       networkingMode=mirrored"
        echo "       Then run: wsl --shutdown (in PowerShell)"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "  ${RED}.wslconfig: NOT FOUND${NC}"
    echo -e "  ${YELLOW}Fix: Create $WSLCONFIG_PATH with:${NC}"
    echo "       [wsl2]"
    echo "       networkingMode=mirrored"
    echo "       Then run: wsl --shutdown (in PowerShell)"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# -----------------------------------------------------------------------------
# Check 2: ADB Server Running
# -----------------------------------------------------------------------------
echo -e "${CYAN}[2/4] ADB Server Status${NC}"

if command -v nc &> /dev/null; then
    if nc -z 127.0.0.1 5037 2>/dev/null; then
        echo -e "  ${GREEN}ADB server: RUNNING${NC}"
    else
        echo -e "  ${RED}ADB server: NOT RUNNING${NC}"
        echo -e "  ${YELLOW}Fix: Start Android Studio and launch an emulator${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "  ${YELLOW}Cannot check (netcat not installed)${NC}"
    echo -e "  ${YELLOW}Install with: sudo apt install netcat-openbsd${NC}"
fi
echo ""

# -----------------------------------------------------------------------------
# Check 3: Connected Devices
# -----------------------------------------------------------------------------
echo -e "${CYAN}[3/4] Connected Devices${NC}"

# Set ADB socket for mirrored networking
export ADB_SERVER_SOCKET=tcp:127.0.0.1:5037

if nc -z 127.0.0.1 5037 2>/dev/null; then
    # Try to get device list
    DEVICES=$(adb devices 2>/dev/null | grep -v "List of devices" | grep -v "^$" | wc -l)

    if [ "$DEVICES" -gt 0 ]; then
        echo -e "  ${GREEN}Emulator: CONNECTED${NC}"
        echo ""
        adb devices 2>/dev/null | grep -v "^$"
    else
        echo -e "  ${RED}Emulator: NO DEVICES FOUND${NC}"
        echo -e "  ${YELLOW}Fix: Launch an AVD from Android Studio Device Manager${NC}"
        ISSUES_FOUND=$((ISSUES_FOUND + 1))
    fi
else
    echo -e "  ${YELLOW}Skipped (ADB server not running)${NC}"
fi
echo ""

# -----------------------------------------------------------------------------
# Check 4: Expo CLI
# -----------------------------------------------------------------------------
echo -e "${CYAN}[4/4] Expo CLI${NC}"

if command -v npx &> /dev/null; then
    EXPO_VERSION=$(npx expo --version 2>/dev/null || echo "not found")
    if [ "$EXPO_VERSION" != "not found" ]; then
        echo -e "  ${GREEN}Expo CLI: v$EXPO_VERSION${NC}"
    else
        echo -e "  ${YELLOW}Expo CLI: Will be installed on first run${NC}"
    fi
else
    echo -e "  ${RED}npx: NOT FOUND${NC}"
    echo -e "  ${YELLOW}Fix: Install Node.js and npm${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi
echo ""

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
echo -e "${CYAN}========================================${NC}"
if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}All checks passed!${NC}"
    echo ""
    echo "You're ready to develop. Run:"
    echo -e "  ${CYAN}npm run start:android${NC}"
    echo "  or"
    echo -e "  ${CYAN}./scripts/start-android.sh${NC}"
else
    echo -e "${RED}$ISSUES_FOUND issue(s) found${NC}"
    echo ""
    echo "Please fix the issues above, then run this check again."
fi
echo -e "${CYAN}========================================${NC}"
echo ""

exit $ISSUES_FOUND
