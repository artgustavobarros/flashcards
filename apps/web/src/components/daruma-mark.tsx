import { cn } from "cn";

// The Daruma doll: rounded body, face cut out, only one eye painted in.
export function DarumaMark({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("size-[1.15em] shrink-0", className)}
      fill="currentColor"
      viewBox="0 0 32 32"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M16 2.5C8.6 2.5 3.5 8.6 3.5 16.6c0 7.4 5.2 12.9 12.5 12.9s12.5-5.5 12.5-12.9C28.5 8.6 23.4 2.5 16 2.5ZM16 7.6c5 0 8.6 2.6 8.6 6.4 0 3.9-3.8 6.6-8.6 6.6s-8.6-2.7-8.6-6.6c0-3.8 3.6-6.4 8.6-6.4Z"
        fillRule="evenodd"
      />
      <circle cx="19.9" cy="13.4" r="2.5" />
      <circle
        cx="12.1"
        cy="13.4"
        fill="none"
        r="1.9"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M12.3 16.9c.8 1.5 2.7 1.7 3.7.6 1 1.1 2.9.9 3.7-.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.3"
      />
    </svg>
  );
}

export function DarumaLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 font-heading font-semibold text-2xl text-primary tracking-tight",
        className
      )}
    >
      <DarumaMark />
      Daruma
    </span>
  );
}
