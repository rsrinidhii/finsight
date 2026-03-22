import { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, TrendingUp, TrendingDown, Download, Plus, Trash2 } from "lucide-react";

const defaultHoldings = [
  { ticker: "AAPL", name: "Apple Inc.", shares: 450, avgCost: 152.30, current: 178.42, allocation: 28 },
  { ticker: "NVDA", name: "NVIDIA Corp.", shares: 120, avgCost: 680.00, current: 892.30, allocation: 24 },
  { ticker: "MSFT", name: "Microsoft Corp.", shares: 200, avgCost: 380.00, current: 412.88, allocation: 18 },
  { ticker: "TSLA", name: "Tesla Inc.", shares: 180, avgCost: 220.00, current: 245.10, allocation: 15 },
  { ticker: "AMZN", name: "Amazon.com", shares: 300, avgCost: 178.00, current: 198.55, allocation: 15 },
];

const PortfolioTracker = () => {
  const [holdings, setHoldings] = useState(defaultHoldings);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ ticker: "", name: "", shares: "", avgCost: "", current: "" });

  const exportCSV = () => {
    const headers = "Ticker,Name,Shares,Avg Cost,Current,P&L%,Allocation%";
    const rows = holdings.map(h => {
      const pl = ((h.current - h.avgCost) / h.avgCost * 100).toFixed(2);
      return `${h.ticker},${h.name},${h.shares},${h.avgCost},${h.current},${pl}%,${h.allocation}%`;
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([[headers, ...rows].join("\n")], { type: "text/csv" }));
    a.download = "portfolio.csv";
    a.click();
  };

  const addHolding = () => {
    if (!form.ticker || !form.shares || !form.avgCost || !form.current) return;
    setHoldings([...holdings, {
      ticker: form.ticker.toUpperCase(),
      name: form.name || form.ticker.toUpperCase(),
      shares: parseFloat(form.shares),
      avgCost: parseFloat(form.avgCost),
      current: parseFloat(form.current),
      allocation: 0,
    }]);
    setForm({ ticker: "", name: "", shares: "", avgCost: "", current: "" });
    setAdding(false);
  };

  const removeHolding = (ticker: string) => setHoldings(holdings.filter(h => h.ticker !== ticker));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="gradient-card rounded-lg border border-border shadow-card overflow-hidden"
    >
      <div className="px-5 py-4 border-b border-border flex items-center gap-2">
        <Briefcase className="w-4 h-4 text-accent" />
        <h3 className="font-display text-base font-semibold text-foreground">Portfolio Holdings</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="text-xs text-muted-foreground hover:text-foreground font-body flex items-center gap-1 hover:bg-secondary/50 px-2 py-1 rounded-md transition-colors"
          >
            <Download className="w-3 h-3" /> Export
          </button>
          <button
            onClick={() => setAdding(!adding)}
            className="text-xs text-accent-blue hover:text-foreground font-body flex items-center gap-1 hover:bg-secondary/50 px-2 py-1 rounded-md transition-colors"
          >
            <Plus className="w-3 h-3" /> Add Stock
          </button>
        </div>
      </div>

      {adding && (
        <div className="px-5 py-3 border-b border-border bg-secondary/20 flex flex-wrap gap-2 items-end">
          {[
            { key: "ticker", placeholder: "Ticker e.g. AAPL", w: "w-24" },
            { key: "name", placeholder: "Company name", w: "w-36" },
            { key: "shares", placeholder: "Shares", w: "w-20" },
            { key: "avgCost", placeholder: "Avg cost $", w: "w-24" },
            { key: "current", placeholder: "Current $", w: "w-24" },
          ].map(f => (
            <input
              key={f.key}
              placeholder={f.placeholder}
              value={(form as any)[f.key]}
              onChange={e => setForm({ ...form, [f.key]: e.target.value })}
              className={`${f.w} bg-card border border-border rounded-md px-2 py-1.5 text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-accent-blue transition-colors font-body`}
            />
          ))}
          <button onClick={addHolding} className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded-md font-body hover:opacity-90 transition-opacity">
            Add
          </button>
          <button onClick={() => setAdding(false)} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground font-body transition-colors">
            Cancel
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs font-body">
          <thead>
            <tr className="border-b border-border">
              {["Ticker", "Name", "Shares", "Avg Cost", "Current", "P&L", "Alloc.", ""].map((h) => (
                <th key={h} className="text-left px-5 py-2.5 text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => {
              const pl = ((h.current - h.avgCost) / h.avgCost) * 100;
              const positive = pl >= 0;
              return (
                <tr key={h.ticker} className="border-b border-border/50 hover:bg-secondary/30 transition-colors group">
                  <td className="px-5 py-3 font-semibold text-foreground">{h.ticker}</td>
                  <td className="px-5 py-3 text-muted-foreground">{h.name}</td>
                  <td className="px-5 py-3 text-foreground">{h.shares.toLocaleString()}</td>
                  <td className="px-5 py-3 text-muted-foreground">${h.avgCost.toFixed(2)}</td>
                  <td className="px-5 py-3 text-foreground font-medium">${h.current.toFixed(2)}</td>
                  <td className={`px-5 py-3 font-medium ${positive ? "text-accent-emerald" : "text-accent-rose"}`}>
                    <span className="flex items-center gap-1">
                      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {positive ? "+" : ""}{pl.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-accent-blue rounded-full" style={{ width: `${h.allocation}%` }} />
                      </div>
                      <span className="text-muted-foreground">{h.allocation}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => removeHolding(h.ticker)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-accent-rose/10 rounded text-muted-foreground hover:text-accent-rose"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default PortfolioTracker;