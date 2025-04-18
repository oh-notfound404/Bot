const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "imgur",
    usePrefix: false,
    usage: "imgur <reply to image>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event }) => {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply?.attachments?.[0]?.url) {
            return api.sendMessage("❌ Please reply to an image to upload to Imgur", threadID, messageID);
        }

        const imageUrl = messageReply.attachments[0].url;
        const tempDir = path.join(__dirname, '..', 'temp');
        const tempPath = path.join(tempDir, `imgur_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            await api.sendMessage("⌛ Uploading image to Imgur, please wait...", threadID);

            // Ensure temp directory exists
            await fs.ensureDir(tempDir);

            // Download the image first
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempPath, Buffer.from(response.data, 'binary'));

            // Upload to Imgur
            const uploadResponse = await axios.get(`https://betadash-uploader.vercel.app/imgur?link=${encodeURIComponent(imageUrl)}`);
            const imgurLink = uploadResponse.data?.uploaded?.image;

            if (!imgurLink) {
                throw new Error("No Imgur link received");
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                `✅ Imgur Upload Successful!\n\n🔗 Link: ${imgurLink}`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("Imgur Upload Error:", error);
            await api.sendMessage(
                "❌ Failed to upload image to Imgur. Please try again later.",
                threadID,
                messageID
            );
        } finally {
            // Clean up temp file if it exists
            if (await fs.pathExists(tempPath)) {
                await fs.unlink(tempPath).catch(console.error);
            }
        }
    }
};