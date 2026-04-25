import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Activity, 
  MessageSquare, 
  Sparkles, 
  BarChart3,
  Bell,
  Settings, 
  LogOut,
  BrainCircuit
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Events', href: '/events', icon: Activity },
  { name: 'Feedback', href: '/feedback', icon: MessageSquare },
  { name: 'AI Insights', href: '/recommendations', icon: Sparkles },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Alerts', href: '/alerts', icon: Bell },
];

export function Sidebar() {
  const [location] = useLocation();
  const { logout } = useAuth();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r border-border">
      <div className="flex h-16 items-center px-6 border-b border-border/40">
        <BrainCircuit className="h-8 w-8 text-primary mr-2" />
        <span className="text-xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          PM-AI
        </span>
      </div>

      <div className="flex-1 flex flex-col gap-1 p-4 overflow-y-auto">
        <div className="text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
          Platform
        </div>
        {navigation.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                  isActive 
                    ? "bg-primary/10 text-primary shadow-sm" 
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon 
                  className={cn(
                    "h-5 w-5 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )} 
                />
                {item.name}
              </div>
            </Link>
          );
        })}

        <div className="mt-8 text-xs font-semibold text-muted-foreground mb-2 px-2 uppercase tracking-wider">
          System
        </div>
        <Link href="/settings">
          <div className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
            location === '/settings'
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}>
            <Settings className="h-5 w-5" />
            Settings
          </div>
        </Link>
      </div>

      <div className="p-4 border-t border-border/40">
        <button 
          onClick={() => logout()}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
