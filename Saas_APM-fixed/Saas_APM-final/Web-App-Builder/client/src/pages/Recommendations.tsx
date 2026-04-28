import { useState } from "react";
import { useRecommendations, useGenerateRecommendations, useRecommendationScoring, useUpdateRecommendation } from "@/hooks/use-pm-data";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Lightbulb, Target, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Recommendations() {
  const { data: recommendations, isLoading } = useRecommendations();
  const { mutate: generate, isPending: isGenerating } = useGenerateRecommendations();
  const { mutate: updateRecommendation, isPending: isUpdating } = useUpdateRecommendation();
  const [expandedRecommendationId, setExpandedRecommendationId] = useState<number | null>(null);
  const { data: scoringData, isLoading: isScoringLoading } = useRecommendationScoring(expandedRecommendationId);

  const getImpactBadge = (score: number) => {
    let colorClass = "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    if (score >= 8) colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
    if (score >= 9) colorClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";

    return (
      <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", colorClass)}>
        Impact: {score.toFixed(1)}/10
      </span>
    );
  };

  const getCategoryIcon = (category: string) => {
    switch(category.toLowerCase()) {
      case 'revenue': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'retention': return <Target className="h-5 w-5 text-blue-500" />;
      default: return <Lightbulb className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 to-accent/10 p-8 rounded-3xl border border-primary/10">
        <div>
          <h1 className="text-3xl md:text-4xl text-foreground font-display mb-2">
            AI Product Strategy
          </h1>
          <p className="text-muted-foreground max-w-xl">
            Autonomous analysis of your events and feedback to generate high-impact product recommendations.
          </p>
        </div>
        <Button 
          onClick={() => generate()} 
          disabled={isGenerating}
          size="lg"
          className="bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:shadow-primary/25 transition-all text-white font-semibold rounded-xl px-8"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Analyzing Data...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate Insights
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-2xl animate-pulse" />
          ))
        ) : (
          recommendations?.sort((a, b) => b.impactScore - a.impactScore).map((rec, index) => (
            <div 
              key={rec.id} 
              className={cn(
                "group bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 flex flex-col"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-secondary rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    {getCategoryIcon(rec.category)}
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {rec.category}
                  </span>
                </div>
                {getImpactBadge(rec.impactScore)}
              </div>
              
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {rec.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed flex-1">
                {rec.description}
              </p>

              <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium capitalize">
                  Status: {rec.status}
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={rec.status ?? "new"}
                    disabled={isUpdating}
                    onChange={(e) =>
                      updateRecommendation({
                        id: rec.id,
                        data: { status: e.target.value },
                      })
                    }
                    className="text-xs px-2 py-1 rounded-md border border-border bg-background"
                  >
                    <option value="new">new</option>
                    <option value="reviewed">reviewed</option>
                    <option value="implemented">implemented</option>
                    <option value="dismissed">dismissed</option>
                  </select>
                  <button
                    className="text-primary text-sm font-semibold flex items-center gap-1"
                    onClick={() => setExpandedRecommendationId(expandedRecommendationId === rec.id ? null : rec.id)}
                  >
                    Details {expandedRecommendationId === rec.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {expandedRecommendationId === rec.id && (
                <div className="mt-4 p-4 rounded-xl bg-secondary/30 border border-border/40 text-sm space-y-2">
                  {isScoringLoading ? (
                    <div className="text-muted-foreground">Loading scoring details...</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>Severity: <strong>{Number(scoringData?.scoringDetails?.severityScore ?? 0).toFixed(1)}</strong></div>
                        <div>Frequency: <strong>{Number(scoringData?.scoringDetails?.frequencyScore ?? 0).toFixed(1)}</strong></div>
                        <div>Affected Users: <strong>{Number(scoringData?.scoringDetails?.affectedUsersPercent ?? 0).toFixed(1)}%</strong></div>
                        <div>Confidence: <strong>{Number(scoringData?.scoringDetails?.confidenceScore ?? 0).toFixed(1)}</strong></div>
                      </div>
                      {scoringData?.scoringDetails?.reasoningSummary && (
                        <p className="text-muted-foreground">{scoringData.scoringDetails.reasoningSummary}</p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!isLoading && recommendations?.length === 0 && (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">No Recommendations Yet</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Click the "Generate Insights" button above to let the AI analyze your data and suggest improvements.
          </p>
        </div>
      )}
    </div>
  );
}
