/*
As a moderator I want to be able to ban a user from the server
and provide a reason which is sent to their personal message inbox.
I should also be able to not type in a reason and the command should still work.

The target should be able to appeal the ban using some command or response.
This appeal is a separate feature
*/

/*
STEPS:
  a user's @ (mention tag) is passed to the function
  a reason is passed to the function
  retrieve the user object - it shouldnt matter if the member left the server already
  build an embed report sent to the channel
  OPTIONAL: specify number of days?
*/

const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Purge a number of messages from this channel'),
    async execute(interaction){
        await interaction.reply('Placeholder')
    },
};
