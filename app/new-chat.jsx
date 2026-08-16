import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";

import api from "../services/api";

export default function NewChatScreen() {
  const [users, setUsers] =
    useState([]);

  const [search, setSearch] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const fetchUsers = async () => {
    try {
      const response =
        await api.get(
          "/conversations/users"
        );

      setUsers(
        response.data.users
      );
    } catch (error) {
      console.log(
        "Users error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchUsers();
    }, [])
  );

  const filteredUsers =
    users.filter((item) => {
      const text =
        search.toLowerCase();

      return (
        item.name
          .toLowerCase()
          .includes(text) ||
        item.email
          .toLowerCase()
          .includes(text)
      );
    });

  const startChat = async (
    selectedUser
  ) => {
    try {
      const response =
        await api.post(
          "/conversations/private",
          {
            userId:
              selectedUser._id,
          }
        );

      router.replace({
        pathname:
          "/chat/[conversationId]",
        params: {
          conversationId:
            response.data
              .conversation._id,
        },
      });
    } catch (error) {
      console.log(
        "Start chat error:",
        error.response?.data ||
          error.message
      );
    }
  };

  const renderUser = ({
    item,
  }) => (
    <Pressable
      style={styles.user}
      onPress={() =>
        startChat(item)
      }
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name
            .charAt(0)
            .toUpperCase()}
        </Text>

        {item.isOnline && (
          <View
            style={styles.online}
          />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name}>
          {item.name}
        </Text>

        <Text
          style={styles.email}
          numberOfLines={1}
        >
          {item.email}
        </Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Text style={styles.back}>
            ‹
          </Text>
        </Pressable>

        <Text style={styles.title}>
          New Chat
        </Text>
      </View>

      <View style={styles.search}>
        <TextInput
          style={styles.input}
          placeholder="Search people..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
          autoFocus
        />
      </View>

      {loading ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
        />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) =>
            item._id
          }
          renderItem={renderUser}
          showsVerticalScrollIndicator={
            false
        }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },

  header: {
    paddingTop: 45,
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  back: {
    fontSize: 38,
    marginRight: 12,
  },

  title: {
    fontSize: 22,
    fontWeight: "700",
  },

  search: {
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
  },

  input: {
    height: 50,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#111",
  },

  user: {
    marginHorizontal: 20,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#eee",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "700",
  },

  online: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#fff",
  },

  info: {
    marginLeft: 13,
  },

  name: {
    fontSize: 16,
    fontWeight: "600",
  },

  email: {
    marginTop: 4,
    fontSize: 13,
    color: "#888",
  },

  loader: {
    marginTop: 40,
  },
});