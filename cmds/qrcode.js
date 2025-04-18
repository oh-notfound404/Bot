const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "qrcode",
    usePrefix: false,
    usage: "qrcode <text>",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage("⚠️ Please provide text to generate QR code.\nUsage: qrcode <text>", threadID, messageID);
        }

        const text = args.join(" ");
        const apiUrl = `https://kaiz-apis.gleeze.com/api/qrcode-generator?text=${encodeURIComponent(text)}`;
        const filePath = path.join(__dirname, `qrcode_${Date.now()}.png`);

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
                    body: `🔳 QR Code for: "${text}"`,
                    attachment: fs.createReadStream(filePath),
                };

                api.sendMessage(msg, threadID, (err) => {
                    if (err) {
                        console.error("❌ Error sending QR code:", err);
                        api.sendMessage("⚠️ Failed to send QR code.", threadID);
                    }

                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error("❌ Error deleting file:", unlinkErr);
                    });
                });
            });

            writer.on("error", (err) => {
                console.error("❌ Error saving QR code:", err);
                api.setMessageReaction("❌", messageID, () => {}, true);
                api.sendMessage("⚠️ Failed to generate QR code.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            api.sendMessage("⚠️ An error occurred while generating QR code.", threadID, messageID);
        }
    },
};