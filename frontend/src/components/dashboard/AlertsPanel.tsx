import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bell, BellOff, Clock, RefreshCw, Loader2 } from "lucide-react";
import { getAlerts, analyzeTicker } from "@/lib/api";

const TICKERS = ["RELIANCE.NS", "TCS.NS", "AAPL", "NVDA"];

const severityDot: Record<string, string> = {
  HIGH: "bg-accent-rose",
  MEDIUM: "bg-accent",
  LOW: "bg-accent-emerald",
};

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [muted, setMuted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAlerts = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      // First make sure data exists by analyzing tickers
      await Promise.all(TICKERS.map(t => analyzeTicker(t, "1mo").catch(() => {})));
      const results = await Promise.all(TICKERS.map(t => getAlerts(t).then(r => r.alerts || []).catch(() => [])));
      const all = results.flat().sort((a, b) => b.score - a.score).slice(0, 6);
      setAlerts(all);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAlerts(); }, []);

  const muteAlert = (key: string) => setMuted(prev => new Set([...prev, key]));

  const visibleAlerts = alerts.filter(a => !muted.has(`${a.ticker}-${a.date}`));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="gradient-card rounded-lg border border-border shadow-card"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-accent" />
          <h3 className="font-display text-base font-semibold text-foreground">Active Alerts</h3>
          <span className="bg-accent-rose/15 text-accent-rose text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
            {visibleAlerts.length}
          </span>
        </div>
        <button onClick={() => fetchAlerts(true)} className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : visibleAlerts.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs text-muted-foreground font-body">
          No active alerts
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {visibleAlerts.map((alert, i) => {
            const key = `${alert.ticker}-${alert.date}`;
            return (
              <div key={i} className="px-5 py-3 hover:bg-secondary/30 transition-colors flex items-start gap-3 cursor-pointer group">
                <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${severityDot[alert.severity] || "bg-accent"} animate-pulse-subtle`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-foreground font-body">{alert.ticker}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${alert.severity === "HIGH" ? "bg-accent-rose/10 text-accent-rose" : "bg-accent/10 text-accent"}`}>
                      {alert.severity}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {alert.date?.slice(0, 10)}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-body leading-relaxed truncate">
                    {alert.message}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); muteAlert(key); }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary rounded"
                  title="Mute"
                >
                  <BellOff className="w-3 h-3 text-muted-foreground" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default AlertsPanel;