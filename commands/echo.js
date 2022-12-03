const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Repeats a phrase back to you'),
    async execute(interaction){
        await interaction.reply('Placeholder');
    },
};
