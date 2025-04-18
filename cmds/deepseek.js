const axios = require('axios');

module.exports = {
    name: "deepseek",
    usePrefix: true,
    usage: "deepseek <question>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const question = args.join(' ');

        if (!question) {
            return api.sendMessage("Please provide your question.", threadID, messageID);
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const apiUrl = `https://yt-video-production.up.railway.app/Deepseek-R1?ask=${encodeURIComponent(question)}`;
            const response = await axios.get(apiUrl);
            const answer = response.data.response;

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `🐬 Deepseek R1\n━━━━━━━━━━━━━\n${answer}\n━━━━━━━━━━━━━`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                `❌ Error: ${error.message}\nPlease try again later.`,
                threadID,
                messageID
            );
        }
    }
};