const { Events } = require('discord.js');

/*
Message event listener - what would you want to do with this?
- Detect bad words (store a blacklist)
- Detect specific mentions
- Detect media -> could do nsfw detection with computer vision or reverse image search for stolen media
- Paywalled link replacement, twitter media replacement, e.g. fxtwitter.com so videos can be embedded
*/


async function handleMessage(message) {
    return;
    //check something about the message, e.g. who sent it or something about the content
    //try fetch whatever is needed, perform some action
}


module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        const badUsers = [];
        const badWords = [];
        await handleMessage(message);
        //more stuff
    },
};
