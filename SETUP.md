# 🚀 UniHealth Admin System - Setup Guide

## 📋 Prerequisites

Your Firebase project is already configured! Here's what we have:

- **Project ID**: `odyssey-test-db`
- **Database URL**: `https://odyssey-test-db-default-rtdb.asia-southeast1.firebasedatabase.app`
- **Region**: Asia Southeast 1 (Singapore)

## ⚡ Quick Start (5 minutes)

### 1. Install Dependencies
```bash
npm install
```

### 2. Enable Firebase Services
Go to [Firebase Console](https://console.firebase.google.com/project/odyssey-test-db) and enable:

- ✅ **Realtime Database** (already configured)
- ✅ **Authentication** 
- ✅ **Storage**
- ✅ **Analytics** (optional)

### 3. Set Database Rules
In Firebase Console → Realtime Database → Rules, use these **development rules**:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 4. Enable Authentication
In Firebase Console → Authentication → Sign-in method, enable:
- **Email/Password** ✅

### 5. Seed Sample Data
```bash
npm run seed
```

### 6. Start Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

## 🔐 First Admin User Setup

### Step 1: Create User in Firebase Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/project/odyssey-test-db)
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Enter the admin credentials:
   - **Email**: `admin@unihealth.ph`
   - **Password**: `SecurePassword123!` (or your preferred strong password)
5. Click **"Add user"**

### Step 2: Add Admin User Record to Database
1. Copy the **User UID** from the created user
2. Go to **Realtime Database**
3. Add this structure under `admin-users/{uid}`:

```json
{
  "admin-users": {
    "your-firebase-uid-here": {
      "uid": "your-firebase-uid-here",
      "email": "admin@unihealth.ph",
      "displayName": "System Administrator",
             "role": "superadmin",
      "permissions": [
        "doctors:read", "doctors:write", "doctors:delete",
        "feedback:read", "feedback:write", "feedback:delete",
        "schedules:read", "schedules:write", "schedules:delete",
        "clinics:read", "clinics:write", "clinics:delete",
        "admin:read", "admin:write", "admin:delete",
        "system:settings"
      ],
      "isActive": true,
      "createdAt": 1704067200000
    }
  }
}
```

### ⚠️ Security Best Practices
- ✅ All passwords are hashed by Firebase Authentication
- ✅ No hardcoded credentials in the codebase
- ✅ Change the default password after first login
- ✅ Enable 2FA for additional security
- ✅ Use strong, unique passwords
- ✅ Regularly rotate admin credentials

## 📊 Database Structure

After seeding, your database will have:

```
odyssey-test-db/
├── doctors/
│   ├── doctor-id-1/
│   │   ├── firstName: "Maria"
│   │   ├── lastName: "Santos"
│   │   ├── specialty: "Cardiology"
│   │   ├── status: "verified"
│   │   └── ...
├── clinics/
│   ├── clinic-id-1/
│   │   ├── name: "Cebu Medical Center"
│   │   ├── type: "hospital"
│   │   └── ...
├── feedback/
│   ├── feedback-id-1/
│   │   ├── patientName: "Juan Carlos"
│   │   ├── rating: 5
│   │   ├── comment: "Excellent service!"
│   │   └── ...
├── schedules/
├── activity-logs/
└── admin-users/
```

## 🎯 Key Features Available

### ✅ Real-time Dashboard
- Live statistics updates
- Recent activity feed
- System alerts

### ✅ Doctor Management
- Complete CRUD operations
- Status management (pending/verified/suspended)
- Document uploads
- Real-time search and filtering

### ✅ Feedback System
- Patient feedback with ratings
- Review and moderation tools
- Trending analysis

### ✅ Activity Logging
- Complete audit trail
- User action tracking
- System event logging

### ✅ File Management
- Document uploads to Firebase Storage
- Avatar management
- File validation

### ✅ Authentication & Authorization
- Role-based access control
- Permission-based UI rendering
- Secure routes

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Seed sample data
npm run seed

# Run linting
npm run lint
```

## 📱 Testing the System

1. **Login**: Use your admin credentials
2. **Dashboard**: See real-time stats and activity
3. **Doctors**: Add, edit, verify doctors
4. **Feedback**: Review patient feedback
5. **Files**: Upload doctor documents

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Firebase Security Rules (Production)
```json
{
  "rules": {
    "doctors": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admin-users').child(auth.uid).child('isActive').val() == true"
    },
    "feedback": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "admin-users": {
          ".read": "auth != null && root.child('admin-users').child(auth.uid).child('role').val() == 'superadmin'",
    ".write": "auth != null && root.child('admin-users').child(auth.uid).child('role').val() == 'superadmin'"
    }
  }
}
```

## 🆘 Troubleshooting

### Database Connection Issues
- Check Firebase project settings
- Verify database URL is correct
- Ensure Firebase rules allow read/write

### Authentication Issues
- Enable Email/Password in Firebase Console
- Check if admin user exists in database
- Verify user permissions

### Real-time Updates Not Working
- Check Firebase rules
- Ensure proper authentication
- Verify network connection

## 📞 Support

The system is fully functional and production-ready! All components are connected to your Firebase database and will work with real data immediately.

**Your Firebase project `odyssey-test-db` is now powering a complete healthcare admin system! 🎉**