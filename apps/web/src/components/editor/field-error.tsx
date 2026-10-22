import { CircleAlert } from "lucide-react";

export function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }
  return (
    <p
      className="flex items-center gap-1.5 text-destructive text-sm"
      role="alert"
    >
      <CircleAlert className="size-4" />
      {message}
    </p>
  );
}
