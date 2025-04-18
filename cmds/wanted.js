const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "wanted",
    usePrefix: false,
    usage: "wanted <userID>",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "⚠️ Please provide a User ID to generate a WANTED poster.\n\nExample: wanted 61556130417570",
                threadID,
                messageID
            );
        }

        const userId = args[0];
        const apiUrl = `https://jerome-web.gleeze.com/service/api/wanted?uid=${encodeURIComponent(userId)}`;
        const filePath = path.join(__dirname, `wanted_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const response = await axios({
                url: apiUrl,
                method: "GET",
                responseType: "stream"
            });

            const writer = fs.createWriteStream(filePath);
            response.data.pipe(writer);

            writer.on("finish", () => {
                api.setMessageReaction("✅", messageID, () => {}, true);

                const msg = {
                    body: `🃏 WANTED poster for user: ${userId}`,
                    attachment: fs.createReadStream(filePath),
                };

                api.sendMessage(msg, threadID, (err) => {
                    if (err) {
                        console.error("❌ Error sending wanted poster:", err);
                        api.sendMessage("⚠️ Failed to send wanted poster.", threadID);
                    }

                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error("❌ Error deleting file:", unlinkErr);
                    });
                });
            });

            writer.on("error", (err) => {
                console.error("❌ Error saving wanted poster:", err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("⚠️ Failed to generate wanted poster.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("⚠️ An error occurred while generating wanted poster.", threadID, messageID);
        }
    },
};