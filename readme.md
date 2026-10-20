
# Delivery Time Prediction Project: End-to-End ML Pipeline Documentation

This notebook documents the building of an end-to-end Machine Learning pipeline to predict the delivery time (in minutes) for orders based on various factors.

---

## 1. Project Workflow Overview
1. **Data Loading & Inspection**: Imported the dataset, examined the target variable `Time_taken (min)`, and identified missing values and feature formats.
2. **Data Cleaning & Handling Nulls**:
   * Imputed delivery agent age and rating nulls using mean and median values.
   * Dropped geographical coordinates containing anomaly values of `0.0` degrees.
   * Filled categorical features like `Weather_conditions` and `Road_traffic_density` with their corresponding statistical modes.
3. **Exploratory Data Analysis (EDA)**:
   * Visualized target distributions and correlations between numeric columns.
   * Analyzed key factors like weather, traffic density, and age groups on overall delivery speed.
4. **Feature Engineering**:
   * Calculated exact geodesic travel distances using the **Haversine formula** from restaurant coordinates to customer coordinates.
   * Parsed delivery hours from order timestamps to capture temporal patterns.
5. **Encoding & Scaling**:
   * Encoded ordinal features like `Road_traffic_density` and one-hot encoded nominal values.
   * Normalized training features using a standard scaling method.
6. **Model Selection & Evaluation**:
   * Trained and evaluated baseline linear, decision tree, random forest, and XGBoost models.
   * Performed Hyperparameter optimization using Randomized Search CV.
   * Decided on the **Tuned Random Forest Regressor** as the champion production model due to its high test-set R² score (~0.827) and stable generalizability.

---

## 2. Model Performance Summary

| Model | Dataset | Mean Absolute Error (MAE) | Root Mean Squared Error (RMSE) | R² Score |
| :--- | :--- | :--- | :--- | :--- |
| **Linear Regression** | Test | 4.793 | 6.014 | 0.585 |
| **Decision Tree** | Test | 4.151 | 5.489 | 0.654 |
| **XGBoost (Tuned)** | Test | 3.102 | 3.903 | 0.825 |
| **Random Forest (Tuned)** | **Test** | **3.088** | **3.882** | **0.827** |

*The Tuned Random Forest model was successfully serialized into `rf_best.pkl` alongside the standard scaler for production use.*
