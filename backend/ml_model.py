import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

def detect_anomalies(df):
    df = df.copy()
    df["returns"] = df["close"].pct_change()
    df["volatility"] = df["returns"].rolling(5).std()
    df["volume_change"] = df["volume"].pct_change()

    # Fix for Indian stocks — replace inf and drop NaN
    df.replace([np.inf, -np.inf], np.nan, inplace=True)
    df.dropna(inplace=True)
    df.reset_index(drop=True, inplace=True)

    features = df[["returns", "volatility", "volume_change"]].values
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    model = IsolationForest(contamination=0.05, random_state=42)
    preds = model.fit_predict(features_scaled)
    scores = model.decision_function(features_scaled)

    df["is_anomaly"] = (preds == -1).astype(int)
    df["anomaly_score"] = -scores

    return df