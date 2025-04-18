const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "soundcloud",
    usePrefix: false,
    usage: "soundcloud <song name>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const query = args.join(' ');

        if (!query) {
            return api.sendMessage("Please provide the name of the music you want to search", threadID, messageID);
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const apiUrl = `https://betadash-search-download.vercel.app/sc?search=${encodeURIComponent(query)}`;
            const tempDir = path.join(__dirname, '..', 'temp');
            const audioPath = path.join(tempDir, `soundcloud_${Date.now()}.mp3`);

            // Ensure temp directory exists
            await fs.ensureDir(tempDir);

            const response = await axios.get(apiUrl, { responseType: 'stream' });
            const writer = fs.createWriteStream(audioPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                {
                    body: `🎧 Found: ${query}`,
                    attachment: fs.createReadStream(audioPath)
                },
                threadID,
                () => fs.unlink(audioPath).catch(console.error),
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('SoundCloud Error:', error);
            return api.sendMessage("Music not found. Please try again.", threadID, messageID);
        }
    }
};