import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { motion } from "framer-motion";
import { GitCompareArrows } from "lucide-react";

const compareData = [
  { month: "Jan", AAPL: 100, NVDA: 100, MSFT: 100, TSLA: 100 },
  { month: "Feb", AAPL: 104, NVDA: 108, MSFT: 102, TSLA: 95 },
  { month: "Mar", AAPL: 106, NVDA: 115, MSFT: 105, TSLA: 98 },
  { month: "Apr", AAPL: 102, NVDA: 120, MSFT: 103, TSLA: 105 },
  { month: "May", AAPL: 111, NVDA: 128, MSFT: 108, TSLA: 110 },
  { month: "Jun", AAPL: 114, NVDA: 135, MSFT: 110, TSLA: 108 },
  { month: "Jul", AAPL: 109, NVDA: 130, MSFT: 107, TSLA: 115 },
  { month: "Aug", AAPL: 118, NVDA: 142, MSFT: 112, TSLA: 112 },
  { month: "Sep", AAPL: 121, NVDA: 148, MSFT: 115, TSLA: 118 },
  { month: "Oct", AAPL: 116, NVDA: 140, MSFT: 110, TSLA: 122 },
  { month: "Nov", AAPL: 125, NVDA: 155, MSFT: 118, TSLA: 128 },
  { month: "Dec", AAPL: 130, NVDA: 165, MSFT: 120, TSLA: 125 },
];

const colors = [
  "hsl(210, 60%, 55%)",
  "hsl(160, 45%, 50%)",
  "hsl(45, 50%, 55%)",
  "hsl(0, 60%, 60%)",
];

const tickers = ["AAPL", "NVDA", "MSFT", "TSLA"];

const MultiStockCompare = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.4 }}
    className="gradient-card rounded-lg border border-border p-5 shadow-card"
  >
    <div className="flex items-center gap-2 mb-4">
      <GitCompareArrows className="w-4 h-4 text-accent" />
      <h3 className="font-display text-base font-semibold text-foreground">Multi-Stock Comparison</h3>
      <span className="text-xs text-muted-foreground font-body ml-1">Normalized to 100</span>
    </div>
    <div className="h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={compareData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 25%, 11%)",
              border: "1px solid hsl(222, 20%, 18%)",
              borderRadius: "6px",
              fontSize: "11px",
            }}
          />
          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          />
          {tickers.map((t, i) => (
            <Line
              key={t}
              type="monotone"
              dataKey={t}
              stroke={colors[i]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </motion.div>
);

export default MultiStockCompare;
