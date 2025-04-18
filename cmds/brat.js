const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "brat",
    usePrefix: false,
    usage: "brat <text>",
    version: "1.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage("❌ Please provide text\nUsage: brat <text>", threadID, messageID);
        }

        const text = args.join(" ");
        const apiUrl = `https://api.zetsu.xyz/gen/brat?text=${encodeURIComponent(text)}&apikey=80836f3451c2b3392b832988e7b73cdb`;
        const tempDir = path.join(__dirname, "..", "temp");
        const imgPath = path.join(tempDir, `brat_${Date.now()}.png`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Create temp directory if not exists
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

            api.setMessageReaction("✅", messageID, () => {}, true);
            api.sendMessage(
                {
                    body: "✨ Here's your Bratz-style image!",
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("Brat Error:", error.message);
            return api.sendMessage("❌ Failed to generate image", threadID, messageID);
        }
    }
};