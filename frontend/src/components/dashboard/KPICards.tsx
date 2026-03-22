import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3, Shield, Zap, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { getPortfolioStats } from "@/lib/api";

const KPICards = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await getPortfolioStats(["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"]);
      setStats(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  const kpis = stats ? [
    { label: "Portfolio Value", value: stats.portfolio_value_fmt, change: stats.pl_pct, positive: stats.pl_positive, icon: BarChart3 },
    { label: "Today's P&L", value: stats.pl_fmt, change: stats.pl_pct, positive: stats.pl_positive, icon: TrendingUp },
    { label: "Active Anomalies", value: String(stats.anomaly_count), change: "detected", positive: stats.anomaly_count === 0, icon: AlertTriangle },
    { label: "Risk Score", value: stats.risk_score, change: stats.risk_positive ? "Stable" : "Elevated", positive: stats.risk_positive, icon: Shield },
    { label: "Signal Strength", value: `${stats.signal_strength}%`, change: stats.signal_strength > 75 ? "Strong" : "Weak", positive: stats.signal_strength > 75, icon: Zap },
  ] : [];

  if (loading) return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="gradient-card rounded-lg border border-border p-4 h-24 flex items-center justify-center">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi, i) => (
        <motion.div
          key={kpi.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06, duration: 0.35 }}
          className="gradient-card rounded-lg border border-border p-4 shadow-card hover:shadow-card-hover transition-shadow group cursor-default"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-body font-medium tracking-wider uppercase text-muted-foreground">
              {kpi.label}
            </span>
            <kpi.icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
          </div>
          <div className="text-xl font-display font-semibold text-foreground leading-none mb-1.5">
            {kpi.value}
          </div>
          <div className={`text-xs font-body font-medium flex items-center gap-1 ${kpi.positive ? "text-accent-emerald" : "text-accent-rose"}`}>
            {kpi.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {kpi.change}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default KPICards;