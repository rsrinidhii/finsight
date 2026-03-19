from flask import Flask, jsonify, request
from flask_cors import CORS
import yfinance as yf
import pandas as pd
from database import Session, StockPrice, AnomalyResult, engine
from ml_model import detect_anomalies
import datetime

app = Flask(__name__)
CORS(app)

@app.route("/api/analyze", methods=["POST"])
def analyze():
    data = request.json
    ticker = data.get("ticker", "AAPL").upper()
    period = data.get("period", "6mo")

    # Fetch from Yahoo Finance
    stock = yf.Ticker(ticker)
    hist = stock.history(period=period)

    if hist.empty:
        return jsonify({"error": "Invalid ticker or no data"}), 400

    hist.reset_index(inplace=True)
    hist.columns = [c.lower() for c in hist.columns]
    hist = hist[["date", "open", "high", "low", "close", "volume"]]

    # Run anomaly detection
    result_df = detect_anomalies(hist)

    # Save to DB
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
    
if __name__ == "__main__":
    app.run(debug=True, port=5000)