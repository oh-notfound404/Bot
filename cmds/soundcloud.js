const axios = require('axios');

module.exports = {
    name: "soundcloud",
    usePrefix: true,
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
            const headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3'
            };

            // Check file size first
            const headResponse = await axios.head(apiUrl, { headers });
            const fileSize = parseInt(headResponse.headers['content-length'], 10);

            if (fileSize > 25 * 1024 * 1024) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage({
                    body: `Error: The audio file exceeds the 25 MB limit\n\nDownload link: ${apiUrl}`,
                    attachment: null
                }, threadID, messageID);
            }

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage({
                body: `🎧 Found: ${query}`,
                attachment: (await axios.get(apiUrl, { responseType: "stream" })).data
            }, threadID, messageID);

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("Music not found. Please try again.", threadID, messageID);
        }
    }
};