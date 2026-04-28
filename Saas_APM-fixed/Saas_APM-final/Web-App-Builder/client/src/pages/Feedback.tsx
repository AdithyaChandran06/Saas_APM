import { useState } from "react";
import { useFeedbackQuery, useCreateFeedback } from "@/hooks/use-pm-data";
import { format } from "date-fns";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus, Send } from "lucide-react";
import { DataSimulator } from "@/components/DataSimulator";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function Feedback() {
  const { toast } = useToast();
  const [searchText, setSearchText] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [content, setContent] = useState("");
  const [source, setSource] = useState("web");

  const { mutateAsync: createFeedback, isPending: isSubmitting } = useCreateFeedback();

  const { data: feedbackResponse, isLoading } = useFeedbackQuery({
    query: searchText || undefined,
    sentiment: sentimentFilter ? (sentimentFilter as "positive" | "neutral" | "negative") : undefined,
  });

  const feedbackList = feedbackResponse?.items ?? [];

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedContent = content.trim();
    if (trimmedContent.length < 10) {
      toast({
        title: "Feedback too short",
        description: "Please enter at least 10 characters.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createFeedback({
        content: trimmedContent,
        source,
      });
      setContent("");
      setSource("web");
      toast({
        title: "Feedback submitted",
        description: "Your feedback was saved successfully.",
      });
    } catch {
      toast({
        title: "Submission failed",
        description: "We could not save your feedback right now.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl md:text-4xl text-foreground">User Feedback</h1>
        <p className="text-muted-foreground mt-1">Direct feedback from users, analyzed by AI.</p>
      </div>

      <form onSubmit={handleSubmit} className="glass-card rounded-2xl border border-border p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Send className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Submit feedback</h2>
            <p className="text-sm text-muted-foreground">Capture a new user comment without leaving the page.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What should we improve?"
              className="w-full min-h-32 rounded-xl border border-border/50 bg-background px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20"
              maxLength={1000}
            />
            <div className="mt-2 text-xs text-muted-foreground">{content.length}/1000 characters</div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Source</label>
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="w-full rounded-xl border border-border/50 bg-background px-4 py-3 text-sm"
              >
                <option value="web">Web app</option>
                <option value="in-app">In app</option>
                <option value="email">Email</option>
                <option value="support">Support</option>
              </select>
            </div>

            <Button type="submit" className="w-full gap-2" disabled={isSubmitting || content.trim().length < 10}>
              <Send className="h-4 w-4" />
              {isSubmitting ? "Submitting..." : "Submit feedback"}
            </Button>
          </div>
        </div>
      </form>

      <div className="glass-card rounded-2xl border border-border p-4 flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative flex-1 max-w-md">
          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search feedback text..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border/50 focus:ring-2 focus:ring-primary/20 text-sm"
          />
        </div>
        <select
          value={sentimentFilter}
          onChange={(e) => setSentimentFilter(e.target.value)}
          className="px-4 py-2 rounded-xl bg-background border border-border/50 text-sm"
        >
          <option value="">All sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />
          ))
        ) : (
          feedbackList?.map((item) => (
            <div 
              key={item.id} 
              className="bg-card border border-border p-6 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.source}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {format(new Date(item.timestamp!), 'PPp')}
                  </span>
                </div>
                <p className="text-foreground text-lg font-medium leading-relaxed">
                  "{item.content}"
                </p>
              </div>

              <div className="flex md:flex-col items-center md:justify-center gap-4 md:border-l md:border-border md:pl-6 min-w-[140px]">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">Sentiment</span>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                    {getSentimentIcon(item.sentiment)}
                    <span className="text-sm font-medium capitalize">
                      {item.sentiment || 'Neutral'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center">
                   <span className="text-xs text-muted-foreground mb-1 uppercase tracking-wider">User</span>
                   <span className="text-sm font-mono text-foreground">{item.userId || 'Anon'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {!isLoading && feedbackList.length === 0 && (
        <div className="text-center py-20 bg-card rounded-2xl border border-border border-dashed">
          <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground">No Feedback Yet</h3>
          <p className="text-muted-foreground">Waiting for users to submit feedback.</p>
        </div>
      )}

      <DataSimulator />
    </div>
  );
}
