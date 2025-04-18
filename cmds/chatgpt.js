const axios = require("axios");

module.exports = {
    name: "chatgpt",
    usePrefix: true,
    usage: "chatgpt <question>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    aliases: ["ai", "gpt"],

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;
        const query = args.join(" ").trim();

        if (!query) {
            return api.sendMessage(
                "❌ Please enter a question.\n\nExample: chatgpt What is artificial intelligence?",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const url = `https://jonell01-ccprojectsapihshs.hf.space/api/gpt4?ask=${encodeURIComponent(query)}&id=${encodeURIComponent(senderID)}`;
            const response = await axios.get(url);
            const result = response.data || "No response from the AI.";

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
            console.error("GPT-4 Error:", error.message);
            return api.sendMessage("❌ An error occurred while contacting the AI.", threadID, messageID);
        }
    }
};