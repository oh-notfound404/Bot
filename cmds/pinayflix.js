const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "pinayflix",
    usePrefix: true,
    usage: "pinayflix <search query> | <page number>",
    version: "1.1",
    cooldown: 10,
    admin: true,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        
        if (args.length < 1) {
            return api.sendMessage("❌ Usage: pinayflix <search query> | <page number>", threadID, messageID);
        }

        // Parse query and page number (default to page 1)
        const input = args.join(" ").split("|").map(item => item.trim());
        const searchQuery = input[0];
        const pageNumber = input[1] || 1;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const apiUrl = `http://sgp1.hmvhostings.com:25743/pinay?search=${encodeURIComponent(searchQuery)}&page=${pageNumber}`;
            const { data } = await axios.get(apiUrl);

            if (!data || data.length === 0) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(`❌ No videos found for "${searchQuery}" on page ${pageNumber}`, threadID, messageID);
            }

            // Create temp directory
            const tempDir = path.join(__dirname, '..', 'temp', 'pinayflix');
            await fs.ensureDir(tempDir);

            // Send first 3 videos (to avoid flooding)
            const videosToSend = data.slice(0, 3);
            for (const [index, video] of videosToSend.entries()) {
                const videoPath = path.join(tempDir, `video_${index}_${Date.now()}.mp4`);
                
                try {
                    // Download video
                    const response = await axios.get(video.video, { responseType: 'arraybuffer' });
                    await fs.writeFile(videoPath, Buffer.from(response.data, 'binary'));
                    
                    // Send video info
                    await api.sendMessage(
                        `🎥 Result ${index + 1} (Page ${pageNumber})\n\n` +
                        `📌 Title: ${video.title}\n` +
                        `🔗 Link: ${video.link}\n` +
                        `🖼 Preview: ${video.img}`,
                        threadID
                    );
                    
                    // Send video file
                    await api.sendMessage(
                        {
                            attachment: fs.createReadStream(videoPath),
                            body: `📹 Video ${index + 1} of ${videosToSend.length}`
                        },
                        threadID
                    );
                    
                } catch (error) {
                    console.error(`Error processing video ${index}:`, error);
                    await api.sendMessage(`⚠️ Failed to send video ${index + 1}`, threadID);
                } finally {
                    if (await fs.pathExists(videoPath)) {
                        await fs.unlink(videoPath).catch(console.error);
                    }
                }
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                `🔎 Found ${data.length} videos for "${searchQuery}"\n` +
                `📄 Current Page: ${pageNumber}\n` +
                `💡 Tip: Use "pinayflix ${searchQuery} | 2" for next page`,
                threadID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("PinayFlix Error:", error);
            return api.sendMessage("❌ Failed to process your request", threadID, messageID);
        }
    }
};