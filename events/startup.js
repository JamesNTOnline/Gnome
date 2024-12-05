const { Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const avatarsPath = path.resolve(__dirname, '..', 'avatars');
//holiday periods and their timings. expand later
const holidays = [ //holiday periods and their timings. expand later
    { name: 'christmas', month: 12, start: 15, end: 31 }, //dec 15th to 31st
    { name: 'easter', month: 3, start: 15, end: 31 },
    { name: 'halloween', month: 10, start: 15, end: 31 }
];


/**
 * Selects a season based on the provided month:
 * - Winter: December, January, February 
 * - Spring: March, April, May... and so on
 * @param {number} month - The month of the year
 * @returns {string} - The name of the season
 */
function getSeason(month) {
    const validMonth = Math.max(1, Math.min(month, 12)); //constrain to 1-12 incase this function is used elsewhere
    const seasons = ['winter', 'spring', 'summer', 'autumn'];
    return seasons[Math.floor((validMonth/3) % 4)]; //e.g: (12/3) % 4 = 0 = seasons[0] = 'winter'
}


async function setAvatar(client) {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1; //months are 0-indexed
    const day = currentDate.getDate();

    //find out if it's a holiday and select either a holiday or season
    const holiday = holidays.find(h => month === h.month && day >= h.start && day <= h.end);
    const timeOfYear = holiday ? holiday.name : getSeason(month);
    //if it isn't a holiday, include the random folder
    const folders = holiday ? [timeOfYear] : [timeOfYear, 'random'];
    const selectedFolder = folders[Math.floor(Math.random() * folders.length)]; //select folder randomly
    const folderPath = path.join(avatarsPath, selectedFolder);
    const files = fs.readdirSync(folderPath);
    const selectedFile = files[Math.floor(Math.random() * files.length)]; //select a file randomly
    const avatarPath = path.join(folderPath, selectedFile);
    try {
        await client.user.setAvatar(avatarPath);
        console.log(`Changed avatar to ${selectedFile}`);
    } catch (error) {
        console.error(error);
    }
}


function startTerminalListener(client) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    async function sendMessageToChannel(channelNamePart, message) {
        const cleanedChannelNamePart = channelNamePart.replace(/^#/, '').toLowerCase();
        try {
            // Fetch all channels to ensure we get an up-to-date list
            const channels = await client.guilds.cache.first().channels.fetch();
            //console.log(channels);
    
            // Find the first matching text channel by name
            const channel = channels.find(
                ch => ch.type === 0 && ch.name.toLowerCase().includes(cleanedChannelNamePart)
            );
    
            if (channel) {
                await channel.send(message);
                console.log(`Message sent to #${channel.name}: ${message}`);
            } else {
                console.error(`No channel found containing "${cleanedChannelNamePart}".`);
            }
        } catch (error) {
            console.error(`Failed to fetch channels or send message: ${error}`);
        }
    }
    

    // Listen for terminal input and send messages to the specified Discord channel
    rl.on('line', (input) => {
        const [channelName, ...messageParts] = input.trim().split(' ');
        const message = messageParts.join(' ');

        if (channelName && message) {
            sendMessageToChannel(channelName, message);
        } else {
            console.log('Invalid format. Use "<channel> <message>" to send a message.');
        }
    });
}


module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Startup successful! Logged in as ${client.user.tag}`);
        setAvatar(client);
        setInterval(() => {
            setAvatar(client);
        }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
        //listening for terminal input for sending messages
        startTerminalListener(client);
    }
};
