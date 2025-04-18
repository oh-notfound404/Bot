const axios = require('axios');

module.exports = {
    name: "zipcode",
    usePrefix: false,
    usage: "zipcode <country-code> <zip-code>",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID } = event;

        if (args.length < 2) {
            return api.sendMessage(
                "❌ Please provide country code and zip code\n" +
                "Example: zipcode ph 6515\n" +
                "Example: zipcode us 90210",
                threadID,
                messageID
            );
        }

        const countryCode = args[0].toLowerCase();
        const zipCode = args[1];
        const apiUrl = `https://kaiz-apis.gleeze.com/api/zipcodeinfo?country=${encodeURIComponent(countryCode)}&zipcode=${encodeURIComponent(zipCode)}`;

        try {
            api.setMessageReaction("⏳", messageID, () => {}, true);
            const response = await axios.get(apiUrl);
            const data = response.data;

            if (!data?.places?.length) {
                api.setMessageReaction("❌", messageID, () => {}, true);
                return api.sendMessage(
                    "❌ No location found for the provided zip code",
                    threadID,
                    messageID
                );
            }

            const place = data.places[0];
            const message = `
📍 Location Information:
━━━━━━━━━━━━━━━━
🏷️ Zip Code: ${data["post code"] || "N/A"}
🌍 Country: ${data.country} (${data["country abbreviation"] || "N/A"})
🏡 Place: ${place["place name"] || "N/A"}
📌 Coordinates: ${place.latitude || "N/A"}, ${place.longitude || "N/A"}
━━━━━━━━━━━━━━━━
            `.trim();

            api.setMessageReaction("✅", messageID, () => {}, true);
            return api.sendMessage(message, threadID, messageID);

        } catch (error) {
            api.setMessageReaction("❌", messageID, () => {}, true);
            console.error('Zipcode API Error:', error);
            return api.sendMessage(
                "❌ Failed to fetch zipcode information. Please check the country code and zipcode.",
                threadID,
                messageID
            );
        }
    }
};