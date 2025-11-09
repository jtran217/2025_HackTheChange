import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Button, Menu } from "react-native-paper";

type Step3Props = {
  form: any;
  onChange: any;
  onBack: any;
  onFinish: any;
  isSubmitting?: boolean;
};

// Come back to fix "any" type when time available.
export default function Step3({ form, onChange, onBack, onFinish, isSubmitting = false }: Step3Props) {
  const [motivationMenuVisible, setMotivationMenuVisible] = useState(false);
  const [focusMenuVisible, setFocusMenuVisible] = useState(false);

  const handleSelectMotivation = (value: string) => {
    onChange("motivation", value);
    setMotivationMenuVisible(false);
  };

  const handleSelectFocus = (value: string) => {
    onChange("focusArea", value);
    setFocusMenuVisible(false);
  };

  const ready = form.motivation && form.focusArea;

  return (
    <View>
      <Text variant="headlineMedium" style={styles.title}>
        Set your goals 
      </Text>
      <Menu
        visible={motivationMenuVisible}
        onDismiss={() => setMotivationMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setMotivationMenuVisible(true)}
            style={styles.menuButton}
          >
            {form.motivation || "What’s your main motivation?"}
          </Button>
        }
      >
        <Menu.Item onPress={() => handleSelectMotivation("Protecting the planet")} title="Protecting the planet" />
        <Menu.Item onPress={() => handleSelectMotivation("Saving money")} title="Saving money" />
        <Menu.Item onPress={() => handleSelectMotivation("Competing with friends")} title="Competing with friends" />
        <Menu.Item onPress={() => handleSelectMotivation("Learning something new")} title="Learning something new" />
      </Menu>
      <Menu
        visible={focusMenuVisible}
        onDismiss={() => setFocusMenuVisible(false)}
        anchor={
          <Button
            mode="outlined"
            onPress={() => setFocusMenuVisible(true)}
            style={styles.menuButton}
          >
            {form.focusArea || "Which area would you like to focus on first?"}
          </Button>
        }
      >
        <Menu.Item onPress={() => handleSelectFocus("Transport")} title="Transport" />
        <Menu.Item onPress={() => handleSelectFocus("Energy use at home")} title="Energy use at home" />
        <Menu.Item onPress={() => handleSelectFocus("Food choices")} title="Food choices" />
        <Menu.Item onPress={() => handleSelectFocus("Waste reduction")} title="Waste reduction" />
      </Menu>

      <View style={styles.row}>
        <Button mode="outlined" onPress={onBack} style={styles.half}>
          Back
        </Button>
        <Button
          mode="contained"
          onPress={onFinish}
          style={styles.half}
          disabled={!ready || isSubmitting}
          loading={isSubmitting}
        >
          Finish
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { textAlign: "center", marginBottom: 24 },
  menuButton: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  half: { flex: 1, marginHorizontal: 4 },
});
