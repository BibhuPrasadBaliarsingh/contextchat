import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { getSocket } from "../../services/socket";

const PAGE_SIZE = 30;

const mergeMessages = (
  existing,
  incoming
) => {
  const map = new Map();

  [...existing, ...incoming].forEach(
    (message) => {
      map.set(
        message._id.toString(),
        message
      );
    }
  );

  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(a.createdAt) -
      new Date(b.createdAt)
  );
};

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams();

  const { user } = useAuth();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [typingUser, setTypingUser] = useState(null);

  const [hasMoreMessages, setHasMoreMessages] =
    useState(true);

  const [loadingMore, setLoadingMore] =
    useState(false);

  /*
    Get the other participant
  */

  const otherUser = conversation?.participants?.find(
    (participant) =>
      participant._id.toString() !== user?._id?.toString() &&
      participant._id.toString() !== user?.id?.toString()
  );

  /*
    Fetch conversation
  */

  const fetchConversation = useCallback(async () => {
    try {
      const response = await api.get(
        `/conversations/${conversationId}`
      );

      setConversation(response.data.conversation);
    } catch (error) {
      console.log(
        "Conversation error:",
        error.response?.data || error.message
      );
    }
  }, [conversationId]);

  /*
    Fetch messages
  */

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get(
        `/messages/${conversationId}?limit=${PAGE_SIZE}`
      );

      setMessages(
        response.data.messages || []
      );

      setHasMoreMessages(
        response.data.hasMore
      );
    } catch (error) {
      console.log(
        "Fetch messages error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  const loadOlderMessages = async () => {
    if (
      loadingMore ||
      !hasMoreMessages ||
      messages.length === 0
    ) {
      return;
    }

    try {
      setLoadingMore(true);

      const oldestMessage =
        messages[0];

      const response = await api.get(
        `/messages/${conversationId}?limit=${PAGE_SIZE}&before=${oldestMessage._id}`
      );

      const olderMessages =
        response.data.messages || [];

      if (olderMessages.length > 0) {
        setMessages((previousMessages) =>
          mergeMessages(
            previousMessages,
            olderMessages
          )
        );
      }

      setHasMoreMessages(
        response.data.hasMore
      );
    } catch (error) {
      console.log(
        "Load older messages error:",
        error.response?.data ||
          error.message
      );
    } finally {
      setLoadingMore(false);
    }
  };

  /*
    Initial load
  */

  useEffect(() => {
    const loadChat = async () => {
      setLoading(true);

      await Promise.all([
        fetchConversation(),
        fetchMessages(),
      ]);

      setLoading(false);
    };

    loadChat();
  }, [fetchConversation, fetchMessages]);

  /*
    Socket events
  */

  useEffect(() => {
    const socket = getSocket();

    if (!socket || !conversationId) {
      return;
    }

    /*
      Join conversation
    */
    socket.emit(
  "join_conversation",
  conversationId
);

socket.emit(
  "mark_messages_read",
  conversationId
);

    /*
      New message
    */

    const handleNewMessage = (newMessage) => {
      if (
        newMessage.conversationId?.toString() ===
        conversationId.toString()
      ) {
        setMessages((previousMessages) =>
          mergeMessages(
            previousMessages,
            [newMessage]
          )
        );

        /*
          Tell server that this message
          reached the device.
        */

        const currentUserId =
          user?._id || user?.id;

        const senderId =
          newMessage.senderId?._id ||
          newMessage.senderId;

        if (
          senderId?.toString() !==
          currentUserId?.toString()
        ) {
          socket.emit(
            "message_delivered",
            newMessage._id
          );
        }
      }
    };

    /*
      Typing
    */

    const handleTyping = (data) => {
      if (
        data.conversationId?.toString() ===
        conversationId.toString()
      ) {
        setTypingUser(data.userName);
      }
    };

    const handleStoppedTyping = () => {
      setTypingUser(null);
    };
    const handleMessageStatus = ({
  messageId,
  status,
}) => {
  setMessages((previousMessages) =>
    previousMessages.map((item) =>
      item._id?.toString() ===
      messageId?.toString()
        ? {
            ...item,
            status,
          }
        : item
    )
  );
};

socket.on(
  "message_status",
  handleMessageStatus
);

    const handleMessagesRead = ({
      conversationId: readConversationId,
    }) => {
      if (
        readConversationId?.toString() !==
        conversationId.toString()
      ) {
        return;
      }

      setMessages((previousMessages) =>
        previousMessages.map((item) => {
          const senderId =
            item.senderId?._id ||
            item.senderId;

          const currentUserId =
            user?._id || user?.id;

          if (
            senderId?.toString() ===
            currentUserId?.toString()
          ) {
            return {
              ...item,
              status: "read",
            };
          }

          return item;
        })
      );
    };

    socket.on(
      "messages_read",
      handleMessagesRead
    );

    socket.on(
      "new_message",
      handleNewMessage
    );

    socket.on(
      "user_typing",
      handleTyping
    );

    socket.on(
      "user_stopped_typing",
      handleStoppedTyping
    );

    return () => {
      socket.off(
        "new_message",
        handleNewMessage
      );

      socket.off(
        "user_typing",
        handleTyping
      );

      socket.off(
        "user_stopped_typing",
        handleStoppedTyping
      );
      socket.off(
        "message_status",
        handleMessageStatus
      );
      socket.off(
        "messages_read",
        handleMessagesRead
      );
    };
  }, [conversationId]);

  /*
    Send message
  */

  const sendMessage = () => {
    if (!message.trim()) {
      return;
    }

    const socket = getSocket();

    if (!socket || !socket.connected) {
      console.log("Socket is not connected.");
      return;
    }

    setSending(true);

    socket.emit("send_message", {
      conversationId,
      content: message.trim(),
      messageType: "text",
    });

    setMessage("");

    socket.emit(
      "typing_stop",
      conversationId
    );

    setSending(false);
  };

  /*
    Typing handler
  */

  const handleTypingChange = (text) => {
    setMessage(text);

    const socket = getSocket();

    if (!socket || !socket.connected) {
      return;
    }

    if (text.trim()) {
      socket.emit(
        "typing_start",
        conversationId
      );
    } else {
      socket.emit(
        "typing_stop",
        conversationId
      );
    }
  };

  /*
    Render message
  */

  const renderMessage = ({ item }) => {
    const senderId =
      item.senderId?._id ||
      item.senderId;

    const currentUserId =
      user?._id || user?.id;

    const isMine =
      senderId?.toString() ===
      currentUserId?.toString();

    return (
      <View
        style={[
          styles.messageRow,
          isMine
            ? styles.myMessageRow
            : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine
              ? styles.myBubble
              : styles.otherBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMine
                ? styles.myMessageText
                : styles.otherMessageText,
            ]}
          >
            {item.content}
          </Text>

          <View style={styles.messageMeta}>
            <Text
              style={[
                styles.messageTime,
                isMine
                  ? styles.myMessageTime
                  : styles.otherMessageTime,
              ]}
            >
              {new Date(
                item.createdAt
              ).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>

            {isMine && (
              <Text
                style={[
                  styles.messageStatus,
                  item.status === "read" &&
                    styles.messageStatusRead,
                ]}
              >
                {item.status === "sent"
                  ? "✓"
                  : "✓✓"}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  /*
    Loading
  */

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />

        <Text style={styles.loadingText}>
          Loading conversation...
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={
        Platform.OS === "ios"
          ? "padding"
          : "height"
      }
      keyboardVerticalOffset={0}
    >
      {/* Header */}

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>
            ‹
          </Text>
        </Pressable>

        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {otherUser?.name
              ?.charAt(0)
              .toUpperCase()}
          </Text>

          {otherUser?.isOnline && (
            <View style={styles.onlineDot} />
          )}
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {otherUser?.name || "Chat"}
          </Text>

          <Text style={styles.headerStatus}>
            {typingUser
              ? `${typingUser} is typing...`
              : otherUser?.isOnline
              ? "Online"
              : "Offline"}
          </Text>
        </View>

        <Pressable style={styles.moreButton}>
          <Text style={styles.moreIcon}>
            ⋮
          </Text>
        </Pressable>
      </View>

      {/* Messages */}

      <FlatList
        data={messages}
        keyExtractor={(item) =>
          item._id.toString()
        }
        renderItem={renderMessage}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.messagesContainer
        }
        onScroll={({ nativeEvent }) => {
          const { contentOffset } = nativeEvent;

          if (contentOffset.y <= 50) {
            loadOlderMessages();
          }
        }}
        ListHeaderComponent={
          loadingMore ? (
            <ActivityIndicator
              size="small"
            />
          ) : null
        }
      />

      {/* Typing indicator */}

      {typingUser && (
        <View style={styles.typingContainer}>
          <Text style={styles.typingText}>
            {typingUser} is typing...
          </Text>
        </View>
      )}

      {/* Input */}

      <View style={styles.inputArea}>
        <Pressable style={styles.attachButton}>
          <Text style={styles.attachIcon}>
            +
          </Text>
        </Pressable>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
          value={message}
          onChangeText={handleTypingChange}
          multiline
          maxLength={5000}
        />

        <Pressable
          style={[
            styles.sendButton,
            !message.trim() &&
              styles.sendButtonDisabled,
          ]}
          onPress={sendMessage}
          disabled={
            !message.trim() || sending
          }
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
    backgroundColor: "#f8f8f8",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  loadingText: {
    marginTop: 12,
    color: "#777777",
  },

  header: {
    height: 82,
    paddingTop: 30,
    paddingHorizontal: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
  },

  backButton: {
    width: 40,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 36,
    color: "#111111",
    marginTop: -4,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#eeeeee",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },

  avatarText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333333",
  },

  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#22c55e",
    borderWidth: 2,
    borderColor: "#ffffff",
    position: "absolute",
    right: -1,
    bottom: 0,
  },

  headerInfo: {
    flex: 1,
    marginLeft: 10,
  },

  headerName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },

  headerStatus: {
    fontSize: 12,
    color: "#777777",
    marginTop: 3,
  },

  moreButton: {
    width: 40,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  moreIcon: {
    fontSize: 25,
    color: "#555555",
  },

  messagesContainer: {
    padding: 15,
    paddingBottom: 15,
    flexGrow: 1,
  },

  messageRow: {
    width: "100%",
    marginBottom: 8,
  },

  myMessageRow: {
    alignItems: "flex-end",
  },

  otherMessageRow: {
    alignItems: "flex-start",
  },

  messageBubble: {
    maxWidth: "78%",
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
  },

  myBubble: {
    backgroundColor: "#111111",
    borderBottomRightRadius: 5,
  },

  otherBubble: {
    backgroundColor: "#ffffff",
    borderBottomLeftRadius: 5,
  },

  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },

  myMessageText: {
    color: "#ffffff",
  },

  otherMessageText: {
    color: "#111111",
  },

  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },

  messageStatus: {
    fontSize: 10,
    marginLeft: 4,
    color: "#aaaaaa",
  },

  messageStatusRead: {
    color: "#4da3ff",
  },

  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },

  myMessageTime: {
    color: "#bbbbbb",
  },

  otherMessageTime: {
    color: "#999999",
  },

  typingContainer: {
    paddingHorizontal: 18,
    paddingBottom: 4,
  },

  typingText: {
    fontSize: 12,
    color: "#777777",
    fontStyle: "italic",
  },

  inputArea: {
    minHeight: 65,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#eeeeee",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 10,
    paddingVertical: 9,
  },

  attachButton: {
    width: 42,
    height: 45,
    justifyContent: "center",
    alignItems: "center",
  },

  attachIcon: {
    fontSize: 28,
    color: "#666666",
  },

  input: {
    flex: 1,
    maxHeight: 100,
    minHeight: 45,
    backgroundColor: "#f4f4f4",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    fontSize: 15,
    color: "#111111",
  },

  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#111111",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 7,
  },

  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },

  sendIcon: {
    color: "#ffffff",
    fontSize: 18,
  },
});