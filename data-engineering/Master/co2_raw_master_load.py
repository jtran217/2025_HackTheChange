# Databricks notebook source
# MAGIC %md
# MAGIC # Initial Load

# COMMAND ----------

import requests

# COMMAND ----------

# MAGIC %sql
# MAGIC create schema if not exists raw.master;
# MAGIC create table if not exists raw.master.co2_data;

# COMMAND ----------

url = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
df = pd.read_csv(url)

spark_df = spark.createDataFrame(df)

spark_df.write.format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .saveAsTable("raw.master.co2_data")
