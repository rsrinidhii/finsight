import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ReferenceDot, ResponsiveContainer, Legend,
  BarChart, Bar, Cell
} from "recharts";
import "./App.css";

const COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#b36aff"];
const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";

function Navbar({ theme, toggleTheme }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fmt = time.toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    timeZone: "Asia/Kolkata"
  });

  const istHour = (time.getUTCHours() + 5);
  const istMinute = (time.getUTCMinutes() + 30) % 60;
  const isOpen = (istHour > 9 || (istHour === 9 && istMinute >= 15))
    && (istHour < 15 || (istHour === 15 && istMinute <= 30))
    && time.getDay() !== 0 && time.getDay() !== 6;

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <div className="navbar-logo">FS</div>
        <div>
          <div className="navbar-title">FinSight</div>
          <div className="navbar-subtitle">Stock Anomaly Intelligence</div>
        </div>
      </div>
      <div className="navbar-right">
        <div className="market-status">
          <div className={`market-dot ${isOpen ? "" : "closed"}`} />
          <span className="market-label">NSE/BSE</span>
          <span className="market-label">{isOpen ? "Open" : "Closed"}</span>
          <span className="market-time">{fmt} IST</span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === "dark" ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [ticker, setTicker] = useState("RELIANCE.NS");
  const [period, setPeriod] = useState("6mo");
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [compareInput, setCompareInput] = useState("RELIANCE.NS,TCS.NS,INFY.NS");
  const [compareData, setCompareData] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("analyze");
  const [alerts, setAlerts] = useState([]);
  const [news, setNews] = useState([]);
  const [portfolio, setPortfolio] = useState([]);
  const [newStock, setNewStock] = useState({ ticker: "", shares: "", cost: "" });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const analyze = async () => {
    setLoading(true); setError(""); setData([]); setSummary(null); setAlerts([]); setNews([]);
    try {
      const res = await axios.post(`${API}/api/analyze`, { ticker, period });
      const cleaned = res.data.data.map(d => ({
        ...d,
        date: d.date.split(" ")[0],
        close: parseFloat(d.close.toFixed(2)),
        anomaly_score: parseFloat(d.anomaly_score.toFixed(4)),
      }));
      setData(cleaned);
      const [sumRes, alertRes, newsRes] = await Promise.all([
        axios.get(`${API}/api/summary/${ticker}`),
        axios.get(`${API}/api/alerts/${ticker}`),
        axios.get(`${API}/api/news/${ticker}`)
      ]);
      setSummary(sumRes.data);
      setAlerts(alertRes.data.alerts || []);
      setNews(newsRes.data.news || []);
    } catch { setError("Something went wrong. Check ticker or backend."); }
    setLoading(false);
  };

  const compare = async () => {
    setCompareLoading(true); setCompareData(null);
    try {
      const tickers = compareInput.split(",").map(t => t.trim()).filter(Boolean);
      const res = await axios.post(`${API}/api/compare`, { tickers, period });
      setCompareData(res.data);
    } catch { setError("Compare failed. Check tickers."); }
    setCompareLoading(false);
  };

  const exportCSV = () => {
    if (!data.length) return;
    const csv = ["Date,Close,Anomaly Score,Is Anomaly",
      ...data.map(d => `${d.date},${d.close},${d.anomaly_score},${d.is_anomaly}`)
    ].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${ticker}_anomalies.csv`;
    a.click();
  };

  const addToPortfolio = () => {
    if (!newStock.ticker || !newStock.shares || !newStock.cost) return;
    setPortfolio([...portfolio, {
      ...newStock,
      shares: parseFloat(newStock.shares),
      cost: parseFloat(newStock.cost)
    }]);
    setNewStock({ ticker: "", shares: "", cost: "" });
  };

  const removeFromPortfolio = (i) => setPortfolio(portfolio.filter((_, idx) => idx !== i));

  const anomalies = data.filter(d => d.is_anomaly === 1);
  const compareChartData = compareData
    ? Object.entries(compareData).map(([t, v]) => ({ ticker: t, ...v }))
    : [];
  const totalInvested = portfolio.reduce((sum, s) => sum + s.shares * s.cost, 0);

  const tooltipStyle = {
    backgroundColor: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    color: "var(--text-primary)",
    fontSize: "12px"
  };

  const IndianStockTip = () => (
    <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "8px" }}>
      🇮🇳 Indian stocks: add <strong style={{ color: "var(--accent-light)" }}>.NS</strong> for NSE — e.g. <strong style={{ color: "var(--accent-light)" }}>RELIANCE.NS, TCS.NS, INFY.NS, WIPRO.NS</strong>
    </p>
  );

  return (
    <>
      <Navbar theme={theme} toggleTheme={toggleTheme} />

      <div className="tabs">
        <button className={`tab ${activeTab === "analyze" ? "active" : ""}`} onClick={() => setActiveTab("analyze")}>
          Single Stock Analysis
        </button>
        <button className={`tab ${activeTab === "compare" ? "active" : ""}`} onClick={() => setActiveTab("compare")}>
          Multi-Stock Compare
        </button>
        <button className={`tab ${activeTab === "portfolio" ? "active" : ""}`} onClick={() => setActiveTab("portfolio")}>
          Portfolio Tracker
        </button>
      </div>

      <div className="app-body">

        {/* ── SINGLE STOCK TAB ── */}
        {activeTab === "analyze" && (
          <>
            <div className="controls">
              <input value={ticker} onChange={e => setTicker(e.target.value.toUpperCase())} placeholder="e.g. RELIANCE.NS" autoComplete="off" />
              <select value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
              </select>
              <button onClick={analyze} disabled={loading}>{loading ? "Analyzing..." : "Analyze"}</button>
              {data.length > 0 && <button className="export-btn" onClick={exportCSV}>⬇ Export CSV</button>}
            </div>
            <IndianStockTip />

            {error && <p className="error" style={{ marginTop: "12px" }}>{error}</p>}

            {summary && (
              <div className="summary-cards" style={{ marginTop: "24px" }}>
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
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={Math.floor(data.length / 6)} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend />
                      <Line type="monotone" dataKey="close" stroke="#3b82f6" dot={false} strokeWidth={2} name="Close Price" />
                      {anomalies.map((a, i) => (
                        <ReferenceDot key={i} x={a.date} y={a.close} r={6} fill="#ef4444" stroke="white" strokeWidth={1.5} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <p className="legend-note">🔴 Red dots = anomalies detected by Isolation Forest</p>
                </div>

                <div className="chart-container">
                  <h2>Anomaly Score Over Time</h2>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--text-muted)" }} interval={Math.floor(data.length / 6)} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Line type="monotone" dataKey="anomaly_score" stroke="#f59e0b" dot={false} strokeWidth={2} name="Anomaly Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="anomaly-table">
                  <h2>Anomaly Log</h2>
                  {anomalies.length === 0
                    ? <p style={{ color: "var(--text-muted)" }}>No anomalies detected.</p>
                    : (
                      <table>
                        <thead>
                          <tr><th>Date</th><th>Close Price</th><th>Anomaly Score</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {anomalies.map((a, i) => (
                            <tr key={i}>
                              <td>{a.date}</td>
                              <td>${a.close}</td>
                              <td style={{ color: "#f59e0b" }}>{a.anomaly_score}</td>
                              <td><span className="badge">ANOMALY</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                </div>

                {alerts.length > 0 && (
                  <div className="anomaly-table" style={{ borderLeft: "3px solid #ef4444" }}>
                    <h2 style={{ color: "#ef4444" }}>⚠ Active Alerts</h2>
                    {alerts.map((a, i) => (
                      <div key={i} style={{
                        background: a.severity === "HIGH" ? "#ef444411" : "#f59e0b11",
                        border: `1px solid ${a.severity === "HIGH" ? "#ef4444" : "#f59e0b"}33`,
                        borderRadius: "8px", padding: "12px 16px", marginBottom: "10px"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            background: a.severity === "HIGH" ? "#ef444422" : "#f59e0b22",
                            color: a.severity === "HIGH" ? "#ef4444" : "#f59e0b",
                            padding: "2px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: 700
                          }}>{a.severity}</span>
                          <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{a.date.slice(0, 10)}</span>
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "8px" }}>{a.message}</p>
                        <p style={{ color: "var(--text-muted)", fontSize: "12px", marginTop: "4px" }}>
                          Close: <strong style={{ color: "var(--text-primary)" }}>${a.close}</strong> &nbsp;|&nbsp;
                          Score: <strong style={{ color: "#f59e0b" }}>{a.score}</strong>
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {news.length > 0 && (
                  <div className="anomaly-table">
                    <h2>Latest News — {ticker}</h2>
                    {news.map((n, i) => (
                      <a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none", display: "block" }}>
                        <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "var(--text-primary)", fontSize: "14px", fontWeight: 500, flex: 1, marginRight: 16 }}>{n.title}</span>
                            <span style={{ color: "var(--text-muted)", fontSize: "11px", whiteSpace: "nowrap" }}>{n.published}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
                            <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>{n.summary?.slice(0, 120)}{n.summary?.length > 120 ? "..." : ""}</span>
                            <span style={{ color: "var(--accent-light)", fontSize: "11px", whiteSpace: "nowrap", marginLeft: 12 }}>{n.source}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── COMPARE TAB ── */}
        {activeTab === "compare" && (
          <>
            <div className="controls">
              <input value={compareInput} onChange={e => setCompareInput(e.target.value.toUpperCase())} placeholder="RELIANCE.NS,TCS.NS,INFY.NS" autoComplete="off" style={{ width: "280px" }} />
              <select value={period} onChange={e => setPeriod(e.target.value)}>
                <option value="1mo">1 Month</option>
                <option value="3mo">3 Months</option>
                <option value="6mo">6 Months</option>
                <option value="1y">1 Year</option>
              </select>
              <button onClick={compare} disabled={compareLoading}>{compareLoading ? "Comparing..." : "Compare"}</button>
            </div>
            <IndianStockTip />

            {compareData && (
              <>
                <div className="summary-cards" style={{ marginTop: "24px" }}>
                  {Object.entries(compareData).map(([t, v], i) => (
                    <div className="card" key={t} style={{ borderTop: `3px solid ${COLORS[i % COLORS.length]}` }}>
                      <h3 style={{ color: COLORS[i % COLORS.length] }}>{t}</h3>
                      <p style={{ color: "var(--text-primary)", fontSize: "1.2rem", fontWeight: 600, marginTop: 4 }}>${v.latest_close}</p>
                      <p style={{ color: v.price_change_pct >= 0 ? "#10b981" : "#ef4444", fontSize: "13px", marginTop: 4 }}>
                        {v.price_change_pct >= 0 ? "▲" : "▼"} {Math.abs(v.price_change_pct)}%
                      </p>
                      <p style={{ color: "var(--text-muted)", fontSize: "11px", marginTop: 4 }}>{v.anomalies} anomalies</p>
                    </div>
                  ))}
                </div>

                <div className="chart-container">
                  <h2>Risk Score Comparison</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={compareChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="ticker" tick={{ fontSize: 12, fill: "var(--text-muted)" }} />
                      <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} unit="%" />
                      <Tooltip contentStyle={tooltipStyle} formatter={v => `${v}%`} />
                      <Bar dataKey="risk_score" name="Risk Score" radius={[6, 6, 0, 0]}>
                        {compareChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
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
                          <td style={{ color: v.price_change_pct >= 0 ? "#10b981" : "#ef4444" }}>
                            {v.price_change_pct >= 0 ? "▲" : "▼"} {Math.abs(v.price_change_pct)}%
                          </td>
                          <td>{v.anomalies}</td>
                          <td style={{ color: v.risk_score > 10 ? "#ef4444" : "#10b981" }}>{v.risk_score}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab === "portfolio" && (
          <>
            <div className="controls">
              <input
                value={newStock.ticker}
                onChange={e => setNewStock({ ...newStock, ticker: e.target.value.toUpperCase() })}
                placeholder="e.g. TCS.NS"
                autoComplete="off"
                style={{ width: "130px" }}
              />
              <input
                value={newStock.shares}
                onChange={e => setNewStock({ ...newStock, shares: e.target.value })}
                placeholder="Shares"
                type="number"
                style={{ width: "100px" }}
              />
              <input
                value={newStock.cost}
                onChange={e => setNewStock({ ...newStock, cost: e.target.value })}
                placeholder="Avg cost ₹"
                type="number"
                style={{ width: "120px" }}
              />
              <button onClick={addToPortfolio}>Add Stock</button>
            </div>
            <IndianStockTip />

            {portfolio.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0", color: "var(--text-muted)" }}>
                <p style={{ fontSize: "3rem" }}>📊</p>
                <p style={{ marginTop: "16px", fontSize: "15px" }}>Add stocks to track your portfolio</p>
                <p style={{ marginTop: "8px", fontSize: "13px" }}>Enter ticker, shares and average cost above</p>
              </div>
            ) : (
              <>
                <div className="summary-cards" style={{ marginTop: "24px", marginBottom: "20px" }}>
                  <div className="card">
                    <h3>{portfolio.length}</h3>
                    <p>Positions</p>
                  </div>
                  <div className="card low-risk">
                    <h3>₹{totalInvested.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    <p>Total Invested</p>
                  </div>
                </div>

                <div className="anomaly-table">
                  <h2>Holdings</h2>
                  <table>
                    <thead>
                      <tr><th>Ticker</th><th>Shares</th><th>Avg Cost</th><th>Invested</th><th></th></tr>
                    </thead>
                    <tbody>
                      {portfolio.map((s, i) => (
                        <tr key={i}>
                          <td style={{ color: COLORS[i % COLORS.length], fontWeight: 600 }}>{s.ticker}</td>
                          <td>{s.shares}</td>
                          <td>₹{s.cost.toFixed(2)}</td>
                          <td style={{ color: "#10b981", fontWeight: 600 }}>
                            ₹{(s.shares * s.cost).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>
                          <td>
                            <button onClick={() => removeFromPortfolio(i)} style={{
                              background: "none", border: "1px solid #ef444444", color: "#ef4444",
                              borderRadius: "4px", padding: "2px 10px", cursor: "pointer", fontSize: "12px"
                            }}>Remove</button>
                          </td>
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
    </>
  );
}