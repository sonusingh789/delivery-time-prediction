from pathlib import Path
from typing import Literal

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "rf_best.pkl"
SCALER_PATH = BASE_DIR / "standard_scaler.pkl"

FEATURES = [
    "Delivery_person_Age",
    "Delivery_person_Ratings",
    "distance_km",
    "order_hour",
    "Road_traffic_density",
    "Vehicle_condition",
    "multiple_deliveries",
    "Type_of_order_Drinks",
    "Type_of_order_Meal",
    "Type_of_order_Snack",
    "Type_of_vehicle_electric_scooter",
    "Type_of_vehicle_motorcycle",
    "Type_of_vehicle_scooter",
    "Festival_Yes",
    "City_Semi-Urban",
    "City_Urban",
    "Weather_conditions_Fog",
    "Weather_conditions_Sandstorms",
    "Weather_conditions_Stormy",
    "Weather_conditions_Sunny",
    "Weather_conditions_Windy",
]

app = FastAPI(title="Delivery Time Prediction API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

model = joblib.load(MODEL_PATH)
if list(getattr(model, "feature_names_in_", [])) != FEATURES:
    raise RuntimeError("The model feature schema does not match the API feature schema.")
scaler = joblib.load(SCALER_PATH) if SCALER_PATH.exists() else None
if scaler is not None and list(getattr(scaler, "feature_names_in_", [])) != FEATURES:
    raise RuntimeError("The scaler feature schema does not match the API feature schema.")


class DeliveryInput(BaseModel):
    Delivery_person_Age: float = Field(ge=15, le=50)
    Delivery_person_Ratings: float = Field(ge=1, le=5)
    distance_km: float = Field(ge=1.4, le=21)
    order_hour: int = Field(ge=8, le=23)
    Weather_conditions: Literal["Fog", "Sandstorms", "Stormy", "Sunny", "Windy", "Cloudy"]
    Road_traffic_density: Literal["Low", "Medium", "High", "Jam"]
    Vehicle_condition: int = Field(ge=0, le=3)
    Type_of_order: Literal["Drinks", "Meal", "Snack", "Buffet"]
    Type_of_vehicle: Literal["bicycle", "electric_scooter", "motorcycle", "scooter"]
    multiple_deliveries: int = Field(ge=0, le=3)
    Festival: Literal["Yes", "No"]
    City: Literal["Semi-Urban", "Urban", "Metropolitian"]


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": True, "scaler_loaded": scaler is not None}


@app.post("/predict")
def predict(data: DeliveryInput):
    if scaler is None:
        raise HTTPException(
            status_code=503,
            detail=(
                "Preprocessing scaler is missing. Place standard_scaler.pkl beside main.py; "
                "the model was trained on standardized features."
            ),
        )

    values = data.model_dump()
    row = {
        "Delivery_person_Age": values["Delivery_person_Age"],
        "Delivery_person_Ratings": values["Delivery_person_Ratings"],
        "distance_km": values["distance_km"],
        "order_hour": values["order_hour"],
        "Road_traffic_density": {"Low": 0, "Medium": 1, "High": 2, "Jam": 3}[values["Road_traffic_density"]],
        "Vehicle_condition": values["Vehicle_condition"],
        "multiple_deliveries": values["multiple_deliveries"],
    }
    for category, choices in {
        "Type_of_order": ["Drinks", "Meal", "Snack"],
        "Type_of_vehicle": ["electric_scooter", "motorcycle", "scooter"],
        "Festival": ["Yes"],
        "City": ["Semi-Urban", "Urban"],
        "Weather_conditions": ["Fog", "Sandstorms", "Stormy", "Sunny", "Windy"],
    }.items():
        for choice in choices:
            row[f"{category}_{choice}"] = int(values[category] == choice)

    frame = pd.DataFrame([[row[name] for name in FEATURES]], columns=FEATURES)
    scaled = pd.DataFrame(scaler.transform(frame), columns=FEATURES)
    minutes = float(model.predict(scaled)[0])
    return {"predicted_delivery_time_minutes": round(minutes, 1)}
