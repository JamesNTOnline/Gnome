/*
Write new commands which reverse otherwise tedious/time consuming tasks here
For example; to remove a user's nickname usually requires:
- right clicking them
- selecting "change nickname"
- selecting "reset nickname"
- pressing "save"
Doing this individually for all users is time consuming
Instead, it has been automated here by simply iterating through the user list.
This is O(n) in terms of runtime for now, maybe it can be improved - but the key is that it saves moderator time!
*/


const { SlashCommandBuilder } = require('discord.js');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('ph'),
    async execute(interaction){
        await interaction.reply('ph');
    },
};
