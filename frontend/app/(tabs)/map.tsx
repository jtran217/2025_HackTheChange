import React, { useEffect, useState } from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView, { Circle } from "react-native-maps";
import { Text, ActivityIndicator, Surface } from "react-native-paper";
import co2Data from "../../dummy.json";

// Will need to get real data later from database api. Put in dummy data for now.
export default function MapScreen() {
  const [region, setRegion] = useState(null);
  const [countryData, setCountryData] = useState(null);

  const DESATURATED_STYLE = [
    { elementType: "geometry", stylers: [{ saturation: -60 }, { lightness: 10 }] },
    { elementType: "labels", stylers: [{ saturation: -100 }] },
  ];

  // Default USA for now
  const country =  "United States";

  const getColorByCO2 = (value) => {
    if (value <= 2) return "#4CAF50"; 
    if (value <= 6) return "#FFEB3B"; 
    if (value <= 10) return "#FF9800"; 
    return "#F44336";
  };

  useEffect(() => {
    const data = co2Data[country];
    if (data) {
      setCountryData(data);
      setRegion({
        latitude: data.lat,
        longitude: data.lng,
        latitudeDelta: 15,
        longitudeDelta: 15,
      });
    }
  }, [country]);

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator animating={true} />
        <Text>Loading map...</Text>
      </View>
    );
  }

  const emission = countryData.co2;
  const radius = 200000 + emission * 25000; 
  const color = getColorByCO2(emission);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        mapType={Platform.OS === "ios" ? "mutedStandard" : "standard"}
        customMapStyle={DESATURATED_STYLE}
      >
        <Circle
          center={{ latitude: countryData.lat, longitude: countryData.lng }}
          radius={radius}
          fillColor={`${color}55`}
          strokeColor={color}
          strokeWidth={2}
        />
      </MapView>
      <Surface style={styles.infoBox}>
        <Text variant="titleMedium">{country}</Text>
        <Text>CO₂ emissions per capita: {countryData.co2} tons</Text>
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
});
