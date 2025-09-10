# Temporary Password System Setup Guide

## Quick Setup

### Option 1: Automated Setup (Recommended)

Run the setup script to automatically configure the system:

```bash
npm run setup-temp-password
```

This will:
- Generate a secure encryption key
- Update your `.env.local` file
- Check your email configuration
- Provide next steps

### Option 2: Manual Setup

#### 1. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Required for temporary password encryption
TEMP_PASSWORD_ENCRYPTION_KEY=your-32-character-encryption-key-here

# Existing email configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 2. Generate Encryption Key

Generate a secure 32-character encryption key:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Using OpenSSL
openssl rand -hex 16

# Using online generator (use a secure one)
# https://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx
```

### 3. Test the System

```bash
# Test the temporary password system
npm run test-temp-password

# Test with email sending (requires valid email)
npm run test-temp-password -- --send-email

# Run cleanup manually
npm run cleanup-temp-passwords
```

### 4. Quick Start Commands

```bash
# Complete setup (generates key, updates .env.local)
npm run setup-temp-password

# Test the system
npm run test-temp-password

# Clean up expired passwords
npm run cleanup-temp-passwords
```

## How It Works

### **Doctor/Patient Creation Flow**

1. **Admin creates account** → System generates secure temporary password
2. **Password encrypted** → Stored in Firebase with 10-minute expiration
3. **Email sent** → Professional email with credentials and security warning
4. **Password marked as sent** → Unencrypted version deleted for security
5. **Auto cleanup** → Expired passwords removed every 5 minutes

### **Security Features**

- ✅ **AES-256-CBC encryption** for stored passwords
- ✅ **10-minute expiration** for temporary passwords
- ✅ **Automatic cleanup** of expired passwords
- ✅ **Single-use passwords** (deleted after email sending)
- ✅ **Secure random generation** meeting Firebase requirements

### **Email Features**

- ✅ **Professional HTML templates** with responsive design
- ✅ **Clear security warnings** about password expiration
- ✅ **Step-by-step instructions** for users
- ✅ **Mobile-friendly** design

## Usage Examples

### **Creating a Doctor Account**

```typescript
const { doctorId, temporaryPassword, tempPasswordId } = await realDataService.createDoctor({
  firstName: 'Dr. John',
  lastName: 'Smith',
  email: 'john.smith@clinic.com',
  specialty: 'Cardiology',
  // ... other doctor data
});
// Email automatically sent with temporary password
```

### **Creating a Patient Account**

```typescript
const { patientId, temporaryPassword, tempPasswordId } = await realDataService.createPatient({
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@email.com',
  // ... other patient data
});
// Email automatically sent with temporary password
```

## Monitoring

### **Check System Status**

```bash
# Check email service
curl http://localhost:3000/api/email-status

# Run cleanup and see statistics
npm run cleanup-temp-passwords

# Test the entire system
npm run test-temp-password
```

### **Database Structure**

Temporary passwords are stored in:
```
temporary-passwords/
├── temp_doctor_1234567890/
│   ├── email: "doctor@example.com"
│   ├── password: "encrypted_password"
│   ├── userType: "doctor"
│   ├── userId: "firebase_uid"
│   ├── createdAt: 1234567890
│   ├── expiresAt: 1234567890
│   ├── sent: true
│   └── encryptedPassword: "encrypted_version"
```

## Troubleshooting

### **Common Issues**

1. **"Encryption key must be 32 characters"**
   - Ensure `TEMP_PASSWORD_ENCRYPTION_KEY` is exactly 32 characters
   - Generate a new key using the methods above

2. **"Email sending failed"**
   - Check `RESEND_API_KEY` is valid
   - Verify `RESEND_FROM_EMAIL` format
   - Test email service: `curl http://localhost:3000/api/email-status`

3. **"Temporary password not found"**
   - Password may have expired (10 minutes)
   - Run cleanup: `npm run cleanup-temp-passwords`

### **Debug Commands**

```bash
# Test system components
npm run test-temp-password

# Check email service
curl http://localhost:3000/api/email-status

# Manual cleanup
npm run cleanup-temp-passwords

# Check environment variables
echo $TEMP_PASSWORD_ENCRYPTION_KEY
echo $RESEND_API_KEY
```

## Security Best Practices

1. **Use a strong encryption key** - 32 random characters
2. **Rotate keys regularly** - Change encryption key periodically
3. **Monitor cleanup logs** - Ensure expired passwords are being removed
4. **Review email logs** - Check for failed email deliveries
5. **Test regularly** - Run test scripts to verify system health

## Production Deployment

### **Environment Variables for Production**

```bash
# Production encryption key (generate new one)
TEMP_PASSWORD_ENCRYPTION_KEY=production-32-char-encryption-key

# Production email configuration
RESEND_API_KEY=re_production_key_here
RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### **Monitoring in Production**

1. Set up monitoring for email delivery rates
2. Monitor cleanup statistics
3. Alert on encryption key issues
4. Track temporary password creation rates

The system is designed to be robust and self-healing, with automatic cleanup and comprehensive error handling to ensure reliable operation in production.
