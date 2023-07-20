/**
 * @todo - command which removes all nicknames
 * @todo - command to list timeouts
 * @todo - command to remove all timeouts
 * @todo - command to remove a role from users
 * @todo - command to purge messages
 * @todo - command to remove emojis from messages
 * 
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
let remove_bans = buildSubCommand('bans', 'Clears the ban list');

//https://discordjs.guide/slash-commands/response-methods.html#ephemeral-responses

module.exports = { //exports data in Node.js so it can be require()d in other files
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('[PH]')
        .addSubcommand(remove_timeouts)
        .addSubcommand(remove_nicknames)
        .addSubcommand(remove_bans),

    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();

        switch (cmd_name) {
            /**
             * @todo this goes through all of the members looking for timeouts right now.
             *       discord does not provide a way to directly get the timeout list
             *       idea: look at the audit log? what do timeout events look like?
             *             member updates -> can i just fetch these and try to get the guildmember as a target?
             */
            case 'timeouts':
                try {
                    let members = await interaction.guild.members.fetch();
                    let count = 0;
                        // Filter the members with communicationDisabledUntil value above 0
                    members = members.filter(member => member.communicationDisabledUntilTimestamp > 0);
                    await interaction.reply(`Clearing timeouts from ${count}/${members.size} members...`);
                    for (const member of members.values()) {
                        // Check permissions else remove timeout
                        try {
                            await member.timeout(null);
                            count++;
                            await interaction.editReply(`Cleared timeouts from ${count}/${members.size} members...`);
                        } catch (err) {
                            // Handle any errors that occur during the timeout process for a member
                            console.error(`Error clearing timeout for member ${member.user.tag}:`, err);
                        }
                    }
                    await interaction.followUp('Timeouts cleared!');
                } catch (err) {
                    await interaction.deleteReply();
                    await interaction.followUp('Something went wrong, check audit log');
                    console.error(err);
                }
                break;
            case 'nicknames':
                interaction.reply('NYI');
                break;
            case 'bans':
                const blueSquareEmoji = ':blue_square:';
                await interaction.reply('Starting to clear the ban list\n[                              ]')
                    .then(async () => { //allows using await to do sequential async functions
                        const bans = await interaction.guild.bans.fetch();
                        const banCount = bans.size;
                        if (banCount === 0) {
                            return interaction.editReply('No members are banned in this server.');
                        }
                        let counter = 0;
                        for (const ban of bans.values()) {
                            await interaction.guild.members.unban(ban.user);
                            counter++;
                            const interval = Math.floor(bans.size / 6); // Calculate the interval for replacing spaces with a blue square
                            if (interval > 0 && counter % interval === 0) {
                                const blueSquareCount = Math.floor(counter / interval);
                                const spaceCount = 6 - (blueSquareCount % 6);
                                const modifiedMessage = `[${blueSquareEmoji.repeat(blueSquareCount)}${'      '.repeat(spaceCount)}]`;
                                await interaction.editReply(modifiedMessage);
                            }
                        }
                    })
                    .catch(err => {
                        console.error(err);
                        interaction.editReply('An error occurred while processing the command.');
                    });
                break;


        }
    },
};
