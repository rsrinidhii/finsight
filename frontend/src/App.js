import { useState } from "react";
import axios from "axios";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceDot } from "recharts";

export default function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState("6mo");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("http://127.0.0.1:5000/api/analyze", { ticker, period });
      const cleaned = res.data.data.map(d => ({
        ...d,
        date: d.date.split(" ")[0],
        close: parseFloat(d.close.toFixed(2)),
        anomaly_score: parseFloat(d.anomaly_score.toFixed(4)),
      }));
      setData(cleaned);
      const sumRes = await axios.get(`http://127.0.0.1:5000/api/summary/${ticker}`);
      setSummary(sumRes.data);
    } catch (e) {
      setError("Something went wrong. Is the backend running?");
    }
    setLoading(false);
  };

  const anomalies = data.filter(d => d.is_anomaly === 1);

  return (
    <div style={{ minHeight: "100vh", background: "#0f1117", color: "#e0e0e0", fontFamily: "sans-serif", padding: "32px" }}>
      <h1 style={{ color: "#00d4aa", marginBottom: 4 }}>FinSight</h1>
      <p style={{ color: "#888", marginBottom: 32 }}>Real-time stock anomaly detector — built with Isolation Forest + Flask + React</p>

      {/* Controls */}
      <div style={{ display: "flex", gap: 12, marginBottom: 32, flexWrap: "wrap" }}>
        <input
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          placeholder="Ticker (e.g. AAPL)"
          style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #333", background: "#1a1d27", color: "#fff", fontSize: 16, width: 160 }}
        />
        <select
          value={period}
          onChange={e => setPeriod(e.target.value)}
          style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid #333", background: "#1a1d27", color: "#fff", fontSize: 16 }}
        >
          <option value="1mo">1 Month</option>
          <option value="3mo">3 Months</option>
          <option value="6mo">6 Months</option>
          <option value="1y">1 Year</option>
        </select>
        <button
          onClick={analyze}
          disabled={loading}
          style={{ padding: "10px 28px", borderRadius: 8, background: "#00d4aa", color: "#000", fontWeight: "bold", fontSize: 16, border: "none", cursor: "pointer" }}
        >
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p style={{ color: "#ff4d4d" }}>{error}</p>}

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
          {[
            { label: "Ticker", value: summary.ticker },
            { label: "Data Points", value: summary.total_points },
            { label: "Anomalies Found", value: summary.anomalies_detected },
            { label: "Risk Score", value: `${summary.risk_score}%`, color: summary.risk_score > 10 ? "#ff4d4d" : "#00d4aa" },
          ].map(card => (
            <div key={card.label} style={{ background: "#1a1d27", borderRadius: 12, padding: "20px 28px", minWidth: 140, border: "1px solid #2a2d3a" }}>
              <div style={{ color: "#888", fontSize: 13, marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 26, fontWeight: "bold", color: card.color || "#fff" }}>{card.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Price Chart */}
      {data.length > 0 && (
        <div style={{ background: "#1a1d27", borderRadius: 12, padding: 24, marginBottom: 32, border: "1px solid #2a2d3a" }}>
          <h2 style={{ marginBottom: 20, color: "#fff", fontSize: 18 }}>Price Chart with Anomalies</h2>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={d => d.slice(5)} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip contentStyle={{ background: "#1a1d27", border: "1px solid #333", borderRadius: 8 }} labelStyle={{ color: "#aaa" }} />
              <Line type="monotone" dataKey="close" stroke="#00d4aa" strokeWidth={2} dot={false} />
              {anomalies.map((a, i) => (
                <ReferenceDot key={i} x={a.date} y={a.close} r={6} fill="#ff4d4d" stroke="#fff" strokeWidth={1.5} />
              ))}
            </LineChart>
          </ResponsiveContainer>
          <p style={{ color: "#888", fontSize: 13, marginTop: 12 }}>🔴 Red dots = anomalies detected by Isolation Forest</p>
        </div>
      )}

      {/* Anomaly Table */}
      {anomalies.length > 0 && (
        <div style={{ background: "#1a1d27", borderRadius: 12, padding: 24, border: "1px solid #2a2d3a" }}>
          <h2 style={{ marginBottom: 20, color: "#fff", fontSize: 18 }}>Anomaly Log</h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ color: "#888", borderBottom: "1px solid #2a2d3a" }}>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Date</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Close Price</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Anomaly Score</th>
                <th style={{ textAlign: "left", padding: "8px 12px" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {anomalies.map((a, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #1e2130" }}>
                  <td style={{ padding: "10px 12px" }}>{a.date}</td>
                  <td style={{ padding: "10px 12px" }}>${a.close}</td>
                  <td style={{ padding: "10px 12px", color: "#ff4d4d" }}>{a.anomaly_score}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: "#ff4d4d22", color: "#ff4d4d", padding: "2px 10px", borderRadius: 20, fontSize: 12 }}>ANOMALY</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}