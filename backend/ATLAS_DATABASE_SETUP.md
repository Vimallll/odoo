# MongoDB Atlas Database Setup for "hackthon"

## Issue: Database "hackthon" not showing in Atlas

**Important:** MongoDB Atlas only displays databases that contain **at least one collection with data**. Empty databases won't appear in the Data Explorer.

## Step 1: Update Your .env File

Create or update `backend/.env` file with your MongoDB Atlas connection string:

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackthon?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_change_this_in_production
```

**Key Points:**
- Replace `username` and `password` with your MongoDB Atlas credentials
- Replace `cluster0.xxxxx` with your actual cluster name
- **Important:** The database name `hackthon` must be in the connection string (after `.net/`)
- If your password has special characters, URL-encode them:
  - `@` becomes `%40`
  - `#` becomes `%23`
  - `$` becomes `%24`
  - etc.

## Step 2: Verify Connection

1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database Name: hackthon
   ```

3. If you see connection errors, check:
   - MongoDB Atlas Network Access (IP whitelist)
   - Database user credentials
   - Connection string format

## Step 3: Create Data to Make Database Visible

The database will only appear in Atlas after you create at least one document. To make it visible:

1. **Sign up a user** through the frontend
2. This will create a `users` collection with data
3. The database will then appear in MongoDB Atlas Data Explorer

## Step 4: View Database in Atlas

1. Go to MongoDB Atlas Dashboard
2. Click on **"Data Explorer"** in the left sidebar
3. Click on **"Cluster0"** (or your cluster name)
4. You should now see **"hackthon"** database listed
5. Expand it to see collections:
   - `users` (after first signup)
   - `attendances` (after first check-in)
   - `leaves` (after first leave application)
   - `payrolls` (after first payroll entry)

## Step 5: Verify Data is Being Saved

### Option 1: Through Backend Logs
When you sign up or create data, check backend console:
```
📝 Signup request received: - Email: test@example.com
👤 Creating new user...
✅ User created successfully: 507f1f77bcf86cd799439011
```

### Option 2: Through MongoDB Atlas
1. Go to Data Explorer
2. Click on `hackthon` database
3. Click on `users` collection
4. You should see your registered users

### Option 3: Test Endpoint
Create a test user via API:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": "TEST001",
    "email": "test@example.com",
    "password": "Test@1234",
    "role": "Employee"
  }'
```

## Troubleshooting

### Database Still Not Showing

1. **Check if data was actually saved:**
   - Look at backend logs for success messages
   - Check for any error messages

2. **Verify connection string:**
   - Make sure database name `hackthon` is in the connection string
   - Format: `...mongodb.net/hackthon?retryWrites...`

3. **Check MongoDB Atlas:**
   - Refresh the Data Explorer page
   - Try clicking "Refresh" button in Atlas
   - Sometimes it takes a few seconds to appear

4. **Verify connection:**
   - Backend should show: `📊 Database Name: hackthon`
   - If it shows a different name, your connection string is wrong

### Data Not Saving

1. **Check backend console for errors:**
   - Look for ❌ error messages
   - Check MongoDB connection status

2. **Verify MongoDB Atlas Network Access:**
   - Go to Network Access in Atlas
   - Make sure your IP is whitelisted (or use 0.0.0.0/0 for development)

3. **Check database user permissions:**
   - User should have "Read and write to any database" permission

4. **Test connection:**
   ```bash
   # Test backend health
   curl http://localhost:5000/api/health
   
   # Should return database status
   ```

## Quick Fix Checklist

- [ ] `.env` file exists in `backend/` folder
- [ ] Connection string includes `/hackthon` at the end
- [ ] MongoDB Atlas IP is whitelisted
- [ ] Database user has read/write permissions
- [ ] Backend server shows "Database Name: hackthon"
- [ ] At least one user has been created (signup)
- [ ] Refreshed MongoDB Atlas Data Explorer

## Example .env File

```env
PORT=5000
MONGODB_URI=mongodb+srv://myuser:mypassword@cluster0.abc123.mongodb.net/hackthon?retryWrites=true&w=majority
JWT_SECRET=my_super_secret_jwt_key_12345
```

**Remember:** 
- Never commit `.env` file to git
- Replace all placeholder values with your actual credentials
- Database name `hackthon` must be in the connection string

