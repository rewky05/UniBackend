import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

interface Doctor {
  id: string;
  name: string;
  specialty: string;
}

interface DoctorInfoBannerProps {
  doctor: Doctor;
}

export function DoctorInfoBanner({ doctor }: DoctorInfoBannerProps) {
  return (
    <Card className="card-shadow bg-primary/5 border-primary/20">
      <CardContent className="pt-6">
        <div className="flex items-center space-x-3">
          <div className="rounded-full bg-primary/10 p-2">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{doctor.name}</h3>
            <p className="text-muted-foreground">{doctor.specialty}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
