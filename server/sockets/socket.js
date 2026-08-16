const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const {
  generateMessageEmbedding,
} = require("../services/embeddingService");

const initializeSocket = (httpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });

    /*
      Socket authentication
    */

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error("Authentication required."));
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error("User not found."));
            }

            socket.user = user;

            next();
        } catch (error) {
            console.error("Socket authentication error:", error.message);

            next(new Error("Invalid authentication token."));
        }
    });

    /*
      New socket connection
    */

    io.on("connection", async (socket) => {
        const userId = socket.user._id.toString();

        console.log(`User connected: ${socket.user.name}`);

        /*
          Mark user online
        */

        await User.findByIdAndUpdate(userId, {
            isOnline: true,
            lastSeen: new Date(),
        });

        /*
          Join personal room
        */

        socket.join(`user:${userId}`);

        /*
          Send online status
        */

        io.emit("user_online", {
            userId,
        });

        /*
          Join conversation
        */

        socket.on("join_conversation", async (conversationId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId,
                });

                if (!conversation) {
                    socket.emit("socket_error", {
                        message: "Conversation not found or access denied.",
                    });

                    return;
                }

                socket.join(`conversation:${conversationId}`);

                console.log(
                    `${socket.user.name} joined conversation ${conversationId}`
                );
            } catch (error) {
                console.error("Join conversation error:", error);
            }
        });

        /*
          Send message
        */

        socket.on("send_message", async (data) => {
            try {
                const {
                    conversationId,
                    content,
                    messageType = "text",
                    replyTo = null,
                    attachments = [],
                } = data;

                if (!conversationId || !content?.trim()) {
                    socket.emit("socket_error", {
                        message: "Conversation ID and message content are required.",
                    });

                    return;
                }

                /*
                  Check conversation access
                */

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    participants: userId,
                });

                if (!conversation) {
                    socket.emit("socket_error", {
                        message: "Conversation not found or access denied.",
                    });

                    return;
                }

                /*
                  Save message permanently
                */

                const message = await Message.create({
                    conversationId,
                    senderId: userId,
                    content: content.trim(),
                    messageType,
                    replyTo,
                    attachments,
                    status: "sent",
                });

                /*
                  Update conversation
                */

                conversation.lastMessage = message._id;
                conversation.lastMessageAt = message.createdAt;

                await conversation.save();

                /*
                  Get complete message
                */

                const populatedMessage = await Message.findById(message._id)
                    .populate(
                        "senderId",
                        "name email profileImage isOnline"
                    )
                    .populate(
                        "replyTo",
                        "content senderId messageType createdAt"
                    );

                /*
                  Send message to everyone
                  inside the conversation
                */

                io.to(`conversation:${conversationId}`).emit(
                    "new_message",
                    populatedMessage
                );

                generateMessageEmbedding({
                    senderName: socket.user.name,
                    content: message.content,
                    createdAt: message.createdAt,
                })
                    .then((embedding) => {
                        if (embedding) {
                            Message.findByIdAndUpdate(message._id, {
                                embedding,
                            }).catch((err) =>
                                console.error("Save embedding error:", err)
                            );
                        }
                    })
                    .catch((err) =>
                        console.error("Generate message embedding error:", err)
                    );

                console.log(
                    `Message sent by ${socket.user.name}: ${content}`
                );
            } catch (error) {
                console.error("Send message error:", error);

                socket.emit("socket_error", {
                    message: "Unable to send message.",
                });
            }
        });


        socket.on("message_delivered", async (messageId) => {
            try {
                const message = await Message.findById(messageId);

                if (!message) {
                    return;
                }

                // Only change sent -> delivered
                if (message.status === "sent") {
                    message.status = "delivered";
                    await message.save();
                }

                io.to(`conversation:${message.conversationId}`).emit(
                    "message_status",
                    {
                        messageId: message._id,
                        status: "delivered",
                    }
                );
            } catch (error) {
                console.error(
                    "Message delivered error:",
                    error
                );
            }
        });
        /*
          Typing started
        */
        socket.on(
            "mark_messages_read",
            async (conversationId) => {
                try {
                    const conversation =
                        await Conversation.findOne({
                            _id: conversationId,
                            participants: socket.user._id,
                        });

                    if (!conversation) {
                        return;
                    }

                    const result =
                        await Message.updateMany(
                            {
                                conversationId,
                                senderId: {
                                    $ne: socket.user._id,
                                },
                                status: {
                                    $ne: "read",
                                },
                                isDeleted: false,
                            },
                            {
                                $set: {
                                    status: "read",
                                },
                            }
                        );

                    if (result.modifiedCount > 0) {
                        io.to(
                            `conversation:${conversationId}`
                        ).emit("messages_read", {
                            conversationId,
                            readBy: socket.user._id,
                        });
                    }
                } catch (error) {
                    console.error(
                        "Mark messages read error:",
                        error
                    );
                }
            }
        );

        socket.on("typing_start", async (conversationId) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("user_typing", {
                    conversationId,
                    userId,
                    userName: socket.user.name,
                });
        });

        /*
          Typing stopped
        */

        socket.on("typing_stop", async (conversationId) => {
            socket
                .to(`conversation:${conversationId}`)
                .emit("user_stopped_typing", {
                    conversationId,
                    userId,
                });
        });

        /*
          Disconnect
        */

        socket.on("disconnect", async () => {
            console.log(`User disconnected: ${socket.user.name}`);

            await User.findByIdAndUpdate(userId, {
                isOnline: false,
                lastSeen: new Date(),
            });

            io.emit("user_offline", {
                userId,
                lastSeen: new Date(),
            });
        });
    });

    return io;
};

module.exports = initializeSocket;