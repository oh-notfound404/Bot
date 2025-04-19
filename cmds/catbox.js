const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "catbox",
    usePrefix: false,
    usage: "catbox <reply to image>",
    version: "1.0.0",
    cooldown: 3,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply?.attachments?.[0]?.url) {
            return api.sendMessage(
                "❌ Please reply to an image to upload it to Catbox!",
                threadID,
                messageID
            );
        }

        const imageUrl = messageReply.attachments[0].url;
        const tempDir = path.join(__dirname, '..', 'temp');
        const tempPath = path.join(tempDir, `catbox_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            // Ensure temp directory exists
            await fs.ensureDir(tempDir);

            // Download the image first
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempPath, Buffer.from(response.data, 'binary'));

            // Upload to Catbox
            const apiUrl = `https://jonell01-ccprojectsapihshs.hf.space/api/catmoe?url=${encodeURIComponent(imageUrl)}`;
            const uploadResponse = await axios.get(apiUrl);
            const { fileUrl } = uploadResponse.data;

            if (!fileUrl) throw new Error("No file URL returned from Catbox API");

            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                `✅ Image uploaded to Catbox successfully!\n🔗 Link: ${fileUrl}`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('Catbox Upload Error:', error);
            await api.sendMessage(
                "❌ Failed to upload image to Catbox. Please try again later.",
                threadID,
                messageID
            );
        } finally {
            // Clean up temp file
            if (await fs.pathExists(tempPath)) {
                await fs.unlink(tempPath).catch(console.error);
            }
        }
    }
};