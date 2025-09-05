# 🚀 Quick Email Setup for Testing

## Step 1: Get Your Resend API Key

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Go to **API Keys** section
4. Click **Create API Key**
5. Name it "UniHealth Testing"
6. Copy the API key (starts with `re_`)

## Step 2: Create Environment File

Create a file called `.env.local` in your project root with this content:

```bash
# Email Service Configuration (Client-side for testing)
NEXT_PUBLIC_RESEND_API_KEY=re_your_actual_api_key_here

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Replace the API Key

Replace `re_your_actual_api_key_here` with your actual Resend API key.

## Step 4: Restart Your Server

```bash
npm run dev
```

## Step 5: Test the Email Service

1. Go to: `http://localhost:3000/api/test-email`
2. You should see: `{"success":true,"message":"Email service is working!"}`

## Step 6: Test Doctor Verification

1. Go to the Doctors page
2. Try to verify a doctor
3. Check the browser console for detailed logs
4. The email should be sent successfully!

## 🔍 Debugging

If it still doesn't work, check the console logs for:
- `NEXT_PUBLIC_RESEND_API_KEY exists: true`
- `API Key length: 40` (should be around 40 characters)
- `API Key starts with: re_`

## ⚠️ Security Note

This setup exposes the API key on the client side for testing only. For production, use server-side environment variables only.
