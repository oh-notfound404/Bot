module.exports = {
    name: "randomreaction",
    version: "69",

    async execute({ api, event }) {
        if (event.body) {
            try {
                const emojis = ['😼', '🥹', '😠', '😹', '🙀', '😻', '🌹'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                
                await api.setMessageReaction(randomEmoji, event.messageID, () => {}, true);
            } catch (error) {
                console.error("Random Reaction Error:", error);
            }
        }
    }
};