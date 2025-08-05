import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface ErrorMessageProps {
  error: string;
  onRetry?: () => void;
  className?: string;
  showIcon?: boolean;
}

export function ErrorMessage({ 
  error, 
  onRetry, 
  className,
  showIcon = true 
}: ErrorMessageProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8", className)}>
      {showIcon && (
        <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
      )}
      <h3 className="text-lg font-semibold text-red-600 mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
        {error}
      </p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
      )}
    </div>
  );
}