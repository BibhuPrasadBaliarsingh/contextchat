const axios = require("axios");

const startKeepAlive = () => {
  const targetUrl = process.env.SERVER_URL || "https://contextchat-drsg.onrender.com/api/health";
  // Render free tier sleeps after 15 minutes. Ping every 14 minutes (840,000 ms).
  const PING_INTERVAL = 14 * 60 * 1000;

  console.log(`[Keep-Alive] Self-ping active. Target URL: ${targetUrl} (every 14 minutes)`);

  setInterval(async () => {
    try {
      const response = await axios.get(targetUrl);
      console.log(
        `[Keep-Alive Ping Success] Status ${response.status} - ${new Date().toLocaleTimeString()}`
      );
    } catch (error) {
      console.error(
        `[Keep-Alive Ping Warning] Could not reach ${targetUrl}: ${error.message}`
      );
    }
  }, PING_INTERVAL);
};

module.exports = startKeepAlive;
