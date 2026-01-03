# Fix Your .env File

## Current Issue

Your `.env` file has:
- `MONGO_URI` (wrong variable name)
- `JWT_SECRET = vmvmvm` (has spaces, which can cause issues)

But `server.js` is looking for:
- `MONGODB_URI` (correct variable name)

## Solution

Update your `backend/.env` file to:

```env
MONGODB_URI=mongodb+srv://JenishVariya:Jp%4004302099@cluster0.fvkjt8v.mongodb.net/hackathon
JWT_SECRET=vmvmvm
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

## Changes Needed:

1. **Change `MONGO_URI` to `MONGODB_URI`** (add "DB")
2. **Remove spaces around `=` in JWT_SECRET**: `JWT_SECRET=vmvmvm` (no spaces)
3. **Keep database name as `hackathon`** (or change to `hackthon` if you prefer)

## After Fixing:

1. Restart your backend server
2. Check the console - you should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database Name: hackathon
   🌐 Host: cluster0.fvkjt8v.mongodb.net
   ```

## Verify Connection:

Test with:
```bash
curl http://localhost:5000/api/test/db-status
```

This will show which database you're connected to.

