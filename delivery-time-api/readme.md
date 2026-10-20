# Delivery Time Prediction — API and Web App

The application layer for the food delivery time prediction:

- **FastAPI** receives delivery details, validates them, applies the notebook’s encodings and saved scaler, and returns the Random Forest estimate in minutes.
- **Next.js** provides an interactive interface for building a delivery scenario and viewing the estimate.

For the dataset, notebook workflow, feature engineering, and model evaluation, see the [project README](../readme.md) and [`delivery_time_prediction.ipynb`](../delivery_time_prediction.ipynb).

## Project structure

```text
delivery-time-api/
├── api/
│   ├── main.py
│   ├── requirements.txt
│   ├── rf_best.pkl
│   └── standard_scaler.pkl
└── frontend/
    ├── app/
    ├── package.json
    └── package-lock.json
```

The API expects both model artifacts beside `main.py`. `rf_best.pkl` contains the tuned Random Forest; `standard_scaler.pkl` contains the fitted `StandardScaler`. They must be the matching pair produced by the notebook. The API verifies the 21-feature schema when it loads. A missing model prevents startup; a missing scaler causes `/predict` to return HTTP 503 rather than produce an unscaled estimate.

## Run locally

Start the API and frontend in separate terminals from the repository root.

### 1. Start FastAPI

The API requirements pin scikit-learn to **1.6.1**, the version used to serialize the model. Use Python 3.12 and a fresh virtual environment:

```powershell
cd delivery-time-api/api
py -3.12 -m venv .venv312
.\.venv312\Scripts\Activate.ps1
python -m pip install -r requirements.txt
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Check service and artifact status at [`http://localhost:8000/health`](http://localhost:8000/health). Interactive API documentation is at [`http://localhost:8000/docs`](http://localhost:8000/docs).

### 2. Start Next.js

In a second terminal:

```powershell
cd delivery-time-api/frontend
npm ci
npm run dev
```

Open [`http://localhost:3000`](http://localhost:3000). The frontend defaults to `http://localhost:8000` for its API URL. If the API runs elsewhere, create `frontend/.env.local` with:

```text
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Restart the Next.js dev server after changing the environment variable. The API allows local development origins and any production origins listed in its `CORS_ORIGINS` environment variable. In Render, set `CORS_ORIGINS` to your Vercel site origin, for example `https://your-project.vercel.app` (no trailing slash). For multiple domains, separate origins with commas.

## API endpoints

### `GET /health`

Reports whether the model and scaler are available:

```json
{
  "status": "ok",
  "model_loaded": true,
  "scaler_loaded": true
}
```

### `POST /predict`

Send a JSON object containing the 12 model inputs. Example:

```json
{
  "Delivery_person_Age": 28,
  "Delivery_person_Ratings": 4.6,
  "distance_km": 5.2,
  "order_hour": 18,
  "Weather_conditions": "Cloudy",
  "Road_traffic_density": "Medium",
  "Vehicle_condition": 2,
  "Type_of_order": "Meal",
  "Type_of_vehicle": "motorcycle",
  "multiple_deliveries": 1,
  "Festival": "No",
  "City": "Urban"
}
```

Example response:

```json
{
  "predicted_delivery_time_minutes": 27.4
}
```

The number above illustrates the response format; the actual estimate depends on the loaded model and supplied inputs.

PowerShell request example:

```powershell
$body = @{
  Delivery_person_Age = 28
  Delivery_person_Ratings = 4.6
  distance_km = 5.2
  order_hour = 18
  Weather_conditions = "Cloudy"
  Road_traffic_density = "Medium"
  Vehicle_condition = 2
  Type_of_order = "Meal"
  Type_of_vehicle = "motorcycle"
  multiple_deliveries = 1
  Festival = "No"
  City = "Urban"
} | ConvertTo-Json
Invoke-RestMethod -Uri http://localhost:8000/predict -Method Post -ContentType "application/json" -Body $body
```

## Accepted values and validation

The API validates requests even if they do not come from the web interface. Invalid values receive FastAPI/Pydantic validation errors (HTTP 422).

| Input | Accepted values |
| --- | --- |
| `Delivery_person_Age` | 15–50 |
| `Delivery_person_Ratings` | 1–5; the notebook clips source ratings above 5 |
| `distance_km` | 1.4–21 km |
| `order_hour` | Integer hour 8–23 |
| `Weather_conditions` | `Cloudy`, `Fog`, `Sandstorms`, `Stormy`, `Sunny`, `Windy` |
| `Road_traffic_density` | `Low`, `Medium`, `High`, `Jam` |
| `Vehicle_condition` | Integer score 0–3 |
| `Type_of_order` | `Buffet`, `Drinks`, `Meal`, `Snack` |
| `Type_of_vehicle` | `bicycle`, `electric_scooter`, `motorcycle`, `scooter` |
| `multiple_deliveries` | Integer count 0–3 |
| `Festival` | `Yes`, `No` |
| `City` | `Metropolitian`, `Semi-Urban`, `Urban` |

The distance and hour ranges reflect the values observed after the notebook’s data cleaning. The UI constrains inputs to these ranges, and the API enforces them independently. The app describes vehicle condition as a score; a value of 0 is valid. A zero multiple-delivery count means there are no additional deliveries.

## How a request becomes a prediction

1. Pydantic validates types, allowed categories, and numeric bounds.
2. Traffic density is mapped to the notebook’s ordinal values: Low = 0, Medium = 1, High = 2, Jam = 3.
3. Nominal values are one-hot encoded in the exact 21-column order used in training. The dropped baseline categories are Buffet, bicycle, Festival No, Metropolitian, and Cloudy.
4. The saved scaler transforms the row, then `rf_best.pkl` predicts delivery time in minutes.

The UI gathers all 12 values. Distance and order hour use numeric controls; weather, traffic, vehicle, and order type use visual choices; partner and remaining delivery details are available in the delivery details section.


