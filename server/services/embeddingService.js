const axios = require("axios");

const NVIDIA_URL =
  "https://integrate.api.nvidia.com/v1/embeddings";

const generateEmbedding = async (text) => {
  if (!text || !text.trim()) {
    return null;
  }

  try {
    const response = await axios.post(
      NVIDIA_URL,
      {
        input: text.trim(),
        model:
          process.env.NVIDIA_EMBEDDING_MODEL ||
          "nvidia/nv-embedqa-e5-v5",
        input_type: "query",
        encoding_format: "float",
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

        timeout: 60000,
      }
    );

    return (
      response.data?.data?.[0]?.embedding ||
      null
    );
  } catch (error) {
    console.error(
      "Embedding error:",
      error.response?.data ||
        error.message
    );

    return null;
  }
};
const generateMessageEmbedding = async ({
  senderName,
  content,
  createdAt,
}) => {
  const text = `
Sender: ${senderName || "Unknown"}
Date: ${
    createdAt
      ? new Date(createdAt).toISOString()
      : ""
  }
Message: ${content}
  `.trim();

  return generateEmbedding(text);
};
module.exports = {
  generateEmbedding,
  generateMessageEmbedding,
};