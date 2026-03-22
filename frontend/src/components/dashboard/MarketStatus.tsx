import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe, TrendingUp, TrendingDown, Loader2, RefreshCw } from "lucide-react";
import { getMarketData } from "@/lib/api";

const MarketStatus = () => {
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getMarketData();
      if (Array.isArray(data)) setMarkets(data);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetch(); }, []);

  const now = new Date();
  const istHour = now.getUTCHours() + 5;
  const istMin = (now.getUTCMinutes() + 30) % 60;
  const marketOpen = (istHour > 9 || (istHour === 9 && istMin >= 15))
    && (istHour < 15 || (istHour === 15 && istMin <= 30))
    && now.getDay() !== 0 && now.getDay() !== 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="gradient-card rounded-lg border border-border p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-4 h-4 text-accent" />
        <h3 className="font-display text-base font-semibold text-foreground">Market Status</h3>
        <span className={`ml-auto flex items-center gap-1.5 text-[10px] font-body font-medium ${marketOpen ? "text-accent-emerald" : "text-accent-rose"}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${marketOpen ? "bg-accent-emerald animate-pulse-subtle" : "bg-accent-rose"}`} />
          NSE/BSE {marketOpen ? "Open" : "Closed"}
        </span>
        <button onClick={() => fetch(true)} className="p-1 rounded hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {markets.map((m) => (
            <div key={m.name} className="flex items-center justify-between px-3 py-2 rounded-md bg-secondary/30 hover:bg-secondary/50 transition-colors">
              <div>
                <span className="text-[10px] text-muted-foreground font-body font-medium uppercase tracking-wide">{m.name}</span>
                <p className="text-sm font-semibold text-foreground font-body">{m.value}</p>
              </div>
              <span className={`text-[11px] font-medium font-body flex items-center gap-0.5 ${m.positive ? "text-accent-emerald" : "text-accent-rose"}`}>
                {m.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {m.change}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default MarketStatus;