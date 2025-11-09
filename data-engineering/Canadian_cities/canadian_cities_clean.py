# Databricks notebook source
# MAGIC %md
# MAGIC # Clean Load

# COMMAND ----------

# MAGIC %pip install geopy

# COMMAND ----------

from geopy.geocoders import Nominatim
import pandas as pd
import time

df = spark.table("raw.master.canadian_cities")

top_canadian_cities = [
    "Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa",
    "Winnipeg", "Quebec City", "Hamilton", "Mississauga", "Brampton",
    "Kitchener", "London", "Halifax", "Victoria", "Windsor",
    "Saskatoon", "Regina", "St. John's", "Sherbrooke", "Barrie",
    "Kelowna", "Abbotsford", "Sudbury", "Kingston", "Saguenay",
    "Trois-Rivières", "Guelph", "Moncton", "Saint John"
]

geolocator = Nominatim(user_agent="databricks_geocoder", timeout=10)

geo_data = []

for i, city in enumerate(top_canadian_cities, start=1):
    try:
        location = geolocator.geocode(f"{city}, Canada")
        if location:
            geo_data.append(
                {"city": city, "latitude": location.latitude, "longitude": location.longitude}
            )
            print(
                f"[{i}/{len(top_canadian_cities)}] Added {city} -> "
                f"Longitude: {location.longitude:.4f}, Latitude: {location.latitude:.4f}"
            )
        else:
            geo_data.append({"city": city, "latitude": None, "longitude": None})
            print(f"[{i}/{len(top_canadian_cities)}] Could not find {city}")
    except Exception as e:
        geo_data.append({"city": city, "latitude": None, "longitude": None})
        print(f"[{i}/{len(top_canadian_cities)}] Error on {city}: {e}")
    time.sleep(1)  

geo_df = pd.DataFrame(geo_data)

geo_spark_df = spark.createDataFrame(geo_df)

merged_df = df.join(geo_spark_df, on="city", how="left")

merged_df = merged_df.na.drop(subset=["longitude", "latitude"])

# COMMAND ----------

merged_df = merged_df.drop("national_pollutant_release_inventory__npri__identifier", "company___facility_name")
merged_df=merged_df.groupBy("city", "year").sum("total").withColumnRenamed("sum(total)", "total").orderBy("year")

merged_df.write.mode("overwrite").saveAsTable("clean.master.canadian_cities")
