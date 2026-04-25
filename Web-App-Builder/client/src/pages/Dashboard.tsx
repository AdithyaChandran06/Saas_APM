import { useStats } from "@/hooks/use-pm-data";
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
import { Activity, MessageSquare, Users, Sparkles, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { data: stats, isLoading } = useStats();

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
    </div>
  );
}
