# Complete Configuration Setup Guide

## Step 1: Generate JWT Secret Key

Run the secret generator script:

```bash
cd backend
node generate-secret.js
```

This will generate a secure random JWT secret key. Copy it for use in Step 3.

**Alternative method:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Step 2: Get MongoDB Atlas Connection String

### 2.1 Create MongoDB Atlas Account (if not done)
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (Free tier M0)

### 2.2 Configure Database Access
1. Go to **Database Access** in MongoDB Atlas
2. Click **Add New Database User**
3. Create username and password (save these!)
4. Set privileges to **Read and write to any database**
5. Click **Add User**

### 2.3 Configure Network Access
1. Go to **Network Access** in MongoDB Atlas
2. Click **Add IP Address**
3. For development: Click **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

### 2.4 Get Connection String
1. Go to **Database** → Click **Connect** on your cluster
2. Choose **Connect your application**
3. Copy the connection string
4. It looks like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 3: Create .env File

1. **Copy the example file:**
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edit the .env file** with your actual values:

   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000

   # MongoDB Atlas - Replace with your actual connection string
   MONGODB_URI=mongodb+srv://yourusername:yourpassword@cluster0.xxxxx.mongodb.net/hackthon?retryWrites=true&w=majority

   # JWT Secret - Use the key generated in Step 1
   JWT_SECRET=your_generated_jwt_secret_key_here
   ```

### Important Notes for MONGODB_URI:

1. **Replace placeholders:**
   - `<username>` → Your MongoDB Atlas username
   - `<password>` → Your MongoDB Atlas password
   - `cluster0.xxxxx` → Your actual cluster name
   - Add `/hackthon` before `?` to specify database name

2. **URL Encoding for Special Characters:**
   If your password contains special characters, encode them:
   - `@` → `%40`
   - `#` → `%23`
   - `$` → `%24`
   - `&` → `%26`
   - `/` → `%2F`
   - `:` → `%3A`
   - `?` → `%3F`
   - `=` → `%3D`

3. **Example with encoded password:**
   If password is `P@ssw0rd#123`:
   ```
   mongodb+srv://myuser:P%40ssw0rd%23123@cluster0.abc123.mongodb.net/hackthon?retryWrites=true&w=majority
   ```

## Step 4: Verify Configuration

### 4.1 Test Backend Connection

Start the backend server:
```bash
cd backend
npm run dev
```

You should see:
```
🔗 Connecting to MongoDB...
✅ MongoDB connected successfully
📊 Database Name: hackthon
🌐 Host: cluster0.xxxxx.mongodb.net
Dayflow HRMS Server is running on port 5000
```

### 4.2 Test API Endpoints

1. **Health Check:**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return database connection status.

2. **Database Status:**
   ```bash
   curl http://localhost:5000/api/test/db-status
   ```
   Shows database name, collections, and document counts.

3. **Create Test User:**
   ```bash
   curl -X POST http://localhost:5000/api/test/create-test-user
   ```
   Creates a test user to verify data saving.

## Step 5: Frontend Configuration (Optional)

If your backend runs on a different port or URL, create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Complete .env File Example

```env
# ============================================
# Server Configuration
# ============================================
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# ============================================
# MongoDB Atlas Configuration
# ============================================
# Replace with your actual MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://myuser:MyP%40ssw0rd123@cluster0.abc123.mongodb.net/hackthon?retryWrites=true&w=majority

# ============================================
# JWT Secret Key
# ============================================
# Generated using: node generate-secret.js
JWT_SECRET=ede1b60a130ffb87f034624b14c0195d77fdb9349f33a1745206774ad3b236aa2c0ecbcdaae05f10dd8ac256ddc7876c14cde8735d76abf8f5f0be73c7f8311a
```

## Troubleshooting

### Connection Errors

1. **"MongoServerError: bad auth"**
   - Check username and password
   - Verify URL encoding for special characters

2. **"MongoNetworkError"**
   - Check internet connection
   - Verify IP is whitelisted in Network Access
   - Check if cluster is running

3. **"MongoServerSelectionError"**
   - IP address not whitelisted
   - Network firewall blocking connection

### Database Not Showing in Atlas

- MongoDB Atlas only shows databases with data
- Create at least one user/document first
- Refresh the Data Explorer in Atlas

### JWT Errors

- Make sure JWT_SECRET is set in .env
- Secret should be at least 32 characters long
- Don't use default/example secrets in production

## Security Best Practices

1. ✅ Never commit `.env` file to git (already in .gitignore)
2. ✅ Use strong, randomly generated JWT secrets
3. ✅ Restrict MongoDB Atlas IP access in production
4. ✅ Use environment-specific configurations
5. ✅ Rotate secrets regularly
6. ✅ Keep credentials secure and private

## Quick Setup Script

You can also use this one-liner to generate and display config:

```bash
cd backend
node generate-secret.js
```

Then manually create `.env` file with the generated secret.

## Next Steps

After configuration:
1. ✅ Start backend: `npm run dev`
2. ✅ Start frontend: `npm start`
3. ✅ Test signup/login functionality
4. ✅ Verify data appears in MongoDB Atlas

---

**Need Help?** Check `TROUBLESHOOTING.md` for common issues and solutions.

