module.exports = {
    name: "getlink",
    usePrefix: false,
    usage: "getlink <reply to media>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event }) => {
        const { threadID, messageID, messageReply } = event;

        if (!messageReply || !messageReply.attachments || messageReply.attachments.length === 0) {
            return api.sendMessage("❌ Please reply to an image or video to get its direct link", threadID, messageID);
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            const mediaUrl = messageReply.attachments[0].url;
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(mediaUrl, threadID, messageID);
        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error("GetLink Error:", error);
            return api.sendMessage("❌ Failed to get media link", threadID, messageID);
        }
    }
};