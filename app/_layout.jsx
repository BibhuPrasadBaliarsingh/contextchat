import { Stack } from "expo-router";

import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="login"
          options={{
            title: "Login",
          }}
        />

        <Stack.Screen
          name="register"
          options={{
            title: "Create Account",
          }}
        />

        <Stack.Screen
          name="home"
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="chat/[conversationId]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="new-chat"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="search"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="context-ai"
          options={{
            headerShown: false,
          }}
        />
      </Stack>
    </AuthProvider>
  );
}