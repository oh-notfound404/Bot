const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
    name: "welcomenoti",
    version: "1.0.0",

    async execute({ api, event }) {
        if (event.logMessageType === "log:subscribe") {
            try {
                const addedParticipants = event.logMessageData.addedParticipants;
                const senderID = addedParticipants[0].userFbId;
                const userInfo = await api.getUserInfo(senderID);
                let name = userInfo[senderID].name;

                // Truncate long names
                const maxLength = 15;
                if (name.length > maxLength) {
                    name = name.substring(0, maxLength - 3) + '...';
                }

                // Get group information
                const groupInfo = await api.getThreadInfo(event.threadID);
                const groupIcon = groupInfo.imageSrc || "https://i.ibb.co/G5mJZxs/rin.jpg";
                const memberCount = groupInfo.participantIDs.length;
                const groupName = groupInfo.threadName || "this group";
                const background = groupInfo.imageSrc || "https://i.ibb.co/4YBNyvP/images-76.jpg";

                // Prepare welcome image URL
                const url = `https://api.joshweb.click/canvas/welcome?name=${encodeURIComponent(name)}&groupname=${encodeURIComponent(groupName)}&groupicon=${encodeURIComponent(groupIcon)}&member=${memberCount}&uid=${senderID}&background=${encodeURIComponent(background)}`;

                // Set up cache directory
                const cacheDir = path.join(__dirname, '..', 'cache');
                await fs.ensureDir(cacheDir);
                const filePath = path.join(cacheDir, `welcome_${event.threadID}_${Date.now()}.jpg`);

                // Download and process welcome image
                const { data } = await axios.get(url, { responseType: 'arraybuffer' });
                await fs.writeFile(filePath, Buffer.from(data));

                // Send welcome message with image
                await api.sendMessage({
                    body: `🌟 Welcome ${name} to ${groupName}! 🌟\n👥 Group now has ${memberCount} members!`,
                    attachment: fs.createReadStream(filePath)
                }, event.threadID);

                // Clean up the temporary file
                await fs.unlink(filePath).catch(console.error);

            } catch (error) {
                console.error("Welcome Notification Error:", error);
                
                // Fallback simple welcome message
                try {
                    const userName = await api.getUserInfo(event.logMessageData.addedParticipants[0].userFbId)
                        .then(info => info[event.logMessageData.addedParticipants[0].userFbId].name)
                        .catch(() => "new member");
                    
                    await api.sendMessage({
                        body: `👋 Welcome ${userName} to the group!`
                    }, event.threadID);
                } catch (fallbackError) {
                    console.error("Fallback welcome failed:", fallbackError);
                }
            }
        }
    }
};