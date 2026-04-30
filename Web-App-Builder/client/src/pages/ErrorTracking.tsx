import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, Clock, XCircle } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "recharts";
import { format } from "date-fns";

interface ErrorEvent {
  id: number;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  message?: string;
  context?: Record<string, unknown>;
}

interface ErrorMetrics {
  totalErrors: number;
  errorRate: number;
  avgDurationMs: number;
  topPaths: Array<{ path: string; count: number; avgDuration: number }>;
  recentErrors: ErrorEvent[];
  errorTrend: Array<{ time: string; count: number }>;
}

export default function ErrorTracking() {
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchErrorMetrics();
    const interval = setInterval(fetchErrorMetrics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchErrorMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/errors");
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error("Failed to fetch error metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-muted-foreground">No error data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          Error Tracking
        </h1>
        <p className="text-muted-foreground mt-1">Monitor and troubleshoot application errors</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Errors</p>
              <p className="text-3xl font-bold mt-2">{metrics.totalErrors}</p>
            </div>
            <XCircle className="h-5 w-5 text-red-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Error Rate</p>
              <p className="text-3xl font-bold mt-2">{metrics.errorRate.toFixed(2)}%</p>
            </div>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
              <p className="text-3xl font-bold mt-2">{metrics.avgDurationMs.toFixed(0)}ms</p>
            </div>
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
        </Card>
      </div>

      {/* Error Trend Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Error Trend (24h)</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={metrics.errorTrend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#ef4444" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Top Error Paths */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Top Error Paths</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="text-left py-2 px-4">Path</th>
                <th className="text-left py-2 px-4">Error Count</th>
                <th className="text-left py-2 px-4">Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {metrics.topPaths.map((path, idx) => (
                <tr key={idx} className="border-b hover:bg-muted/50">
                  <td className="py-2 px-4 font-mono text-xs text-muted-foreground">{path.path}</td>
                  <td className="py-2 px-4">{path.count}</td>
                  <td className="py-2 px-4">{path.avgDuration.toFixed(0)}ms</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Errors */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Errors</h2>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {metrics.recentErrors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent errors</p>
          ) : (
            metrics.recentErrors.map((error) => (
              <div
                key={error.id}
                className="flex items-start justify-between p-3 bg-muted/50 rounded border border-border"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                      {error.statusCode}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      {error.method} {error.path}
                    </span>
                  </div>
                  {error.message && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{error.message}</p>
                  )}
                </div>
                <div className="text-xs text-muted-foreground ml-4 whitespace-nowrap">
                  {format(new Date(error.timestamp), "HH:mm:ss")}
                  <div className="text-xs">{error.durationMs}ms</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
