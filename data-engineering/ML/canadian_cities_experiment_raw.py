# Databricks notebook source
# MAGIC %pip install prophet

# COMMAND ----------

df = spark.read.table("clean.master.canadian_cities")
df = df.na.drop(subset=["city", "year", "total"])
display(df)

# COMMAND ----------

import mlflow
experiment_name = "/Users/ajaypalsallh@gmail.com/canadian_co2_forecast_experiment"
mlflow.set_experiment(experiment_name)

# COMMAND ----------

from prophet import Prophet
import pandas as pd
import mlflow
import mlflow.pyfunc

pdf = df.toPandas().sort_values(["city", "year"])

results = []

for city in pdf["city"].unique():
    city_data = pdf[pdf["city"] == city][["year", "total"]]
    city_data = city_data.rename(columns={"year": "ds", "total": "y"})
    city_data["ds"] = pd.to_datetime(city_data["ds"], format="%Y")

    #  Skipping data points with less than 2 points of data
    if city_data.shape[0] < 2:
        print(f"Skipping {city}: not enough data points ({city_data.shape[0]})")
        continue

    with mlflow.start_run(run_name=city):
        model = Prophet()
        model.fit(city_data)

        future = model.make_future_dataframe(periods=7, freq="Y")
        forecast = model.predict(future)

        forecast["city"] = city
        results.append(forecast[["ds", "city", "yhat", "yhat_lower", "yhat_upper"]])

        mlflow.log_param("city", city)
        mlflow.log_metric("latest_predicted", forecast["yhat"].iloc[-1])

        # Save Prophet model as artifact
        # mlflow.pyfunc.log_model(
        #     artifact_path="model",
        #     python_model=model,
        # )

        mlflow.log_param("model_type", "Prophet")

if len(results) > 0:
    all_forecasts = pd.concat(results)
    print("Forecast generated successfully.")
else:
    print("No valid cities found for forecasting.")

# COMMAND ----------

# MAGIC %sql
# MAGIC create schema if not exists raw.ml;
# MAGIC
# MAGIC create table if not exists raw.ml.canadian_cities_forecast

# COMMAND ----------

forecast_spark = spark.createDataFrame(all_forecasts)
forecast_spark.write.mode("overwrite").option("overwriteSchema", "true").saveAsTable("raw.ml.canadian_cities_forecast")
display(forecast_spark)
