import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";
import { motion } from "framer-motion";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { analyzeTicker } from "@/lib/api";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-md px-3 py-2 shadow-elevated text-xs font-body">
      <p className="text-muted-foreground mb-0.5">{label}</p>
      <p className="text-foreground font-semibold">${payload[0].value}</p>
      {payload[0].payload.is_anomaly === 1 && <p className="text-accent-rose mt-0.5">⚠ Anomaly detected</p>}
    </div>
  );
};

const periodMap: Record<string, string> = { "1D": "1d", "1W": "5d", "1M": "1mo", "1Y": "1y" };

interface PriceChartProps { ticker?: string; }

const PriceChart = ({ ticker = "RELIANCE.NS" }: PriceChartProps) => {
  const [period, setPeriod] = useState("1Y");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inputTicker, setInputTicker] = useState(ticker);
  const [activeTicker, setActiveTicker] = useState(ticker);

  const fetchData = async (t = activeTicker, p = period, refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await analyzeTicker(t, periodMap[p] || "1y");
      if (res.data) {
        setData(res.data.map((d: any) => ({
          date: d.date.split(" ")[0].slice(5),
          price: parseFloat(d.close.toFixed(2)),
          is_anomaly: d.is_anomaly,
        })));
      }
    } catch { }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setActiveTicker(inputTicker);
      fetchData(inputTicker, period);
    }
  };

  const handlePeriod = (p: string) => {
    setPeriod(p);
    fetchData(activeTicker, p);
  };

  const exportChart = () => {
    const csv = ["Date,Price,Anomaly", ...data.map(d => `${d.date},${d.price},${d.is_anomaly}`)].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${activeTicker}_prices.csv`;
    a.click();
  };

  const anomalyPoints = data.filter(d => d.is_anomaly === 1);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="gradient-card rounded-lg border border-border p-5 shadow-card"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">{activeTicker} Price Action</h3>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Live data with anomaly markers</p>
          </div>
          <input
            value={inputTicker}
            onChange={e => setInputTicker(e.target.value.toUpperCase())}
            onKeyDown={handleSearch}
            placeholder="e.g. TCS.NS"
            className="bg-secondary/50 border border-border rounded-md px-2 py-1 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent-blue transition-colors font-body w-28"
          />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={exportChart} className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground" title="Export">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => fetchData(activeTicker, period, true)} className="p-1.5 rounded-md hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          <div className="flex gap-1.5 ml-1">
            {["1D", "1W", "1M", "1Y"].map((t) => (
              <button key={t} onClick={() => handlePeriod(t)} className={`px-2.5 py-1 text-[11px] font-body font-medium rounded-md transition-colors ${t === period ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-[280px]">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(210, 60%, 55%)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="hsl(210, 60%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} interval={Math.floor(data.length / 6)} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220, 10%, 50%)" }} domain={["dataMin - 5", "dataMax + 5"]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="price" stroke="hsl(210, 60%, 55%)" strokeWidth={2} fill="url(#priceGradient)" />
              {anomalyPoints.map((point, i) => (
                <ReferenceDot key={i} x={point.date} y={point.price} r={5} fill="hsl(0, 60%, 60%)" stroke="hsl(0, 60%, 60%)" strokeWidth={2} strokeOpacity={0.3} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
};

export default PriceChart;