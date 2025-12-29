#!/bin/bash
# Bash script to fix Metro bundler cache issues
# Run this script: chmod +x fix-cache.sh && ./fix-cache.sh

echo "🧹 Cleaning React Native cache..."

# Stop Metro bundler if running
echo ""
echo "1. Stopping Metro bundler..."
pkill -f "react-native" || true
pkill -f "metro" || true

# Clear Metro cache
echo "2. Clearing Metro bundler cache..."
rm -rf .metro
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear watchman cache
echo "3. Clearing watchman cache..."
watchman watch-del-all 2>/dev/null || true

# Clear npm cache
echo "4. Clearing npm cache..."
npm cache clean --force

# Clear Android build cache
echo "5. Clearing Android build cache..."
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/build

echo ""
echo "✅ Cache cleared successfully!"
echo ""
echo "Next steps:"
echo "1. Delete node_modules folder: rm -rf node_modules"
echo "2. Run: npm install"
echo "3. Run: npx react-native start --reset-cache"

