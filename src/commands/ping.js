const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies to let you know the bot is active'),
    async execute(interaction){
        await interaction.reply('Tea\'s a gimp');
    },
};
