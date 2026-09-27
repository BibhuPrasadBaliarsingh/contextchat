import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useGoogleAuth } from "../hooks/useGoogleAuth";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  const { login } = useAuth();
  const {
    handleGoogleSignIn,
    handleDirectGoogleLogin,
    isConfigured,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const handleLogin = async () => {
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      await login(email.trim(), password);

      router.replace("/home");
    } catch (error) {
      console.log(
        "Login error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
        "Unable to login. Please try again."
      );
    }
  };

  const onPressGoogleButton = async () => {
    if (!isConfigured) {
      setShowGoogleModal(true);
      return;
    }
    await handleGoogleSignIn();
  };

  const submitDirectGoogleLogin = async () => {
    if (!googleEmailInput.trim() || !googleEmailInput.includes("@")) {
      setError("Please enter a valid Google email address.");
      return;
    }
    setShowGoogleModal(false);
    await handleDirectGoogleLogin(
      googleEmailInput.trim(),
      googleNameInput.trim() || "Google User"
    );
  };

  const displayError = error || googleError;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>💬</Text>

        <Text style={styles.title}>Welcome Back</Text>

        <Text style={styles.subtitle}>
          Login to continue to ContextChat.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>

          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999999"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Password</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Enter your password"
              placeholderTextColor="#999999"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
            />

            <Pressable
              onPress={() => setShowPassword(!showPassword)}
              style={styles.showButton}
            >
              <Text style={styles.showButtonText}>
                {showPassword ? "Hide" : "Show"}
              </Text>
            </Pressable>
          </View>

          {displayError ? <Text style={styles.error}>{displayError}</Text> : null}

          <Pressable style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login</Text>
          </Pressable>

          <View style={styles.orContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.line} />
          </View>

          <Pressable
            style={styles.googleButton}
            onPress={onPressGoogleButton}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#111111" />
            ) : (
              <>
                <Text style={styles.googleIcon}>G</Text>
                <Text style={styles.googleButtonText}>
                  Sign in with Google
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            style={styles.registerButton}
            onPress={() => router.push("/register")}
          >
            <Text style={styles.registerText}>
              Don't have an account?{" "}
              <Text style={styles.registerTextBold}>Register</Text>
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Google Modal */}
      <Modal
        visible={showGoogleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowGoogleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Google Mobile Sign-In</Text>
            <Text style={styles.modalSub}>
              Enter your Google Account email to test Google registration/login:
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Google Email (e.g. user@gmail.com)"
              placeholderTextColor="#999999"
              keyboardType="email-address"
              autoCapitalize="none"
              value={googleEmailInput}
              onChangeText={setGoogleEmailInput}
            />

            <TextInput
              style={styles.input}
              placeholder="Your Name (Optional)"
              placeholderTextColor="#999999"
              value={googleNameInput}
              onChangeText={setGoogleNameInput}
            />

            <Pressable
              style={styles.loginButton}
              onPress={submitDirectGoogleLogin}
            >
              <Text style={styles.loginButtonText}>Continue with Google</Text>
            </Pressable>

            <Pressable
              style={{ marginTop: 12, alignItems: "center" }}
              onPress={() => setShowGoogleModal(false)}
            >
              <Text style={{ color: "#666666" }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  content: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
  },

  logo: {
    fontSize: 56,
    textAlign: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 36,
  },

  form: {
    width: "100%",
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#222222",
    marginBottom: 8,
  },

  input: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 20,
    color: "#111111",
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },

  passwordInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#111111",
  },

  showButton: {
    paddingHorizontal: 14,
  },

  showButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },

  error: {
    color: "#d32f2f",
    fontSize: 13,
    marginBottom: 12,
  },

  loginButton: {
    height: 52,
    backgroundColor: "#111111",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
  },

  loginButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },

  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#eeeeee",
  },

  orText: {
    marginHorizontal: 12,
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
  },

  googleButton: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  googleIcon: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
    color: "#4285F4",
  },

  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222222",
  },

  registerButton: {
    alignItems: "center",
    marginTop: 22,
  },

  registerText: {
    color: "#666666",
    fontSize: 14,
  },

  registerTextBold: {
    color: "#111111",
    fontWeight: "700",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },

  modalCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 8,
  },

  modalSub: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 16,
  },
});