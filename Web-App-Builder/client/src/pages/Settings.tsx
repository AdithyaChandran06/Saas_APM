import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { User, Bell, Lock, Globe, Code, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Settings {
  dataCollectionEnabled: boolean;
  aiAnalysisFrequency: "realtime" | "daily" | "weekly";
  retentionDays: number;
  privacyMode: boolean;
  sampleRate: number;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: "demo_user",
    email: "demo@example.com",
    firstName: "Demo",
    lastName: "User",
  });
  const [settings, setSettings] = useState<Settings>({
    dataCollectionEnabled: true,
    aiAnalysisFrequency: "daily",
    retentionDays: 90,
    privacyMode: false,
    sampleRate: 1.0,
  });
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");

  useEffect(() => {
    fetchSettings();
    fetchProfile();
    fetchApiKeys();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  };

  const fetchApiKeys = async () => {
    try {
      const response = await fetch("/api/api-keys");
      const data = await response.json();
      setApiKeys(data);
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    }
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSettingChange = (field: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const saveProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
        }),
      });

      if (!response.ok) throw new Error("Failed to update profile");

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error("Failed to update settings");

      toast({
        title: "Success",
        description: "Settings updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Key name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!response.ok) throw new Error("Failed to generate key");

      const newKey = await response.json();
      setApiKeys((prev) => [...prev, newKey]);
      setNewKeyName("");
      setShowNewKeyModal(false);

      toast({
        title: "Success",
        description: "API Key generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete key");

      setApiKeys((prev) => prev.filter((key) => key.id !== id));

      toast({
        title: "Success",
        description: "API Key deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl md:text-4xl text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and workspace configuration.</p>
      </div>

      {/* Profile Information */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) =>
                  handleProfileChange("firstName", e.target.value)
                }
                className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => handleProfileChange("lastName", e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => handleProfileChange("email", e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20 focus:border-transparent"
              />
            </div>
          </div>
          <div className="pt-4">
            <Button onClick={saveProfile} disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Workspace Settings */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Workspace Settings
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
            <div>
              <h3 className="font-medium">Data Collection</h3>
              <p className="text-sm text-muted-foreground">
                Enable automatic event tracking
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange(
                  "dataCollectionEnabled",
                  !settings.dataCollectionEnabled
                )
              }
              className={`w-11 h-6 rounded-full relative transition-colors ${
                settings.dataCollectionEnabled
                  ? "bg-primary"
                  : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  settings.dataCollectionEnabled ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">AI Analysis Frequency</label>
            <select
              value={settings.aiAnalysisFrequency}
              onChange={(e) =>
                handleSettingChange(
                  "aiAnalysisFrequency",
                  e.target.value as any
                )
              }
              className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20"
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Data Retention Days ({settings.retentionDays})
            </label>
            <input
              type="range"
              min="7"
              max="365"
              value={settings.retentionDays}
              onChange={(e) =>
                handleSettingChange("retentionDays", parseInt(e.target.value))
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              How long to keep historical data
            </p>
          </div>

          <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl">
            <div>
              <h3 className="font-medium">Privacy Mode</h3>
              <p className="text-sm text-muted-foreground">
                Exclude sensitive user data
              </p>
            </div>
            <button
              onClick={() =>
                handleSettingChange("privacyMode", !settings.privacyMode)
              }
              className={`w-11 h-6 rounded-full relative transition-colors ${
                settings.privacyMode ? "bg-primary" : "bg-muted"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                  settings.privacyMode ? "right-1" : "left-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Sample Rate ({(settings.sampleRate * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.sampleRate}
              onChange={(e) =>
                handleSettingChange("sampleRate", parseFloat(e.target.value))
              }
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              % of events to track (reduce to lower storage usage)
            </p>
          </div>

          <div className="pt-4">
            <Button onClick={saveSettings} disabled={loading}>
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            API Keys
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNewKeyModal(true)}
          >
            Generate Key
          </Button>
        </div>
        <div className="p-6 space-y-4">
          {apiKeys.length > 0 ? (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 bg-secondary/30 rounded-xl"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{key.name}</p>
                    <p className="text-sm text-muted-foreground font-mono truncate">
                      {key.key}
                    </p>
                    {key.lastUsed && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used:{" "}
                        {new Date(key.lastUsed).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteApiKey(key.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              No API keys generated yet
            </p>
          )}

          {showNewKeyModal && (
            <div className="border-t border-border pt-4 space-y-3">
              <input
                type="text"
                placeholder="Key name (e.g., Development)"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-secondary/50 border border-border focus:ring-2 focus:ring-primary/20"
              />
              <div className="flex gap-2">
                <Button
                  onClick={generateApiKey}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? "Generating..." : "Generate"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewKeyModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden max-w-3xl">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-yellow-900">
                Two-factor authentication
              </p>
              <p className="text-yellow-800 text-xs mt-1">
                Coming soon. Enable 2FA to secure your account.
              </p>
            </div>
          </div>
          <Button variant="outline" disabled>
            Enable 2FA (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}
