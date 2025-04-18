const axios = require('axios');

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