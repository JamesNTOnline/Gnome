/**
 * @todo - setup bot roles
 * @todo - setup bot channel
 * @todo - display timeouts
 * @todo - 
*/

const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Sets up the bot for use in this server'),
    async execute(interaction){
        await interaction.reply('ph');
    },
};