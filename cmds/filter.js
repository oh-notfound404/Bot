module.exports = {
    name: "filter",
    usePrefix: false,
    usage: "filter dead acc",
    version: "2.0.0",
    cooldown: 5,
    admin: true, // Requires admin privileges

    execute: async ({ api, event }) => {
        const { threadID } = event;

        try {
            api.setMessageReaction("⏳", event.messageID, () => {}, true);
            
            const { userInfo, adminIDs } = await api.getThreadInfo(threadID);
            const filteredUsers = userInfo.filter(user => user.gender === undefined).map(user => user.id);
            const isBotAdmin = adminIDs.some(admin => admin.id === api.getCurrentUserID());

            if (filteredUsers.length === 0) {
                api.setMessageReaction("ℹ️", event.messageID, () => {}, true);
                return api.sendMessage("No Facebook User accounts found in this group.", threadID);
            }

            if (!isBotAdmin) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return api.sendMessage("❌ Bot needs admin rights to filter users.", threadID);
            }

            api.sendMessage(`Found ${filteredUsers.length} Facebook User accounts to filter...`, threadID);
            
            let successCount = 0;
            let failCount = 0;

            for (const userID of filteredUsers) {
                try {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    await api.removeUserFromGroup(parseInt(userID), threadID);
                    successCount++;
                } catch {
                    failCount++;
                }
            }

            api.setMessageReaction("✅", event.messageID, () => {}, true);
            let resultMsg = `✅ Successfully filtered ${successCount} users.`;
            if (failCount > 0) {
                resultMsg += `\n❌ Failed to filter ${failCount} users.`;
            }
            return api.sendMessage(resultMsg, threadID);

        } catch (error) {
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            console.error("Filter Error:", error);
            return api.sendMessage("❌ An error occurred while filtering users.", threadID);
        }
    }
};