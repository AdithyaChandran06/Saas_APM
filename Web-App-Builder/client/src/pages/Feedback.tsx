import { useFeedback } from "@/hooks/use-pm-data";
import { format } from "date-fns";
import { MessageSquare, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { DataSimulator } from "@/components/DataSimulator";

export default function Feedback() {
  const { data: feedbackList, isLoading } = useFeedback();

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive': return <ThumbsUp className="h-4 w-4 text-green-500" />;
      case 'negative': return <ThumbsDown className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div>
        <h1 className="text-3xl md:text-4xl text-foreground">User Feedback</h1>
        <p className="text-muted-foreground mt-1">Direct feedback from users, analyzed by AI.</p>
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

      {!isLoading && feedbackList?.length === 0 && (
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
