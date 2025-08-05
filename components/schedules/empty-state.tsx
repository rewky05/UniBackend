import { Card, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";

export function EmptyState() {
  return (
    <Card className="card-shadow">
      <CardContent className="flex flex-col items-center justify-center py-16">
        <div className="rounded-full bg-muted p-4 mb-4">
          <User className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">
          Select a doctor to view their schedule
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Choose a doctor from the dropdown above to manage their weekly
          schedules and clinic affiliations.
        </p>
      </CardContent>
    </Card>
  );
}
