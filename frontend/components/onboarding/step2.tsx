import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, TextInput, Button, Menu } from "react-native-paper";

// Come back to fix "any" type when time available.
export default function Step2({ form, onChange, onNext, onBack }:{form:any, onChange:any, onNext:any, onBack:any}) {
  const [transportMenuVisible, setTransportMenuVisible] = useState(false);
  const [dietMenuVisible, setDietMenuVisible] = useState(false);

  const handleSelectTransport = (value: string) => {
    onChange("transport", value);
    setTransportMenuVisible(false);
  };

  const handleSelectDiet = (value: string) => {
    onChange("diet", value);
    setDietMenuVisible(false);
  };

  const ready = form.transport && form.diet;

  return (
    <View>
      <Text variant="headlineMedium" style={styles.title}>
        Getting around & what you eat
      </Text>

      {/* Transport dropdown */}
      <Menu
        visible={transportMenuVisible}
        onDismiss={() => setTransportMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setTransportMenuVisible(true)}
            style={styles.menuButton}
          >
            {form.transport || "Select main mode of transport"}
          </Button>
        }
      >
        <Menu.Item onPress={() => handleSelectTransport("Car (solo)")} title="Car (solo)" />
        <Menu.Item onPress={() => handleSelectTransport("Carpool")} title="Carpool" />
        <Menu.Item onPress={() => handleSelectTransport("Bus")} title="Bus" />
        <Menu.Item onPress={() => handleSelectTransport("Train")} title="Train" />
        <Menu.Item onPress={() => handleSelectTransport("Bike")} title="Bike" />
        <Menu.Item onPress={() => handleSelectTransport("Walk")} title="Walk" />
        <Menu.Item onPress={() => handleSelectTransport("Remote work")} title="Remote work" />
      </Menu>

      {/* Car distance input */}
      <TextInput
        label="Weekly distance traveled by car (km or miles)"
        mode="outlined"
        value={form.carDistance}
        onChangeText={(val) => onChange("carDistance", val)}
        keyboardType="numeric"
        style={styles.input}
      />

      {/* Diet dropdown */}
      <Menu
        visible={dietMenuVisible}
        onDismiss={() => setDietMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setDietMenuVisible(true)}
            style={styles.menuButton}
          >
            {form.diet || "Select your diet type"}
          </Button>
        }
      >
        <Menu.Item onPress={() => handleSelectDiet("Regular meat eater")} title="Regular meat eater" />
        <Menu.Item onPress={() => handleSelectDiet("Occasional meat")} title="Occasional meat" />
        <Menu.Item onPress={() => handleSelectDiet("Vegetarian")} title="Vegetarian" />
        <Menu.Item onPress={() => handleSelectDiet("Vegan")} title="Vegan" />
      </Menu>

      <View style={styles.row}>
        <Button mode="outlined" onPress={onBack} style={styles.half}>
          Back
        </Button>
        <Button mode="contained" onPress={onNext} style={styles.half} disabled={!ready}>
          Next
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: "center", marginBottom: 24 },
  menuButton: { marginBottom: 16 },
  input: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  half: { flex: 1, marginHorizontal: 4 },
});
