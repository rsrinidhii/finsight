from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from database import Session, StockPrice, AnomalyResult, engine
from ml_model import detect_anomalies
import datetime

app = Flask(__name__)
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:8080",
    "https://finsight-gamma-eight.vercel.app"
])
@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    ticker = data.get("ticker", "AAPL").upper()
    period = data.get("period", "6mo")

    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)

    if hist.empty:
        return jsonify({"error": "Invalid ticker or no data"}), 400

    hist.reset_index(inplace=True)
    hist.columns = [c.lower() for c in hist.columns]
    hist = hist[["date", "open", "high", "low", "close", "volume"]]

    result_df = detect_anomalies(hist)

    session = Session()
    session.query(StockPrice).filter_by(ticker=ticker).delete()
    session.query(AnomalyResult).filter_by(ticker=ticker).delete()

    for _, row in result_df.iterrows():
        session.add(AnomalyResult(
            ticker=ticker,
            date=row["date"],
            close=row["close"],
            anomaly_score=float(row["anomaly_score"]),
            is_anomaly=int(row["is_anomaly"])
        ))
    session.commit()
    session.close()

    return jsonify({
        "ticker": ticker,
        "data": result_df[["date", "close", "anomaly_score", "is_anomaly"]]
            .assign(date=result_df["date"].astype(str))
            .to_dict(orient="records")
    })

@app.route("/api/summary/<ticker>", methods=["GET"])
def summary(ticker):
    session = Session()
    rows = session.query(AnomalyResult).filter_by(ticker=ticker.upper()).all()
    session.close()

    if not rows:
        return jsonify({"error": "No data found. Run /api/analyze first."}), 404

    total = len(rows)
    anomalies = sum(r.is_anomaly for r in rows)
    risk_score = round((anomalies / total) * 100, 2)

    return jsonify({
        "ticker": ticker.upper(),
        "total_points": total,
        "anomalies_detected": anomalies,
        "risk_score": risk_score
    })

@app.route("/api/compare", methods=["POST"])
def compare():
    data = request.json
    tickers = data.get("tickers", ["AAPL", "TSLA", "GOOGL"])
    period = data.get("period", "6mo")

    result = {}
    for ticker in tickers:
        ticker = ticker.upper().strip()
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)
        if hist.empty:
            continue
        hist.reset_index(inplace=True)
        hist.columns = [c.lower() for c in hist.columns]
        hist = hist[["date", "open", "high", "low", "close", "volume"]]
        df = detect_anomalies(hist)
        total = len(df)
        anomalies = int(df["is_anomaly"].sum())
        result[ticker] = {
            "risk_score": round((anomalies / total) * 100, 2),
            "anomalies": anomalies,
            "total": total,
            "latest_close": round(float(df["close"].iloc[-1]), 2),
            "price_change_pct": round(float(
                (df["close"].iloc[-1] - df["close"].iloc[0]) / df["close"].iloc[0] * 100
            ), 2)
        }
    return jsonify(result)

@app.route("/api/alerts/<ticker>", methods=["GET"])
def alerts(ticker):
    session = Session()
    rows = session.query(AnomalyResult).filter_by(ticker=ticker.upper()).all()
    session.close()

    if not rows:
        return jsonify({"alerts": []})

    alerts_list = []
    for r in rows:
        if r.is_anomaly == 1:
            severity = "HIGH" if r.anomaly_score > 0.08 else "MEDIUM"
            alerts_list.append({
                "date": str(r.date),
                "close": round(r.close, 2),
                "score": round(r.anomaly_score, 4),
                "severity": severity,
                "message": f"Unusual price movement detected on {str(r.date)[:10]} — score {round(r.anomaly_score, 4)}"
            })

    alerts_list.sort(key=lambda x: x["score"], reverse=True)
    return jsonify({"ticker": ticker.upper(), "alerts": alerts_list[:5]})

@app.route("/api/news/<ticker>", methods=["GET"])
def news(ticker):
    try:
        stock = yf.Ticker(ticker.upper())
        news_items = stock.news[:6]
        result = []
        for item in news_items:
            content = item.get("content", {})
            result.append({
                "title": content.get("title", "No title"),
                "summary": content.get("summary", ""),
                "url": content.get("canonicalUrl", {}).get("url", "#"),
                "published": content.get("pubDate", "")[:10] if content.get("pubDate") else "",
                "source": content.get("provider", {}).get("displayName", "Yahoo Finance")
            })
        return jsonify({"ticker": ticker.upper(), "news": result})
    except Exception as e:
        return jsonify({"ticker": ticker.upper(), "news": [], "error": str(e)})
    
@app.route("/api/market", methods=["GET"])
def market():
    try:
        symbols = {
            "S&P 500": "^GSPC",
            "NASDAQ": "^IXIC",
            "DOW": "^DJI",
            "VIX": "^VIX",
            "NIFTY 50": "^NSEI",
            "SENSEX": "^BSESN",
        }
        result = []
        for name, sym in symbols.items():
            try:
                t = yf.Ticker(sym)
                hist = t.history(period="2d")
                if len(hist) < 2:
                    continue
                prev = float(hist["Close"].iloc[-2])
                curr = float(hist["Close"].iloc[-1])
                change_pct = round((curr - prev) / prev * 100, 2)
                result.append({
                    "name": name,
                    "value": f"{curr:,.2f}",
                    "change": f"{'+' if change_pct >= 0 else ''}{change_pct}%",
                    "positive": change_pct >= 0,
                })
            except:
                continue
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/portfolio-stats", methods=["POST"])
def portfolio_stats():
    try:
        data = request.json
        tickers = data.get("tickers", ["AAPL", "MSFT", "NVDA", "TSLA", "AMZN"])
        total_value = 0
        total_cost = 0
        anomaly_count = 0

        shares_map = {"AAPL": 450, "MSFT": 200, "NVDA": 120, "TSLA": 180, "AMZN": 300}
        cost_map = {"AAPL": 152.30, "MSFT": 380.00, "NVDA": 680.00, "TSLA": 220.00, "AMZN": 178.00}

        for ticker in tickers:
            try:
                t = yf.Ticker(ticker)
                hist = t.history(period="2d")
                if hist.empty:
                    continue
                curr = float(hist["Close"].iloc[-1])
                shares = shares_map.get(ticker, 100)
                cost = cost_map.get(ticker, curr)
                total_value += curr * shares
                total_cost += cost * shares

                session = Session()
                rows = session.query(AnomalyResult).filter_by(ticker=ticker).all()
                session.close()
                anomaly_count += sum(r.is_anomaly for r in rows)
            except:
                continue

        pl = total_value - total_cost
        pl_pct = round((pl / total_cost * 100), 2) if total_cost > 0 else 0

        return jsonify({
            "portfolio_value": round(total_value, 2),
            "portfolio_value_fmt": f"${total_value:,.2f}",
            "pl": round(pl, 2),
            "pl_fmt": f"{'+' if pl >= 0 else ''}${abs(pl):,.2f}",
            "pl_pct": f"{'+' if pl_pct >= 0 else ''}{pl_pct}%",
            "pl_positive": pl >= 0,
            "anomaly_count": anomaly_count,
            "risk_score": "High" if pl_pct < -5 else "Low" if pl_pct > 0 else "Medium",
            "risk_positive": pl_pct >= 0,
            "signal_strength": min(100, max(50, round(84 - anomaly_count * 2))),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)