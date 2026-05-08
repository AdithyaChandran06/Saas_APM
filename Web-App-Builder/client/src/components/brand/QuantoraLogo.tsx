import { cn } from "@/lib/utils";

type QuantoraLogoProps = {
  className?: string;
  markClassName?: string;
  showWordmark?: boolean;
};

export function QuantoraLogo({ className, markClassName, showWordmark = true }: QuantoraLogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 48 48"
        role="img"
        aria-label="Quantora"
        className={cn("h-8 w-8 text-primary", markClassName)}
      >
        <rect width="48" height="48" rx="12" fill="currentColor" opacity="0.12" />
        <path
          d="M24 9.5c-8 0-14.5 6.1-14.5 13.7S16 36.9 24 36.9c2.7 0 5.2-.7 7.4-1.9l4.7 4.4 3.4-3.6-4.5-4.2c2.2-2.4 3.5-5.3 3.5-8.4C38.5 15.6 32 9.5 24 9.5Zm0 5.1c5 0 9.1 3.8 9.1 8.6 0 1.8-.6 3.5-1.6 4.9l-4.1-3.8-3.4 3.6 3.5 3.3c-1.1.4-2.3.6-3.5.6-5 0-9.1-3.8-9.1-8.6s4.1-8.6 9.1-8.6Z"
          fill="currentColor"
        />
        <path d="M21 20h10v4H21zM17 26h8v4h-8z" fill="currentColor" opacity="0.62" />
      </svg>
      {showWordmark && (
        <span className="text-xl font-display font-bold tracking-tight text-foreground">
          Quantora
        </span>
      )}
    </div>
  );
}
