import { useEffect, useState } from "react";

type RawEmissionRow = {
  country: string;
  co2?: number | null;
  co2_per_capita?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
};

type EmissionRow = {
  country: string;
  co2: number;
  lat: number;
  lng: number;
};

export function useCountryEmissions(
  apiBase = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000"
) {
  const [data, setData] = useState<EmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBase}/countryEmissions`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload = (await res.json()) as RawEmissionRow[];

        const normalized = payload
          .map((row) => {
            const lat = row.latitude ?? row.lat;
            const lng = row.longitude ?? row.lng;
            const co2 = row.co2 ?? row.co2_per_capita;

            if (
              typeof row.country !== "string" ||
              typeof lat !== "number" ||
              typeof lng !== "number" ||
              typeof co2 !== "number"
            ) {
              return null;
            }

            return {
              country: row.country,
              co2,
              lat,
              lng,
            };
          })
          .filter((row): row is EmissionRow => row !== null);

        if (!cancelled) {
          setData(normalized);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [apiBase]);

  return { data, loading, error };
}