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

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
      <div className="bg-card/80 backdrop-blur border border-border p-4 rounded-2xl shadow-xl flex flex-col gap-3 max-w-[200px]">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center">
          Dev Simulator
        </div>
        <Button 
          size="sm" 
          variant="outline" 
          className="justify-start gap-2"
          onClick={handleSimulateEvent}
          disabled={isEventPending}
        >
          <Activity className="h-4 w-4 text-blue-500" />
          Simulate Event
        </Button>
        <Button 
          size="sm" 
          variant="outline" 
          className="justify-start gap-2"
          onClick={handleSimulateFeedback}
          disabled={isFeedbackPending}
        >
          <MessageSquarePlus className="h-4 w-4 text-green-500" />
          Simulate Feedback
        </Button>
      </div>
    </div>
  );
}
