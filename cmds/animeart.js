const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "animeart",
    usePrefix: false,
    usage: "animeart <reply to photo>",
    version: "2.2",
    admin: false,
    cooldown: 5,
    aliases: ["animefy"],

    async execute({ api, event }) {
        const { messageReply, threadID, messageID } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to an image!", threadID, messageID);
        }

        const attachment = messageReply.attachments[0];
        if (attachment.type !== "photo") {
            return api.sendMessage("❌ The replied message must be a photo.", threadID, messageID);
        }

        const imgUrl = attachment.url;
        const processingMsg = await api.sendMessage("🛠️ Creating anime art...", threadID, messageID);

        try {
            const tempDir = path.join(__dirname, "..", "temp");
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

            const apiResponse = await axios.get(`http://45.134.39.193:6298/animirror?url=${encodeURIComponent(imgUrl)}`);
            if (!apiResponse.data?.image_url) throw new Error("Invalid API response format");

            const animeImgUrl = apiResponse.data.image_url;
            const imgPath = path.join(tempDir, `anime-${Date.now()}.jpg`);

            const response = await axios.get(animeImgUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

            await api.sendMessage(
                {
                    body: "🎨 Your anime transformation is ready!",
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => {
                    fs.unlinkSync(imgPath);
                    api.unsendMessage(processingMsg.messageID);
                }
            );

        } catch (err) {
            console.error("AnimeArt Error:", err.message);
            api.sendMessage("❌ Failed to create anime art. Please try another image.", threadID, messageID);
        }
    }
};