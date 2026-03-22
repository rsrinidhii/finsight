import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Download, Loader2, RefreshCw } from "lucide-react";
import { analyzeTicker } from "@/lib/api";

const severityFromScore = (score: number) => score > 0.08 ? "High" : score > 0.03 ? "Medium" : "Low";

const severityStyles: Record<string, string> = {
  High: "bg-accent-rose/10 text-accent-rose",
  Medium: "bg-accent/10 text-accent",
  Low: "bg-accent-emerald/10 text-accent-emerald",
};

const TICKERS = ["RELIANCE.NS", "TCS.NS", "INFY.NS", "AAPL", "NVDA"];

const AnomalyTable = () => {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAll = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const results = await Promise.all(
        TICKERS.map(t => analyzeTicker(t, "1mo").then(r => ({ ticker: t, data: r.data || [] })))
      );
      const anomalies: any[] = [];
      results.forEach(({ ticker, data }) => {
        data.filter((d: any) => d.is_anomaly === 1).forEach((d: any) => {
          anomalies.push({
            ticker,
            date: d.date.split(" ")[0],
            price: `$${parseFloat(d.close).toFixed(2)}`,
            score: d.anomaly_score,
            severity: severityFromScore(d.anomaly_score),
            deviation: `+${(d.anomaly_score * 100).toFixed(1)}%`,
            status: d.anomaly_score > 0.08 ? "Active" : "Monitoring",
          });
        });
      });
      anomalies.sort((a, b) => b.score - a.score);
      setRows(anomalies);
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const displayed = showAll ? rows : rows.slice(0, 6);

  const exportCSV = () => {
    const csv = ["Ticker,Date,Price,Severity,Deviation,Status",
      ...rows.map(r => `${r.ticker},${r.date},${r.price},${r.severity},${r.deviation},${r.status}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "anomaly_log.csv";
    a.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="gradient-card rounded-lg border border-border shadow-card overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-semibold text-foreground">Anomaly Log</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">
            Live ML detections — {TICKERS.join(", ")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => fetchAll(true)} className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <button onClick={exportCSV} className="text-xs text-muted-foreground hover:text-foreground font-body flex items-center gap-1 hover:bg-secondary/50 px-2 py-1 rounded-md transition-colors">
            <Download className="w-3 h-3" /> Export
          </button>
          <button onClick={() => setShowAll(!showAll)} className="text-xs text-accent-blue hover:underline font-body flex items-center gap-1">
            {showAll ? "Show Less" : "View All"} <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground font-body">Fetching live anomalies...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground font-body">No anomalies detected recently</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-body">
              <thead>
                <tr className="border-b border-border">
                  {["Ticker", "Date", "Price", "Severity", "Deviation", "Status"].map(h => (
                    <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.map((a, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <td className="px-5 py-3 font-semibold text-foreground">{a.ticker}</td>
                    <td className="px-5 py-3 text-muted-foreground">{a.date}</td>
                    <td className="px-5 py-3 text-foreground">{a.price}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${severityStyles[a.severity]}`}>{a.severity}</span>
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground">{a.deviation}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${a.status === "Active" ? "bg-accent-rose/10 text-accent-rose" : "bg-accent-blue/10 text-accent-blue"}`}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!showAll && rows.length > 6 && (
            <div className="px-5 py-3 border-t border-border/50 text-center">
              <button onClick={() => setShowAll(true)} className="text-xs text-muted-foreground hover:text-foreground font-body transition-colors">
                + {rows.length - 6} more anomalies
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default AnomalyTable;