# Troubleshooting Guide - Sign Up & Login Issues

## Common Issues and Solutions

### 1. "Cannot connect to backend" or Network Error

**Symptoms:**
- Frontend shows "Network error" or "Cannot connect"
- No response from API calls
- Browser console shows CORS errors

**Solutions:**
1. **Check if backend is running:**
   ```bash
   cd backend
   npm run dev
   ```
   You should see: `Dayflow HRMS Server is running on port 5000`

2. **Test backend connection:**
   - Open browser: http://localhost:5000/api/health
   - Should return: `{"status":"OK","message":"Server is running"}`

3. **Check frontend API URL:**
   - Open browser console (F12)
   - Check if API calls are going to correct URL
   - Default should be: `http://localhost:5000/api`

4. **Verify CORS:**
   - Backend should allow requests from `http://localhost:3000`
   - Check `backend/server.js` CORS configuration

### 2. MongoDB Atlas Connection Issues

**Symptoms:**
- Backend shows: `❌ MongoDB connection error`
- Server crashes on startup
- Database operations fail

**Solutions:**
1. **Check .env file exists:**
   ```bash
   # In backend folder
   ls .env  # Should show the file
   ```

2. **Verify MongoDB URI format:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/dayflow?retryWrites=true&w=majority
   ```
   - Replace `username` and `password` with your Atlas credentials
   - Replace `cluster0.xxxxx` with your cluster name
   - Make sure password is URL-encoded if it has special characters

3. **Check Network Access in MongoDB Atlas:**
   - Go to MongoDB Atlas Dashboard
   - Network Access → Add IP Address
   - For development: Allow `0.0.0.0/0` (all IPs)

4. **Test MongoDB connection:**
   - Start backend server
   - Should see: `✅ MongoDB connected successfully`

### 3. Sign Up Not Working

**Symptoms:**
- Form submits but nothing happens
- Error message appears but unclear
- User not created in database

**Debug Steps:**
1. **Open browser console (F12)**
   - Look for error messages
   - Check Network tab for API calls

2. **Check backend logs:**
   - Should see: `📝 Signup request received`
   - Look for error messages with ❌

3. **Common errors:**
   - **"Password validation failed"**: Password must have uppercase, lowercase, number, and special character
   - **"User already exists"**: Email or Employee ID already registered
   - **"Missing required fields"**: Fill all form fields

4. **Test with valid password:**
   - Example: `Test@1234`
   - Must have: uppercase, lowercase, number, special char, min 8 chars

### 4. Sign In Not Working

**Symptoms:**
- Login fails with "Invalid credentials"
- User exists but can't login
- Token not generated

**Debug Steps:**
1. **Verify user exists:**
   - Check MongoDB Atlas database
   - Or try signing up again (should show "already exists")

2. **Check email verification:**
   - Users are auto-verified on signup
   - If manually created, set `emailVerified: true`

3. **Verify password:**
   - Make sure you're using the correct password
   - Password is case-sensitive

4. **Check backend logs:**
   - Should see: `🔐 Signin request received`
   - Look for specific error messages

### 5. Frontend Not Connecting to Backend

**Symptoms:**
- API calls fail
- CORS errors in console
- "Network Error" messages

**Solutions:**
1. **Check API URL in frontend:**
   - File: `frontend/src/utils/api.js`
   - Default: `http://localhost:5000/api`
   - Can be set via `.env` file:
     ```env
     REACT_APP_API_URL=http://localhost:5000/api
     ```

2. **Verify both servers running:**
   - Backend: `http://localhost:5000`
   - Frontend: `http://localhost:3000`

3. **Check CORS in backend:**
   - File: `backend/server.js`
   - Should allow: `http://localhost:3000`

### 6. Error Messages Not Showing

**Symptoms:**
- Errors occur but not displayed
- No feedback to user

**Solutions:**
1. **Check browser console:**
   - Press F12 → Console tab
   - Look for error messages

2. **Check error handling:**
   - Frontend should display errors in red box
   - Backend logs errors to console

3. **Enable detailed logging:**
   - Backend already has detailed logs
   - Look for emoji indicators: ✅ ❌ 🔍 📝

## Quick Diagnostic Checklist

- [ ] Backend server is running (`npm run dev` in backend folder)
- [ ] Frontend server is running (`npm start` in frontend folder)
- [ ] MongoDB Atlas connection string is correct in `.env`
- [ ] MongoDB Atlas IP whitelist includes your IP (or 0.0.0.0/0)
- [ ] Database user has read/write permissions
- [ ] Password in connection string is URL-encoded if needed
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API requests going to correct URL
- [ ] Backend console shows request logs

## Testing Endpoints

### Test Backend Health:
```bash
curl http://localhost:5000/api/health
```

### Test API Connection:
```bash
curl http://localhost:5000/api/test
```

### Test Sign Up (from frontend or Postman):
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "EMP001",
    "email": "test@example.com",
    "password": "Test@1234",
    "role": "Employee"
  }'
```

### Test Sign In:
```bash
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

## Still Having Issues?

1. **Check all console logs** (both browser and terminal)
2. **Verify .env file** has correct MongoDB Atlas connection string
3. **Test backend endpoints** directly using curl or Postman
4. **Check MongoDB Atlas dashboard** to see if data is being created
5. **Review error messages** - they now include detailed information

## Contact Support

If issues persist, provide:
- Backend console logs
- Browser console errors
- Network tab screenshots
- MongoDB Atlas connection status
- .env file format (without actual credentials)

