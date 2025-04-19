const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "soundcloud",
    usePrefix: false,
    usage: "soundcloud <search query>",
    version: "1.0",
    cooldown: 5, // Increased cooldown for audio downloads
    admin: false,
    description: "Search and send SoundCloud tracks",

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (!args[0]) {
            return api.sendMessage(
                "❌ Please provide a search query\nExample: soundcloud Bawat Sandali",
                threadID,
                messageID
            );
        }

        const query = args.join(' ');
        const apiUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${encodeURIComponent(query)}`;
        const tempDir = path.join(__dirname, '..', 'temp', 'soundcloud');
        const audioPath = path.join(tempDir, `sc_${Date.now()}.mp3`);

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            await fs.ensureDir(tempDir);

            // Search for tracks
            const response = await axios.get(apiUrl);
            const { results } = response.data;

            if (!results || results.length === 0) {
                throw new Error("No results found");
            }

            // Get first result's audio
            const trackUrl = results[0].url;
            const audioApiUrl = `https://kaiz-apis.gleeze.com/api/soundcloud-dl?url=${encodeURIComponent(trackUrl)}`;
            const audioResponse = await axios.get(audioApiUrl, { responseType: 'stream' });

            // Save audio temporarily
            const writer = fs.createWriteStream(audioPath);
            audioResponse.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Send audio file only
            api.setMessageReaction("✅", messageID, () => {}, true);
            await api.sendMessage(
                {
                    attachment: fs.createReadStream(audioPath),
                    body: `🎧 ${results[0].title} - ${results[0].artist}`
                },
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('SoundCloud Error:', error);
            await api.sendMessage(
                "❌ Failed to download audio. Please try another query.",
                threadID,
                messageID
            );
        } finally {
            // Clean up
            if (await fs.pathExists(audioPath)) {
                await fs.unlink(audioPath).catch(console.error);
            }
        }
    }
};