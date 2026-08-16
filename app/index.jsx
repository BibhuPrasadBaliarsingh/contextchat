import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>💬</Text>

        <Text style={styles.title}>ContextChat</Text>

        <Text style={styles.subtitle}>
          Conversations that remember what matters.
        </Text>

        <Text style={styles.description}>
          Chat in real time, find your old conversations, and let AI help you
          remember important things.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Pressable
          style={styles.primaryButton}
          onPress={() => router.push("/register")}
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() => router.push("/login")}
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 24,
    justifyContent: "space-between",
  },

  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  logo: {
    fontSize: 72,
    marginBottom: 24,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },

  description: {
    fontSize: 15,
    lineHeight: 23,
    color: "#666666",
    textAlign: "center",
    maxWidth: 340,
  },

  buttons: {
    gap: 12,
    paddingBottom: 20,
  },

  primaryButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  secondaryButton: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#dddddd",
    justifyContent: "center",
    alignItems: "center",
  },

  secondaryButtonText: {
    color: "#111111",
    fontSize: 16,
    fontWeight: "600",
  },
});