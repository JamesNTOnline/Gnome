/**
Deployment:
Guild-based: for development/testing in a personal server
//Routes.applicationGuildCommands(clientId, guildId),

Global: for publishing the command to all guilds the bot is in
    await rest.put(
        Routes.applicationCommands(clientId),
        { body: commands },
    );
there is some rate-limiting on global updates, 
so don't spam this during testing
*/

const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('../botconfig.json');
const fs = require('fs');
const path = require('path');

const commandList = [];
const commandsFolderPath = path.join(__dirname, '../commands');
//prepare a list of command files present in the commands folder
const commandFiles = fs.readdirSync(commandsFolderPath, { withFileTypes: true })
  .filter(entry => entry.isFile() && entry.name.endsWith('.js'))
  .map(entry => entry.name);
for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsFolderPath, file));
    const hasBuilder = command && command.data && typeof command.data.toJSON === 'function';
    const hasExecute = command && typeof command.execute === 'function';
    /* don't want to bother trying to deploy command files 
    that are WIP without a builder or exported function */ 
    if (hasBuilder) {
      commandList.push(command.data.toJSON());
    } else {
      console.warn(`Skipping ${file} — missing command builder (module.exports.data.toJSON)`);
    }
    if (!hasExecute) {
      console.warn(`Note: ${file} has no execute() export — it won't run at runtime`);
    }
  } catch (err) {
    console.error(`Failed to load ${file}:`, err);
  }
}

//prepare REST instance for deployment
const rest = new REST({version:'10'}).setToken(token);
(async()=>{
    try{
        console.log(`refreshing ${commandList.length} commands...`);
        /* put to refresh all commands
        i don't remember why 'data' is declared here but not used
        have a look when i don't care about stuff breaking */
        const data = await rest.put(
            Routes.applicationCommands(clientId),
            {body: commandList},
        );
        console.log(`successfully reloaded ${commandList.length} commands`);
    } catch (error){
        console.error(error);
    }
})();
