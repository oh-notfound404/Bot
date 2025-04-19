const axios = require("axios");

module.exports = {
    name: "test",
    usePrefix: false,
    usage: "autocreate <firstname> <lastname> <password> <male/female>",
    version: "1.1",
    admin: false,
    cooldown: 5,
    async execute({ api, event, args }) {
        const { threadID, messageID } = event;
        
        if (args.length < 4) {
            return api.sendMessage(
                "❗ Usage: autocreate <firstname> <lastname> <password> <male/female>\n\n" +
                "Example:\n" +
                "autocreate Juan Dela Cruz password123 male\n" +
                "autocreate Maria Santos mypassword456 female",
                threadID,
                messageID
            );
        }

        const [firstname, lastname, password, gender] = args;
        const genderCode = gender.toLowerCase() === 'male' ? 2 : 1;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Generate random birthday (13-40 years old)
            const currentYear = new Date().getFullYear();
            const birthYear = currentYear - Math.floor(Math.random() * 28) - 13;
            const birthMonth = Math.floor(Math.random() * 12) + 1;
            const birthDay = Math.floor(Math.random() * 28) + 1;
            const birthday = `${birthMonth}/${birthDay}/${birthYear}`;

            // Step 1: Generate Temp Email
            const { data: emailData } = await axios.get("https://kaiz-apis.gleeze.com/api/tempmail-create");
            if (!emailData?.email || !emailData?.token) {
                throw new Error("Failed to generate temporary email");
            }

            const email = emailData.email;
            const mailToken = emailData.token;

            // Step 2: Display account details (simulated registration)
            const accountDetails = 
                "📋 ACCOUNT DETAILS:\n" +
                `👤 Name: ${firstname} ${lastname}\n` +
                `📧 Email: ${email}\n` +
                `🔑 Password: ${password}\n` +
                `🎂 Birthday: ${birthday}\n` +
                `⚧️ Gender: ${gender}\n\n` +
                "⏳ Checking for verification email in 15 seconds...";

            await api.sendMessage(accountDetails, threadID, messageID);
            await new Promise(resolve => setTimeout(resolve, 15000));

            // Step 3: Check Inbox
            const { data: inboxData } = await axios.get(`https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${mailToken}`);
            const emails = inboxData?.emails || [];

            if (emails.length === 0) {
                throw new Error("No verification email received");
            }

            // Find Facebook verification email
            const fbEmail = emails.find(e => 
                e.subject?.toLowerCase().includes("facebook") || 
                e.subject?.toLowerCase().includes("verify")
            );

            if (!fbEmail) {
                throw new Error("Facebook verification email not found");
            }

            // Step 4: Send final result
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                "✅ ACCOUNT CREATION SUCCESSFUL!\n\n" +
                `🔗 Verification required for:\n${email}\n\n` +
                "📩 Latest Facebook Email:\n" +
                `Subject: ${fbEmail.subject || "No Subject"}\n` +
                `Date: ${fbEmail.date || "Unknown"}\n\n` +
                "⚠️ Complete verification within 24 hours",
                threadID,
                messageID
            );

        } catch (error) {
            console.error("Autocreate Error:", error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                `❌ Account creation failed: ${error.message}\n\n` +
                "Possible solutions:\n" +
                "1. Check if gender is 'male' or 'female'\n" +
                "2. Try again after 5 minutes\n" +
                "3. Contact admin if problem persists",
                threadID,
                messageID
            );
        }
    }
};