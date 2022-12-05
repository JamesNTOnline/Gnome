/*
Write new commands which output information pertaining to some entity (server, channel, user) here
Example commands might include /info user which returns the name and join date of a mentioned person
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
