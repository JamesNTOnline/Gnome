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


const { SlashCommandBuilder, SlashCommandSubcommandBuilder } = require('discord.js');

function buildSubCommand(name, desc) { //this should go into a helper file
    let sub_cmd = new SlashCommandSubcommandBuilder()
        .setName(name)
        .setDescription(desc)
    return sub_cmd;
}

let remove_timeouts = buildSubCommand('timeouts', 'Clears all of the currently active timeouts');
let remove_nicknames = buildSubCommand('nicknames', 'Clears all nicknames from server members');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('[PH]')
        .addSubcommand(remove_timeouts)
        .addSubcommand(remove_nicknames),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();

        switch (cmd_name) {
            case 'timeouts':
                try {
                    const members = await interaction.guild.members.fetch();
                    members.forEach(member => {
                        //check permissions else remove timeout
                        member.timeout(null);
                    });
                    interaction.reply('Timeouts cleared!');
                } catch (err) {
                    interaction.deleteReply();
                    interaction.followUp('Something went wrong, check audit log');
                    console.error(err);
                }
                break;
            case 'nicknames':
                interaction.reply('NYI');
                break;
        }
    },
};
