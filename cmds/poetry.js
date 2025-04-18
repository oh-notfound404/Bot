const axios = require('axios');

module.exports = {
    name: "poetry",
    usePrefix: false,
    usage: "poetry <title|author|random> [query]",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const query = args.join(' ');

        if (!query) {
            return api.sendMessage(
                "Usage:\n" +
                "• poetry title <poem-title>\n" +
                "• poetry author <author-name>\n" +
                "• poetry random",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            await api.sendMessage("⌛ Searching for poems...", threadID, messageID);

            const [type, ...rest] = args;
            const titleOrAuthor = rest.join(' ');

            if (!['title', 'author', 'random'].includes(type.toLowerCase())) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    "Invalid type. Use: title, author, or random",
                    threadID,
                    messageID
                );
            }

            const apiUrl = `https://jerome-web.gleeze.com/service/api/poetry?type=${encodeURIComponent(type)}${titleOrAuthor ? `&titleorauthor=${encodeURIComponent(titleOrAuthor)}` : ''}`;
            const response = await axios.get(apiUrl);
            const { data } = response.data;

            if (!data?.length) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    `❌ No poems found for: ${titleOrAuthor || 'random selection'}`,
                    threadID,
                    messageID
                );
            }

            const poem = data[0];
            const poemText = poem.lines.join('\n');
            
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `📜 Title: ${poem.title}\n` +
                `🖋️ Author: ${poem.author}\n\n` +
                `📄 Poem:\n${poemText}`,
                threadID,
                messageID
            );

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('Poetry API Error:', error);
            return api.sendMessage(
                "❌ Failed to fetch poems. Please try again later.",
                threadID,
                messageID
            );
        }
    }
};