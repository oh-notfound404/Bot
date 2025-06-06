const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: "soundcloud",
    usePrefix: false,
    usage: "soundcloud [song name]",
    description: "Search and download SoundCloud tracks",
    version: "1.0",
    cooldown: 5,

    async execute({ api, event, args }) {
        if (!args[0]) {
            return api.sendMessage("Please provide a search keyword.\nUsage: soundcloud [song name]", event.threadID, event.messageID);
        }

        const keyword = encodeURIComponent(args.join(" "));
        const searchURL = `https://kaiz-apis.gleeze.com/api/soundcloud-search?title=${keyword}`;

        try {
            const searchRes = await axios.get(searchURL);
            const track = searchRes.data.results[0]; // Get first result

            if (!track || !track.url) {
                return api.sendMessage("No track found.", event.threadID, event.messageID);
            }

            const downloadURL = `https://kaiz-apis.gleeze.com/api/soundcloud-dl?url=${encodeURIComponent(track.url)}`;
            const dlRes = await axios.get(downloadURL);
            const { title, artist, thumbnail, audioUrl } = dlRes.data;

            // Download thumbnail
            const imgPath = path.join(__dirname, "cache", `sc_thumb_${event.senderID}.jpg`);
            const audioPath = path.join(__dirname, "cache", `sc_audio_${event.senderID}.mp3`);
            const imgRes = await axios.get(thumbnail, { responseType: "arraybuffer" });
            fs.writeFileSync(imgPath, imgRes.data);

            // Download audio
            const audioRes = await axios.get(audioUrl, { responseType: "arraybuffer" });
            fs.writeFileSync(audioPath, audioRes.data);

            // Send thumbnail and caption
            api.sendMessage({
                body: `🎵 Title: ${title}\n👤 Artist: ${artist}`,
                attachment: fs.createReadStream(imgPath)
            }, event.threadID, () => {
                // Send audio after image
                api.sendMessage({
                    body: "🎧 Here's your SoundCloud track!",
                    attachment: fs.createReadStream(audioPath)
                }, event.threadID, () => {
                    fs.unlinkSync(imgPath);
                    fs.unlinkSync(audioPath);
                });
            });

        } catch (err) {
            console.error("SoundCloud Error:", err);
            api.sendMessage("An error occurred while processing your request.", event.threadID, event.messageID);
        }
    }
};