const { Events } = require('discord.js');
const {connectDatabase} =  require('../db/connect-db.js');
const rotateAvatar = require('../utilities/avatar-rotator.js');
const readline = require('readline');

// Function to start listening for terminal input and send messages to Discord channels
// This function will listen for input in the terminal and send messages to a specified Discord channel
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
        console.log('Connecting to database...');
        await connectDatabase();
        console.log('Database connected.');
        console.log('Setting up avatar updater...');
        //rotateAvatar(client);
        //avatar rotation disabled for now, seems to cause issues
        startTerminalListener(client);
    }
};
