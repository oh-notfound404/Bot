const cron = require("node-cron");

module.exports = {
    name: "acc",
    usePrefix: true,
    version: "1.0.1",
    admin: true, // role: 2 = admin
    cooldown: 5,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;
        const send = (msg) => api.sendMessage(msg, threadID, messageID);

        // Handle friend request approval
        const approveRequest = async (uid) => {
            try {
                const form = {
                    av: api.getCurrentUserID(),
                    fb_api_req_friendly_name: "FriendingCometFriendRequestConfirmMutation",
                    doc_id: "3147613905362928",
                    variables: JSON.stringify({
                        input: {
                            source: "friends_tab",
                            actor_id: api.getCurrentUserID(),
                            friend_requester_id: uid,
                            client_mutation_id: Math.round(Math.random() * 19).toString(),
                        },
                        scale: 3,
                        refresh_num: 0,
                    }),
                };

                const result = await api.httpPost("https://www.facebook.com/api/graphql/", form);
                return !JSON.parse(result).errors;
            } catch (error) {
                console.error("Approval error:", error);
                return false;
            }
        };

        // Check pending requests
        const checkRequests = async () => {
            try {
                const form = {
                    av: api.getCurrentUserID(),
                    fb_api_req_friendly_name: "FriendingCometFriendRequestsRootQueryRelayPreloader",
                    doc_id: "4499164963466303",
                    variables: JSON.stringify({ input: { scale: 3 } }),
                };

                const response = await api.httpPost("https://www.facebook.com/api/graphql/", form);
                const requests = JSON.parse(response).data?.viewer?.friending_possibilities?.edges || [];

                if (requests.length === 0) {
                    return "✅ No pending friend requests found.";
                }

                let message = "📥 Pending Friend Requests:\n\n";
                requests.forEach((req, index) => {
                    const time = new Date(req.time * 1000).toLocaleString("en-PH", {
                        timeZone: "Asia/Manila"
                    });
                    message += `${index + 1}. ${req.node.name}\nID: ${req.node.id}\nTime: ${time}\n\n`;
                });

                return message + "To approve: accept check <UID>";
            } catch (error) {
                console.error("Check error:", error);
                return "❌ Failed to fetch friend requests.";
            }
        };

        // Command handler
        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);

            if (args[0] === "check" && args[1]) {
                if (isNaN(args[1])) {
                    throw new Error("Invalid UID");
                }

                const success = await approveRequest(args[1]);
                api.setMessageReaction(success ? "✅" : "❌", messageID, () => {}, true);
                return send(success ? `✅ Approved request for UID: ${args[1]}` : `❌ Failed to approve UID: ${args[1]}`);
            }

            const requestList = await checkRequests();
            api.setMessageReaction("✅", messageID, () => {}, true);
            return send(requestList);

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            return send(error.message || "❌ An error occurred");
        }
    }
};

// Scheduled task (runs hourly)
cron.schedule("0 * * * *", async () => {
    // Requires access to 'api' and target threadID
    // Example: auto-check to admin group
    const adminThreadID = "YOUR_ADMIN_GROUP_ID";
    try {
        const api = global.api; // Adjust based on your setup
        const message = await module.exports.execute({ 
            api, 
            event: { threadID: adminThreadID, messageID: null },
            args: [] 
        });
        api.sendMessage("🔄 Auto-check:\n" + message, adminThreadID);
    } catch (error) {
        console.error("Scheduled check failed:", error);
    }
});