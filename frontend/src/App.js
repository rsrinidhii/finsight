import React, { useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceDot, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from "recharts";
import "./App.css";

const COLORS = ["#4f9eff", "#f5a623", "#4caf50", "#ff4f4f", "#b36aff"];

function App() {
  const [ticker, setTicker] = useState("AAPL");
  const [period, setPeriod] = useState("6mo");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compareInput, setCompareInput] = useState("AAPL,TSLA,GOOGL");
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analyze");

  const analyze = async () => {
    setLoading(true);
    setError("");
    setData([]);
    setSummary(null);
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
      setError("Something went wrong. Check ticker or backend.");
    }
    setLoading(false);
  };

  const compare = async () => {
    setCompareLoading(true);
    setCompareData(null);
    try {
      const tickers = compareInput.split(",").map(t => t.trim()).filter(Boolean);
      const res = await axios.post("http://127.0.0.1:5000/api/compare", { tickers, period });
      setCompareData(res.data);
    } catch (e) {
      setError("Compare failed. Check tickers.");
    }
    setCompareLoading(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const headers = "Date,Close,Anomaly Score,Is Anomaly";
    const rows = data.map(d => `${d.date},${d.close},${d.anomaly_score},${d.is_anomaly}`);
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ticker}_anomalies.csv`;
    a.click();
  };

  const anomalies = data.filter(d => d.is_anomaly === 1);

  const compareChartData = compareData
    ? Object.entries(compareData).map(([t, v]) => ({
        ticker: t,
        risk_score: v.risk_score,
        anomalies: v.anomalies,
        price_change_pct: v.price_change_pct,
        latest_close: v.latest_close,
      }))
    : [];

  return (
    <div className="app">
      <header>
        <h1>FinSight</h1>
        <p>Real-time Stock Anomaly Detector — Isolation Forest + Flask + React</p>
      </header>

      <div className="tabs">
        <button className={activeTab === "analyze" ? "tab active" : "tab"} onClick={() => setActiveTab("analyze")}>
          Single Stock
        </button>
        <button className={activeTab === "compare" ? "tab active" : "tab"} onClick={() => setActiveTab("compare")}>
          Compare Stocks
        </button>
      </div>

      {activeTab === "analyze" && (
        <>
          <div className="controls">
            <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="Ticker e.g. AAPL" />
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
            <button onClick={analyze} disabled={loading}>{loading ? "Analyzing..." : "Analyze"}</button>
            {data.length > 0 && <button className="export-btn" onClick={exportCSV}>Export CSV</button>}
          </div>

          {error && <p className="error">{error}</p>}

          {summary && (
            <div className="summary-cards">
              <div className="card"><h3>{summary.ticker}</h3><p>Ticker</p></div>
              <div className="card"><h3>{summary.total_points}</h3><p>Trading Days</p></div>
              <div className="card anomaly"><h3>{summary.anomalies_detected}</h3><p>Anomalies Found</p></div>
              <div className={`card ${summary.risk_score > 10 ? "high-risk" : "low-risk"}`}>
                <h3>{summary.risk_score}%</h3><p>Risk Score</p>
              </div>
            </div>
          )}

          {data.length > 0 && (
            <>
              <div className="chart-container">
                <h2>Price Chart with Anomalies</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(data.length / 6)} />
                    <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="close" stroke="#4f9eff" dot={false} strokeWidth={2} name="Close Price" />
                    {anomalies.map((a, i) => (
                      <ReferenceDot key={i} x={a.date} y={a.close} r={6} fill="#ff4f4f" stroke="white" strokeWidth={1.5} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
                <p className="legend-note">🔴 Red dots = anomalies detected by Isolation Forest</p>
              </div>

              <div className="chart-container">
                <h2>Anomaly Score Over Time</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(data.length / 6)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="anomaly_score" stroke="#f5a623" dot={false} strokeWidth={2} name="Anomaly Score" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="anomaly-table">
                <h2>Anomaly Log</h2>
                {anomalies.length === 0 ? <p>No anomalies detected.</p> : (
                  <table>
                    <thead>
                      <tr><th>Date</th><th>Close Price</th><th>Anomaly Score</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {anomalies.map((a, i) => (
                        <tr key={i}>
                          <td>{a.date}</td>
                          <td>${a.close}</td>
                          <td style={{ color: "#f5a623" }}>{a.anomaly_score}</td>
                          <td><span className="badge">ANOMALY</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </>
      )}

      {activeTab === "compare" && (
        <>
          <div className="controls">
            <input
              value={compareInput}
              onChange={e => setCompareInput(e.target.value.toUpperCase())}
              placeholder="AAPL,TSLA,GOOGL"
              style={{ width: "260px" }}
            />
            <select value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="1mo">1 Month</option>
              <option value="3mo">3 Months</option>
              <option value="6mo">6 Months</option>
              <option value="1y">1 Year</option>
            </select>
            <button onClick={compare} disabled={compareLoading}>
              {compareLoading ? "Comparing..." : "Compare"}
            </button>
          </div>

          {compareData && (
            <>
              <div className="summary-cards">
                {Object.entries(compareData).map(([t, v], i) => (
                  <div className="card" key={t} style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
                    <h3 style={{ color: COLORS[i % COLORS.length] }}>{t}</h3>
                    <p style={{ color: "#e0e0e0", fontSize: "1.2rem", fontWeight: 600 }}>${v.latest_close}</p>
                    <p style={{ color: v.price_change_pct >= 0 ? "#4caf50" : "#ff4f4f" }}>
                      {v.price_change_pct >= 0 ? "▲" : "▼"} {Math.abs(v.price_change_pct)}%
                    </p>
                    <p style={{ color: "#888", fontSize: "12px" }}>{v.anomalies} anomalies</p>
                  </div>
                ))}
              </div>

              <div className="chart-container">
                <h2>Risk Score Comparison</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={compareChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                    <XAxis dataKey="ticker" tick={{ fontSize: 13 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip formatter={(v) => `${v}%`} />
                    <Bar dataKey="risk_score" name="Risk Score" radius={[6, 6, 0, 0]}>
                      {compareChartData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="anomaly-table">
                <h2>Stock Comparison Table</h2>
                <table>
                  <thead>
                    <tr><th>Ticker</th><th>Latest Close</th><th>Period Change</th><th>Anomalies</th><th>Risk Score</th></tr>
                  </thead>
                  <tbody>
                    {Object.entries(compareData).map(([t, v], i) => (
                      <tr key={t}>
                        <td style={{ color: COLORS[i % COLORS.length], fontWeight: 600 }}>{t}</td>
                        <td>${v.latest_close}</td>
                        <td style={{ color: v.price_change_pct >= 0 ? "#4caf50" : "#ff4f4f" }}>
                          {v.price_change_pct >= 0 ? "▲" : "▼"} {Math.abs(v.price_change_pct)}%
                        </td>
                        <td>{v.anomalies}</td>
                        <td style={{ color: v.risk_score > 10 ? "#ff4f4f" : "#4caf50" }}>{v.risk_score}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default App;