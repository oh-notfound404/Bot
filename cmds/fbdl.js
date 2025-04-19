const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "fbdl",
    usePrefix: true,
    usage: "fbdl <facebook-url>",
    version: "1.1",  // Updated version
    cooldown: 10,    // Increased cooldown
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "❌ Please provide a Facebook video URL",
                threadID,
                messageID
            );
        }

        const fbUrl = args[0];
        const apiUrl = `https://kaiz-apis.gleeze.com/api/fbdl?url=${encodeURIComponent(fbUrl)}`;
        const tempDir = path.join(__dirname, '..', 'temp', 'fbdl');
        const videoPath = path.join(tempDir, `fb_video_${Date.now()}.mp4`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Ensure temp directory exists
            await fs.ensureDir(tempDir);

            // Fetch video info
            const response = await axios.get(apiUrl);
            const { title, author, quality, videoUrl } = response.data;

            if (!videoUrl) {
                throw new Error("No video URL found in response");
            }

            // Download video file
            const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(videoPath);
            videoResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send video info
            await api.sendMessage(
                `📹 Facebook Video Info:\n━━━━━━━━━━━━━━━━\n` +
                `🎬 Title: ${title || "N/A"}\n` +
                `👤 Author: ${author || "N/A"}\n` +
                `🖥️ Quality: ${quality || "N/A"}\n` +
                `━━━━━━━━━━━━━━━━\n` +
                `✅ Downloaded successfully!`,
                threadID,
                messageID
            );

            // Send video file
            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                {
                    attachment: fs.createReadStream(videoPath),
                    body: "Here's your Facebook video:"
                },
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('FB Download Error:', error);
            await api.sendMessage(
                "❌ Failed to download video. Please check:\n1. URL validity\n2. Video privacy settings\n3. Try again later",
                threadID,
                messageID
            );
        } finally {
            // Clean up temp file
            if (await fs.pathExists(videoPath)) {
                await fs.unlink(videoPath).catch(console.error);
            }
        }
    }
};