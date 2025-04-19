const axios = require("axios");

module.exports = {
    name: "test",
    usePrefix: false,
    usage: "sonar <prompt>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    aliases: ["snr", "sonarai"],

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;
        const prompt = args.join(" ").trim();

        if (!prompt) {
            return api.sendMessage(
                "❌ Please enter your prompt.\n\nExample: sonar Explain quantum computing",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const url = `https://renzsuperb.onrender.com/api/sonar-r-pro?prompt=${encodeURIComponent(prompt)}&uid=${encodeURIComponent(senderID)}`;
            const response = await axios.get(url, { timeout: 15000 });
            const result = response.data?.message || "No response from Sonar AI.";

            api.setMessageReaction("✅", messageID, () => {}, true);

            const maxLength = 2000;
            if (result.length > maxLength) {
                const parts = result.match(new RegExp(`.{1,${maxLength}}`, "g"));
                for (const part of parts) {
                    await new Promise((r) => setTimeout(r, 500));
                    await api.sendMessage(part, threadID, messageID);
                }
            } else {
                return api.sendMessage(result, threadID, messageID);
            }
        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("Sonar AI Error:", error.message);
            return api.sendMessage(
                `❌ Sonar AI request failed. ${error.response?.data?.message || "Please try again later."}`,
                threadID,
                messageID
            );
        }
    }
};