/**
 * @todo - display avatar
 * @todo - display profile
*/


const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('ph'),
    async execute(interaction){
        await interaction.reply('ph');
    },
};
