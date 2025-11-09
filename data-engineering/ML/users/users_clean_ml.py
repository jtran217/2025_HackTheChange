# Databricks notebook source
# MAGIC %md
# MAGIC # User Clean - ML

# COMMAND ----------

# MAGIC %sql
# MAGIC create schema if not exists clean.user

# COMMAND ----------

dbutils.widgets.text("user_id", "")
USER_ID = dbutils.widgets.get("user_id")

print(f"Running projection for user_id: {USER_ID or 'ALL'}")

# COMMAND ----------

from pyspark.sql.functions import col

data_count = (
    spark.table("raw.user.daily_footprint")
    .filter(col("user_id") == USER_ID)
    .count()
    if USER_ID else None
)

if USER_ID and (data_count is None or data_count < 5):
    print(f"Not enough data to train for user_id {USER_ID}. Exiting program.")
    dbutils.notebook.exit("Insufficient data for user_id")

# COMMAND ----------

from pyspark.ml.feature import VectorAssembler
from pyspark.ml.regression import LinearRegression
from pyspark.sql import functions as F
from pyspark.sql.functions import col, lit, max as spark_max
from pyspark.sql.types import DateType
import datetime
import mlflow

dbutils.widgets.text("user_id", "")
USER_ID = dbutils.widgets.get("user_id")

if not USER_ID:
    raise ValueError("user_id parameter is required for this run")

print(f"Running forecast for user_id: {USER_ID}")

data = (
    spark.table("raw.user.daily_footprint")
    .withColumn("date", col("date").cast("date"))
    .filter(col("user_id") == USER_ID)
)

if data.count() < 5:
    raise ValueError(f"Not enough data to train for user_id {USER_ID}")

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
assembled = assembler.transform(data)

mlflow.set_experiment("/Users/ajaypalsallh@gmail.com/user_emission_forecast")

with mlflow.start_run(run_name=f"user_{USER_ID}"):

    lr = LinearRegression(featuresCol="features", labelCol="total_emission_kgco2")
    model = lr.fit(assembled)

    mlflow.log_param("user_id", USER_ID)
    mlflow.log_metric("r2", model.summary.r2)
    mlflow.log_metric("rmse", model.summary.rootMeanSquaredError)

    hist = (
        model.transform(assembled)
        .select("date", "user_id", col("prediction").alias("predicted_emission"))
        .withColumn("is_forecast", lit(False))
    )

    last_date = data.select(spark_max("date")).first()[0]
    pattern = data.orderBy(F.desc("date")).limit(7).toPandas()

    future_rows = []
    for i in range(1, 31):
        base = pattern.iloc[i % len(pattern)]
        future_rows.append((
            last_date + datetime.timedelta(days=i),
            USER_ID,
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

    combined = hist.unionByName(forecast)

(combined
 .select("date", "user_id", "predicted_emission", "is_forecast")
 .write
 .option("replaceWhere", f"user_id = '{USER_ID}'")  
 .mode("overwrite")
 .saveAsTable("clean.user.daily_footprint_projected"))

display(combined)
