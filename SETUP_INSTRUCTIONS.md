# Project Setup Instructions

## ⚠️ IMPORTANT: Before Running the Project

### 1. Backend Setup (ChatBackend)

#### Step 1: Create `.env` file
Create a file named `.env` in the `ChatBackend` folder with the following content:

```env
# MongoDB Connection String
MONGO_URI=mongodb://localhost:27017/chatdb

# JWT Secret Key (use a random string)
JWT_SECRET=your_super_secret_jwt_key_12345

# Server Port
PORT=5000
```

**For MongoDB Atlas (Cloud):**
```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/chatdb?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_12345
PORT=5000
```

#### Step 2: Install Dependencies
```bash
cd ChatBackend
npm install
```

#### Step 3: Start MongoDB
- **Local MongoDB**: Make sure MongoDB is running on your machine
- **MongoDB Atlas**: No need to start, it's cloud-based

#### Step 4: Start Backend Server
```bash
node server.js
```

You should see:
```
✅ MongoDB connected successfully
✅ Server running on port 5000
```

---

### 2. Frontend Setup (AwesomeProject)

#### Step 1: Update IP Address
**IMPORTANT**: Update the IP address in these files to match your computer's IP:

1. **`src/utils/api.js`** - Line 5:
   ```javascript
   baseURL: 'http://YOUR_IP_ADDRESS:5000/api',
   ```

2. **`src/utils/socket.js`** - Line 36:
   ```javascript
   socket = io('http://YOUR_IP_ADDRESS:5000', {
   ```

**How to find your IP address:**
- **Windows**: Open CMD → type `ipconfig` → look for "IPv4 Address"
- **Mac/Linux**: Open Terminal → type `ifconfig` → look for "inet"

**For Android Emulator:**
- Use `10.0.2.2` instead of your IP

**For iOS Simulator:**
- Use `localhost` or `127.0.0.1`

#### Step 2: Install Dependencies
```bash
cd AwesomeProject
npm install
```

#### Step 3: Run the App
```bash
# For Android
npx react-native run-android

# For iOS
npx react-native run-ios
```

---

## 🔧 Common Issues & Fixes

### Issue 1: "MongoDB connection error"
**Solution:**
- Check if MongoDB is running (for local)
- Verify MONGO_URI in `.env` file
- Check internet connection (for Atlas)

### Issue 2: "Cannot connect to server"
**Solution:**
- Verify backend is running (`node server.js`)
- Check IP address in `api.js` and `socket.js`
- Make sure phone/emulator and computer are on same network
- Check firewall settings

### Issue 3: "JWT_SECRET is not set"
**Solution:**
- Create `.env` file in `ChatBackend` folder
- Add `JWT_SECRET=your_secret_key`

### Issue 4: "Socket connection error"
**Solution:**
- Check if backend is running
- Verify IP address in `socket.js`
- Check token is being sent correctly

### Issue 5: "401 Unauthorized"
**Solution:**
- Token might be expired - try logging in again
- Check JWT_SECRET matches in backend
- Verify token is stored in AsyncStorage

---

## 📋 Quick Checklist

Before running:
- [ ] `.env` file created in `ChatBackend` folder
- [ ] `MONGO_URI` set correctly
- [ ] `JWT_SECRET` set in `.env`
- [ ] MongoDB is running (if local)
- [ ] IP address updated in `api.js` and `socket.js`
- [ ] Backend dependencies installed (`npm install` in ChatBackend)
- [ ] Frontend dependencies installed (`npm install` in AwesomeProject)
- [ ] Backend server is running (`node server.js`)
- [ ] Phone/emulator and computer on same network

---

## 🚀 Testing the Setup

1. **Test Backend:**
   - Open browser: `http://localhost:5000/`
   - Should see: "Chat backend running"

2. **Test Frontend:**
   - Open app
   - Try to sign up/login
   - Check console for errors

3. **Test Database:**
   - Sign up a user
   - Check MongoDB to see if user was created

---

## 📞 Need Help?

If you encounter issues:
1. Check backend console for errors
2. Check frontend console (Metro bundler)
3. Verify all configuration files
4. Make sure all dependencies are installed

