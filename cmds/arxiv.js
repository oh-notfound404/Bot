const axios = require('axios');

module.exports = {
    name: "arxiv",
    usePrefix: false,
    usage: "arxiv <search query>",
    version: "1.0",
    cooldown: 10,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const query = args.join(' ');

        if (!query) {
            return api.sendMessage(
                "❌ Usage: arxiv <search term>\nExample: arxiv quantum physics",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            await api.sendMessage("🔍 Searching arXiv, please wait...", threadID, messageID);

            const apiUrl = `https://jerome-web.gleeze.com/service/api/arxiv?query=${encodeURIComponent(query)}`;
            const response = await axios.get(apiUrl);
            const { article } = response.data;

            if (!article) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    `❌ No articles found for: ${query}`,
                    threadID,
                    messageID
                );
            }

            const message = `
📄 Title: ${article.title}
🖋️ Authors: ${article.authors.join(', ')}
📆 Published: ${article.published}

📜 Summary:
${article.summary}

🔗 Article Link: ${article.id}
            `;

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(message, threadID, messageID);

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('arXiv API Error:', error);
            return api.sendMessage(
                "❌ Failed to fetch articles. Please try again later.",
                threadID,
                messageID
            );
        }
    }
};