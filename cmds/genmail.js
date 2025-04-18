const axios = require("axios");

module.exports = {
    name: "genmail",
    usePrefix: false,
    usage: "tempmail gen | tempmail inbox <email>",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "⚠️ Usage: genmail gen | genmail inbox <email>",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            if (args[0].toLowerCase() === "gen") {
                const response = await axios.get("https://kaiz-apis.gleeze.com/api/smailpro-tempmail");
                const data = response.data.response;

                if (!data?.token || !data?.email) {
                    api.setMessageReaction("❌", messageID, () => {}, true);
                    return api.sendMessage(
                        "❌ Failed to generate email. Please try again later.",
                        threadID,
                        messageID
                    );
                }

                api.setMessageReaction("✅", messageID, () => {}, true);
                return api.sendMessage(
                    `📧 TempMail Generator\n\n✉️: ${data.email}\n\n🔑 Token:\n${data.token}\n\n🔔 To check inbox use:\ntempmail inbox ${data.email}`,
                    threadID,
                    messageID
                );

            } else if (args[0].toLowerCase() === "inbox" && args[1]) {
                const email = args[1];
                const response = await axios.get(`https://kaiz-apis.gleeze.com/api/smailpro-inbox?email=${encodeURIComponent(email)}`);
                const inbox = response.data.inbox;

                if (!inbox?.length) {
                    api.setMessageReaction("❌", messageID, () => {}, true);
                    return api.sendMessage(
                        "📭 No messages found in your inbox.",
                        threadID,
                        messageID
                    );
                }

                const firstMail = inbox[0];
                api.setMessageReaction("✅", messageID, () => {}, true);
                return api.sendMessage(
                    `📨 Email Inbox\n━━━━━━━━━━━━\n👤 From: ${firstMail.from || "Unknown"}\n🔖 Subject: ${firstMail.subject || "No Subject"}\n━━━━━━━━━━━━`,
                    threadID,
                    messageID
                );
            } else {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    "⚠️ Invalid command. Usage: genmail gen | genmail inbox <email>",
                    threadID,
                    messageID
                );
            }

        } catch (error) {
            console.error("Tempmail Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                "⚠️ An error occurred. Please try again later.",
                threadID,
                messageID
            );
        }
    }
};