import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import api from "../services/api";

export default function SearchScreen() {
  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const searchMessages = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    try {
      setLoading(true);

      const response =
        await api.get(
          `/messages/search?q=${encodeURIComponent(
            query.trim()
          )}`
        );

      setResults(
        response.data.messages
      );
    } catch (error) {
      console.log(
        "Search error:",
        error.response?.data ||
          error.message
      );

      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const openMessage = (item) => {
    router.push({
      pathname:
        "/chat/[conversationId]",
      params: {
        conversationId:
          item.conversationId._id,
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}

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
          Search Messages
        </Text>
      </View>

      {/* Search */}

      <View style={styles.searchBox}>
        <TextInput
          style={styles.input}
          placeholder="Search your conversations..."
          placeholderTextColor="#999"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={
            searchMessages
          }
          returnKeyType="search"
        />

        <Pressable
          style={styles.searchButton}
          onPress={
            searchMessages
          }
        >
          <Text style={styles.searchButtonText}>
            Search
          </Text>
        </Pressable>
      </View>

      {/* Loading */}

      {loading && (
        <ActivityIndicator
          style={styles.loader}
          size="large"
        />
      )}

      {/* Results */}

      {!loading && (
        <FlatList
          data={results}
          keyExtractor={(item) =>
            item._id
          }
          showsVerticalScrollIndicator={
            false
          }
          contentContainerStyle={
            styles.results
          }
          renderItem={({
            item,
          }) => (
            <Pressable
              style={styles.result}
              onPress={() =>
                openMessage(item)
              }
            >
              <View
                style={
                  styles.resultHeader
                }
              >
                <Text
                  style={
                    styles.sender
                  }
                >
                  {item.senderId
                    ?.name ||
                    "Unknown"}
                </Text>

                <Text
                  style={
                    styles.date
                  }
                >
                  {new Date(
                    item.createdAt
                  ).toLocaleDateString()}
                </Text>
              </View>

              <Text
                style={
                  styles.message
                }
                numberOfLines={3}
              >
                {item.content}
              </Text>
            </Pressable>
          )}
          ListEmptyComponent={
            query.trim() &&
            !loading ? (
              <View
                style={
                  styles.empty
                }
              >
                <Text
                  style={
                    styles.emptyIcon
                  }
                >
                  🔎
                </Text>

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No messages found
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Try another search
                  term.
                </Text>
              </View>
            ) : null
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
    fontSize: 21,
    fontWeight: "700",
  },

  searchBox: {
    marginHorizontal: 20,
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    overflow: "hidden",
  },

  input: {
    flex: 1,
    height: 52,
    paddingHorizontal: 15,
    fontSize: 15,
    color: "#111",
  },

  searchButton: {
    paddingHorizontal: 16,
    justifyContent: "center",
    backgroundColor: "#111",
  },

  searchButtonText: {
    color: "#fff",
    fontWeight: "600",
  },

  loader: {
    marginTop: 30,
  },

  results: {
    padding: 20,
  },

  result: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent:
      "space-between",
    marginBottom: 7,
  },

  sender: {
    fontWeight: "700",
    fontSize: 14,
  },

  date: {
    color: "#999",
    fontSize: 11,
  },

  message: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  empty: {
    alignItems: "center",
    marginTop: 80,
  },

  emptyIcon: {
    fontSize: 45,
    marginBottom: 15,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  emptyText: {
    marginTop: 5,
    color: "#888",
  },
});