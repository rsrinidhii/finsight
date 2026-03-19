# FinSight — Stock Anomaly Detector

> Real-time stock market anomaly detection using Machine Learning, built with Flask + React.

![Python](https://img.shields.io/badge/Python-3.8+-blue)
![React](https://img.shields.io/badge/React-18-61DAFB)
![ML](https://img.shields.io/badge/ML-Isolation%20Forest-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## What it does
FinSight fetches real-time stock data and uses an **Isolation Forest ML model** to detect anomalous price movements — the kind of signals that precede market events, earnings surprises, or unusual trading activity.

This is the same class of problem that quantitative teams at firms like JPMorgan and Goldman Sachs solve at scale.

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | Python, Flask, SQLAlchemy |
| ML Model | Isolation Forest (scikit-learn) |
| Database | SQLite |
| Frontend | React, Recharts |
| Data Source | Yahoo Finance (yfinance) |

## Features
- Real-time stock data fetching for any ticker (AAPL, TSLA, GOOGL...)
- ML-powered anomaly detection on price returns + volatility + volume
- Interactive price chart with anomalies highlighted in red
- Risk score calculation per stock
- Anomaly log with dates, prices, and scores
- REST API backend — easily extendable

## How it works
1. Fetches OHLCV data from Yahoo Finance
2. Engineers features: daily returns, rolling volatility, volume change
3. Trains Isolation Forest (unsupervised) — no labeled data needed
4. Flags top 5% most anomalous trading days
5. Returns results via REST API to React dashboard

## Run locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install flask flask-cors yfinance pandas numpy scikit-learn sqlalchemy
python app.py
```

### Frontend
```bash
cd frontend
npm install
npm start
```

## API Endpoints
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/analyze` | Run anomaly detection on a ticker |
| GET | `/api/summary/<ticker>` | Get risk summary for a ticker |

## Sample API call
```bash
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"ticker": "AAPL", "period": "6mo"}'
```

## Resume line
> Built FinSight, a full-stack stock anomaly detection system using Isolation Forest ML model (Python/Flask) and React dashboard. Detects statistically significant price movements across any publicly traded stock using unsupervised learning on OHLCV financial data.

## Author
Ranga Srinidhi — [LinkedIn](https://www.linkedin.com/in/srinidhiranga/) · [GitHub](https://github.com/rsrinidhii)