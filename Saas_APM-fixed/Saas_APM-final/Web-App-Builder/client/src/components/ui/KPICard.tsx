import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function KPICard({ title, value, icon, trend, trendUp, className }: KPICardProps) {
  return (
    <div className={cn(
      "bg-card rounded-2xl p-6 border border-border shadow-sm hover:shadow-md transition-shadow duration-300",
      className
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "text-xs font-semibold px-2 py-1 rounded-full",
            trendUp ? "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400" : "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400"
          )}>
            {trend}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-muted-foreground text-sm font-medium mb-1">{title}</h3>
        <div className="text-3xl font-display font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
