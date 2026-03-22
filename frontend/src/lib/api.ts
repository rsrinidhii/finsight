const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

export const analyzeTicker = async (ticker: string, period: string) => {
  const res = await fetch(`${API}/api/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ticker, period }),
  });
  return res.json();
};

export const getSummary = async (ticker: string) => {
  const res = await fetch(`${API}/api/summary/${ticker}`);
  return res.json();
};

export const getAlerts = async (ticker: string) => {
  const res = await fetch(`${API}/api/alerts/${ticker}`);
  return res.json();
};

export const getNews = async (ticker: string) => {
  const res = await fetch(`${API}/api/news/${ticker}`);
  return res.json();
};

export const compareTickers = async (tickers: string[], period: string) => {
  const res = await fetch(`${API}/api/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers, period }),
  });
  return res.json();
};

export const getMarketData = async () => {
  const res = await fetch(`${API}/api/market`);
  return res.json();
};

export const getPortfolioStats = async (tickers: string[]) => {
  const res = await fetch(`${API}/api/portfolio-stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tickers }),
  });
  return res.json();
};