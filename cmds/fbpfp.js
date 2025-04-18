const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "fbpfp",
    usePrefix: true,
    usage: "fbpfp <uid>",
    version: "1.0.0",
    admin: false,
    cooldown: 5,
    aliases: ["facebookpfp", "profilepic"],

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "❌ Please provide a Facebook UID to fetch the profile picture.",
                threadID,
                messageID
            );
        }

        const uid = args[0];
        const imageUrl = `https://kaiz-apis.gleeze.com/api/facebookpfp?uid=${encodeURIComponent(uid)}`;
        const tempDir = path.join(__dirname, "..", "temp");
        const imgPath = path.join(tempDir, `fbpfp-${uid}-${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Create temp directory if not exists
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir);
            }

            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, Buffer.from(response.data, "binary"));

            api.setMessageReaction("✅", messageID, () => {}, true);
            api.sendMessage(
                {
                    body: `✅ Facebook profile picture for UID: ${uid}`,
                    attachment: fs.createReadStream(imgPath)
                },
                threadID,
                () => fs.unlinkSync(imgPath),
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("Facebook PFP Error:", error.message);
            return api.sendMessage(
                "❌ Failed to fetch profile picture. Please check the UID and try again.",
                threadID,
                messageID
            );
        }
    }
};