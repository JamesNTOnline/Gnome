const { Events } = require('discord.js');

/* Things I can use this for:
- keep track of popular reactions
- user reaction score (post quality measure)
*/

async function updateUserScore(reaction) {
    return;
    //look at who authored the message the reaction was applied to
    //look up the score of the reaction, e.g. "laugh" is positive, "angry" is negative
    //update the poster's score
}


module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
            await updateUserScore(reaction);
    },
};
