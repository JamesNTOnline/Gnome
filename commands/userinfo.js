const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Displays information about the user'),
    async execute(interaction){
        await interaction.reply('fill this in later')
    },
};
