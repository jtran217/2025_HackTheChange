import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Avatar,
  IconButton,
  Text,
  TextInput,
} from "react-native-paper";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";

type MessageRole = "user" | "assistant";

type Message = {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
};

type UserEmission = {
  user_id?: string;
  date?: string;
  total_emission_kgco2?: number | null;
  transport_weight?: number | null;
  energy_weight?: number | null;
  diet_weight?: number | null;
  recycling_modifier?: number | null;
  offset_modifier?: number | null;
  [key: string]: unknown;
};

type EmissionInsights = {
  latestDate: string;
  latestTotal: number;
  average: number;
  sevenDayAverage: number;
  entries: number;
  categoryBreakdown: {
    label: string;
    value: number;
  }[];
};

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? process.env.API_URL ?? "http://172.20.10.3:3000";
const AI_ENDPOINT =
  process.env.EXPO_PUBLIC_AI_ENDPOINT ?? process.env.AI_ENDPOINT ?? "";
const DATABRICKS_TOKEN =
  process.env.EXPO_PUBLIC_DATABRICKS_TOKEN ?? process.env.DATABRICKS_TOKEN ?? "";
const AI_MODEL =
  process.env.EXPO_PUBLIC_AI_MODEL ?? process.env.AI_MODEL ?? "databricks-claude-sonnet-4-5";

const TRIMMED_AI_ENDPOINT = AI_ENDPOINT.trim();
const TRIMMED_DATABRICKS_TOKEN = DATABRICKS_TOKEN.trim();

const INTRO_MESSAGE: Message = {
  id: "assistant-intro",
  role: "assistant",
  content:
    "Hey there! I'm Emmet, your climate companion. Tell me about your day or ask for ideas and I'll help you keep shrinking your carbon footprint.",
  createdAt: Date.now(),
};

export default function Emmet() {
  const isIOS = Platform.OS === "ios";
  const [userId, setUserId] = useState<string | null>(null);
  const [fetchingEmissions, setFetchingEmissions] = useState(false);
  const [emissionError, setEmissionError] = useState<string | null>(null);
  const [emissions, setEmissions] = useState<UserEmission[]>([]);
  const [messages, setMessages] = useState<Message[]>([INTRO_MESSAGE]);
  const [pendingInput, setPendingInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const listRef = useRef<FlatList<Message>>(null);
  const insightsRef = useRef<EmissionInsights | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error("Failed to fetch user", error);
        return;
      }
      setUserId(data.user?.id ?? null);
    });
  }, []);

  useEffect(() => {
    if (!userId) {
      setEmissions([]);
      return;
    }

    let cancelled = false;
    const fetchEmissions = async () => {
      setFetchingEmissions(true);
      setEmissionError(null);
      try {
        const response = await fetch(
          `${API_URL}/userEmissions?user_id=${encodeURIComponent(userId)}`,
        );
        if (!response.ok) {
          const message = await response.text();
          throw new Error(message || "Failed to load emissions");
        }
        const data = (await response.json()) as UserEmission[];
        if (!cancelled) {
          setEmissions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Failed to fetch user emissions", error);
        if (!cancelled) {
          setEmissionError(
            error instanceof Error
              ? error.message
              : "We couldn’t load your recent logs just yet.",
          );
        }
      } finally {
        if (!cancelled) {
          setFetchingEmissions(false);
        }
      }
    };

    fetchEmissions();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const insights = useMemo<EmissionInsights | null>(() => {
    if (!emissions.length) {
      insightsRef.current = null;
      return null;
    }

    const sorted = [...emissions].filter((item) => item.date).sort((a, b) => {
      const left = new Date(a.date ?? "").getTime();
      const right = new Date(b.date ?? "").getTime();
      return right - left;
    });

    if (!sorted.length) {
      insightsRef.current = null;
      return null;
    }

    const latest = sorted[0];
    const total = sorted.reduce((sum, current) => {
      const value = Number(current.total_emission_kgco2 ?? 0);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    const average = sorted.length ? total / sorted.length : 0;
    const sevenDaySlice = sorted.slice(0, 7);
    const sevenDayAverage = sevenDaySlice.length
      ? sevenDaySlice.reduce((sum, current) => {
          const value = Number(current.total_emission_kgco2 ?? 0);
          return sum + (Number.isFinite(value) ? value : 0);
        }, 0) / sevenDaySlice.length
      : average;

    const breakdown: EmissionInsights["categoryBreakdown"] = [
      { label: "Transport", value: Number(latest.transport_weight ?? 0) },
      { label: "Energy", value: Number(latest.energy_weight ?? 0) },
      { label: "Diet", value: Number(latest.diet_weight ?? 0) },
      { label: "Recycling", value: Number(latest.recycling_modifier ?? 0) },
      { label: "Offsets", value: Number(latest.offset_modifier ?? 0) },
    ]
      .map((item) => ({
        ...item,
        value: Number.isFinite(item.value) ? item.value : 0,
      }))
      .sort((a, b) => b.value - a.value);

    const computed: EmissionInsights = {
      latestDate: latest.date ?? "",
      latestTotal: Number(latest.total_emission_kgco2 ?? 0),
      average,
      sevenDayAverage,
      entries: sorted.length,
      categoryBreakdown: breakdown,
    };

    insightsRef.current = computed;
    return computed;
  }, [emissions]);

  const topCategories = useMemo(() => {
    if (!insights) {
      return [] as EmissionInsights["categoryBreakdown"];
    }
    return insights.categoryBreakdown.filter((item) => item.value !== 0).slice(0, 4);
  }, [insights]);

  useEffect(() => {
    if (!insights || messages.some((msg) => msg.id === "assistant-insights")) {
      return;
    }

    const trend = insights.latestTotal - insights.sevenDayAverage;
    const trendText = trend > 0
      ? `That’s ${trend.toFixed(1)} kg CO₂ above your weekly average — let’s find a win for tomorrow.`
      : `Nice! That’s ${Math.abs(trend).toFixed(1)} kg CO₂ below your weekly average.`;

    const categoryFocus = insights.categoryBreakdown
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)[0]?.label;

    const insightMessage: Message = {
      id: "assistant-insights",
      role: "assistant",
      createdAt: Date.now(),
      content: categoryFocus
        ? `Your latest log on ${insights.latestDate || "your last check-in"} came in at ${insights.latestTotal.toFixed(1)} kg CO₂. ${trendText} Your biggest contributor was ${categoryFocus.toLowerCase()}. Want a tip to bring that down?`
        : `I can see your latest log came in at ${insights.latestTotal.toFixed(1)} kg CO₂. ${trendText}`,
    };

    setMessages((prev) => [...prev, insightMessage]);
  }, [insights, messages]);

  useEffect(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, [messages, autoScroll]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const {
        contentOffset,
        contentSize,
        layoutMeasurement,
      } = event.nativeEvent;
      const paddingToBottom = 48;
      const isAtBottom =
        contentOffset.y + layoutMeasurement.height + paddingToBottom >=
        contentSize.height;
      setAutoScroll(isAtBottom);
    },
    [],
  );

  const summaryForPrompt = useMemo(() => {
    const summarySource = insights ?? insightsRef.current;
    if (!summarySource) {
      return "The user has no stored carbon logs yet. Encourage them to log today’s habits and offer general, actionable sustainability tips.";
    }

    const breakdownText = summarySource.categoryBreakdown
      .filter((item) => item.value !== 0)
      .map((item) => `${item.label}: ${item.value.toFixed(1)} kg`)
      .join(", ");

    const trendDelta = summarySource.latestTotal - summarySource.sevenDayAverage;
    const trendDirection = trendDelta > 0 ? "above" : "below";

    return [
      `Latest log date: ${summarySource.latestDate}.`,
      `Latest total: ${summarySource.latestTotal.toFixed(1)} kg CO₂, which is ${Math.abs(trendDelta).toFixed(1)} kg ${trendDirection} the 7-day average of ${summarySource.sevenDayAverage.toFixed(1)} kg.`,
      breakdownText ? `Category breakdown for the latest log — ${breakdownText}.` : undefined,
      `Total number of logs available: ${summarySource.entries}.`,
      "Reference these insights when offering feedback. Celebrate improvements and suggest practical next steps tailored to the dominant categories.",
    ]
      .filter(Boolean)
      .join(" ");
  }, [insights]);

  const aiAvailable = Boolean(TRIMMED_AI_ENDPOINT && TRIMMED_DATABRICKS_TOKEN);

  const handleSend = useCallback(async () => {
    const trimmed = pendingInput.trim();
    if (!trimmed || isSending) {
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      createdAt: Date.now(),
    };
    setPendingInput("");
    Keyboard.dismiss();
    const nextMessages = [...messages, userMessage];

    if (!aiAvailable) {
      const configMessage: Message = {
        id: `assistant-config-${Date.now()}`,
        role: "assistant",
        content:
          "I’m ready to help once the AI endpoint is connected. Double-check the `EXPO_PUBLIC_AI_ENDPOINT` and `EXPO_PUBLIC_DATABRICKS_TOKEN` values, then reload the app.",
        createdAt: Date.now(),
      };
      setMessages([...nextMessages, configMessage]);
      setAutoScroll(true);
      return;
    }

    setMessages(nextMessages);
    setAutoScroll(true);
    setIsSending(true);

    try {
      const payloadMessages = [
        {
          role: "system",
          content:
            "You are Emmet, a warm, practical climate accountability coach. Be empathetic, concise, and focus on actionable, evidence-based tips tied to the user’s habits. Highlight wins and suggest realistic tweaks. Keep replies under 140 words unless the user explicitly requests more detail.",
        },
        {
          role: "system",
          content: summaryForPrompt,
        },
        ...nextMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
      ];

      const sanitizedEndpoint = TRIMMED_AI_ENDPOINT.replace(/\/$/, "");
      const endsWithInvocations = sanitizedEndpoint.endsWith("/invocations");
      const endsWithChatCompletions = sanitizedEndpoint.endsWith("/chat/completions");
      const requestUrl = endsWithInvocations || endsWithChatCompletions
        ? sanitizedEndpoint
        : `${sanitizedEndpoint}/chat/completions`;

      const requestPayload = endsWithInvocations
        ? {
            messages: payloadMessages,
            max_tokens: 450,
            temperature: 0.6,
          }
        : {
            model: AI_MODEL,
            messages: payloadMessages,
            max_tokens: 450,
            temperature: 0.6,
          };

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${TRIMMED_DATABRICKS_TOKEN}`,
        },
        body: JSON.stringify(requestPayload),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "Failed to reach Emmet");
      }

      const result = await response.json();
      const assistantContent =
        result?.choices?.[0]?.message?.content ??
        result?.predictions?.[0]?.content ??
        result?.predictions?.[0]?.outputs?.[0]?.text ??
        result?.output?.[0]?.content ??
        result?.data?.[0]?.generation ??
        "I’m here for you, but I couldn’t parse that response. Could we try again?";

      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: String(assistantContent).trim(),
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Failed to get assistant response", error);
      const fallback: Message = {
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content:
          "I ran into a hiccup while reaching out to the brainpower in the cloud. Give it a moment and we can try again.",
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  }, [aiAvailable, isSending, messages, pendingInput, summaryForPrompt]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isAssistant = item.role === "assistant";
    return (
      <View
        style={[
          styles.messageRow,
          isAssistant ? styles.assistantRow : styles.userRow,
        ]}
      >
        {isAssistant && (
          <Avatar.Text
            size={32}
            label="E"
            style={styles.avatar}
            labelStyle={{ fontSize: 16, color: "#1f2937" }}
          />
        )}
        <View
          style={[
            styles.messageBubble,
            isAssistant ? styles.assistantBubble : styles.userBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isAssistant ? styles.assistantText : styles.userText,
            ]}
          >
            {item.content}
          </Text>
        </View>
      </View>
    );
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.container}>
            <View style={styles.header}>
              <Avatar.Icon
                size={44}
                icon="leaf"
                color="#ffffff"
                style={styles.headerAvatar}
              />
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  Emmet
                </Text>
                <Text style={styles.headerSubtitle}>Your climate companion</Text>
              </View>
              <IconButton
                icon={isIOS ? "dots-horizontal" : "dots-vertical"}
                size={22}
                onPress={() => {}}
                disabled
                style={styles.headerMenu}
                iconColor="#8e8e93"
                accessibilityLabel="More options"
              />
            </View>

            <View style={styles.summaryCard}>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                Emission snapshot
              </Text>
              {fetchingEmissions ? (
                <View style={styles.summaryRow}>
                  <ActivityIndicator animating />
                  <Text style={styles.summaryText}>Pulling in your latest logs…</Text>
                </View>
              ) : emissionError ? (
                <Text style={[styles.summaryText, styles.summaryError]}>
                  {emissionError}
                </Text>
              ) : insights ? (
                <View style={styles.summaryBody}>
                  <Text style={styles.summaryHighlight}>
                    {insights.latestTotal.toFixed(1)} kg CO₂
                  </Text>
                  <Text style={styles.summaryCaption}>
                    Last logged on {insights.latestDate || "your most recent check-in"}
                  </Text>
                  <View style={styles.summaryDivider} />
                  <Text style={styles.summaryText}>
                    7-day average · {insights.sevenDayAverage.toFixed(1)} kg CO₂ ({insights.entries} logs)
                  </Text>
                  <View style={styles.summaryChips}>
                    {topCategories.length ? (
                      topCategories.map((item) => (
                      <View key={item.label} style={styles.summaryChip}>
                        <Text style={styles.summaryChipLabel}>{item.label}</Text>
                        <Text style={styles.summaryChipValue}>{item.value.toFixed(1)} kg</Text>
                      </View>
                      ))
                    ) : (
                      <Text style={styles.summaryEmptyText}>
                        Log a few habits to unlock tailored category tips.
                      </Text>
                    )}
                  </View>
                </View>
              ) : (
                <Text style={styles.summaryText}>
                  You haven’t logged any habits yet. Share what you’ve done today and we’ll build momentum together.
                </Text>
              )}
            </View>

            {!aiAvailable && (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  The AI coaching endpoint is not configured. Set `EXPO_PUBLIC_AI_ENDPOINT` (or `AI_ENDPOINT`) and `EXPO_PUBLIC_DATABRICKS_TOKEN` (or `DATABRICKS_TOKEN`) in your `.env`, then reload the app.
                </Text>
              </View>
            )}

            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={styles.messageList}
              contentContainerStyle={styles.messages}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={isIOS ? "interactive" : "on-drag"}
              onScrollBeginDrag={() => {
                Keyboard.dismiss();
                setAutoScroll(false);
              }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={() => {
                if (autoScroll) {
                  listRef.current?.scrollToEnd({ animated: true });
                }
              }}
            />

            <View style={[styles.composer, isIOS && styles.composerIOSShadow]}>
              <TextInput
                value={pendingInput}
                onChangeText={setPendingInput}
                mode="flat"
                placeholder="Share what you did today or ask for a tip…"
                multiline
                style={styles.input}
                contentStyle={styles.inputContent}
                dense
                right={<TextInput.Affix text={`${pendingInput.length}/280`} />}
                maxLength={280}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                textAlignVertical="top"
                placeholderTextColor="#9ca3af"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                selectionColor="#007aff"
                theme={{ colors: { primary: "#007aff" }, roundness: 18 }}
              />
              <IconButton
                icon={isSending ? "progress-clock" : "send"}
                size={28}
                onPress={handleSend}
                disabled={isSending || !pendingInput.trim()}
                style={styles.sendButton}
                iconColor={isSending ? "#9ca3af" : "#007aff"}
              />
            </View>
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#f2f2f7",
    },
    container: {
        flex: 1,
        paddingHorizontal: 18,
        paddingBottom: 4,
        gap: 14,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 4,
    },
    headerAvatar: {
        backgroundColor: "#34c759",
    },
    headerTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    headerTitle: {
        fontWeight: "600",
    },
    headerSubtitle: {
        color: "#6b7280",
        fontSize: 14,
    },
    headerMenu: {
        margin: 0,
        backgroundColor: "transparent",
    },
    summaryCard: {
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#ffffff",
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
    },
    summaryTitle: {
        marginBottom: 8,
        fontWeight: "600",
    },
    summaryText: {
        fontSize: 14,
        lineHeight: 20,
        color: "#374151",
    },
    summaryRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    summaryError: {
        color: "#b91c1c",
    },
    summaryBody: {
        gap: 8,
    },
    summaryHighlight: {
        fontSize: 28,
        fontWeight: "700",
        color: "#1f2937",
    },
    summaryCaption: {
        fontSize: 13,
        color: "#6b7280",
    },
    summaryDivider: {
        height: StyleSheet.hairlineWidth,
        backgroundColor: "#e5e7eb",
        marginVertical: 4,
    },
    summaryChips: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 4,
    },
    summaryChip: {
        backgroundColor: "#f4f4f6",
        borderRadius: 14,
        paddingVertical: 6,
        paddingHorizontal: 10,
        gap: 2,
    },
    summaryChipLabel: {
        fontSize: 12,
        color: "#6b7280",
    },
    summaryChipValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#111827",
    },
    summaryEmptyText: {
        fontSize: 13,
        color: "#9ca3af",
    },
    warningCard: {
        padding: 14,
        borderRadius: 14,
        backgroundColor: "#fff1f0",
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#ffccc7",
    },
    warningText: {
        color: "#b91c1c",
        fontSize: 13,
        lineHeight: 18,
    },
    messages: {
        paddingTop: 8,
        paddingBottom: 72,
        paddingHorizontal: 8,
    },
    messageList: {
        flex: 1,
    },
    messageRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        marginBottom: 12,
    },
    assistantRow: {
        justifyContent: "flex-start",
        alignItems: "flex-start",
    },
    userRow: {
        justifyContent: "flex-end",
        alignItems: "flex-end",
    },
    avatar: {
        marginRight: 8,
        marginTop: 2,
        backgroundColor: "#e9e9ed",
    },
    messageBubble: {
        maxWidth: "75%",
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 22,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 1,
    },
    assistantBubble: {
        backgroundColor: "#e9e9ed",
        borderBottomLeftRadius: 8,
    },
    userBubble: {
        backgroundColor: "#007aff",
        borderBottomRightRadius: 8,
        shadowOpacity: 0,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 21,
    },
    assistantText: {
        color: "#1f2937",
    },
    userText: {
        color: "#f8fafc",
    },
    composer: {
        borderRadius: 24,
        paddingHorizontal: 14,
        paddingVertical: 8,
        flexDirection: "row",
        alignItems: "flex-end",
        backgroundColor: "#f5f5f7",
        gap: 6,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
    },
    composerIOSShadow: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    input: {
        flex: 1,
        marginRight: 6,
        backgroundColor: "#ffffff",
        fontSize: 16,
        minHeight: 34,
        maxHeight: 88,
        borderRadius: 18,
        paddingHorizontal: 10,
    },
    inputContent: {
        fontSize: 16,
        paddingVertical: 6,
    },
    sendButton: {
        alignSelf: "flex-end",
        margin: 0,
        backgroundColor: "transparent",
    },
});
