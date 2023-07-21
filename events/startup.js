const {Events} = require('discord.js');

module.exports = {
    name: Events.ClientReady, //this event is for the clientready file
    once: true, //run once
    execute(client){
        console.log(`Startup successful! Logged in as ${client.user.tag}`);
    }
};
