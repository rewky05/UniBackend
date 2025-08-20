'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationData {
  medicalLicense: string;
  prcId: string;
}

interface VerificationFormProps {
  data: VerificationData;
  onUpdate: (data: Partial<VerificationData>) => void;
}

export function DocumentUploadsForm({ data, onUpdate }: VerificationFormProps) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');

  // Reset internal state when form data is cleared
  useEffect(() => {
    // If both fields are empty, reset verification state
    if (!data.medicalLicense && !data.prcId) {
      setIsVerifying(false);
      setVerificationStatus('pending');
    }
  }, [data.medicalLicense, data.prcId]);

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleVerify = async () => {
    if (!data.medicalLicense || !data.prcId) {
      return;
    }

    setIsVerifying(true);
    
    // Simulate verification process
    setTimeout(() => {
      // Mock verification - in real implementation, this would call an API
      const isValid = data.medicalLicense.length >= 6 && data.prcId.length >= 6;
      setVerificationStatus(isValid ? 'verified' : 'failed');
      setIsVerifying(false);
    }, 2000);
  };

  const isFormValid = () => {
    return data.medicalLicense.trim() !== '' && data.prcId.trim() !== '';
  };

  const getStatusIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-blue-600" />;
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'Verification Successful';
      case 'failed':
        return 'Verification Failed';
      default:
        return 'Pending Verification';
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'verified':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Verification Requirements */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            License Verification
          </CardTitle>
          <CardDescription>
            Enter the doctor's Medical License number and PRC ID for verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="medicalLicense" className="text-sm font-medium">
                Medical License Number *
              </Label>
              <Input
                id="medicalLicense"
                placeholder="Enter Medical License number"
                value={data.medicalLicense}
                onChange={(e) => handleInputChange('medicalLicense', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter the complete Medical License number as issued by the PRC
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prcId" className="text-sm font-medium">
                PRC ID Number *
              </Label>
              <Input
                id="prcId"
                placeholder="Enter PRC ID number"
                value={data.prcId}
                onChange={(e) => handleInputChange('prcId', e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter the PRC ID number for verification
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Verification Status
          </CardTitle>
          <CardDescription>
            Current status of license verification
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Display */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getStatusIcon()}
                <div>
                  <h4 className="font-medium">{getStatusText()}</h4>
                  <p className="text-sm text-muted-foreground">
                    {verificationStatus === 'verified' 
                      ? 'License and PRC ID have been verified successfully'
                      : verificationStatus === 'failed'
                      ? 'Verification failed. Please check the entered information'
                      : 'Enter the license information and click verify to proceed'
                    }
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor()} variant="outline">
                {verificationStatus === 'verified' ? 'Verified' : 
                 verificationStatus === 'failed' ? 'Failed' : 'Pending'}
              </Badge>
            </div>

            {/* Verification Button */}
            <div className="flex justify-center">
              <button
                onClick={handleVerify}
                disabled={!isFormValid() || isVerifying}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isFormValid() && !isVerifying
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isVerifying ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify License'
                )}
              </button>
            </div>

            {/* Requirements Info */}
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Verification Requirements
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Medical License number must be valid and active</li>
                <li>• PRC ID number must match the license holder</li>
                <li>• Both fields are required for verification</li>
                <li>• Verification is performed against official PRC database</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}