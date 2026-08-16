const express = require("express");

const {
  getMessages,
  searchMessages,
  askContext,
  askConversationContext,
} = require("../controllers/messageController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Global Context AI
router.post(
  "/context-ai",
  protect,
  askContext
);

// Search messages
router.get(
  "/search",
  protect,
  searchMessages
);

// Conversation-specific Context AI
router.post(
  "/:conversationId/context-ai",
  protect,
  askConversationContext
);

// Get conversation messages
router.get(
  "/:conversationId",
  protect,
  getMessages
);

module.exports = router;