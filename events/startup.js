const {Events} = require('discord.js');

module.exports = {
    name: Events.ClientReady, //this event is for the clientready file
    once: true, //run once
    execute(client){
        console.log(`Startup successful! Logged in as ${client.user.tag}`);
    }
};

//DEPRECATED CODE
// when client ready, run this once
// 'c' s event parameter to keep it separate from the 'client'
//client.once(Events.ClientReady, c =>{
//    console.log(`Ready! Logged in as ${c.user.tag}`);
//    c.user.setPresence({ activities: [{ name: 'Searching for Gnomefriends' }],
//    status: 'idle' });
//});
