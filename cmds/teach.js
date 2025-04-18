const axios = require("axios");

module.exports = {
    name: "teach",
    usePrefix: true,
    usage: "teach <question> => <answer>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const text = args.join(" ");

        try {
            // Validate input format
            if (!text.includes(" => ")) {
                return api.sendMessage(
                    "⚠️ Invalid format. Usage: teach <question> => <answer>\nExample: teach hi => hello",
                    threadID,
                    messageID
                );
            }

            // Split question and answer
            const [question, answer] = text.split(" => ").map(str => str.trim());
            if (!question || !answer) {
                throw new Error("Missing question or answer");
            }

            api.setMessageReaction("⏳", messageID, () => {}, true);

            // Teach SimSimi
            const apiUrl = `https://simsimi-api-pro.onrender.com/teach?ask=${encodeURIComponent(question)}&ans=${encodeURIComponent(answer)}`;
            await axios.get(apiUrl);

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `✅ Successfully taught SimSimi!\n\nYour question: ${question}\nSim response: ${answer}`,
                threadID,
                messageID
            );

        } catch (error) {
            console.error("Teach error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                "❌ Failed to teach SimSimi. Please use format:\nteach <question> => <answer>\nExample: teach hi => hello",
                threadID,
                messageID
            );
        }
    }
};