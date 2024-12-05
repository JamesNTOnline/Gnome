const { Events } = require('discord.js');
//todo refactor


module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        const isExecutable = interaction.isChatInputCommand(); //check which type of interaction it is
        const isAutocomplete = interaction.isAutocomplete();
        if (!isExecutable && !isAutocomplete) return; //stop if neither

        const command = interaction.client.commands.get(interaction.commandName);
        console.log('Command Name:', interaction.commandName);
        if (!command) { //stop if this is not a valid command
            console.error(`No command matching ${interaction.commandName} found.`);
            return;
        }
        try {
            if (isExecutable) {
                await command.execute(interaction);
            } else if (isAutocomplete) {
                await command.autocomplete(interaction);
            }
        } catch (error) {
            console.error(error);
            console.error(`Error while handling ${isExecutable ? 'command' : 'auto-completion'}.`);
        }
    }
};
