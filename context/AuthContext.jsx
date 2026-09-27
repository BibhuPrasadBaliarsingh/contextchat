import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import {
  connectSocket,
  disconnectSocket,
} from "../services/socket";
import api from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "contextchat_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const saveToken = async (newToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, newToken);
    setToken(newToken);
  };

  const removeToken = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setToken(null);
  };

  const login = async (email, password) => {
  const response = await api.post("/auth/login", {
    email,
    password,
  });

  const {
    token: newToken,
    user: loggedInUser,
  } = response.data;

  await saveToken(newToken);

  setUser(loggedInUser);

  connectSocket(newToken);

  return response.data;
};

  const register = async (name, email, password) => {
    const response = await api.post("/auth/register", {
      name,
      email,
      password,
    });

    return response.data;
  };

  const loginWithGoogle = async (googleData) => {
    const response = await api.post("/auth/google", googleData);

    const { token: newToken, user: loggedInUser } = response.data;

    await saveToken(newToken);
    setUser(loggedInUser);
    connectSocket(newToken);

    return response.data;
  };

  const logout = async () => {
  disconnectSocket();

  await removeToken();

  setUser(null);
};

  const restoreSession = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setToken(storedToken);

      const response = await api.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${storedToken}`,
        },
      });

      setUser(response.data.user);
    } catch (error) {
      console.log("Session restore failed.");

      await removeToken();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}