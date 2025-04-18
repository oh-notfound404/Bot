const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "tvprisoner",
    usePrefix: false,
    usage: "tvprisoner <reply to a photo>",
    version: "1.0",
    admin: false,
    cooldown: 5,
    aliases: ["prisoner"],

    async execute({ api, event }) {
        const { messageReply, threadID, messageID } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to an image to use this command.", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== "photo") {
            return api.sendMessage("❌ The replied message must be a photo.", threadID, messageID);
        }

        const imageUrl = attachment.url;
        const apiUrl = `https://kaiz-apis.gleeze.com/api/tv-prisoner?imageUrl=${encodeURIComponent(imageUrl)}`;

        try {
            api.sendMessage("⏳ Processing image, please wait...", threadID, messageID);

            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });

            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const tempPath = path.join(tempDir, `tvprisoner_${Date.now()}.jpg`);
            fs.writeFileSync(tempPath, Buffer.from(response.data, "binary"));

            api.sendMessage(
                {
                    body: "✅ Image processed!",
                    attachment: fs.createReadStream(tempPath)
                },
                threadID,
                () => fs.unlinkSync(tempPath)
            );
        } catch (err) {
            console.error("TV Prisoner Error:", err.message);
            api.sendMessage("❌ Error occurred while processing the image.", threadID, messageID);
        }
    }
};