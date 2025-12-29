# 🔧 Fix Metro Bundler Syntax Error

## Error You're Seeing
```
SyntaxError: Missing semicolon. (358:1)
at node_modules\react-native\index.js:358:1
```

## ✅ Quick Fix (5 minutes)

### Step 1: Stop Metro Bundler
Press `Ctrl+C` in the terminal where Metro is running

### Step 2: Clear All Caches

**Windows (PowerShell):**
```powershell
cd AwesomeProject

# Clear Metro cache
Remove-Item -Recurse -Force .metro -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force $env:TEMP\metro-* -ErrorAction SilentlyContinue

# Clear npm cache
npm cache clean --force

# Clear Android build
Remove-Item -Recurse -Force android\app\build -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force android\.gradle -ErrorAction SilentlyContinue
```

**Mac/Linux:**
```bash
cd AwesomeProject

# Clear Metro cache
rm -rf .metro
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear watchman (if installed)
watchman watch-del-all

# Clear npm cache
npm cache clean --force

# Clear Android build
rm -rf android/app/build
rm -rf android/.gradle
```

### Step 3: Delete node_modules and Reinstall
```bash
# Delete node_modules
rm -rf node_modules
# or on Windows PowerShell:
Remove-Item -Recurse -Force node_modules

# Reinstall dependencies
npm install
```

### Step 4: Start Metro with Reset Cache
```bash
npx react-native start --reset-cache
```

### Step 5: In a NEW Terminal, Run App
```bash
# Android
npx react-native run-android

# iOS
npx react-native run-ios
```

---

## 🔍 Why This Happens

1. **Metro Cache Corruption**: Old cached files get corrupted
2. **Path Issues**: Sometimes cache has wrong paths
3. **Node Modules Issue**: Corrupted installation
4. **Babel Cache**: Transpilation cache issues

---

## 🚀 Complete Reset (If Quick Fix Doesn't Work)

### Nuclear Option - Complete Clean:

```bash
cd AwesomeProject

# 1. Stop all processes
pkill -f react-native
pkill -f metro

# 2. Delete everything
rm -rf node_modules
rm -rf .metro
rm -rf android/app/build
rm -rf android/.gradle
rm -rf android/build
rm -rf ios/build
rm -rf ios/Pods
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# 3. Clear npm cache
npm cache clean --force

# 4. Reinstall
npm install

# 5. iOS only - reinstall pods
cd ios && pod install && cd ..

# 6. Start fresh
npx react-native start --reset-cache
```

---

## ⚡ One-Line Fix (Windows PowerShell)

```powershell
cd AwesomeProject; Remove-Item -Recurse -Force node_modules,.metro,android\app\build,android\.gradle -ErrorAction SilentlyContinue; npm cache clean --force; npm install; npx react-native start --reset-cache
```

---

## ⚡ One-Line Fix (Mac/Linux)

```bash
cd AwesomeProject && rm -rf node_modules .metro android/app/build android/.gradle && npm cache clean --force && npm install && npx react-native start --reset-cache
```

---

## 📋 Checklist

After fixing:
- [ ] Metro bundler starts without errors
- [ ] App builds successfully
- [ ] No syntax errors in console
- [ ] App loads on device/emulator

---

## 🆘 Still Not Working?

1. **Check Node Version:**
   ```bash
   node --version
   # Should be >= 20 (as per package.json)
   ```

2. **Check React Native Version:**
   ```bash
   npx react-native --version
   ```

3. **Try Different Metro Port:**
   ```bash
   npx react-native start --port 8082 --reset-cache
   ```

4. **Check for Conflicting Processes:**
   ```bash
   # Windows
   tasklist | findstr node
   
   # Mac/Linux
   ps aux | grep node
   ```

5. **Verify Babel Config:**
   - Check `babel.config.js` is correct
   - Should have: `module:metro-react-native-babel-preset`

---

## 💡 Prevention

To avoid this in future:
- Always use `--reset-cache` when having issues
- Don't interrupt Metro bundler while it's starting
- Keep node_modules clean
- Use `npm ci` instead of `npm install` for clean installs

