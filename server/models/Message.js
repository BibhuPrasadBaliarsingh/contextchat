const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            required: true,
            index: true,
        },

        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        content: {
            type: String,
            trim: true,
            maxlength: 5000,
            default: "",
        },
        embedding: {
            type: [Number],
            default: undefined,
            select: false,
        },
        messageType: {
            type: String,
            enum: [
                "text",
                "image",
                "video",
                "audio",
                "file",
                "code",
            ],
            default: "text",
        },

        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },

        attachments: [
            {
                type: String,
            },
        ],

        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },

        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
messageSchema.index({
    conversationId: 1,
    createdAt: -1,
});

messageSchema.index({
    content: "text",
});
const Message = mongoose.model("Message", messageSchema);

module.exports = Message;