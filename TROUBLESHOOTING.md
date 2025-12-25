# Troubleshooting Signup/Login Issues

## Common Issues and Solutions

### 1. "Failed to create account" Error

**Possible Causes:**

#### A. Backend Server Not Running
- **Solution:** Make sure the backend server is running
  ```bash
  cd ChatBackend
  npm install  # if not done already
  node server.js
  ```
  You should see: `Server running on port 5000` and `MongoDB connected`

#### B. Wrong IP Address
- **Current IP in code:** `192.168.31.235`
- **Solution:** Update the IP address in `AwesomeProject/src/utils/api.js`:
  1. Find your computer's IP address:
     - Windows: Open CMD and run `ipconfig` (look for IPv4 Address)
     - Mac/Linux: Run `ifconfig` or `ip addr`
  2. Update the `baseURL` in `src/utils/api.js`:
     ```javascript
     baseURL: "http://YOUR_IP_ADDRESS:5000/api",
     ```
  3. For Android Emulator, use `10.0.2.2` instead of localhost
  4. For iOS Simulator, use `localhost` or `127.0.0.1`

#### C. MongoDB Not Connected
- **Solution:** 
  1. Make sure MongoDB is running
  2. Check `.env` file in `ChatBackend` folder has:
     ```
     MONGO_URI=your_mongodb_connection_string
     JWT_SECRET=your_secret_key
     ```
  3. Example MONGO_URI: `mongodb://localhost:27017/chatdb` or your MongoDB Atlas connection string

#### D. Network/Firewall Issues
- **Solution:**
  - Make sure your phone/emulator and computer are on the same network
  - Check if firewall is blocking port 5000
  - Try disabling firewall temporarily to test

### 2. How to Check if Backend is Running

Open browser or Postman and visit:
- `http://192.168.31.235:5000/` (or your IP)
- Should see: "Chat backend running"

### 3. Testing the Signup Endpoint

You can test directly with curl or Postman:
```bash
curl -X POST http://192.168.31.235:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Check Backend Logs

When you try to signup, check the backend console for error messages. Common errors:
- `MongoDB connection error` - Database not connected
- `ECONNREFUSED` - Server not running
- `ValidationError` - Invalid data format

### 5. Quick Fix Checklist

- [ ] Backend server is running (`node server.js` in ChatBackend folder)
- [ ] MongoDB is connected (check backend console for "MongoDB connected")
- [ ] IP address in `api.js` matches your computer's IP
- [ ] Phone/emulator and computer are on same network
- [ ] Port 5000 is not blocked by firewall
- [ ] `.env` file exists with MONGO_URI and JWT_SECRET

### 6. Alternative: Use Localhost for Testing

For Android Emulator:
```javascript
baseURL: "http://10.0.2.2:5000/api"
```

For iOS Simulator:
```javascript
baseURL: "http://localhost:5000/api"
```

For Physical Device:
- Use your computer's actual IP address (found via `ipconfig` or `ifconfig`)

