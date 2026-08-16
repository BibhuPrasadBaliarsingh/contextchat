const Conversation = require("../models/Conversation");
const User = require("../models/User");

// Get all users except current logged-in user
const getUsers = async (req, res) => {
  try {
    const users = await User.find({
      _id: {
        $ne: req.user._id,
      },
    })
      .select("_id name email profileImage isOnline lastSeen")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch users.",
    });
  }
};

// Create or find a private conversation
const createPrivateConversation = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    if (userId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: "You cannot start a conversation with yourself.",
      });
    }

    const otherUser = await User.findById(userId);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    let conversation = await Conversation.findOne({
      type: "private",
      participants: {
        $all: [req.user._id, userId],
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "private",
        participants: [req.user._id, userId],
      });
    }

    await conversation.populate(
      "participants",
      "name email profileImage isOnline lastSeen"
    );

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to create conversation.",
    });
  }
};

// Get all conversations of current user
const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate(
        "participants",
        "name email profileImage isOnline lastSeen"
      )
      .populate(
        "lastMessage",
        "content senderId messageType createdAt status"
      )
      .sort({
        lastMessageAt: -1,
        createdAt: -1,
      });

    const formattedConversations = conversations.map(
      (conversation) => {
        const otherParticipant =
          conversation.participants.find(
            (participant) =>
              participant._id.toString() !==
              req.user._id.toString()
          );

        return {
          _id: conversation._id,
          type: conversation.type,

          otherUser: otherParticipant || null,

          lastMessage: conversation.lastMessage,

          lastMessageAt:
            conversation.lastMessageAt ||
            conversation.createdAt,

          participants:
            conversation.participants,
        };
      }
    );

    return res.status(200).json({
      success: true,
      conversations: formattedConversations,
    });
  } catch (error) {
    console.error(
      "Get conversations error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch conversations.",
    });
  }
};

// Get one conversation
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: req.user._id,
    }).populate(
      "participants",
      "name email profileImage isOnline lastSeen"
    );

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found.",
      });
    }

    return res.status(200).json({
      success: true,
      conversation,
    });
  } catch (error) {
    console.error("Get conversation error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch conversation.",
    });
  }
};

module.exports = {
  getUsers,
  createPrivateConversation,
  getConversations,
  getConversation,
};