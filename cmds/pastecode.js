const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "pastecode",
    usePrefix: false,
    usage: "pastecode get <ID> | pastecode <filename> | (reply to message)",
    version: "1.0.0",
    admin: false,
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, messageReply } = event;

        // GET subcommand
        if (args[0]?.toLowerCase() === "get") {
            if (args.length < 2) {
                return api.sendMessage("⚠️ Please provide paste IDs to retrieve!", threadID, messageID);
            }

            try {
                api.setMessageReaction("⏳", messageID, () => {}, true);
                const results = [];
                
                for (const pasteID of args.slice(1)) {
                    const url = `https://paste.c-net.org/${pasteID}`;
                    const response = await axios.get(url);
                    results.push(`📋 ${url}:\n${response.data}\n━━━━━━━━━━━━`);
                }

                api.setMessageReaction("✅", messageID, () => {}, true);
                return api.sendMessage(results.join("\n\n"), threadID, messageID);
            } catch (error) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("❌ Failed to retrieve paste(s)", threadID, messageID);
            }
        }

        // Handle replied messages
        if (messageReply) {
            try {
                api.setMessageReaction("⏳", messageID, () => {}, true);
                const response = await axios.post("https://paste.c-net.org/", messageReply.body, {
                    headers: { "X-FileName": "replied-code.txt" }
                });
                
                api.setMessageReaction("✅", messageID, () => {}, true);
                return api.sendMessage(`📎 Paste created: ${response.data}`, threadID, messageID);
            } catch (error) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("❌ Failed to upload replied content", threadID, messageID);
            }
        }

        // Handle file upload
        if (!args[0]) {
            return api.sendMessage(
                "⚠️ Usage:\n• pastecode get <ID>\n• pastecode <filename>\n• Reply to a message",
                threadID,
                messageID
            );
        }

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            const fileName = args[0];
            const cmdPath = path.join(__dirname, "..", "cmds");
            const filePath = [
                path.join(cmdPath, fileName),
                path.join(cmdPath, `${fileName}.js`)
            ].find(fs.existsSync);

            if (!filePath) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage("❌ File not found!", threadID, messageID);
            }

            const code = fs.readFileSync(filePath, "utf8");
            const response = await axios.post("https://paste.c-net.org/", code, {
                headers: { "X-FileName": path.basename(filePath) }
            });

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(`📁 File uploaded: ${response.data}`, threadID, messageID);
        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage("❌ Failed to upload file", threadID, messageID);
        }
    }
};