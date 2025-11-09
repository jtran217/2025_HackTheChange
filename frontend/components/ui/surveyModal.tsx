import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import {
  Portal,
  Dialog,
  Text,
  Button,
  RadioButton,
  Divider,
  ProgressBar,
} from "react-native-paper";
import { QUESTIONS } from "../../constants/survey-questions";
import { SurveyQuestionOption } from "../../types/survey";

type SurveyModalProps = {
  visible: boolean;
  onDismiss: () => void;
  onComplete: (data: {
    answers: Record<string, SurveyQuestionOption>;
    total: number;
  }) => void;
};

export default function SurveyModal({
  visible,
  onDismiss,
  onComplete,
}: SurveyModalProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, SurveyQuestionOption>>(
    {}
  );
  const [total, setTotal] = useState(0);

  const current = QUESTIONS[step];
  const selected = answers[current.id]?.value || "";

  const handleSelect = (option: SurveyQuestionOption) => {
    const prev = answers[current.id]?.co2 || 0;
    const delta = option.co2 - prev;
    setTotal((prevTotal) => prevTotal + delta);
    setAnswers((prev) => ({
      ...prev,
      [current.id]: option,
    }));
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) setStep(step + 1);
    
    else {
      onComplete({ answers, total });
      onDismiss();
    }
  };

  const progress = (step + 1) / QUESTIONS.length;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Title>{current.title}</Dialog.Title>
        <Dialog.Content>
          <ProgressBar
            progress={progress}
            style={{ marginBottom: 10, borderRadius: 8 }}
          />
          <Text variant="bodyMedium" style={styles.question}>
            {current.question}
          </Text>

          <RadioButton.Group
            onValueChange={(val) => {
              const option = current.options.find((o) => o.value === val);
              if (option) handleSelect(option);
            }}
            value={selected}
          >
            {current.options.map((opt) => (
              <View key={opt.value} style={styles.optionRow}>
                <RadioButton value={opt.value} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optionLabel}>{opt.label}</Text>
                  <Text style={styles.optionNotes}>{opt.notes}</Text>
                </View>
              </View>
            ))}
          </RadioButton.Group>

          <Divider style={{ marginVertical: 10 }} />
          <Text style={styles.total}>
            Running Total:{" "}
            <Text style={{ fontWeight: "bold" }}>
              {total.toFixed(1)} kg CO₂
            </Text>
          </Text>
        </Dialog.Content>

        <Dialog.Actions>
          {step > 0 && (
            <Button onPress={() => setStep(step - 1)} mode="text">
              Back
            </Button>
          )}
          <Button
            mode="contained"
            onPress={handleNext}
            disabled={!answers[current.id]}
          >
            {step < QUESTIONS.length - 1 ? "Next" : "Finish"}
          </Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  dialog: {
    borderRadius: 12,
  },
  question: {
    fontWeight: "600",
    marginBottom: 10,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  optionNotes: {
    fontSize: 12,
    color: "#888",
  },
  optionScore: {
    width: 60,
    textAlign: "right",
  },
  total: {
    textAlign: "right",
    fontSize: 14,
  },
});
