'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Shield, Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth/auth.service';
import { HealthcareCaptcha } from '@/components/ui/healthcare-captcha';
import { LockoutTimer } from '@/components/ui/lockout-timer';
import { securityService } from '@/lib/services/security.service';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaCompleted, setCaptchaCompleted] = useState(false);
  const [lockoutRecord, setLockoutRecord] = useState<any>(null);
  const router = useRouter();

  // Check for account lockout when email changes
  useEffect(() => {
    const checkLockout = async () => {
      if (email) {
        try {
          const { locked, record } = await securityService.isAccountLocked(email);
          if (locked && record) {
            setLockoutRecord(record);
          } else {
            setLockoutRecord(null);
          }
        } catch (error) {
          console.error('Error checking lockout status:', error);
        }
      }
    };

    const timeoutId = setTimeout(checkLockout, 500); // Debounce
    return () => clearTimeout(timeoutId);
  }, [email]);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    // Show captcha first
    setShowCaptcha(true);
  };

  const handleCaptchaComplete = async (isValid: boolean) => {
    if (isValid) {
      setCaptchaCompleted(true);
      setShowCaptcha(false);
      setIsLoading(true);
      setError('');

      try {
        // Only now proceed with Firebase authentication
        const adminUser = await authService.signIn(email, password);
        
        // Store user info in localStorage for UI purposes
        localStorage.setItem('userRole', adminUser.role);
        localStorage.setItem('userEmail', adminUser.email);
        localStorage.setItem('userDisplayName', adminUser.displayName);
        
        // Navigate to dashboard
        router.push('/dashboard');
      } catch (error: any) {
        console.error('Login error:', error);
        setError(error.message || 'Invalid email or password. Please try again.');
        setCaptchaCompleted(false);
        
        // Check for lockout after failed attempt
        try {
          const { locked, record } = await securityService.isAccountLocked(email);
          if (locked && record) {
            setLockoutRecord(record);
          }
        } catch (lockoutError) {
          console.error('Error checking lockout after failed attempt:', lockoutError);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setError('Security verification failed. Please try again.');
    }
  };

  const handleCaptchaReset = () => {
    setCaptchaCompleted(false);
    setError('');
  };

  const handleLockoutExpired = () => {
    setLockoutRecord(null);
    setError('');
  };



  return (
    <div className="min-h-screen healthcare-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Branding */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-primary rounded-full p-3">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-primary">UniHealth</h1>
              <p className="text-sm text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <div className="flex items-center justify-center space-x-1 text-sm text-muted-foreground">
            <Shield className="h-4 w-4" />
            <span>Secure Administrative Access</span>
          </div>
        </div>

        {/* Login Form */}
        <Card className="card-shadow">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-semibold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@unihealth.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-11 w-10"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>



              <Button
                type="submit"
                className="w-full h-11"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Security Notice */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700 font-medium">
                  Enhanced Security
                </span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Multiple failed attempts will temporarily lock your account
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="text-center text-xs text-muted-foreground space-y-1">
          <p>This system is protected by advanced security measures</p>
          <p>Unauthorized access attempts will be logged and reported</p>
        </div>
      </div>

      {/* Healthcare Captcha */}
      {showCaptcha && (
        <HealthcareCaptcha
          onComplete={handleCaptchaComplete}
          onReset={handleCaptchaReset}
        />
      )}

      {/* Lockout Timer */}
      {lockoutRecord && lockoutRecord.lockoutUntil && (
        <LockoutTimer
          lockoutUntil={lockoutRecord.lockoutUntil}
          onExpired={handleLockoutExpired}
        />
      )}


    </div>
  );
}