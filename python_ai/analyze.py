from fastapi import FastAPI
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import xgboost as xgb
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  # або ["*"] для розвитку
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

class ForecastRequest(BaseModel):
    uid: str

@app.post("/forecast")
async def forecast_expense(data: ForecastRequest):
    USER_UID = data.uid
    transactions = []

    for doc in db.collection("transactions").stream():
        d = doc.to_dict()
        if d.get("uid") == USER_UID and d.get("type") == "expense":
            try:
                date = pd.to_datetime(d["date"].isoformat())
            except:
                continue
            transactions.append({
                "amount": d["amount"],
                "date": date,
                "category": d["type"],
                "walletId": d.get("walletId"),
            })

    df = pd.DataFrame(transactions)

    if df.empty:
        return {"error": "No transactions for analysis"}

    df["month"] = df["date"].dt.to_period("M").astype(str)
    monthly = df.groupby("month")["amount"].sum().reset_index()
    monthly["month_num"] = pd.to_datetime(monthly["month"]).dt.month

    X = monthly[["month_num"]]
    y = monthly["amount"]

    model = xgb.XGBRegressor()
    model.fit(X, y)

    next_month = monthly["month_num"].max() + 1
    if next_month > 12:
        next_month = 1

    pred = model.predict(np.array([[next_month]]))[0]
    mean = y.mean()

    status = "stable" if pred <= mean else "higher_expense"

    return {
    "next_month": int(next_month),
    "prediction": float(round(pred, 2)),
    "mean": float(round(mean, 2)),
    "status": status,
}

