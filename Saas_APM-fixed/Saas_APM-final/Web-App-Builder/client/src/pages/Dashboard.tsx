import { useStats, useErrorsData, usePerformanceData } from "@/hooks/use-pm-data";
import { KPICard } from "@/components/ui/KPICard";
import { DataSimulator } from "@/components/DataSimulator";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  CartesianGrid
} from "recharts";
import { Activity, MessageSquare, Users, Sparkles, TrendingUp, Zap, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();
  const { data: errorsData } = useErrorsData();
  const { data: perfData } = usePerformanceData();

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in">
        <div className="h-8 w-48 bg-muted rounded-md animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-96 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  // Transform recent activity for charts
  const activityData = stats?.recentActivity.reduce((acc: any[], event) => {
    const date = format(new Date(event.timestamp!), 'HH:mm');
    const existing = acc.find(item => item.time === date);
    if (existing) {
      existing.count++;
    } else {
      acc.push({ time: date, count: 1 });
    }
    return acc;
  }, []).slice(-20) || [];

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-foreground">Overview</h1>
          <p className="text-muted-foreground mt-1">Real-time product insights and AI analysis.</p>
        </div>
        <Link href="/recommendations">
          <Button className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all">
            <Sparkles className="mr-2 h-4 w-4" />
            View AI Insights
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
        <KPICard
          title="Total Events"
          value={stats?.totalEvents || 0}
          icon={<Activity className="h-6 w-6" />}
          trend="+12%"
          trendUp={true}
          className="delay-100 animate-in"
        />
        <KPICard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon={<Users className="h-6 w-6" />}
          trend="+5%"
          trendUp={true}
          className="delay-200 animate-in"
        />
        <KPICard
          title="Feedback Received"
          value={stats?.totalFeedback || 0}
          icon={<MessageSquare className="h-6 w-6" />}
          trend="New"
          trendUp={true}
          className="delay-300 animate-in"
        />
        <KPICard
          title="Error Rate"
          value={`${errorsData?.errorRatePercent ?? 0}%`}
          icon={<AlertTriangle className="h-6 w-6" />}
          trend={errorsData && errorsData.errorRatePercent > 5 ? "High" : "OK"}
          trendUp={errorsData ? errorsData.errorRatePercent <= 5 : true}
          className="delay-400 animate-in"
        />
        <KPICard
          title="p95 Latency"
          value={(() => {
            const routes = perfData?.routes ?? [];
            if (routes.length === 0) return "—";
            const max = Math.max(...routes.map((r) => r.p95Ms));
            return `${max}ms`;
          })()}
          icon={<Zap className="h-6 w-6" />}
          trend={(() => {
            const routes = perfData?.routes ?? [];
            if (routes.length === 0) return "—";
            const max = Math.max(...routes.map((r) => r.p95Ms));
            return max > 500 ? "Slow" : "Fast";
          })()}
          trendUp={(() => {
            const routes = perfData?.routes ?? [];
            if (routes.length === 0) return true;
            return Math.max(...routes.map((r) => r.p95Ms)) <= 500;
          })()}
          className="delay-500 animate-in"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Chart */}
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col delay-200 animate-in">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-bold text-lg">Event Velocity</h3>
            <div className="p-2 bg-secondary rounded-lg">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex-1 w-full min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '8px', 
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                  }}
                  cursor={{ stroke: 'hsl(var(--border))', strokeWidth: 2 }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Events List */}
        <div className="glass-card rounded-2xl p-6 h-[400px] flex flex-col delay-300 animate-in">
          <h3 className="font-display font-bold text-lg mb-6">Recent Activity</h3>
          <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {stats?.recentActivity.map((event, i) => (
              <div key={event.id} className="flex items-center gap-4 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/60 transition-colors">
                <div className={`
                  w-2 h-2 rounded-full shrink-0
                  ${event.type === 'error' ? 'bg-red-500' : 'bg-primary'}
                `} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {event.type.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {event.url || 'N/A'}
                  </p>
                </div>
                <div className="text-xs text-muted-foreground whitespace-nowrap">
                  {format(new Date(event.timestamp!), 'HH:mm:ss')}
                </div>
              </div>
            ))}
            {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
              <div className="text-center text-muted-foreground py-8">
                No recent events found.
              </div>
            )}
          </div>
        </div>
      </div>

      <DataSimulator />

      {/* Performance & Error Telemetry */}
      {perfData && perfData.routes.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Slowest Routes */}
          <div className="glass-card rounded-2xl p-6 animate-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Slowest Routes</h3>
                <p className="text-xs text-muted-foreground">p95 latency · last {perfData.routes.reduce((s, r) => s + r.requestCount, 0)} requests</p>
              </div>
            </div>
            <div className="space-y-3">
              {[...perfData.routes]
                .sort((a, b) => b.p95Ms - a.p95Ms)
                .slice(0, 6)
                .map((route) => (
                  <div key={route.path} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground truncate flex-1 min-w-0">{route.path}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(100, (route.p95Ms / Math.max(...perfData.routes.map(r => r.p95Ms))) * 100)}%`,
                            background: route.p95Ms > 500 ? "hsl(var(--destructive))" : "hsl(var(--primary))",
                          }}
                        />
                      </div>
                      <span className={`text-xs font-medium w-14 text-right ${route.p95Ms > 500 ? "text-destructive" : "text-foreground"}`}>
                        {route.p95Ms}ms
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Recent Errors */}
          <div className="glass-card rounded-2xl p-6 animate-in">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-destructive/10 rounded-lg text-destructive">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Recent Errors</h3>
                <p className="text-xs text-muted-foreground">
                  {errorsData?.errorRatePercent ?? 0}% error rate · {errorsData?.totalErrors ?? 0} of {errorsData?.totalRequests ?? 0} requests
                </p>
              </div>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-48 custom-scrollbar">
              {errorsData && errorsData.recentErrors.length > 0 ? (
                errorsData.recentErrors.slice(0, 8).map((err, i) => (
                  <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-destructive/5 border border-destructive/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-foreground truncate">{err.method} {err.path}</p>
                      {err.message && <p className="text-xs text-muted-foreground truncate mt-0.5">{err.message}</p>}
                      <p className="text-xs text-muted-foreground mt-0.5">{new Date(err.timestamp).toLocaleTimeString()} · {err.statusCode || "client"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No errors recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
