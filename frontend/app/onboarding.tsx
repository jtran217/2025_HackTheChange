import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import { ProgressBar } from "react-native-paper";
import Step1 from "../components/onboarding/step1";
import Step2 from "../components/onboarding/step2";
import Step3 from "../components/onboarding/step3";
import { router } from "expo-router";
import { supabase } from "../lib/supabase";

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
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  const handleFinish = async () => {
    if (submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        throw userError;
      }
      if (!user) {
        throw new Error("No authenticated user found.");
      }
      const householdNum = Number.parseInt(form.householdSize, 10);
      const weekDistance = Number.parseFloat(form.carDistance);
      const payload = {
        id: user.id,
        name: form.name || null,
        location: form.location || null,
        household_num: Number.isFinite(householdNum) ? householdNum : null,
        house_type: form.homeType || null,
        mode_transport: form.transport || null,
        week_distance: Number.isFinite(weekDistance) ? weekDistance : null,
        diet_type: form.diet || null,
        main_motivation: form.motivation || null,
        main_focus: form.focusArea || null,
      };

      const { error: upsertError } = await supabase
        .from("carbon_assessment")
        .upsert(payload, { onConflict: "id" });

      if (upsertError) {
        throw upsertError;
      }

      router.replace("/(tabs)");
    } catch (error) {
      console.error("Failed to save onboarding progress", error);
      const message =
        error instanceof Error ? error.message : "Something went wrong.";
      Alert.alert("Onboarding", message);
    } finally {
      setSubmitting(false);
    }
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
            isSubmitting={submitting}
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
