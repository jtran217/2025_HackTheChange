import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Circle, Marker } from "react-native-maps";
import type { Region } from "react-native-maps";
import { Text, ActivityIndicator, Surface } from "react-native-paper";
import { useCountryEmissions } from "@/hooks/use-country-emissions";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export default function MapScreen() {
  const { data, loading, error } = useCountryEmissions(API_URL);
  const [region, setRegion] = useState<Region | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(
    "United States"
  );

  const DESATURATED_STYLE = [
    { elementType: "geometry", stylers: [{ saturation: -60 }, { lightness: 10 }] },
    { elementType: "labels", stylers: [{ saturation: -100 }] },
  ];

  const getColorByCO2 = (value: number) => {
    if (value >= 5000) return "#dc2626"; 
    if (value >= 1000) return "#f97316"; 
    if (value >= 300) return "#facc15";
    return "#22c55e"; 
  };

  const getRadiusByCO2 = (value: number) => {
    const safeValue = Math.max(value, 0);
    return 120000 + Math.sqrt(safeValue) * 20000;
  };

  useEffect(() => {
    if (data.length === 0) {
      return;
    }

    setSelectedCountry((prev) => {
      if (prev && data.some((item) => item.country === prev)) {
        return prev;
      }

      const fallback =
        data.find((item) => item.country === "United States") ?? data[0];
      return fallback.country;
    });
  }, [data]);

  const activeCountry = useMemo(() => {
    if (!selectedCountry) return null;
    return data.find((item) => item.country === selectedCountry) ?? null;
  }, [data, selectedCountry]);

  useEffect(() => {
    if (!activeCountry) {
      return;
    }

    setRegion({
      latitude: activeCountry.lat,
      longitude: activeCountry.lng,
      latitudeDelta: 15,
      longitudeDelta: 15,
    });
  }, [activeCountry]);

  if (loading || !region || !activeCountry) {
    return (
      <View style={styles.loadingContainer}>
        {loading ? (
          <>
            <ActivityIndicator animating />
            <Text>Loading map...</Text>
          </>
        ) : (
          <Text>{error ?? "No data available"}</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        customMapStyle={DESATURATED_STYLE}
      >
        {data.map((item) => {
          const color = getColorByCO2(item.co2);
          const radius = getRadiusByCO2(item.co2);
          const isActive = item.country === activeCountry.country;

          return (
            <View key={item.country}>
              <Circle
                center={{ latitude: item.lat, longitude: item.lng }}
                radius={radius}
                fillColor={`${color}${isActive ? "AA" : "55"}`}
                strokeColor={color}
                strokeWidth={isActive ? 2 : 1}
              />
              <Marker
                coordinate={{ latitude: item.lat, longitude: item.lng }}
                onPress={() => setSelectedCountry(item.country)}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.tapTarget} />
              </Marker>
            </View>
          );
        })}
      </MapView>
      <Surface style={styles.infoBox}>
        <Text variant="titleMedium">{activeCountry.country}</Text>
        <Text>
          CO₂ emissions: {activeCountry.co2}
        </Text>
      </Surface>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  infoBox: {
    position: "absolute",
    bottom: 30,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "white",
    elevation: 4,
  },
  tapTarget: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0)",
  },
});
