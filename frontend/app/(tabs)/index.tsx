import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Text,
  Button,
  Card,
  Surface,
  ProgressBar,
  ActivityIndicator,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import SurveyModal from "../../components/ui/surveyModal";
import { SurveyQuestionOption } from "../../types/survey";
import { supabase } from "@/lib/supabase";
const dummyData = {
  user: {
    name: "Johnny",
    streak: 5,
    avgScore: 14.2,
  },
  today: {
    co2: 12.8,
    comparedToAvg: -8,
  },
  recentLogs: [
    { date: "Nov 4", co2: 15.4 },
    { date: "Nov 5", co2: 13.1 },
    { date: "Nov 6", co2: 11.9 },
    { date: "Nov 7", co2: 13.6 },
    { date: "Nov 8", co2: 12.8 },
  ],
};

export default function Dashboard() {
  const [visible, setVisible] = useState(false);
  const [result, setResult] = useState<{
    userId: string;
    answers: Record<string, SurveyQuestionOption>;
    total: number;
    date: string;
  } | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const toggleSurvey = () => setVisible(!visible);
  const [uploading, setUploading] = useState(false);
  const [hasLoggedToday, setHasLoggedToday] = useState(false);
  const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://172.20.10.3:3000";
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!result) return;

    (async () => {
      try {
        setUploading(true);
        const res = await fetch(`${API_URL}/carbonLogs`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: result.userId,
            date: result.date,
            transport_weight: result.answers.transport?.co2 ?? 0,
            energy_weight: result.answers.energy?.co2 ?? 0,
            diet_weight: result.answers.diet?.co2 ?? 0,
            recycling_modifier: result.answers.recycling?.co2 ?? 0,
            offset_modifier: result.answers.offset?.co2 ?? 0,
            total_emission_kgco2: result.total,
          }),
        });

        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Failed to save carbon log");
        }
        setHasLoggedToday(true);
      } catch (err) {
        console.error("Failed to upload carbon log", err);
      } finally {
        setUploading(false);
      }
    })();
  }, [result]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Welcome back, {dummyData.user.name} 👋
        </Text>

        <Text style={styles.subtitle}>
          Your streak: 🔥 {dummyData.user.streak} days in a row
        </Text>

        <Surface style={styles.card}>
          <Text variant="titleMedium">Today's Carbon Score</Text>
          <Text style={styles.co2Value}>{dummyData.today.co2} kg CO₂</Text>
          <Text
            style={{
              color: dummyData.today.comparedToAvg < 0 ? "#4CAF50" : "#F44336",
              marginBottom: 8,
            }}
          >
            {dummyData.today.comparedToAvg < 0
              ? `${Math.abs(dummyData.today.comparedToAvg)}% below average 🎉`
              : `${dummyData.today.comparedToAvg}% above average 😬`}
          </Text>

          <ProgressBar
            progress={dummyData.today.co2 / 20}
            color={dummyData.today.comparedToAvg < 0 ? "#4CAF50" : "#F44336"}
            style={{ height: 10, borderRadius: 8 }}
          />
        </Surface>
        <Card style={styles.card}>
          <Card.Title title="Recent CO₂ Logs" />
          <Card.Content>
            {dummyData.recentLogs.map((log) => (
              <View
                key={log.date}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  marginVertical: 4,
                }}
              >
                <Text>{log.date}</Text>
                <Text>{log.co2} kg</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        <Surface style={styles.card}>
          <Text variant="titleMedium">Weekly Average</Text>
          <Text style={styles.avgValue}>{dummyData.user.avgScore} kg CO₂</Text>
          <Text style={{ color: "#888" }}>Last 7-day average</Text>
        </Surface>

        <Button
          mode="contained"
          style={styles.button}
          onPress={toggleSurvey}
          disabled={uploading || hasLoggedToday}
        >
          {uploading ? (
            <>
              <ActivityIndicator
                animating
                size="small"
                color="#fff"
                style={{ marginRight: 8 }}
              />
              Updating your score…
            </>
          ) : hasLoggedToday ? (
            "Today’s habits logged"
          ) : (
            "Log Today’s Habits"
          )}
        </Button>

        <SurveyModal
          visible={visible}
          onDismiss={() => setVisible(false)}
          onComplete={(data) => {
            if (!userId) return;
            setResult({
              userId,
              ...data,
              date: new Date().toISOString().slice(0, 10),
            });
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  co2Value: {
    fontSize: 28,
    fontWeight: "bold",
    marginVertical: 8,
  },
  avgValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginVertical: 4,
  },
  button: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 6,
  },
  modalPlaceholder: {
    backgroundColor: "#eee",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
});
