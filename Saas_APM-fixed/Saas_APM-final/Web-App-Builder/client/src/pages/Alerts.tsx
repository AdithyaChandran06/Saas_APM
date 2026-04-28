import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, AlertTriangle, CheckCircle2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: number | string;
  name: string;
  condition: string;
  threshold: number;
  metricType: string;
  enabled: boolean;
  channels: string[];
  triggered?: boolean;
  triggeredAt?: string;
  acknowledgedAt?: string;
}

export default function AlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewAlert, setShowNewAlert] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    condition: "",
    threshold: 5,
    metricType: "error_rate",
    channels: [] as string[],
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/alerts");
      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.condition.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to create alert");

      const newAlert = await response.json();
      setAlerts((prev) => [...prev, newAlert]);

      toast({
        title: "Success",
        description: "Alert created successfully",
      });

      // Reset form
      setFormData({
        name: "",
        condition: "",
        threshold: 5,
        metricType: "error_rate",
        channels: [],
      });
      setShowNewAlert(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create alert",
        variant: "destructive",
      });
    }
  };

  const toggleAlert = async (id: number | string) => {
    try {
      const alert = alerts.find((a) => a.id === id);
      if (!alert) return;

      const response = await fetch(`/api/alerts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !alert.enabled }),
      });

      if (!response.ok) throw new Error("Failed to update alert");

      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a))
      );

      toast({
        title: "Success",
        description: `Alert ${!alert.enabled ? "enabled" : "disabled"}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update alert",
        variant: "destructive",
      });
    }
  };

  const deleteAlert = async (id: number | string) => {
    try {
      const response = await fetch(`/api/alerts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete alert");

      setAlerts((prev) => prev.filter((a) => a.id !== id));

      toast({
        title: "Success",
        description: "Alert deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete alert",
        variant: "destructive",
      });
    }
  };

  const acknowledgeAlert = async (id: number | string) => {
    try {
      const response = await fetch(`/api/alerts/${id}/acknowledge`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to acknowledge alert");

      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, acknowledgedAt: new Date().toISOString() } : a
        )
      );

      toast({
        title: "Success",
        description: "Alert acknowledged",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl md:text-4xl text-foreground">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Set up automatic alerts for key metrics.
          </p>
        </div>
        <Button onClick={() => setShowNewAlert(!showNewAlert)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showNewAlert && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Create New Alert</h2>
          <form onSubmit={handleCreateAlert} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Alert Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="High Error Rate Alert"
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Metric Type
                </label>
                <select
                  value={formData.metricType}
                  onChange={(e) =>
                    setFormData({ ...formData, metricType: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary/20"
                >
                  <option value="error_rate">Error Rate</option>
                  <option value="response_time">Response Time (ms)</option>
                  <option value="event_count">Event Count</option>
                  <option value="user_activity">User Activity</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Threshold
                </label>
                <input
                  type="number"
                  value={formData.threshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      threshold: parseFloat(e.target.value),
                    })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Condition
                </label>
                <select
                  value={formData.condition}
                  onChange={(e) =>
                    setFormData({ ...formData, condition: e.target.value })
                  }
                  className="w-full px-4 py-2 rounded-lg bg-secondary border border-border focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select condition...</option>
                  <option value="greater_than">&gt; Greater Than</option>
                  <option value="less_than">&lt; Less Than</option>
                  <option value="equals">= Equals</option>
                  <option value="not_equals">≠ Not Equals</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Notification Channels
              </label>
              <div className="space-y-2">
                {["email", "slack", "webhook"].map((channel) => (
                  <label key={channel} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.channels.includes(channel)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({
                            ...formData,
                            channels: [...formData.channels, channel],
                          });
                        } else {
                          setFormData({
                            ...formData,
                            channels: formData.channels.filter(
                              (c) => c !== channel
                            ),
                          });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{channel}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit">Create Alert</Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowNewAlert(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading alerts...
          </div>
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-card border border-border rounded-2xl p-6 flex items-start justify-between"
            >
              <div className="flex gap-4 flex-1">
                <div className="flex-shrink-0 mt-1">
                  {alert.triggered ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{alert.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.metricType}: {alert.condition} {alert.threshold}
                  </p>

                  {alert.triggered && alert.triggeredAt && (
                    <p className="text-xs text-red-600 mt-2">
                      Triggered at {new Date(alert.triggeredAt).toLocaleString()}
                    </p>
                  )}

                  {alert.channels.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {alert.channels.map((channel) => (
                        <span
                          key={channel}
                          className="text-xs bg-secondary px-2 py-1 rounded-full"
                        >
                          {channel}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {alert.triggered && !alert.acknowledgedAt && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlert(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}

                <button
                  onClick={() => toggleAlert(alert.id)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${
                    alert.enabled
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {alert.enabled ? "Active" : "Inactive"}
                </button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteAlert(alert.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">
              No alerts created yet
            </h3>
            <p className="text-muted-foreground">
              Create your first alert to get notified about important metrics.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
