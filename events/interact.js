const {Events} = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction){
        if(!interaction.isChatInputCommand()) return;
        //match the command to the client's list of commands
        const command = interaction.client.commands.get(interaction.commandName);
        if(!command){ //no match, error
            console.error(`No command matching ${interaction.commandName} found!`);
        }
        try { //try to execute the command using execute method
            await command.execute(interaction);
        } catch (error){ //catch any errors caused during runtime and report
            console.error(error);
            console.error('Error while executing command');
        }
    }
};
