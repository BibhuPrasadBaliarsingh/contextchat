import { useEffect, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { makeRedirectUri } from "expo-auth-session";
import { router } from "expo-router";
import { useAuth } from "../context/AuthContext";

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const redirectUri = makeRedirectUri({
    scheme: "chatapp",
    native: "chatapp://",
  });

  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  const isConfigured =
    (webClientId && !webClientId.includes("your-web-client-id")) ||
    (androidClientId && !androidClientId.includes("your-android-client-id")) ||
    (iosClientId && !iosClientId.includes("your-ios-client-id"));

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: isConfigured ? webClientId : undefined,
    androidClientId: isConfigured ? androidClientId : undefined,
    iosClientId: isConfigured ? iosClientId : undefined,
    redirectUri,
  });

  const processGoogleAuthResponse = async (authResponse) => {
    if (authResponse?.type === "success") {
      setLoading(true);
      setError("");

      const { authentication } = authResponse;
      const accessToken = authentication?.accessToken;
      const idToken = authentication?.idToken;

      try {
        let userInfo = {};
        if (accessToken) {
          const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` },
          });
          userInfo = await res.json();
        }

        await loginWithGoogle({
          accessToken,
          idToken,
          googleId: userInfo.sub || authentication?.userId,
          email: userInfo.email,
          name: userInfo.name,
          profileImage: userInfo.picture,
        });

        router.replace("/home");
      } catch (err) {
        console.error("Google authentication process error:", err);
        setError(
          err.response?.data?.message ||
            "Google registration/login failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    } else if (authResponse?.type === "error" || authResponse?.type === "dismiss") {
      setLoading(false);
      if (authResponse?.error?.message?.includes("invalid_request") || authResponse?.type === "error") {
        setError(
          "Google OAuth Error: 'redirect_uri exp://...' is not permitted by Google. Use native 'chatapp://' redirect or Mobile Direct Sign-In."
        );
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (response) {
      processGoogleAuthResponse(response);
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError("");

    if (!isConfigured) {
      setError(
        "Google Client ID not configured. Please set valid EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID in .env file."
      );
      return false;
    }

    try {
      setLoading(true);
      const result = await promptAsync();
      if (result?.type !== "success") {
        setLoading(false);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Google prompt error:", err);
      setError("Failed to open Google Sign-In prompt.");
      setLoading(false);
      return false;
    }
  };

  const handleDirectGoogleLogin = async (googleUserEmail, googleUserName) => {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle({
        email: googleUserEmail,
        name: googleUserName || "Google User",
        googleId: `google_${Date.now()}`,
        profileImage: "",
      });
      router.replace("/home");
    } catch (err) {
      console.error("Direct Google login error:", err);
      setError(
        err.response?.data?.message || "Google registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    handleGoogleSignIn,
    handleDirectGoogleLogin,
    isConfigured,
    loading,
    error,
    setError,
    redirectUri,
  };
}
