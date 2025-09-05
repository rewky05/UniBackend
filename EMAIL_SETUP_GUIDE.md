# Email Service Setup Guide

## Required Environment Variables

To use the email service, you need to set up the following environment variables:

### 1. Resend API Key
```bash
# Option 1: Server-side (recommended for production)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Option 2: Client-side (for development/testing)
NEXT_PUBLIC_RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 2. Sender Email (Optional but recommended)
```bash
# Configure a verified domain email address
RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>
```

## Setup Steps

### 1. Get Resend API Key
1. Go to [Resend.com](https://resend.com)
2. Sign up for an account
3. Go to API Keys section
4. Create a new API key
5. Copy the API key (starts with `re_`)

### 2. Verify Domain (Recommended)
1. In Resend dashboard, go to Domains
2. Add your domain (e.g., `yourdomain.com`)
3. Follow the DNS verification steps
4. Once verified, you can use emails from that domain

### 3. Set Environment Variables

#### For Development (.env.local)
Create a `.env.local` file in your project root:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### For Production
Set these environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other platforms: Check their documentation

## Testing the Email Service

### 1. Check Email Service Status
Visit: `http://localhost:3000/api/email-status`

This will show you:
- Whether API keys are configured
- Email service initialization status
- Any configuration issues

### 2. Test Email Sending
The email service will automatically test when you try to send a doctor verification email.

## Common Issues

### 1. "Email service initialization failed"
- Check if `RESEND_API_KEY` or `NEXT_PUBLIC_RESEND_API_KEY` is set
- Verify the API key is valid and starts with `re_`

### 2. "Invalid sender email"
- Use a verified domain in your sender email
- Format: `Name <email@domain.com>`
- Or use the default: `UniHealth Admin <noreply@resend.dev>`

### 3. "API Error" from Resend
- Check your Resend account status
- Verify you have sufficient credits
- Check if the domain is verified (if using custom domain)

## Default Configuration

If no environment variables are set, the service will use:
- Sender: `UniHealth Admin <noreply@resend.dev>`
- App URL: `http://localhost:3000`

## Security Notes

- Never commit API keys to version control
- Use server-side environment variables in production
- Consider using a secrets management service for production