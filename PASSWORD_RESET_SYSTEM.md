# Password Reset System with 3-Minute Expiration

## Overview

The password reset system has been updated to implement a **3-minute expiration time** for all password reset tokens. This provides enhanced security by ensuring that reset tokens expire quickly, reducing the window of opportunity for unauthorized access.

## Features

### ✅ **3-Minute Token Expiration**
- All password reset tokens expire after exactly 3 minutes
- Tokens are automatically cleaned up when expired
- Used tokens are immediately invalidated

### ✅ **Secure Token Generation**
- Cryptographically secure random tokens
- Timestamp-based token generation
- Unique tokens for each reset request

### ✅ **Automatic Cleanup**
- Expired tokens are automatically removed from the database
- Used tokens are marked and cleaned up
- Periodic cleanup prevents database bloat

### ✅ **Validation System**
- Real-time token validation
- Expiration time checking
- Usage status tracking

## Implementation Details

### **Files Created/Modified:**

1. **`lib/services/password-reset.service.ts`** - New password reset service
2. **`lib/auth/auth.service.ts`** - Updated to use new service
3. **`scripts/cleanup-expired-tokens.ts`** - Cleanup script
4. **`scripts/test-password-reset.ts`** - Test script

### **Key Components:**

#### **PasswordResetService Class**
```typescript
export class PasswordResetService {
  private readonly TOKEN_EXPIRATION_MINUTES = 3; // 3 minutes
  
  // Methods:
  - createPasswordResetToken(email: string): Promise<string>
  - validatePasswordResetToken(token: string): Promise<PasswordResetToken | null>
  - markTokenAsUsed(token: string): Promise<void>
  - cleanupExpiredTokens(): Promise<number>
  - sendPasswordResetEmail(email: string): Promise<void>
}
```

#### **Token Structure**
```typescript
interface PasswordResetToken {
  email: string;
  token: string;
  createdAt: number;
  expiresAt: number; // 3 minutes from creation
  used: boolean;
}
```

## Usage

### **Sending Password Reset Email**
```typescript
import { authService } from '@/lib/auth/auth.service';

// Send password reset email with 3-minute expiration
await authService.sendPasswordReset('user@example.com');
```

### **Validating Reset Token**
```typescript
import { passwordResetService } from '@/lib/services/password-reset.service';

// Validate a reset token
const tokenData = await passwordResetService.validatePasswordResetToken(token);
if (tokenData) {
  // Token is valid and not expired
  // Proceed with password reset
} else {
  // Token is invalid, expired, or already used
}
```

### **Manual Cleanup**
```bash
# Clean up expired tokens
npx tsx scripts/cleanup-expired-tokens.ts
```

### **Testing**
```bash
# Test the password reset system
npx tsx scripts/test-password-reset.ts
```

## Security Features

### **🔒 Token Security**
- **3-minute expiration**: Tokens expire quickly to minimize risk
- **One-time use**: Tokens are invalidated after first use
- **Automatic cleanup**: Expired tokens are removed from database
- **Secure generation**: Cryptographically secure random tokens

### **🛡️ Database Security**
- **Firebase Realtime Database**: Secure storage with authentication
- **Automatic cleanup**: Prevents database bloat
- **Usage tracking**: Prevents token reuse

### **⚡ Performance**
- **Efficient validation**: Fast token lookup and validation
- **Background cleanup**: Non-blocking token cleanup
- **Minimal overhead**: Lightweight implementation

## Configuration

### **Token Expiration Time**
The expiration time is configured in `lib/services/password-reset.service.ts`:

```typescript
private readonly TOKEN_EXPIRATION_MINUTES = 3; // 3 minutes
```

### **Cleanup Interval**
The session service includes password reset token cleanup in its periodic cleanup:

```typescript
// Cleanup runs every 5 minutes (configurable)
cleanupIntervalMinutes: 5
```

## Database Schema

### **Password Reset Tokens**
```
/password-reset-tokens/{token}
├── email: string
├── token: string
├── createdAt: number
├── expiresAt: number
└── used: boolean
```

## Error Handling

### **Common Error Scenarios**
1. **Token Expired**: Token has passed the 3-minute expiration
2. **Token Used**: Token has already been used for password reset
3. **Token Invalid**: Token doesn't exist in database
4. **Database Error**: Firebase connection issues

### **Error Messages**
- `"Failed to create password reset token"`
- `"Failed to send password reset email"`
- `"Token validation failed"`

## Testing

### **Test Coverage**
- ✅ Token creation with 3-minute expiration
- ✅ Token validation (valid, expired, used)
- ✅ Token usage tracking
- ✅ Expired token cleanup
- ✅ Error handling

### **Test Commands**
```bash
# Run password reset tests
npx tsx scripts/test-password-reset.ts

# Clean up expired tokens
npx tsx scripts/cleanup-expired-tokens.ts
```

## Migration Notes

### **From Previous System**
- **No breaking changes**: Existing password reset functionality continues to work
- **Enhanced security**: All new tokens have 3-minute expiration
- **Backward compatibility**: Old tokens are handled gracefully

### **Database Changes**
- New `password-reset-tokens` node in Firebase Realtime Database
- Automatic cleanup of old tokens
- No manual migration required

## Monitoring

### **Logs to Monitor**
- Token creation: `"Password reset token created for {email}, expires at {time}"`
- Token validation: `"Token validation failed"` or `"Token is valid"`
- Cleanup: `"Cleaned up {count} expired tokens"`

### **Metrics to Track**
- Number of password reset requests
- Token expiration rate
- Cleanup frequency
- Error rates

## Future Enhancements

### **Potential Improvements**
1. **Email Templates**: Custom email templates with expiration warnings
2. **Rate Limiting**: Prevent abuse of password reset functionality
3. **Audit Logging**: Track all password reset attempts
4. **Multi-factor Authentication**: Additional security layers
5. **Custom Expiration**: Configurable expiration times per user role

---

## Summary

The password reset system now implements **3-minute token expiration** for enhanced security. All password reset tokens automatically expire after 3 minutes, and the system includes comprehensive cleanup and validation mechanisms to ensure security and performance.

**Key Benefits:**
- 🔒 **Enhanced Security**: Quick token expiration reduces attack window
- 🧹 **Automatic Cleanup**: Prevents database bloat
- ✅ **Comprehensive Testing**: Full test coverage
- 📚 **Complete Documentation**: Easy to understand and maintain 