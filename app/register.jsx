import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import api from "../services/api";
import { useGoogleAuth } from "../hooks/useGoogleAuth";
export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState("");
  const [googleNameInput, setGoogleNameInput] = useState("");

  const {
    handleGoogleSignIn,
    handleDirectGoogleLogin,
    isConfigured,
    loading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

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
      googleNameInput.trim() || name.trim() || "Google User"
    );
  };

  const handleRegister = async () => {
    setError("");

    if (!name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      const response = await api.post("/auth/register", {
        name: name.trim(),
        email: email.trim(),
        password,
      });

      console.log("Registration response:", response.data);

      if (response.data.success) {
        router.replace("/login");
      }
    } catch (error) {
      console.log(
        "Registration error:",
        error.response?.data || error.message
      );

      setError(
        error.response?.data?.message ||
        "Unable to create your account. Please try again."
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.logo}>💬</Text>

          <Text style={styles.title}>Create Account</Text>

          <Text style={styles.subtitle}>
            Create your ContextChat account.
          </Text>

          <View style={styles.form}>
            {/* Name */}

            <Text style={styles.label}>Name</Text>

            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              placeholderTextColor="#999999"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />

            {/* Email */}

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

            {/* Password */}

            <Text style={styles.label}>Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Create a password"
                placeholderTextColor="#999999"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />

              <Pressable
                style={styles.showButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.showButtonText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {/* Confirm Password */}

            <Text style={styles.label}>Confirm Password</Text>

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm your password"
                placeholderTextColor="#999999"
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />

              <Pressable
                style={styles.showButton}
                onPress={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                <Text style={styles.showButtonText}>
                  {showConfirmPassword ? "Hide" : "Show"}
                </Text>
              </Pressable>
            </View>

            {/* Error */}

            {error || googleError ? (
              <Text style={styles.error}>{error || googleError}</Text>
            ) : null}

            {/* Register */}

            <Pressable
              style={styles.registerButton}
              onPress={handleRegister}
            >
              <Text style={styles.registerButtonText}>
                Create Account
              </Text>
            </Pressable>

            {/* Google */}

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
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>

            {/* Login */}

            <Pressable
              style={styles.loginLink}
              onPress={() => router.push("/login")}
            >
              <Text style={styles.loginText}>
                Already have an account?{" "}
                <Text style={styles.loginTextBold}>Login</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

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
              style={styles.registerButton}
              onPress={submitDirectGoogleLogin}
            >
              <Text style={styles.registerButtonText}>
                Continue with Google
              </Text>
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

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    padding: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },

  logo: {
    fontSize: 52,
    textAlign: "center",
    marginBottom: 14,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    textAlign: "center",
    color: "#111111",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 15,
    color: "#666666",
    textAlign: "center",
    marginBottom: 32,
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
    color: "#111111",
    marginBottom: 18,
  },

  passwordContainer: {
    height: 52,
    borderWidth: 1,
    borderColor: "#dddddd",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
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

  registerButton: {
    height: 52,
    backgroundColor: "#111111",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },

  registerButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },

  orContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
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

  loginLink: {
    alignItems: "center",
    marginTop: 24,
  },

  loginText: {
    color: "#666666",
    fontSize: 14,
  },

  loginTextBold: {
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