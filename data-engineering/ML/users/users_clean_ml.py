# Databricks notebook source
# MAGIC %md
# MAGIC # User Clean - ML

# COMMAND ----------

# MAGIC %sql
# MAGIC create schema if not exists clean.user

# COMMAND ----------

from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.sql import functions as F
from pyspark.sql.functions import col, lit, max as spark_max
from pyspark.sql.types import DateType
import datetime
import mlflow


data = spark.table("raw.user.daily_footprint").withColumn("date", col("date").cast("date"))

assembler = VectorAssembler(
    inputCols=[
        "transport_weight",
        "energy_weight",
        "diet_weight",
        "recycling_modifier",
        "offset_modifier",
    ],
    outputCol="features",
)

mlflow.set_experiment("/Users/ajaypalsallh@gmail.com/user_emission_forecast")
results = []

for user in [r["user_id"] for r in data.select("user_id").distinct().collect()]:
    df_user = data.filter(col("user_id") == user).orderBy("date")
    if df_user.count() < 5:
        print(f"Skipping {user}")
        continue

    assembled = assembler.transform(df_user)

    with mlflow.start_run(run_name=f"user_{user}"):
        lr = LinearRegression(featuresCol="features", labelCol="total_emission_kgco2")
        model = lr.fit(assembled)

        mlflow.log_param("user_id", user)
        mlflow.log_metric("r2", model.summary.r2)
        mlflow.log_metric("rmse", model.summary.rootMeanSquaredError)

        hist_pred = (
            model.transform(assembled)
            .select("date", "user_id", col("prediction").alias("predicted_emission"))
            .withColumn("is_forecast", lit(False))
        )

        last_date = df_user.select(spark_max("date")).first()[0]
        recent_pattern = df_user.orderBy(F.desc("date")).limit(7).toPandas()

        future_rows = []
        for i in range(1, 31):
            base = recent_pattern.iloc[i % len(recent_pattern)]
            future_rows.append((
                last_date + datetime.timedelta(days=i),
                user,
                float(base.transport_weight),
                float(base.energy_weight),
                float(base.diet_weight),
                float(base.recycling_modifier),
                float(base.offset_modifier),
            ))

        future_df = spark.createDataFrame(
            future_rows,
            ["date", "user_id", "transport_weight", "energy_weight",
             "diet_weight", "recycling_modifier", "offset_modifier"]
        )

        future_assembled = assembler.transform(future_df)
        forecast = (
            model.transform(future_assembled)
            .select("date", "user_id", col("prediction").alias("predicted_emission"))
            .withColumn("is_forecast", lit(True))
        )

        combined = hist_pred.unionByName(forecast)
        results.append(combined)

if not results:
    raise ValueError("No results computed")

merged = results[0]
for nxt in results[1:]:
    merged = merged.unionByName(nxt)

final_output = merged.select("date", "user_id", "predicted_emission", "is_forecast")
final_output.write.option("overwriteSchema","true").mode("overwrite").saveAsTable(
    "clean.user.daily_footprint_projected"
)

display(final_output)
