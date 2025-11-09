# Databricks notebook source
# MAGIC %md
# MAGIC # Raw Canadian Cities

# COMMAND ----------

# MAGIC %sql
# MAGIC create schema if not exists raw.master;

# COMMAND ----------

# MAGIC %sql
# MAGIC create table if not exists raw.master.canadian_cities

# COMMAND ----------

import pandas as pd
import re

df = pd.read_csv("/Volumes/raw/master/additional_data/GHGRP Data Nov 08 2025.csv")

df.columns = (
    df.columns.str.strip()
    .str.lower()
    .str.replace(r"[ ,;{}()\n\t=/&]", "_", regex=True)
)

spark_df = spark.createDataFrame(df)

spark_df.write.format("delta") \
    .mode("overwrite") \
    .option("overwriteSchema", "true") \
    .saveAsTable("raw.master.canadian_cities")

# COMMAND ----------

# MAGIC %md
# MAGIC
