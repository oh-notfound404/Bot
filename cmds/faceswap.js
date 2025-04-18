const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "faceswap",
    usePrefix: false,
    usage: "faceswap <reply to 2 images>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply } = event;

        // Check if the message reply contains two image attachments
        if (!messageReply || messageReply.attachments.length < 2) {
            return api.sendMessage("⚠️ Please reply to a message containing *two* images to swap faces.", threadID, messageID);
        }

        const [source, target] = messageReply.attachments;

        if (source.type !== "photo" || target.type !== "photo") {
            return api.sendMessage("⚠️ Both attachments must be images.", threadID, messageID);
        }

        const sourceUrl = encodeURIComponent(source.url);
        const targetUrl = encodeURIComponent(target.url);
        const apiUrl = `https://kaiz-apis.gleeze.com/api/faceswap-v2?targetUrl=${targetUrl}&sourceUrl=${sourceUrl}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            const response = await axios.get(apiUrl, { responseType: "stream" });

            const filePath = path.join(__dirname, `faceswap_${Date.now()}.jpg`);
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            writer.on("finish", () => {
                api.sendMessage(
                    {
                        body: "✅ Face swap completed!",
                        attachment: fs.createReadStream(filePath),
                    },
                    threadID,
                    () => fs.unlinkSync(filePath),
                    messageID
                );
            });

            writer.on("error", (err) => {
                console.error("Error writing file:", err);
                api.sendMessage("❌ Failed to save or send the swapped image.", threadID, messageID);
            });
        } catch (error) {
            console.error("FaceSwap API Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ An error occurred while processing the face swap.", threadID, messageID);
        }
    }
};
