const express = require("express");

const {
  getUsers,
  createPrivateConversation,
  getConversations,
  getConversation,
} = require("../controllers/conversationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/users", protect, getUsers);

router.get("/", protect, getConversations);

router.get("/:conversationId", protect, getConversation);

router.post("/private", protect, createPrivateConversation);

module.exports = router;