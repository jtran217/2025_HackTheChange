# Databricks notebook source
# MAGIC %md
# MAGIC # Clean Load

# COMMAND ----------

# MAGIC %sql
# MAGIC CREATE SCHEMA IF NOT EXISTS clean.master;
# MAGIC
# MAGIC CREATE TABLE IF NOT EXISTS clean.master.co2_data;

# COMMAND ----------

from pyspark.sql import functions as F

df = spark.table("raw.master.co2_data")

clean_df = (
    df.select(
        "country",
        "year",
        "population",
        "gdp",
        "co2",
        "co2_per_capita",
        "co2_per_gdp",
        "primary_energy_consumption",
        "share_global_co2",
        "temperature_change_from_co2",
    )
    .where((F.col("co2").isNotNull()) & (F.col("co2") != 0))
)

# COMMAND ----------

import requests
import pandas as pd

countries = [row["country"] for row in clean_df.select("country").distinct().collect()]

geo_records = []
for country in countries:
    try:
        resp = requests.get(
            f"https://restcountries.com/v3.1/name/{country}?fields=name,latlng"
        )
        data = resp.json()

        if isinstance(data, list) and len(data) > 0:
            lat, lon = data[0]["latlng"]
            geo_records.append((country, lat, lon))
        else:
            geo_records.append((country, None, None))
    except Exception as e:
        geo_records.append((country, None, None))
        print(f"Warning: failed to get {country}: {e}")

geo_pdf = pd.DataFrame(geo_records, columns=["country", "latitude", "longitude"])
geo_df = spark.createDataFrame(geo_pdf)

clean_with_geo_df = (
    clean_df.alias("c")
    .join(geo_df.alias("g"), F.col("c.country") == F.col("g.country"), "left")
    .select(
        "c.country",
        "c.year",
        "c.population",
        "c.co2",
        "c.co2_per_capita",
        "c.primary_energy_consumption",
        "c.share_global_co2",
        "c.temperature_change_from_co2",
        "g.latitude",
        "g.longitude",
    )
)

clean_with_geo_df.write \
    .format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .saveAsTable("clean.master.co2_data")
