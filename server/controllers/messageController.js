const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const {
  generateContextAnswer,
} = require("../services/nvidiaService");
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const limit = Math.min(
      parseInt(req.query.limit) || 30,
      100
    );

    const before = req.query.before;

    // Make sure user belongs to conversation
    const conversation =
      await Conversation.findOne({
        _id: conversationId,
        participants: req.user._id,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message:
          "Conversation not found or access denied.",
      });
    }

    // Build query
    const query = {
      conversationId,
      isDeleted: false,
    };

    // Load messages older than `before`
    if (before) {
      const beforeMessage =
        await Message.findById(before).select(
          "createdAt"
        );

      if (beforeMessage) {
        query.createdAt = {
          $lt: beforeMessage.createdAt,
        };
      }
    }

    // Get newest messages first
    const messages =
      await Message.find(query)
        .populate(
          "senderId",
          "name email profileImage isOnline"
        )
        .populate(
          "replyTo",
          "content senderId messageType createdAt"
        )
        .sort({
          createdAt: -1,
        })
        .limit(limit + 1);

    const hasMore =
      messages.length > limit;

    if (hasMore) {
      messages.pop();
    }

    // We fetched newest → oldest.
    // React Native chat needs oldest → newest.
    messages.reverse();

    return res.status(200).json({
      success: true,
      messages,
      hasMore,
    });
  } catch (error) {
    console.error(
      "Get messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch messages.",
    });
  }
};

const searchMessages = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
    }

    const searchText = q.trim();

    /*
      Find conversations where
      current user is a participant.
    */

    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select("_id");

    const conversationIds =
      conversations.map(
        (conversation) =>
          conversation._id
      );

    /*
      Search messages only inside
      user's conversations.
    */

    const messages = await Message.find({
      conversationId: {
        $in: conversationIds,
      },

      isDeleted: false,

      $text: {
        $search: searchText,
      },
    })
      .populate(
        "senderId",
        "name email profileImage"
      )
      .populate(
        "conversationId",
        "type participants"
      )
      .select(
        "content senderId conversationId messageType createdAt"
      )
      .sort({
        createdAt: -1,
      })
      .limit(50);

    return res.status(200).json({
      success: true,
      query: searchText,
      count: messages.length,
      messages,
    });
  } catch (error) {
    console.error(
      "Search messages error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to search messages.",
    });
  }
};

const askContext = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const cleanQuestion = question.trim();

    /*
     * Step 1:
     * Find conversations belonging to
     * the authenticated user.
     */

    const conversations = await Conversation.find({
      participants: req.user._id,
    }).select("_id");

    const conversationIds = conversations.map(
      (conversation) => conversation._id
    );

    if (conversationIds.length === 0) {
      return res.status(200).json({
        success: true,
        answer:
          "You don't have any conversation history yet.",
        sources: [],
      });
    }

    /*
     * Step 2:
     * Try keyword search first.
     */

    let messages = await Message.find({
      conversationId: {
        $in: conversationIds,
      },

      isDeleted: false,

      $text: {
        $search: cleanQuestion,
      },
    })
      .populate("senderId", "name email")
      .sort({
        createdAt: -1,
      })
      .limit(30);

    /*
     * Step 3:
     * If keyword search doesn't find anything,
     * use recent conversation messages.
     */

    if (messages.length === 0) {
      messages = await Message.find({
        conversationId: {
          $in: conversationIds,
        },

        isDeleted: false,
      })
        .populate("senderId", "name email")
        .sort({
          createdAt: -1,
        })
        .limit(50);
    }

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,
        answer:
          "I couldn't find any messages to answer your question.",
        sources: [],
      });
    }

    /*
     * Step 4:
     * Generate answer using NVIDIA.
     */

    const answer = await generateContextAnswer({
      question: cleanQuestion,
      messages,
    });

    /*
     * Step 5:
     * Return source messages.
     */

    const sources = messages.map((message) => ({
      _id: message._id,
      content: message.content,
      sender: message.senderId?.name || "Unknown",
      createdAt: message.createdAt,
      conversationId: message.conversationId,
    }));

    return res.status(200).json({
      success: true,
      answer,
      sources,
    });
  } catch (error) {
    console.error(
      "Context AI error:",
      error.response?.data || error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to generate ContextChat answer.",
    });
  }
};
const askConversationContext = async (
  req,
  res
) => {
  try {
    const { conversationId } = req.params;
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    /*
     * Make sure the user belongs
     * to this conversation.
     */

    const conversation =
      await Conversation.findOne({
        _id: conversationId,

        participants:
          req.user._id,
      });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message:
          "Conversation not found.",
      });
    }

    /*
     * Get messages from ONLY
     * this conversation.
     */

    const messages =
      await Message.find({
        conversationId,

        isDeleted: false,
      })
        .populate(
          "senderId",
          "name email"
        )
        .sort({
          createdAt: 1,
        })
        .limit(100);

    if (messages.length === 0) {
      return res.status(200).json({
        success: true,

        answer:
          "There are no messages in this conversation yet.",

        sources: [],
      });
    }

    const answer =
      await generateContextAnswer({
        question:
          question.trim(),

        messages,
      });

    const sources =
      messages.map(
        (message) => ({
          _id: message._id,

          content:
            message.content,

          sender:
            message.senderId
              ?.name ||
            "Unknown",

          createdAt:
            message.createdAt,

          conversationId:
            message.conversationId,
        })
      );

    return res.status(200).json({
      success: true,

      answer,

      sources,
    });
  } catch (error) {
    console.error(
      "Conversation AI error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Unable to analyze conversation.",
    });
  }
};

module.exports = {
  getMessages,
  searchMessages,
  askContext,
  askConversationContext,
};