import { Heart } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingScreen({ message = "Loading...", fullScreen = true }: LoadingScreenProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Heart className="h-4 w-4 text-primary-600" fill="currentColor" />
        </div>
      </div>
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        {content}
      </div>
    );
  }

  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      {content}
    </div>
  );
}
