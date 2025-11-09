-- Databricks notebook source
create schema if not exists clean.ml

-- COMMAND ----------

CREATE OR REPLACE TABLE clean.ml.city_co2_forecasts_clean AS
SELECT
    *,
    CASE
        WHEN yhat < 0 THEN 0
        ELSE yhat
    END AS yhat_clean
FROM raw.ml.canadian_cities_forecast;

-- COMMAND ----------

select * from clean.ml.city_co2_forecasts_clean
