/**
Deployment:
Guild-based: for development/testing in a personal server
consider cloning the application to use a separate token/app for testing
//Routes.applicationGuildCommands(clientId, guildId),

add
    "clientID": ,
    "guildID":
to botconfig.json

Global: for publishing the command to all guilds the bot is in
    await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
    );
*/

const {REST, Routes} = require('discord.js');
const {clientId, guildId, token} = require('./botconfig.json');
const fs = require('node:fs');
const commands = [];
//get command files
const commandFiles = fs.readdirSync('./commands').filter(file=>file.endsWith('.js'));

//get SlashCommandBuilder#toJSON() for each command's data
for(const file of commandFiles){
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

//prep REST module
const rest = new REST({version:'10'}).setToken(token);

//deploy
// syntax for Immediately-invoked Function Expression (IIFE)
//(async () => { await someAsyncFunc();})();
(async()=>{
    try{
        console.log(`refreshing ${commands.length} application (/) commands...`);
        //put to refresh all commands
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            {body: commands},
        );
        console.log(`successfully reloaded ${data.length} commands`);
    } catch (error){
        console.error(error);
    }
})();
