const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "fbdl",
    usePrefix: false,
    usage: "fbdl <facebook-url>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "❌ Please provide a Facebook video URL\nExample: fbdl https://fb.watch/example",
                threadID,
                messageID
            );
        }

        const fbUrl = args[0];
        const apiUrl = `https://kaiz-apis.gleeze.com/api/fbdl?url=${encodeURIComponent(fbUrl)}`;
        const tempDir = path.join(__dirname, '..', 'temp', 'fb_videos');
        const videoPath = path.join(tempDir, `fb_${Date.now()}.mp4`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Create temp directory if not exists
            await fs.ensureDir(tempDir);

            // Get video URL from API
            const response = await axios.get(apiUrl);
            const videoUrl = response.data?.videoUrl;

            if (!videoUrl) {
                throw new Error("No video URL found");
            }

            // Download video
            const videoResponse = await axios.get(videoUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(videoPath);
            videoResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send video directly
            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                {
                    attachment: fs.createReadStream(videoPath)
                },
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('FB Download Error:', error);
            await api.sendMessage(
                "❌ Failed to download video. Please check the URL and try again.",
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