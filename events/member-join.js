const { Events } = require('discord.js');

/* Things I can use this for:
- Gatekeep bad users (automatic kick/ban) - prevent people circumventing temporary moderation
- Welcome messages
- Adding roles to old members rejoining
*/

async function welcomeMember(member) {
    return;
    //console.log(`Welcome, ${member.user.tag}!`); //text could be customisable using a command
    //should post to a channel, not the log, this is just an example to refer to later
}


module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {

        await welcomeMember(member);
    },
};
