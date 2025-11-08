import React, { useState } from "react";
import { View, StyleSheet, TouchableWithoutFeedback, Keyboard } from "react-native";
import { Provider as PaperProvider, ProgressBar } from "react-native-paper";
import Step1 from "../components/onboarding/step1";
import Step2 from "../components/onboarding/step2";
import Step3 from "../components/onboarding/step3";
import { router } from "expo-router";

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    location: "",
    householdSize: "",
    homeType: "",
    transport: "",
    carDistance: "",
    diet: "",
    motivation: "",
    focusArea: "",
  });

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleFinish = () => {
    console.log("Onboarding complete", form);
    router.replace("/(tabs)");
  };

  const progress = step / 3;

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ProgressBar progress={progress} style={styles.progress} />
        {step === 1 && (
          <Step1 form={form} onChange={handleChange} onNext={nextStep} />
        )}
        {step === 2 && (
          <Step2
            form={form}
            onChange={handleChange}
            onNext={nextStep}
            onBack={prevStep}
          />
        )}
        {step === 3 && (
          <Step3
            form={form}
            onChange={handleChange}
            onBack={prevStep}
            onFinish={handleFinish}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  progress: {
    marginBottom: 20,
  },
});
