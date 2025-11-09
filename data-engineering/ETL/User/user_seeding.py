# Databricks notebook source
# MAGIC %sql
# MAGIC CREATE TABLE IF NOT EXISTS raw.user.daily_footprint (
# MAGIC     user_id STRING,
# MAGIC     date DATE,
# MAGIC     transport_weight FLOAT,
# MAGIC     energy_weight FLOAT,
# MAGIC     diet_weight FLOAT,
# MAGIC     recycling_modifier FLOAT,
# MAGIC     offset_modifier FLOAT,
# MAGIC     total_emission_kgco2 FLOAT
# MAGIC )
# MAGIC USING DELTA;

# COMMAND ----------

from pyspark.sql import SparkSession
import pandas as pd
import random
from datetime import datetime, timedelta

spark = SparkSession.builder.getOrCreate()

users = ["ID"]
start_date = datetime(2025, 8, 1)
end_date = datetime(2025, 10, 31)  # ~3 months of data
total_days = (end_date - start_date).days + 1

possible_transport_weights = [5.0, 2.5, 1.8, 0.0, 0.2]
possible_energy_weights = [3.0, 2.0, 1.0, 0.5]
possible_diet_weights = [4.0, 2.5, 1.5, 1.0]
possible_recycling_modifiers = [0.0, -0.3, -0.6, -1.0]
possible_offset_modifiers = [0.0, -1.0, -0.7, -1.5]

records = []

for user in users:
    for i in range(total_days):
        date = start_date + timedelta(days=i)

        transport_weight = random.choice(possible_transport_weights)
        energy_weight = random.choice(possible_energy_weights)
        diet_weight = random.choice(possible_diet_weights)
        recycling_modifier = random.choice(possible_recycling_modifiers)
        offset_modifier = random.choice(possible_offset_modifiers)

        total_emission = max(
            transport_weight
            + energy_weight
            + diet_weight
            + recycling_modifier
            + offset_modifier,
            0,
        )

        records.append(
            {
                "user_id": user,
                "date": date.date(),
                "transport_weight": transport_weight,
                "energy_weight": energy_weight,
                "diet_weight": diet_weight,
                "recycling_modifier": recycling_modifier,
                "offset_modifier": offset_modifier,
                "total_emission_kgco2": round(total_emission, 2),
            }
        )

pdf = pd.DataFrame(records)
df = spark.createDataFrame(pdf)

display(df)

df.write.mode("append").saveAsTable("raw.user.daily_footprint")
