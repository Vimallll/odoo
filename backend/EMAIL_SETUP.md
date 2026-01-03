# Email Setup Guide for OTP Verification

## Current Status

Currently, OTP codes are **logged to the console** only. To enable actual email sending, you need to configure email credentials.

## Option 1: Gmail Setup (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** in the left sidebar
3. Enable **2-Step Verification** if not already enabled

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select **Mail** as the app
3. Select **Other (Custom name)** as the device
4. Enter "Dayflow HRMS" as the name
5. Click **Generate**
6. **Copy the 16-character password** (you'll need this)

### Step 3: Update .env File

Add these lines to your `backend/.env` file:

```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_SERVICE=gmail
```

**Important:** 
- Use your **Gmail address** for `EMAIL_USER`
- Use the **16-character app password** (not your regular Gmail password) for `EMAIL_PASSWORD`
- The app password will look like: `abcd efgh ijkl mnop` (remove spaces when adding to .env)

### Step 4: Restart Server

```bash
cd backend
npm run dev
```

## Option 2: Other Email Services

### For Outlook/Hotmail:

```env
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
EMAIL_SERVICE=hotmail
```

### For Custom SMTP:

```env
EMAIL_USER=your-email@yourdomain.com
EMAIL_PASSWORD=your-password
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Testing Email Configuration

1. Start your backend server
2. Try to sign up or request password reset
3. Check your email inbox (and spam folder)
4. If email fails, check the console - OTP will still be displayed there

## Troubleshooting

### "Invalid login" error:
- Make sure you're using an **App Password** (not your regular password) for Gmail
- Verify 2-Factor Authentication is enabled

### "Connection timeout" error:
- Check your internet connection
- Verify email service settings
- For Gmail, make sure "Less secure app access" is not required (use App Password instead)

### Emails going to spam:
- This is normal for automated emails
- Check your spam/junk folder
- Consider using a professional email service for production

## Console Fallback

Even if email sending fails, the OTP will always be displayed in the **backend console** for testing purposes. Look for output like:

```
📧 ============================================
📧 OTP Email
📧 ============================================
📧 To: user@example.com
📧 Subject: Email Verification OTP - Dayflow
📧 OTP Code: 123456
📧 ============================================
```

## Production Recommendations

For production, consider using:
- **SendGrid** (free tier: 100 emails/day)
- **Mailgun** (free tier: 5,000 emails/month)
- **AWS SES** (very affordable)
- **Resend** (modern email API)

These services provide better deliverability and don't require app passwords.

