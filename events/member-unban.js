const { Events } = require('discord.js');

/*
Things to do when a user is unbanned
- Reban if they are not supposed to be unbanned
 - Permaban function updates the blacklist
*/


/**
 * Automatically re-applies a ban to a user who should not be unbanned, in the event they are
 * @param {GuildBan} ban - The ban entry for a server user
 */
async function reban(ban) {
    let targetUserIds = []; //NYI a list of blacklisted users pulled from file
    if (targetUserIds.includes(ban.user.id)) {
        try {
            await ban.guild.members.ban(ban.user.id, { reason: 'user is not allowed in this server, do not unban' });
            console.log(`User ${ban.user.tag} has been banned again.`);
        } catch (error) {
            console.error(`Failed to re-ban user ${ban.user.tag}: ${error}`);
        }
    }
}


module.exports = {
    name: Events.GuildBanRemove,
    async execute(ban) {
        await reban(ban);
    }
};
