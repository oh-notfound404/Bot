const axios = require("axios"); // Not needed here, but kept for consistency

module.exports = {
    name: "bio",
    usePrefix: false,
    usage: "bio (text)",
    version: "1.7",
    admin: true, // Since role: 2 is typically admin
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        try {
            if (!args[0]) {
                return api.sendMessage("❌ Please provide a bio text.", threadID, messageID);
            }

            const newBio = args.join(" ");
            await api.changeBio(newBio);

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(`✅ Admin changed bot bio to:\n"${newBio}"`, threadID, messageID);

        } catch (error) {
            console.error("Bio change error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ Failed to update bio.", threadID, messageID);
        }
    },
};