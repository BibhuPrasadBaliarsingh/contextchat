import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";

import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function HomeScreen() {
    const { user } = useAuth();

    const [conversations, setConversations] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const fetchConversations = async () => {
        try {
            const response = await api.get(
                "/conversations"
            );

            setConversations(
                response.data.conversations
            );
        } catch (error) {
            console.log(
                "Fetch conversations error:",
                error.response?.data ||
                error.message
            );
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchConversations();
        }, [])
    );

    const refresh = async () => {
        setRefreshing(true);

        await fetchConversations();

        setRefreshing(false);
    };

    const openConversation = (
        conversationId
    ) => {
        router.push({
            pathname:
                "/chat/[conversationId]",
            params: {
                conversationId,
            },
        });
    };

    const formatTime = (date) => {
        if (!date) return "";

        const messageDate =
            new Date(date);

        const today =
            new Date();

        if (
            messageDate.toDateString() ===
            today.toDateString()
        ) {
            return messageDate.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit",
                }
            );
        }

        return messageDate.toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short",
            }
        );
    };

    const renderConversation = ({
        item,
    }) => {
        const otherUser =
            item.otherUser;

        return (
            <Pressable
                style={styles.conversation}
                onPress={() =>
                    openConversation(
                        item._id
                    )
                }
            >
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {otherUser?.name
                            ?.charAt(0)
                            .toUpperCase()}
                    </Text>

                    {otherUser?.isOnline && (
                        <View
                            style={styles.onlineDot}
                        />
                    )}
                </View>

                <View style={styles.info}>
                    <View style={styles.nameRow}>
                        <Text
                            style={styles.name}
                            numberOfLines={1}
                        >
                            {otherUser?.name ||
                                "Unknown User"}
                        </Text>

                        <Text style={styles.time}>
                            {formatTime(
                                item.lastMessageAt
                            )}
                        </Text>
                    </View>

                    <Text
                        style={styles.lastMessage}
                        numberOfLines={1}
                    >
                        {item.lastMessage
                            ?.content ||
                            "Start a conversation"}
                    </Text>
                </View>
            </Pressable>
        );
    };

    return (
        <View style={styles.container}>
            {/* Header */}

            <View style={styles.header}>
                <View>
                    <Text style={styles.brand}>
                        ContextChat
                    </Text>

                    <Text style={styles.greeting}>
                        Hello, {user?.name}
                    </Text>
                </View>

                <View style={styles.headerActions}>
                    <Pressable
                        style={styles.aiButton}
                        onPress={() =>
                            router.push("/context-ai")
                        }
                    >
                        <Text style={styles.aiButtonText}>
                            ✦
                        </Text>
                    </Pressable>

                    <View style={styles.profile}>
                        <Text style={styles.profileText}>
                            {user?.name
                                ?.charAt(0)
                                .toUpperCase()}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Search */}

            <Pressable
                style={styles.search}
                onPress={() =>
                    router.push("/search")
                }
            >
                <Text style={styles.searchIcon}>
                    🔎
                </Text>

                <Text style={styles.searchText}>
                    Search conversations...
                </Text>
            </Pressable>
            {/* Section */}

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                    Chats
                </Text>

                <Text style={styles.count}>
                    {conversations.length}
                </Text>
            </View>

            {/* Conversations */}

            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator
                        size="large"
                    />
                </View>
            ) : (
                <FlatList
                    data={conversations}
                    keyExtractor={(item) =>
                        item._id
                    }
                    renderItem={
                        renderConversation
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={
                                refreshing
                            }
                            onRefresh={refresh}
                        />
                    }
                    showsVerticalScrollIndicator={
                        false
                    }
                    ListEmptyComponent={
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
                                💬
                            </Text>

                            <Text
                                style={
                                    styles.emptyTitle
                                }
                            >
                                No conversations yet
                            </Text>

                            <Text
                                style={
                                    styles.emptyText
                                }
                            >
                                Start chatting with
                                someone.
                            </Text>
                        </View>
                    }
                    contentContainerStyle={
                        conversations.length ===
                            0
                            ? styles.emptyList
                            : styles.list
                    }
                />
            )}

            {/* New chat */}

            <Pressable
                style={styles.newChat}
                onPress={() =>
                    router.push(
                        "/new-chat"
                    )
                }
            >
                <Text style={styles.plus}>
                    +
                </Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
    },

    header: {
        paddingTop: 55,
        paddingHorizontal: 20,
        paddingBottom: 18,
        flexDirection: "row",
        justifyContent:
            "space-between",
        alignItems: "center",
    },

    brand: {
        fontSize: 25,
        fontWeight: "800",
        color: "#111",
    },

    greeting: {
        marginTop: 4,
        color: "#777",
        fontSize: 14,
    },

    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    aiButton: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "#f1f1f1",
        justifyContent: "center",
        alignItems: "center",
    },

    aiButtonText: {
        fontSize: 21,
        color: "#111",
    },

    profile: {
        width: 45,
        height: 45,
        borderRadius: 23,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
    },

    profileText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },

    search: {
        height: 50,
        marginHorizontal: 20,
        borderRadius: 15,
        backgroundColor: "#f5f5f5",
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
    },

    searchIcon: {
        fontSize: 16,
        marginRight: 9,
    },

    searchText: {
        color: "#999",
        fontSize: 14,
    },

    sectionHeader: {
        marginHorizontal: 20,
        marginTop: 28,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: "700",
    },

    count: {
        marginLeft: 8,
        color: "#999",
        fontSize: 13,
    },

    list: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },

    conversation: {
        minHeight: 75,
        flexDirection: "row",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },

    avatar: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#eee",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },

    avatarText: {
        fontSize: 18,
        fontWeight: "700",
    },

    onlineDot: {
        position: "absolute",
        right: 0,
        bottom: 1,
        width: 13,
        height: 13,
        borderRadius: 7,
        backgroundColor: "#22c55e",
        borderWidth: 2,
        borderColor: "#fff",
    },

    info: {
        flex: 1,
        marginLeft: 13,
    },

    nameRow: {
        flexDirection: "row",
        alignItems: "center",
    },

    name: {
        flex: 1,
        fontSize: 16,
        fontWeight: "650",
    },

    time: {
        color: "#999",
        fontSize: 11,
        marginLeft: 8,
    },

    lastMessage: {
        color: "#888",
        fontSize: 13,
        marginTop: 5,
    },

    loader: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },

    emptyList: {
        flexGrow: 1,
    },

    empty: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: 80,
    },

    emptyIcon: {
        fontSize: 55,
        marginBottom: 15,
    },

    emptyTitle: {
        fontSize: 18,
        fontWeight: "700",
    },

    emptyText: {
        color: "#888",
        marginTop: 6,
    },

    newChat: {
        position: "absolute",
        right: 22,
        bottom: 25,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#111",
        alignItems: "center",
        justifyContent: "center",
        elevation: 5,
    },

    plus: {
        color: "#fff",
        fontSize: 30,
        fontWeight: "300",
        marginTop: -2,
    },
});