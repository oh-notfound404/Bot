const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "imgbb",
    usePrefix: false,
    usage: "imgbb <reply to image>",
    version: "1.0.0",
    cooldown: 3,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply?.attachments?.[0]?.url) {
            return api.sendMessage(
                "❌ Please reply to an image to upload it to IMGBB!",
                threadID,
                messageID
            );
        }

        const imageUrl = messageReply.attachments[0].url;
        const tempDir = path.join(__dirname, '..', 'temp');
        const tempPath = path.join(tempDir, `imgbb_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            await fs.ensureDir(tempDir);
            const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempPath, Buffer.from(response.data, 'binary'));

            const apiUrl = `https://kaiz-apis.gleeze.com/api/imgbb?url=${encodeURIComponent(imageUrl)}`;
            const uploadResponse = await axios.get(apiUrl);
            const { link } = uploadResponse.data;

            if (!link) throw new Error("No link returned from API");

            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                `✅ Image uploaded successfully!\n🌐 Link: ${link}`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('IMGBB Upload Error:', error);
            await api.sendMessage(
                "❌ Failed to upload image. Please try again later.",
                threadID,
                messageID
            );
        } finally {
            if (await fs.pathExists(tempPath)) {
                await fs.unlink(tempPath).catch(console.error);
            }
        }
    }
};