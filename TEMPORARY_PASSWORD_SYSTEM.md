# Temporary Password System

## Overview

The Temporary Password System provides a secure way to create user accounts (doctors and patients) with temporary passwords that are automatically sent via email. The system ensures that temporary passwords are encrypted, have a short expiration time, and are automatically cleaned up for security.

## Features

### ✅ **Secure Password Generation**
- Cryptographically secure random passwords
- Meets Firebase Authentication requirements
- 12 characters with mixed case, numbers, and special characters

### ✅ **Encryption & Security**
- AES-256-CBC encryption for stored passwords
- 10-minute expiration time
- Automatic cleanup of expired passwords
- Temporary passwords are deleted after email sending

### ✅ **Email Notifications**
- Professional HTML email templates
- Clear security warnings
- Step-by-step instructions for users
- Responsive design for all devices

### ✅ **Automatic Cleanup**
- Expired passwords are automatically removed
- Cleanup runs every 5 minutes
- Manual cleanup script available
- Statistics tracking

## Architecture

### **Core Components**

1. **TemporaryPasswordService** (`lib/services/temporary-password.service.ts`)
   - Manages temporary password lifecycle
   - Handles encryption/decryption
   - Automatic cleanup functionality

2. **EmailService** (`lib/services/email.service.ts`)
   - Sends temporary password emails
   - Professional email templates
   - Error handling and logging

3. **API Endpoint** (`app/api/send-temporary-password/route.ts`)
   - RESTful API for sending emails
   - Validation and error handling

4. **Cleanup Script** (`scripts/cleanup-temporary-passwords.ts`)
   - Manual cleanup of expired passwords
   - Statistics reporting

## Database Structure

### **Temporary Passwords Collection**
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

## Security Features

### **Password Encryption**
- Uses AES-256-CBC encryption
- 32-character encryption key required
- Passwords are encrypted before storage
- Unencrypted passwords are only kept temporarily for email sending

### **Expiration Management**
- 10-minute expiration time
- Automatic cleanup every 5 minutes
- Expired passwords are immediately invalid
- Manual cleanup script for maintenance

### **Access Control**
- Only system administrators can create accounts
- Temporary passwords are single-use
- Email sending is logged and tracked

## Usage

### **Creating a Doctor Account**

```typescript
import { RealDataService } from '@/lib/services/real-data.service';

const realDataService = new RealDataService();

const doctorData = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  specialty: 'Cardiology',
  // ... other doctor data
};

const { doctorId, temporaryPassword, tempPasswordId } = await realDataService.createDoctor(doctorData);
// Email is automatically sent with temporary password
```

### **Creating a Patient Account**

```typescript
import { RealDataService } from '@/lib/services/real-data.service';

const realDataService = new RealDataService();

const patientData = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane.smith@example.com',
  // ... other patient data
};

const { patientId, temporaryPassword, tempPasswordId } = await realDataService.createPatient(patientData);
// Email is automatically sent with temporary password
```

### **Manual Cleanup**

```bash
# Run cleanup script
npm run cleanup-temp-passwords

# Or directly with tsx
npx tsx scripts/cleanup-temporary-passwords.ts
```

## Configuration

### **Environment Variables**

```bash
# Required for encryption
TEMP_PASSWORD_ENCRYPTION_KEY=your-32-character-encryption-key

# Email configuration (existing)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=UniHealth Admin <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Security Settings**

```typescript
// In TemporaryPasswordService
private readonly EXPIRATION_MINUTES = 10; // 10 minutes
private readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
```

## Email Templates

### **Doctor Account Email**
- Professional medical theme
- Clear credentials display
- Security warnings
- Step-by-step instructions
- Responsive design

### **Patient Account Email**
- Patient-friendly design
- Simple language
- Security emphasis
- Easy-to-follow steps

## Error Handling

### **Common Error Scenarios**
1. **Email sending fails**: Account is still created, error is logged
2. **Encryption key missing**: Service initialization fails
3. **Temporary password expired**: Email sending is skipped
4. **Invalid user type**: Validation error returned

### **Logging**
- All operations are logged with timestamps
- Error details are captured
- Email sending status is tracked
- Cleanup statistics are reported

## Monitoring & Maintenance

### **Statistics Available**
- Total temporary passwords
- Expired passwords count
- Sent passwords count
- Cleanup success rate

### **Health Checks**
- Email service connectivity
- Encryption key validation
- Database connection status
- Cleanup process status

## Best Practices

### **Security**
1. Use a strong 32-character encryption key
2. Regularly rotate encryption keys
3. Monitor cleanup statistics
4. Review email sending logs

### **Performance**
1. Cleanup runs automatically every 5 minutes
2. Expired passwords are removed immediately
3. Email sending is asynchronous
4. Database operations are optimized

### **User Experience**
1. Clear email instructions
2. Prominent security warnings
3. Easy-to-copy credentials
4. Mobile-responsive design

## Troubleshooting

### **Common Issues**

1. **"Encryption key must be 32 characters"**
   - Set `TEMP_PASSWORD_ENCRYPTION_KEY` environment variable
   - Ensure it's exactly 32 characters long

2. **"Temporary password not found"**
   - Password may have expired (10 minutes)
   - Check if cleanup process is running
   - Verify tempPasswordId is correct

3. **"Email sending failed"**
   - Check Resend API key configuration
   - Verify sender email format
   - Check network connectivity

4. **"Cleanup not working"**
   - Check database permissions
   - Verify cleanup script execution
   - Check system logs for errors

### **Debug Commands**

```bash
# Check email service status
curl http://localhost:3000/api/email-status

# Run cleanup manually
npm run cleanup-temp-passwords

# Check environment variables
echo $TEMP_PASSWORD_ENCRYPTION_KEY
echo $RESEND_API_KEY
```

## Future Enhancements

### **Planned Features**
- Password strength requirements
- Custom expiration times per user type
- Email delivery tracking
- User notification preferences
- Audit trail for password creation

### **Security Improvements**
- Rate limiting for password creation
- IP-based restrictions
- Multi-factor authentication for admins
- Password history tracking

## Support

For issues or questions about the Temporary Password System:

1. Check the troubleshooting section above
2. Review system logs for error details
3. Verify environment variable configuration
4. Test email service connectivity
5. Run manual cleanup script

The system is designed to be robust and self-healing, with automatic cleanup and comprehensive error handling to ensure reliable operation.
