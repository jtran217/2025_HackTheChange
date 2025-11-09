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