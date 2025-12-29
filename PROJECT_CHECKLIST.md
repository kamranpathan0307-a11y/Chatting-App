# 🔍 Project Configuration Checklist

## ✅ Issues Fixed

### 1. **Socket Authentication Fixed**
- ✅ Socket now correctly reads `decoded.id` (matches JWT token format)
- ✅ Auth middleware now supports both `id` and `userId` formats

### 2. **Database Connection**
- ✅ Added error handling for missing MONGO_URI
- ✅ Better error messages for connection failures

### 3. **Environment Variables**
- ✅ Added checks for missing JWT_SECRET
- ✅ Created `.env.example` template

---

## 📋 Configuration Checklist

### Backend (ChatBackend)

#### ✅ Step 1: Create `.env` file
**Location:** `ChatBackend/.env`

```env
MONGO_URI=mongodb://localhost:27017/chatdb
JWT_SECRET=your_super_secret_key_12345
PORT=5000
```

**For MongoDB Atlas:**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb
JWT_SECRET=your_super_secret_key_12345
PORT=5000
```

#### ✅ Step 2: Install Dependencies
```bash
cd ChatBackend
npm install
```

#### ✅ Step 3: Start MongoDB
- **Local**: Make sure MongoDB service is running
- **Atlas**: No action needed (cloud)

#### ✅ Step 4: Start Backend
```bash
node server.js
```

**Expected Output:**
```
✅ MongoDB connected successfully
✅ Server running on port 5000
✅ API available at: http://localhost:5000/api
✅ Socket.IO available at: http://localhost:5000
```

---

### Frontend (AwesomeProject)

#### ✅ Step 1: Update IP Address

**File 1:** `src/utils/api.js` (Line 5)
```javascript
baseURL: 'http://YOUR_IP:5000/api',
```

**File 2:** `src/utils/socket.js` (Line 36)
```javascript
socket = io('http://YOUR_IP:5000', {
```

**How to find YOUR_IP:**
- **Windows**: `ipconfig` → Look for "IPv4 Address"
- **Mac/Linux**: `ifconfig` → Look for "inet"

**Special Cases:**
- **Android Emulator**: Use `10.0.2.2`
- **iOS Simulator**: Use `localhost` or `127.0.0.1`
- **Physical Device**: Use your computer's actual IP

#### ✅ Step 2: Install Dependencies
```bash
cd AwesomeProject
npm install
```

#### ✅ Step 3: Run App
```bash
npx react-native run-android
# or
npx react-native run-ios
```

---

## 🔧 Common Issues & Solutions

### Issue 1: "MONGO_URI is not set"
**Solution:**
1. Create `.env` file in `ChatBackend` folder
2. Add: `MONGO_URI=mongodb://localhost:27017/chatdb`
3. Restart backend server

### Issue 2: "MongoDB connection error"
**Solution:**
- **Local MongoDB**: Start MongoDB service
  ```bash
  # Windows (if installed as service)
  net start MongoDB
  
  # Mac/Linux
  brew services start mongodb-community
  # or
  mongod
  ```
- **MongoDB Atlas**: Check connection string is correct

### Issue 3: "Cannot connect to server"
**Solution:**
1. Check backend is running: `http://localhost:5000/`
2. Update IP in `api.js` and `socket.js`
3. Check firewall isn't blocking port 5000
4. Ensure phone/emulator and computer on same network

### Issue 4: "Socket connection error"
**Solution:**
1. Check backend is running
2. Verify IP address in `socket.js`
3. Check token is stored: `AsyncStorage.getItem('token')`
4. Check backend console for socket errors

### Issue 5: "401 Unauthorized"
**Solution:**
1. Try logging in again (token might be expired)
2. Check JWT_SECRET matches in backend `.env`
3. Clear app data and re-login

### Issue 6: "403 Access Denied" (Messages)
**Solution:**
1. Make sure chat exists before sending messages
2. Verify user is a member of the chat
3. Check chatId is correct (not userId)

---

## 🧪 Testing Steps

### Test 1: Backend Connection
```bash
# Open browser
http://localhost:5000/

# Should see: "Chat backend running"
```

### Test 2: Database Connection
```bash
# Check backend console
# Should see: "✅ MongoDB connected successfully"
```

### Test 3: API Endpoints
```bash
# Test signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"123456"}'
```

### Test 4: Frontend Connection
1. Open app
2. Try to sign up/login
3. Check Metro bundler console for errors
4. Check backend console for API calls

---

## 📝 Quick Reference

### Current IP Address
**Update these files:**
- `AwesomeProject/src/utils/api.js` → Line 5
- `AwesomeProject/src/utils/socket.js` → Line 36

### Environment Variables Needed
**ChatBackend/.env:**
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `PORT` - Server port (optional, default: 5000)

### Ports Used
- **Backend**: 5000
- **MongoDB**: 27017 (local) or cloud (Atlas)

---

## ✅ Final Checklist

Before running:
- [ ] `.env` file created in `ChatBackend` folder
- [ ] `MONGO_URI` set correctly
- [ ] `JWT_SECRET` set in `.env`
- [ ] MongoDB is running (if local)
- [ ] IP address updated in `api.js`
- [ ] IP address updated in `socket.js`
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend server running (`node server.js`)
- [ ] Phone/emulator and computer on same network

---

## 🚨 If Still Not Working

1. **Check Backend Console:**
   - Look for error messages
   - Check MongoDB connection status
   - Check if routes are loading

2. **Check Frontend Console (Metro):**
   - Look for network errors
   - Check API call errors
   - Check socket connection errors

3. **Verify Configuration:**
   - IP address matches your computer
   - `.env` file exists and has correct values
   - All dependencies installed

4. **Test Manually:**
   - Try accessing backend in browser
   - Test API with Postman/curl
   - Check MongoDB connection

