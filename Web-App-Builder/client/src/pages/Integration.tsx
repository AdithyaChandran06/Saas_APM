import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Plus, Trash2, Eye, EyeOff, Code, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DataSimulator } from "@/components/DataSimulator";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function Integration() {
  const { toast } = useToast();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [visibleKeyId, setVisibleKeyId] = useState<number | null>(null);
  const apiKeyForExamples = apiKeys[0]?.key;

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
      toast({
        title: "Error",
        description: "Failed to load API keys",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for the API key",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const newKey = await response.json();
        setApiKeys([newKey, ...apiKeys]);
        setNewKeyName("");
        setShowModal(false);
        toast({
          title: "Success",
          description: "API key created successfully",
        });
      } else {
        throw new Error("Failed to create API key");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create API key",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const deleteApiKey = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const response = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== id));
        toast({
          title: "Success",
          description: "API key deleted",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete API key",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="space-y-8 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-foreground">Integrations</h1>
          <p className="text-muted-foreground mt-1">
            Connect your applications to Quantora and start collecting events
          </p>
        </div>
        <Button
          onClick={() => setShowModal(true)}
          className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all"
        >
          <Plus className="mr-2 h-4 w-4" />
          New API Key
        </Button>
      </div>

      {/* API Keys Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-4">API Keys</h2>
          <p className="text-muted-foreground mb-6">
            Use API keys to authenticate requests from your applications. Keep them secret!
          </p>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl p-12 text-center bg-secondary/30">
              <Code className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No API keys yet</p>
              <Button
                onClick={() => setShowModal(true)}
                variant="outline"
              >
                Create your first API key
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((apiKey) => (
                <div
                  key={apiKey.id}
                  className="border border-border rounded-lg p-4 bg-card hover:shadow-md transition-all flex items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <p className="font-medium">{apiKey.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <code className="text-xs bg-secondary px-3 py-1 rounded font-mono">
                        {visibleKeyId === apiKey.id ? apiKey.key : apiKey.key.substring(0, 20) + "..."}
                      </code>
                      <button
                        onClick={() =>
                          setVisibleKeyId(visibleKeyId === apiKey.id ? null : apiKey.id)
                        }
                        className="p-1 hover:bg-secondary rounded"
                      >
                        {visibleKeyId === apiKey.id ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey.key, "API Key")}
                        className="p-1 hover:bg-secondary rounded"
                      >
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(apiKey.createdAt).toLocaleDateString()}
                      {apiKey.lastUsed && ` • Last used ${new Date(apiKey.lastUsed).toLocaleDateString()}`}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteApiKey(apiKey.id)}
                    className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-2xl font-bold">Developer Tools</h2>
        <p className="text-muted-foreground">
          Utilities for local development and integration testing.
        </p>
        <DataSimulator />
      </div>

      {/* Integration Guide */}
      <div className="space-y-6 border-t border-border pt-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Quick Start Guide</h2>
          <div className="space-y-6">
            {/* NPM SDK */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-primary" />
                Using NPM SDK (Recommended)
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Install package:</p>
                  <div className="bg-secondary/50 p-3 rounded font-mono text-sm break-all">
                    npm install @quantora/sdk
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Initialize in your app:</p>
                  {apiKeyForExamples ? (
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm overflow-auto">
                      <pre>{`import { createAPMClient } from "@quantora/sdk";

const apm = createAPMClient({
  apiKey: "${apiKeyForExamples}",
  endpoint: window.location.origin,
  enableAutoPageTracking: true,
  enableAutoErrorTracking: true,
});

// Track custom events
apm.trackEvent("feature_used", { feature: "export" });`}</pre>
                    </div>
                  ) : (
                    <div className="bg-secondary/40 border border-border p-3 rounded text-sm text-muted-foreground">
                      Create an API key above to get a live SDK snippet for your workspace.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* REST API */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Code className="h-5 w-5 text-accent" />
                Using REST API
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Send events:</p>
                  {apiKeyForExamples ? (
                    <div className="bg-secondary/50 p-3 rounded font-mono text-sm overflow-auto">
                      <pre>{`curl -X POST ${window.location.origin}/api/events \
  -H "Authorization: Bearer ${apiKeyForExamples}" \
  -H "Content-Type: application/json" \\
  -d '{
    "type": "feature_used",
    "payload": {
      "feature": "export",
      "duration": 2500
    }
  }'`}</pre>
                    </div>
                  ) : (
                    <div className="bg-secondary/40 border border-border p-3 rounded text-sm text-muted-foreground">
                      Create an API key above to get a live REST example for your workspace.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Feedback */}
            <div className="border border-border rounded-lg p-6 bg-card">
              <h3 className="font-semibold mb-3">Submit Feedback</h3>
              {apiKeyForExamples ? (
                <div className="bg-secondary/50 p-3 rounded font-mono text-sm overflow-auto">
                  <pre>{`curl -X POST ${window.location.origin}/api/feedback \
  -H "Authorization: Bearer ${apiKeyForExamples}" \
  -H "Content-Type: application/json" \\
  -d '{
    "content": "Great product!",
    "source": "web"
  }'`}</pre>
                </div>
              ) : (
                <div className="bg-secondary/40 border border-border p-3 rounded text-sm text-muted-foreground">
                  Create an API key above to get a live feedback submission example.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Key Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Create API Key</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Key Name</label>
                <Input
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="API key name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createApiKey();
                  }}
                  disabled={creating}
                />
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowModal(false);
                    setNewKeyName("");
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createApiKey}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
