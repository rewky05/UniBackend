"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Upload, X } from "lucide-react";
import { useState, useEffect } from "react";

interface PersonalInfoData {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  email: string;
  phone: string;
  address: string;
  dateOfBirth: string;
  gender: string;
  civilStatus: string;
  avatar?: File | null;
  temporaryPassword?: string; // TEMPORARY: For testing purposes
}

interface PersonalInfoFormProps {
  data: PersonalInfoData;
  onUpdate: (data: Partial<PersonalInfoData>) => void;
}

const SUFFIXES = ["Jr.", "Sr.", "II", "III", "IV", "V", "Dr.", "MD", "PhD"];

const GENDERS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer-not-to-say", label: "Prefer not to say" },
];

const CIVIL_STATUS = [
  { value: "single", label: "Single" },
  { value: "married", label: "Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
  { value: "separated", label: "Separated" },
];

export function PersonalInfoForm({ data, onUpdate }: PersonalInfoFormProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Reset internal state when form data is cleared
  useEffect(() => {
    // If all personal info fields are empty, clear internal state
    const isFormEmpty = !data.firstName && !data.lastName && !data.email && !data.phone;
    if (isFormEmpty) {
      setAvatarPreview(null);
    }
  }, [data.firstName, data.lastName, data.email, data.phone]);

  const handleInputChange = (field: keyof PersonalInfoData, value: string) => {
    onUpdate({ [field]: value });
  };

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpdate({ avatar: file });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    onUpdate({ avatar: null });
    setAvatarPreview(null);
  };

  const getInitials = () => {
    return `${data.firstName.charAt(0)}${data.middleName?.charAt(0) || ''}${data.lastName.charAt(
      0
    )}`.toUpperCase();
  };

  return (
    <div className="space-y-6">
      {/* Basic Details */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Basic Details
          </CardTitle>
          <CardDescription>
            Enter the doctor&apos;s personal identification information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={data.firstName || ''}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">
                Middle Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="middleName"
                placeholder="Enter middle name"
                value={data.middleName || ''}
                onChange={(e) => handleInputChange("middleName", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={data.lastName || ''}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                required
              />
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">
                Email Address <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@example.com"
                value={data.email || ''}
                onChange={(e) => handleInputChange("email", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">
                Temporary Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="temporaryPassword"
                type="password"
                placeholder="Enter temporary password"
                value={data.temporaryPassword || ''}
                onChange={(e) => handleInputChange("temporaryPassword", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+63 917 123 4567"
                value={data.phone || ''}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suffix">
                Suffix <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.suffix || ''}
                onValueChange={(value) => handleInputChange("suffix", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select suffix" />
                </SelectTrigger>
                <SelectContent>
                  {SUFFIXES.map((suffix) => (
                    <SelectItem key={suffix} value={suffix}>
                      {suffix}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>



          <div className="space-y-2">
            <Label htmlFor="address">
              Address <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="address"
              placeholder="Enter complete address"
              value={data.address || ''}
              onChange={(e) => handleInputChange("address", e.target.value)}
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Demographics */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Demographics</CardTitle>
          <CardDescription>
            Additional personal information for records
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={data.dateOfBirth || ''}
                onChange={(e) =>
                  handleInputChange("dateOfBirth", e.target.value)
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gender">
                Gender <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.gender || ''}
                onValueChange={(value) => handleInputChange("gender", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value} value={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="civilStatus">
                Civil Status <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.civilStatus || ''}
                onValueChange={(value) =>
                  handleInputChange("civilStatus", value)
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select civil status" />
                </SelectTrigger>
                <SelectContent>
                  {CIVIL_STATUS.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Picture */}
      <Card className="card-shadow">
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a professional photo (optional)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarPreview || ""} />
              <AvatarFallback className="text-lg">
                {data.firstName || data.middleName || data.lastName ? (
                  getInitials()
                ) : (
                  <User className="h-8 w-8" />
                )}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    document.getElementById("avatar-upload")?.click()
                  }
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
                {(data.avatar || avatarPreview) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={removeAvatar}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Recommended: Square image, at least 200x200px, max 5MB
              </p>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}