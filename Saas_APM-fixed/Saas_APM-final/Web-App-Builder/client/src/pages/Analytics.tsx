import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Activity, Target } from "lucide-react";

interface RetentionData {
  day: number;
  retained: number;
  percentage: number;
}

interface GrowthMetrics {
  newUsers: number;
  returningUsers: number;
  churnRate: number;
  growthRate: number;
}

interface FunnelStage {
  stage: string;
  users: number;
}

interface CohortRow {
  cohort: string;
  week0: number;
  week1: number;
  week2: number;
  week3: number;
}

interface SegmentRow {
  name: string;
  count: number;
}

export default function Analytics() {
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);
  const [growthMetrics, setGrowthMetrics] = useState<GrowthMetrics | null>(null);
  const [funnelData, setFunnelData] = useState<FunnelStage[]>([]);
  const [cohortData, setCohortData] = useState<CohortRow[]>([]);
  const [segmentData, setSegmentData] = useState<SegmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [retentionRes, growthRes, funnelRes, cohortsRes, segmentsRes] = await Promise.all([
        fetch("/api/analytics/retention"),
        fetch("/api/analytics/growth"),
        fetch("/api/analytics/funnels"),
        fetch("/api/analytics/cohorts"),
        fetch("/api/analytics/segments"),
      ]);

      if (retentionRes.ok) {
        const data = await retentionRes.json();
        setRetentionData(data.days || []);
      }

      if (growthRes.ok) {
        const data = await growthRes.json();
        setGrowthMetrics(data);
      }

      if (funnelRes.ok) {
        const data = await funnelRes.json();
        setFunnelData(data || []);
      }

      if (cohortsRes.ok) {
        const data = await cohortsRes.json();
        setCohortData(data || []);
      }

      if (segmentsRes.ok) {
        const data = await segmentsRes.json();
        setSegmentData(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl md:text-4xl text-foreground">Analytics</h1>
        <p className="text-muted-foreground mt-1">
          In-depth product metrics and user behavior analysis.
        </p>
      </div>

      {/* Key Metrics */}
      {growthMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  New Users
                </p>
                <p className="text-2xl font-bold mt-2">
                  {growthMetrics.newUsers}
                </p>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Returning Users
                </p>
                <p className="text-2xl font-bold mt-2">
                  {growthMetrics.returningUsers}
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Churn Rate
                </p>
                <p className="text-2xl font-bold mt-2">
                  {growthMetrics.churnRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Target className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Growth Rate
                </p>
                <p className="text-2xl font-bold mt-2">
                  +{growthMetrics.growthRate.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Retention Analysis */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Retention Curve</h2>
        {retentionData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={retentionData}>
              <defs>
                <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" label={{ value: "Days", position: "right", offset: -5 }} />
              <YAxis label={{ value: "Retention %", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderRadius: "8px",
                  border: "1px solid hsl(var(--border))",
                }}
              />
              <Area
                type="monotone"
                dataKey="percentage"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRetention)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Loading retention data...
          </div>
        )}
      </div>

      {/* Funnel Analysis */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Conversion Funnel</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={funnelData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="stage" />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderRadius: "8px",
                border: "1px solid hsl(var(--border))",
              }}
            />
            <Bar dataKey="users" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {funnelData.map((stage, index) => {
            const dropoff =
              index === 0
                ? 0
                : ((funnelData[index - 1].users - stage.users) /
                    Math.max(funnelData[index - 1].users, 1)) *
                  100;

            return (
              <div
                key={index}
                className="p-4 bg-secondary/30 rounded-lg text-center"
              >
                <p className="text-sm font-medium text-muted-foreground">
                  {stage.stage}
                </p>
                <p className="text-2xl font-bold mt-2">{stage.users}</p>
                {index > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    -{dropoff.toFixed(1)}% drop
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cohort Analysis */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">Cohort Analysis</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left font-semibold">Cohort</th>
                <th className="px-4 py-3 text-center font-semibold">Week 0</th>
                <th className="px-4 py-3 text-center font-semibold">Week 1</th>
                <th className="px-4 py-3 text-center font-semibold">Week 2</th>
                <th className="px-4 py-3 text-center font-semibold">Week 3</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((row, index) => (
                <tr key={index} className="border-b border-border/50">
                  <td className="px-4 py-3 font-medium">{row.cohort}</td>
                  <td className="px-4 py-3 text-center">{row.week0}</td>
                  <td className="px-4 py-3 text-center">
                    {row.week1 ? (
                      <>
                        {row.week1}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({((row.week1 / row.week0) * 100).toFixed(0)}%)
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.week2 ? (
                      <>
                        {row.week2}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({((row.week2 / row.week0) * 100).toFixed(0)}%)
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.week3 ? (
                      <>
                        {row.week3}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({((row.week3 / row.week0) * 100).toFixed(0)}%)
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Segments */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-6">User Segments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {segmentData.map((segment, index) => (
            <div
              key={index}
              className="p-4 bg-secondary/30 rounded-lg border border-border"
            >
              <p className="text-sm font-medium text-muted-foreground">
                {segment.name}
              </p>
              <div className="flex items-baseline justify-between mt-2">
                <p className="text-2xl font-bold">{segment.count}</p>
                <span className="text-xs font-medium text-muted-foreground">
                  users
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
