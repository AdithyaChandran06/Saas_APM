import { useState } from "react";
import { useCreateEvent, useCreateFeedback } from "@/hooks/use-pm-data";
import { Button } from "@/components/ui/button";
import { PlayCircle, MessageSquarePlus, Activity } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const SAMPLE_EVENTS = [
  { type: "page_view", url: "/pricing" },
  { type: "click", url: "/signup", payload: { button: "hero_cta" } },
  { type: "feature_used", payload: { feature: "ai_analysis" } },
  { type: "error", payload: { code: "500", endpoint: "/api/data" } },
  { type: "session_start", payload: { referrer: "google" } },
];

const SAMPLE_FEEDBACK = [
  { content: "I love the new dashboard design! So clean.", source: "web" },
  { content: "The loading times are a bit slow on mobile.", source: "email" },
  { content: "Can you add dark mode support?", source: "in_app" },
  { content: "The AI recommendations are spot on, thanks!", source: "web" },
  { content: "I'm confused about the pricing tiers.", source: "support" },
];

export function DataSimulator() {
  const { mutate: createEvent, isPending: isEventPending } = useCreateEvent();
  const { mutate: createFeedback, isPending: isFeedbackPending } = useCreateFeedback();
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulateEvent = () => {
    const randomEvent = SAMPLE_EVENTS[Math.floor(Math.random() * SAMPLE_EVENTS.length)];
    createEvent({
      ...randomEvent,
      sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
    }, {
      onSuccess: () => {
        toast({ title: "Event Simulated", description: `Simulated ${randomEvent.type}` });
      }
    });
  };

  const handleSimulateFeedback = () => {
    const randomFeedback = SAMPLE_FEEDBACK[Math.floor(Math.random() * SAMPLE_FEEDBACK.length)];
    createFeedback({
      ...randomFeedback,
      userId: `user_${Math.floor(Math.random() * 1000)}`,
    }, {
      onSuccess: () => {
        toast({ title: "Feedback Simulated", description: "Added new user feedback" });
      }
    });
  };

  // Only show dev simulator in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="mt-12 p-6 rounded-xl bg-yellow-50/50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span className="text-lg">🧪</span> Development Simulator
          </h3>
          <p className="text-xs text-muted-foreground mt-1">Quickly generate test events and feedback</p>
        </div>
        <div className="flex gap-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2"
            onClick={handleSimulateEvent}
            disabled={isEventPending}
          >
            <Activity className="h-4 w-4" />
            Simulate Event
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-2"
            onClick={handleSimulateFeedback}
            disabled={isFeedbackPending}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Simulate Feedback
          </Button>
        </div>
      </div>
    </div>
  );
}
