import { useEvents } from "@/hooks/use-pm-data";
import { format } from "date-fns";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { DataSimulator } from "@/components/DataSimulator";

export default function Events() {
  const { data: events, isLoading } = useEvents();

  return (
    <div className="space-y-8 animate-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl text-foreground">Raw Events</h1>
          <p className="text-muted-foreground mt-1">Live stream of all user interactions.</p>
        </div>
      </div>

      <div className="glass-card rounded-2xl overflow-hidden border border-border">
        {/* Toolbar */}
        <div className="p-4 border-b border-border bg-secondary/30 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search events..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border-none focus:ring-2 focus:ring-primary/20 text-sm"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background hover:bg-secondary transition-colors text-sm font-medium border border-border/50">
            <Filter className="h-4 w-4 text-muted-foreground" />
            Filter
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
              <tr>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">User / Session</th>
                <th className="px-6 py-4">Context (URL)</th>
                <th className="px-6 py-4">Payload</th>
                <th className="px-6 py-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                // Loading skeletons
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 w-24 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-32 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-40 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-20 bg-muted rounded" /></td>
                    <td className="px-6 py-4"><div className="h-4 w-16 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                events?.map((event) => (
                  <tr key={event.id} className="hover:bg-secondary/20 transition-colors">
                    <td className="px-6 py-4">
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                        ${event.type === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}
                      `}>
                        {event.type.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      <div>{event.userId || 'Anonymous'}</div>
                      <div className="opacity-50">{event.sessionId}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs" title={event.url || ''}>
                      {event.url || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-secondary/50 px-2 py-1 rounded">
                        {JSON.stringify(event.payload).slice(0, 30)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground whitespace-nowrap">
                      {format(new Date(event.timestamp!), 'MMM d, HH:mm:ss')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {!isLoading && events?.length === 0 && (
          <div className="p-12 text-center text-muted-foreground">
            No events logged yet. Use the simulator to generate data.
          </div>
        )}
      </div>

      <DataSimulator />
    </div>
  );
}
