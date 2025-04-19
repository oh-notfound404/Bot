const axios = require("axios");

module.exports = {
    name: "test",
    usePrefix: true,
    usage: "sonar <your_message>",
    version: "1.0",
    admin: false,
    cooldown: 5,
    async execute({ api, event, args }) {
        const { threadID, messageID, senderID } = event;

        if (!args || args.length === 0) {
            return api.sendMessage(
                "❌ Please provide a message for Sonar AI\nExample: sonar hello",
                threadID,
                messageID
            );
        }

        const prompt = args.join(" ");
        const apiUrl = `https://renzsuperb.onrender.com/api/sonar-r-pro?prompt=${encodeURIComponent(prompt)}&uid=${senderID}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const { data } = await axios.get(apiUrl, {
                timeout: 15000
            });

            if (!data || !data.message) {
                throw new Error("Invalid response from AI");
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `🤖 Sonar AI Response:\n\n${data.message}`,
                threadID,
                messageID
            );

        } catch (error) {
            console.error("Sonar API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                `❌ Failed to get response: ${error.message || "API timeout"}\nPlease try again later.`,
                threadID,
                messageID
            );
        }
    }
};