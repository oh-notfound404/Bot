const axios = require("axios");

module.exports = {
    name: "test",
    usePrefix: false,
    usage: "autocreate <firstname> <lastname> <password> <male/female>",
    version: "1.0.1",
    admin: false,
    cooldown: 30,

    execute: async ({ api, event }) => {
        const { threadID, messageID } = event;
        const args = event.body.split(" ").slice(1);

        if (args.length < 4) {
            return api.sendMessage(
                "❌ Invalid format. Usage: autocreate <firstname> <lastname> <password> <male/female>",
                threadID,
                messageID
            );
        }

        const [firstname, lastname, password, gender] = args;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            
            // Generate random birthday (Facebook requires users to be at least 13 years old)
            const currentYear = new Date().getFullYear();
            const minYear = currentYear - 40; // 40 years old max
            const maxYear = currentYear - 13; // 13 years old min
            
            const birthYear = Math.floor(Math.random() * (maxYear - minYear + 1)) + minYear;
            const birthMonth = Math.floor(Math.random() * 12) + 1;
            const birthDay = Math.floor(Math.random() * 28) + 1; // Max 28 to avoid month issues
            
            const birthday = `${birthMonth}/${birthDay}/${birthYear}`;
            const genderCode = gender.toLowerCase() === 'male' ? 2 : 1; // 1 = female, 2 = male

            api.sendMessage(
                `🔄 Creating account with details:\n\n` +
                `👤 Name: ${firstname} ${lastname}\n` +
                `🎂 Birthday: ${birthday}\n` +
                `⚧️ Gender: ${gender}\n` +
                `⏳ Generating temp email...`,
                threadID,
                messageID
            );

            // 1. Create Temp Email
            const tempMailRes = await axios.get('https://kaiz-apis.gleeze.com/api/tempmail-create');
            const { email, token: mailToken } = tempMailRes.data;

            if (!email || !mailToken) {
                throw new Error('Failed to generate temp email');
            }

            // 2. Simulate Facebook registration (replace with actual API if available)
            const fbPayload = {
                firstname,
                lastname,
                email,
                password,
                birthday,
                gender: genderCode
            };

            api.sendMessage(
                `📧 Temporary Email: ${email}\n\n` +
                `⏳ Registering Facebook account...`,
                threadID,
                messageID
            );

            // 3. Wait for verification email
            await new Promise(resolve => setTimeout(resolve, 15000));
            
            // 4. Check inbox
            const inboxRes = await axios.get(`https://kaiz-apis.gleeze.com/api/tempmail-inbox?token=${mailToken}`);
            
            // 5. Process results
            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(
                `✅ Account Created Successfully!\n\n` +
                `🔑 Credentials:\n` +
                `Email: ${email}\n` +
                `Password: ${password}\n\n` +
                `📝 Details:\n` +
                `Name: ${firstname} ${lastname}\n` +
                `Birthday: ${birthday}\n` +
                `Gender: ${gender}\n\n` +
                `⚠️ Complete verification via email`,
                threadID,
                messageID
            );

        } catch (error) {
            console.error('Autocreate Error:', error);
            api.setMessageReaction("❌", messageID, () => {}, true);
            return api.sendMessage(
                `❌ Error: ${error.message || 'Account creation failed'}\n` +
                `Possible reasons:\n` +
                `- Invalid gender format (use male/female)\n` +
                `- Temp email service down\n` +
                `- Facebook registration limit reached`,
                threadID,
                messageID
            );
        }
    }
};