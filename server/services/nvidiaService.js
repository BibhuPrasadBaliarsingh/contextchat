const axios = require("axios");

const NVIDIA_URL =
  "https://integrate.api.nvidia.com/v1/chat/completions";

const generateContextAnswer = async ({
  question,
  messages,
}) => {
  try {
    const context = messages
      .map((message, index) => {
        const sender =
          message.senderId?.name || "Unknown";

        const date = message.createdAt
          ? new Date(
              message.createdAt
            ).toLocaleString()
          : "";

        return `
MESSAGE ${index + 1}
Sender: ${sender}
Date: ${date}
Content: ${message.content}
`;
      })
      .join("\n");

    const response = await axios.post(
      NVIDIA_URL,
      {
        model:
          process.env.NVIDIA_MODEL ||
          "openai/gpt-oss-20b",

        messages: [
          {
            role: "system",

            content: `
You are ContextChat AI.

You answer questions about the user's
previous conversations.

IMPORTANT RULES:

1. Use only the supplied conversation messages.

2. Never invent information.

3. If the supplied messages do not contain
   enough information, say:
   "I couldn't find enough information in
   your conversations."

4. Identify the person who said something
   when relevant.

5. Use dates when they help answer the question.

6. Combine information from multiple messages
   when necessary.

7. Keep answers concise and natural.

8. Never reveal information that is not
   contained in the supplied messages.

9. Do not claim certainty when the context
   is ambiguous.
            `.trim(),
          },

          {
            role: "user",

            content: `
Here are messages from the user's conversations:

${context}

--------------------------------

User question:

${question}

--------------------------------

Answer the question using the conversation
context above.
            `.trim(),
          },
        ],

        temperature: 0.1,

        max_tokens: 500,

        stream: false,
      },

      {
        headers: {
          Authorization:
            `Bearer ${process.env.NVIDIA_API_KEY}`,

          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        timeout: 120000,
      }
    );

    return (
      response.data?.choices?.[0]?.message
        ?.content ||
      "I couldn't generate an answer."
    );
  } catch (error) {
    console.error(
      "NVIDIA request failed:"
    );

    console.error(
      "Status:",
      error.response?.status
    );

    console.error(
      "Response:",
      error.response?.data
    );

    console.error(
      "Message:",
      error.message
    );

    throw error;
  }
};


module.exports = {
  generateContextAnswer,
};