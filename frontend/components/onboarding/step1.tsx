import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Text, TextInput, Button, Menu } from "react-native-paper";

// Come back to fix "any" type when time available.
export default function Step1({
  form,
  onChange,
  onNext,
}: {
  form: any;
  onChange: any;
  onNext: any;
}) {
  const [homeMenuVisible, setHomeMenuVisible] = useState(false);

  const handleSelectHomeType = (value: string) => {
    onChange("homeType", value);
    setHomeMenuVisible(false);
  };

  const ready = form.location && form.householdSize && form.homeType;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View>
        <Text variant="headlineMedium" style={styles.title}>
          Let’s start with your home
        </Text>

        <TextInput
          label="What is your name?"
          mode="outlined"
          value={form.name}
          onChangeText={(val) => onChange("name", val)} 
          style={styles.input}
        />
        <TextInput
          label="Where do you live?"
          mode="outlined"
          value={form.location}
          onChangeText={(val) => onChange("location", val)}
          placeholder="City or region"
          style={styles.input}
        />

        <TextInput
          label="How many people live in your household?"
          mode="outlined"
          value={form.householdSize}
          onChangeText={(val) => onChange("householdSize", val)}
          keyboardType="numeric"
          style={styles.input}
        />

        <Menu
          visible={homeMenuVisible}
          onDismiss={() => setHomeMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setHomeMenuVisible(true)}
              style={styles.menuButton}
            >
              {form.homeType || "Select your housing type"}
            </Button>
          }
        >
          <Menu.Item
            onPress={() => handleSelectHomeType("Apartment")}
            title="Apartment"
          />
          <Menu.Item
            onPress={() => handleSelectHomeType("Detached house")}
            title="Detached house"
          />
          <Menu.Item
            onPress={() => handleSelectHomeType("Shared housing")}
            title="Shared housing"
          />
          <Menu.Item
            onPress={() => handleSelectHomeType("Other")}
            title="Other"
          />
        </Menu>

        <Button
          mode="contained"
          onPress={onNext}
          style={styles.nextButton}
          disabled={!ready}
        >
          Next
        </Button>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: "center", marginBottom: 24 },
  input: { marginBottom: 16 },
  menuButton: { marginBottom: 16 },
  nextButton: { marginTop: 8 },
});
