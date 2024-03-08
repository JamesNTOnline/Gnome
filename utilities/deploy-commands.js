/**
Deployment:
Guild-based: for development/testing in a personal server
//Routes.applicationGuildCommands(clientId, guildId),

Global: for publishing the command to all guilds the bot is in
    await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
    );
*/

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../botconfig.json');
const fs = require('fs');
const path = require('path');

const commandList = [];
const commandsFolderPath = path.join(__dirname, '../commands');
const commandFiles = fs.readdirSync(commandsFolderPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(path.join(commandsFolderPath, file));
    commandList.push(command.data.toJSON());
}
//prep REST module
const rest = new REST({version:'10'}).setToken(token);
//deploy
(async()=>{
    try{
        console.log(`refreshing ${commandList.length} commands...`);
        //put to refresh all commands
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            {body: commandList},
        );
        console.log(`successfully reloaded ${commandList.length} commands`);
    } catch (error){
        console.error(error);
    }
})();
