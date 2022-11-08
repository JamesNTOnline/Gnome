const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Displays information about the server'),
    async execute(interaction){
        await interaction.reply(`This server is ${interaction.guild.name}`);
    },
};
