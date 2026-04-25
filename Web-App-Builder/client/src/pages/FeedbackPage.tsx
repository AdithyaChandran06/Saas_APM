import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Send,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedbackSubmission {
  content: string;
  type: "general" | "bug" | "feature_request" | "complaint" | "praise";
  sentiment?: "positive" | "negative" | "neutral";
}

export function FeedbackForm() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [type, setType] = useState<FeedbackSubmission["type"]>("general");
  const [sentiment, setSentiment] = useState<"positive" | "negative" | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please enter your feedback",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/feedback/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          source: "in-app",
          sentiment:
            sentiment === "positive"
              ? "positive"
              : sentiment === "negative"
              ? "negative"
              : "neutral",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback");
      }

      toast({
        title: "Thank you!",
        description: "Your feedback has been submitted successfully",
      });

      // Reset form
      setContent("");
      setSentiment(null);
      setSubmitted(true);

      // Hide confirmation after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-4">
          <MessageSquare className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Thank you for your feedback!
        </h3>
        <p className="text-green-800">
          We appreciate your input and will review it shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Sentiment Selection */}
      <div>
        <label className="text-sm font-medium mb-3 block">How are you feeling?</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setSentiment("positive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sentiment === "positive"
                ? "bg-green-500/20 border border-green-500 text-green-700"
                : "bg-secondary border border-border hover:border-green-500/50"
            }`}
          >
            <ThumbsUp className="h-4 w-4" />
            <span className="text-sm">Good</span>
          </button>
          <button
            type="button"
            onClick={() => setSentiment(null)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sentiment === null
                ? "bg-blue-500/20 border border-blue-500 text-blue-700"
                : "bg-secondary border border-border hover:border-blue-500/50"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Neutral</span>
          </button>
          <button
            type="button"
            onClick={() => setSentiment("negative")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              sentiment === "negative"
                ? "bg-red-500/20 border border-red-500 text-red-700"
                : "bg-secondary border border-border hover:border-red-500/50"
            }`}
          >
            <ThumbsDown className="h-4 w-4" />
            <span className="text-sm">Not great</span>
          </button>
        </div>
      </div>

      {/* Feedback Type */}
      <div>
        <label className="text-sm font-medium mb-3 block">What is this about?</label>
        <select
          value={type}
          onChange={(e) =>
            setType(e.target.value as FeedbackSubmission["type"])
          }
          className="w-full px-4 py-2 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20"
        >
          <option value="general">General Feedback</option>
          <option value="bug">Bug Report</option>
          <option value="feature_request">Feature Request</option>
          <option value="complaint">Complaint</option>
          <option value="praise">Praise</option>
        </select>
      </div>

      {/* Feedback Content */}
      <div>
        <label className="text-sm font-medium mb-3 block">Your feedback</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tell us what you think... (minimum 10 characters)"
          maxLength={1000}
          className="w-full px-4 py-3 rounded-xl bg-secondary border border-border focus:ring-2 focus:ring-primary/20 resize-none h-32 focus:border-transparent"
        />
        <div className="text-xs text-muted-foreground mt-2">
          {content.length}/1000 characters
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={loading || !content.trim() || content.length < 10}
        className="w-full gap-2"
      >
        <Send className="h-4 w-4" />
        {loading ? "Submitting..." : "Submit Feedback"}
      </Button>

      {/* Info Message */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
        <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800">
          Your feedback helps us improve the product. Thank you for taking the
          time to share your thoughts!
        </p>
      </div>
    </form>
  );
}

export default function FeedbackPage() {
  const [tab, setTab] = useState<"submit" | "view">("submit");

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl md:text-4xl text-foreground">Feedback</h1>
        <p className="text-muted-foreground mt-1">
          Help us improve by sharing your thoughts and suggestions.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("submit")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "submit"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Submit Feedback
        </button>
        <button
          onClick={() => setTab("view")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            tab === "view"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Your Feedback
        </button>
      </div>

      {tab === "submit" ? (
        <div className="max-w-2xl">
          <FeedbackForm />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <div className="text-center py-12 bg-card rounded-2xl border border-border border-dashed">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No feedback submitted yet</h3>
            <p className="text-muted-foreground">
              Share your thoughts using the form above!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
