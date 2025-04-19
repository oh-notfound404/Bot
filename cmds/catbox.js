const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "catbox",
    usePrefix: false,
    usage: "catbox <image-url>",
    version: "1.0",
    cooldown: 5,
    admin: false,
    description: "Upload images to catbox.moe hosting service",

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "❌ Please provide an image URL\nExample: catbox https://example.com/image.jpg",
                threadID,
                messageID
            );
        }

        const imageUrl = args[0];
        const apiUrl = `https://jonell01-ccprojectsapihshs.hf.space/api/catmoe?url=${encodeURIComponent(imageUrl)}`;
        const tempDir = path.join(__dirname, '..', 'temp', 'catbox');
        const tempPath = path.join(tempDir, `catbox_${Date.now()}.jpg`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Ensure temp directory exists
            await fs.ensureDir(tempDir);

            // First download the image to verify it's valid
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            await fs.writeFile(tempPath, Buffer.from(imageResponse.data, 'binary'));

            // Upload to catbox.moe
            const uploadResponse = await axios.get(apiUrl);
            const catboxUrl = uploadResponse.data?.fileUrl;

            if (!catboxUrl) {
                throw new Error("No URL returned from catbox.moe");
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `✅ Image uploaded to catbox.moe:\n${catboxUrl}`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('Catbox Upload Error:', error);
            return api.sendMessage(
                "❌ Failed to upload image. Please check:\n1. URL validity\n2. Image size (max ~20MB)\n3. Try again later",
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