# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (Free tier M0 is sufficient)

## Step 2: Configure Database Access
1. Go to **Database Access** in the left sidebar
2. Click **Add New Database User**
3. Create a username and password (save these!)
4. Set user privileges to **Read and write to any database**
5. Click **Add User**

## Step 3: Configure Network Access
1. Go to **Network Access** in the left sidebar
2. Click **Add IP Address**
3. For development, click **Allow Access from Anywhere** (0.0.0.0/0)
   - ⚠️ For production, use specific IP addresses
4. Click **Confirm**

## Step 4: Get Connection String
1. Go to **Database** in the left sidebar
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## Step 5: Update .env File
Create a `.env` file in the `backend` folder:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/dayflow?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
```

**Important:**
- Replace `<username>` with your database username
- Replace `<password>` with your database password
- Replace `cluster0.xxxxx` with your actual cluster name
- The `/dayflow` at the end is the database name (you can change it)

## Step 6: Test Connection
1. Start your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. You should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database: dayflow
   Dayflow HRMS Server is running on port 5000
   ```

## Troubleshooting

### Connection Timeout
- Check your internet connection
- Verify IP address is whitelisted in Network Access
- Check if MongoDB Atlas cluster is running

### Authentication Failed
- Verify username and password in connection string
- Check if user has proper permissions
- Make sure password doesn't contain special characters that need URL encoding

### Connection String Issues
- Make sure to URL encode special characters in password
- Example: If password is `p@ssw0rd`, it should be `p%40ssw0rd` in the connection string

### Common Errors
- **"MongoServerError: bad auth"** - Wrong username or password
- **"MongoNetworkError"** - Network/connection issue
- **"MongoServerSelectionError"** - IP not whitelisted

## Security Best Practices
1. Never commit `.env` file to version control
2. Use strong passwords for database users
3. Restrict IP access in production
4. Rotate JWT secrets regularly
5. Use environment-specific connection strings

