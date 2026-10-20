# Food Delivery Time Prediction

An end-to-end machine learning project that estimates how long a food order may take to arrive. The repository contains the analysis and model-training notebook, the supplied delivery dataset, a trained Random Forest model, a FastAPI prediction service, and a Next.js interface for exploring delivery scenarios.

The estimate is returned in **minutes**. It is a prediction based on historical patterns in the data; actual delivery times can differ.

## Project contents

| Path | Description |
| --- | --- |
| [`delivery_time_prediction.ipynb`](delivery_time_prediction.ipynb) | Data exploration, cleaning, feature engineering, model comparisons, and model training. |
| [`data.csv`](data.csv) | The delivery records used by the notebook (45,584 rows and 20 source columns). |
| [`delivery-time-api/api`](delivery-time-api/api) | FastAPI service, trained model, and preprocessing scaler. |
| [`delivery-time-api/frontend`](delivery-time-api/frontend) | Next.js interactive delivery-time estimator. |
| [`delivery-time-api/readme.md`](delivery-time-api/readme.md) | API, frontend, installation, and request instructions. |
| [`requirements.txt`](requirements.txt) | Python dependencies for notebook analysis and model training. |

### Data preparation

The following cleanup and feature engineering steps:

1. Removed the record identifiers `ID` and `Delivery_person_ID` from the modeling data.
2. Filled missing delivery-person age values with the rounded mean.
3. Clipped delivery-person ratings above 5 to 5, then fills missing ratings with the median.
4. Removed rows with a zero restaurant or delivery coordinate.
5. Filled missing multiple-delivery counts with the median; fills missing weather, traffic, festival, and city values with their modes.
6. Calculated `distance_km` from restaurant and customer coordinates using the Haversine formula and removes calculated distances of 100 km or more.
7. Extracted `order_hour` from `Time_Orderd`; missing or unparseable hours are filled with the median.

The model uses these 12 inputs:

`Delivery_person_Age`, `Delivery_person_Ratings`, `distance_km`, `order_hour`, `Weather_conditions`, `Road_traffic_density`, `Vehicle_condition`, `Type_of_order`, `Type_of_vehicle`, `multiple_deliveries`, `Festival`, and `City`.

Traffic is encoded as an ordered value (`Low` = 0, `Medium` = 1, `High` = 2, `Jam` = 3). The notebook one-hot encodes order type, vehicle type, festival, city, and weather using `drop_first=True`, then standardizes the resulting features with `StandardScaler`.

### Model training and reported results

There is 80/20 train/test split with `random_state=42`. Compareing linear regression, a decision tree, random forests, and XGBoost, including randomized hyperparameter searches. The tuned Random Forest is selected and saved as `rf_best.pkl`; the fitted scaler is saved as `standard_scaler.pkl`.

The test-set results:

| Model | MAE (minutes) | RMSE (minutes) | R² |
| --- | ---: | ---: | ---: |
| Linear Regression | 4.793 | 6.014 | 0.585 |
| Decision Tree | 4.151 | 5.489 | 0.654 |
| Tuned XGBoost | 3.102 | 3.903 | 0.825 |
| **Tuned Random Forest** | **3.088** | **3.882** | **0.827** |

MAE is the average absolute prediction error; RMSE gives larger errors more weight; R² describes how much target variation the model explains on the test split. These are the notebook’s reported results and may vary if the data, preprocessing, split, or training environment changes.

## Run the web application

The full setup, endpoint details, example payload, and input constraints are in the [API and frontend guide](delivery-time-api/readme.md). In short, start the API in one terminal and the Next.js frontend in another. Visit `http://localhost:3000` to use the estimator.

The serving API validates inputs against supported values and ranges. In particular, the interactive app accepts trips from **1.4 to 21 km** and order hours from **08:00 to 23:00**, which reflect the observed range in the cleaned data used by this project. Inputs outside the supported range are rejected rather than extrapolated.

## Reproducing the notebook

From the project root, create a Python environment and install the notebook dependencies:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
jupyter notebook delivery_time_prediction.ipynb
```

Run the notebook cells sequentially so that cleaning, feature generation, encoding, scaling, and training use the same data state. The serialization cell writes `rf_best.pkl` and `standard_scaler.pkl` to the notebook’s current working directory. Copy both files into `delivery-time-api/api` if you retrain the model and want the API to serve that newly trained pair.

## Limitations

- The model reflects the dataset and preprocessing used in the notebook; it does not account for live maps, current weather feeds, restaurant preparation status, or real-time courier location.
- Predictions are estimates, not guaranteed arrival times.
- The API supports only the categories and numeric ranges.