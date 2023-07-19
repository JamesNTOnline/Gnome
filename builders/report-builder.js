/** function somewhere else
 * Builds the chat embed message (basically, a nice way to display a mod action)
 * @param {*} interaction 
 * @param {String} cmd_name - the name of the subcommand
 * @param {User} target - a user object representing a guild member
 * @param {String} reason - the reason for the action
 * @returns an embeddable message, this needs to be used in a reply statement to appear in chat
 */
/* function buildEmbed(interaction, cmd_name, target, reason) {
    const embed = new EmbedBuilder();
    const name_formatted = cmd_name.charAt(0).toUpperCase() + cmd_name.slice(1);
    if (target) {
        embed.setTitle('~ ' + name_formatted + ' Report ~')
            .setColor("#e56b00")
            .addFields(
                { name: 'Mod', value: `<@${interaction.member.id}>`, inline: true },
                { name: 'User', value: `<@${target.id}>`, inline: true },
                { name: 'ID', value: `${target.id}`, inline: true },
                { name: 'Reason', value: reason }
            )
            .setThumbnail(`${target.displayAvatarURL({ dynamic: true })}`)
            .setTimestamp(interaction.createdTimestamp);
    }
    return embed;
} */