# Quick Start Guide

## 🚀 Fast Setup (3 Steps)

### Step 1: Generate JWT Secret & Setup Environment

**Option A: Interactive Setup (Recommended)**
```bash
cd backend
npm run setup-env
```
This will guide you through creating the .env file interactively.

**Option B: Manual Setup**
```bash
cd backend
npm run generate-secret
```
Copy the generated JWT secret, then manually create `.env` file.

### Step 2: Configure MongoDB Atlas

1. Get your connection string from MongoDB Atlas
2. Update `.env` file with your MongoDB URI:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackthon?retryWrites=true&w=majority
   ```
   **Important:** Make sure `/hackthon` is in the connection string (before `?`)

### Step 3: Start the Server

```bash
cd backend
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
📊 Database Name: hackthon
Dayflow HRMS Server is running on port 5000
```

## ✅ Verify Setup

Test the API:
```bash
# Health check
curl http://localhost:5000/api/health

# Database status
curl http://localhost:5000/api/test/db-status
```

## 📝 Complete .env Template

```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackthon?retryWrites=true&w=majority
JWT_SECRET=your_generated_secret_key_here
```

## 🔧 Troubleshooting

- **Connection Error?** Check MongoDB Atlas Network Access (whitelist IP)
- **Database Not Showing?** Create at least one user/document first
- **JWT Errors?** Make sure JWT_SECRET is set in .env

For detailed help, see `CONFIGURATION_SETUP.md`

