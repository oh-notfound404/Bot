const axios = require('axios');

module.exports = {
    name: "chords",
    usePrefix: false,
    usage: "chords <song name>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const query = args.join(' ');

        if (!query) {
            return api.sendMessage("Please enter a song name to search for chords", threadID, messageID);
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            const apiUrl = `https://markdevs-last-api-2epw.onrender.com/search/chords?q=${encodeURIComponent(query)}`;
            const response = await axios.get(apiUrl);
            const result = response.data.chord;

            if (!result?.chords) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("No chords found for this song", threadID, messageID);
            }

            const chordsMessage = `🎸 Chords for: ${result.title} - ${result.artist}\nKey: ${result.key}\n\n${result.chords}`;
            
            api.setMessageReaction("✅", messageID, () => {}, true);
            
            // Send main chords
            await api.sendMessage(chordsMessage, threadID);
            
            // Send URL separately if available
            if (result.url) {
                await api.sendMessage(`🔗 Full chords: ${result.url}`, threadID);
            }

        } catch (error) {
            console.error('Chords API error:', error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("Failed to fetch chords. Please try again later.", threadID, messageID);
        }
    }
};