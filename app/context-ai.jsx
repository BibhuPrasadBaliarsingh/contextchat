import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import api from "../services/api";

export default function ContextAIScreen() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim() || loading) {
      return;
    }

    try {
      setLoading(true);
      setAnswer("");
      setSources([]);

      const response = await api.post(
        "/messages/context-ai",
        {
          question: question.trim(),
        }
      );

      setAnswer(response.data.answer || "");
      setSources(response.data.sources || []);
    } catch (error) {
      console.log(
        "Context AI error:",
        error.response?.data || error.message
      );

      setAnswer(
        "Sorry, I couldn't process your question."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : undefined
      }
    >
      {/* Header */}

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.back}>
            ‹
          </Text>
        </Pressable>

        <View>
          <Text style={styles.title}>
            Context AI
          </Text>

          <Text style={styles.subtitle}>
            Ask about your conversations
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Intro */}

        {!answer && !loading && (
          <View style={styles.intro}>
            <View style={styles.aiIcon}>
              <Text style={styles.aiIconText}>
                ✦
              </Text>
            </View>

            <Text style={styles.introTitle}>
              Ask your conversations
            </Text>

            <Text style={styles.introText}>
              Context AI can search your stored
              conversations and help you find
              information from previous chats.
            </Text>

            <View style={styles.exampleContainer}>
              <Text style={styles.exampleTitle}>
                Try asking
              </Text>

              <Pressable
                style={styles.example}
                onPress={() =>
                  setQuestion(
                    "What did Rahul say about the project deadline?"
                  )
                }
              >
                <Text style={styles.exampleText}>
                  "What did Rahul say about the project deadline?"
                </Text>
              </Pressable>

              <Pressable
                style={styles.example}
                onPress={() =>
                  setQuestion(
                    "What did we discuss about React Native?"
                  )
                }
              >
                <Text style={styles.exampleText}>
                  "What did we discuss about React Native?"
                </Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Loading */}

        {loading && (
          <View style={styles.loading}>
            <View style={styles.loadingIcon}>
              <Text style={styles.loadingIconText}>
                ✦
              </Text>
            </View>

            <ActivityIndicator size="small" />

            <Text style={styles.loadingText}>
              Searching your conversations...
            </Text>
          </View>
        )}

        {/* Answer */}

        {!loading && answer && (
          <View style={styles.answerContainer}>
            <View style={styles.answerHeader}>
              <View style={styles.smallAiIcon}>
                <Text style={styles.smallAiText}>
                  ✦
                </Text>
              </View>

              <Text style={styles.answerTitle}>
                Context Answer
              </Text>
            </View>

            <Text style={styles.answer}>
              {answer}
            </Text>

            {/* Sources */}

            {sources.length > 0 && (
              <View style={styles.sourcesContainer}>
                <Text style={styles.sourcesTitle}>
                  Sources
                </Text>

                {sources.map((source) => (
                  <View
                    key={source._id}
                    style={styles.source}
                  >
                    <View style={styles.sourceHeader}>
                      <Text style={styles.sourceSender}>
                        {source.sender || "Unknown"}
                      </Text>

                      <Text style={styles.sourceDate}>
                        {new Date(
                          source.createdAt
                        ).toLocaleDateString()}
                      </Text>
                    </View>

                    <Text
                      style={styles.sourceMessage}
                      numberOfLines={4}
                    >
                      {source.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              style={styles.askAgain}
              onPress={() => {
                setAnswer("");
                setSources([]);
              }}
            >
              <Text style={styles.askAgainText}>
                Ask another question
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Input */}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask about your chats..."
          placeholderTextColor="#999"
          value={question}
          onChangeText={setQuestion}
          multiline
          maxLength={1000}
          onSubmitEditing={askAI}
        />

        <Pressable
          style={[
            styles.sendButton,
            (!question.trim() || loading) &&
              styles.sendButtonDisabled,
          ]}
          onPress={askAI}
          disabled={!question.trim() || loading}
        >
          <Text style={styles.sendIcon}>
            ➤
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  header: {
    paddingTop: 45,
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },

  backButton: {
    width: 40,
    height: 45,
    justifyContent: "center",
  },

  back: {
    fontSize: 38,
    color: "#111",
  },

  title: {
    fontSize: 21,
    fontWeight: "800",
    color: "#111",
  },

  subtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },

  content: {
    padding: 20,
    paddingBottom: 30,
  },

  intro: {
    alignItems: "center",
    paddingTop: 45,
  },

  aiIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  aiIconText: {
    color: "#fff",
    fontSize: 32,
  },

  introTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
  },

  introText: {
    color: "#777",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 330,
  },

  exampleContainer: {
    width: "100%",
    marginTop: 35,
  },

  exampleTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
    marginBottom: 10,
  },

  example: {
    backgroundColor: "#f6f6f6",
    padding: 14,
    borderRadius: 13,
    marginBottom: 9,
  },

  exampleText: {
    color: "#444",
    fontSize: 13,
    lineHeight: 19,
  },

  loading: {
    alignItems: "center",
    paddingTop: 70,
  },

  loadingIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },

  loadingIconText: {
    color: "#fff",
    fontSize: 25,
  },

  loadingText: {
    color: "#777",
    marginTop: 12,
    fontSize: 13,
  },

  answerContainer: {
    paddingTop: 10,
  },

  answerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },

  smallAiIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  smallAiText: {
    color: "#fff",
    fontSize: 17,
  },

  answerTitle: {
    fontSize: 17,
    fontWeight: "800",
  },

  answer: {
    fontSize: 16,
    lineHeight: 25,
    color: "#222",
    backgroundColor: "#f6f6f6",
    padding: 16,
    borderRadius: 16,
  },

  sourcesContainer: {
    marginTop: 25,
  },

  sourcesTitle: {
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 10,
  },

  source: {
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 13,
    padding: 13,
    marginBottom: 9,
  },

  sourceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  sourceSender: {
    fontSize: 12,
    fontWeight: "700",
  },

  sourceDate: {
    fontSize: 10,
    color: "#999",
  },

  sourceMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: "#555",
  },

  askAgain: {
    marginTop: 15,
    padding: 14,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#dddddd",
    alignItems: "center",
  },

  askAgainText: {
    fontSize: 13,
    fontWeight: "600",
  },

  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    padding: 10,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "flex-end",
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 110,
    backgroundColor: "#f5f5f5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 11,
    fontSize: 14,
    color: "#111",
  },

  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#111",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },

  sendIcon: {
    color: "#fff",
    fontSize: 18,
  },
});