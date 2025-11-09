EMISSIONS_QUERY = """
WITH top_countries AS (
  SELECT *
  FROM clean.master.co2_data
  WHERE year = 2023
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND country NOT IN ('Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica', 'Canada')
  ORDER BY population DESC
  LIMIT 30
),
canada_row AS (
  SELECT *
  FROM clean.master.co2_data
  WHERE year = 2023
    AND latitude IS NOT NULL
    AND longitude IS NOT NULL
    AND country in ('Canada', 'Australia')
)
SELECT * FROM top_countries
UNION ALL
SELECT * FROM canada_row
""" 

HABITS_QUERY = """
INSERT INTO raw.user.daily_footprint (
    user_id,
    date,
    transport_weight,
    energy_weight,
    diet_weight,
    recycling_modifier,
    offset_modifier,
    total_emission_kgco2
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
"""