import { cn, getInitials } from "@fundordonate/utils";

export interface AvatarProps {
  src?: string | null;
  alt?: string;
  firstName?: string | null;
  lastName?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, alt, firstName, lastName, size = "md", className }: AvatarProps) {
  const initials = getInitials(firstName, lastName);
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  if (src) {
    return (
      <img
        src={src}
        alt={alt || `${firstName} ${lastName}`}
        className={cn("rounded-full object-cover", sizeClasses[size], className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-primary-100 font-medium text-primary-700",
        sizeClasses[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
