/**
 * These commands are intended to execute on groups of messages or groups of users
 * In general they are "clean up" commands which perform administration tasks in bulk
 * For example: /clear timeouts will reverse all of the currently active mutes on server members,
 * which saves a lot of individual clicks
 *
 */
const {PermissionsBitField } = require('discord.js');
const allCommands = require('../utilities/sub-command-builder.js');


/**
 * @todo - extend this with pagination?
 * @todo - make the pinned deletion an option
 * Applies an action to filtered message objects in a channel
 * @param {Interaction} interaction - The interaction object from discord.js
 * @param {Function} messageFilter - A function used to filter messages
 * @param {Function} messageAction - The function to be called for each filtered (included) message
 * @param {number} amount - The maximum number of messages to process (default: 10)
 */
async function actionFilteredMessages(interaction, messageFilter, messageAction, amount = 10) {
    let count = 0; // Counter to track the number of processed messages
    try {
        // need to access this reply later to not delete it
        const reply = await interaction.reply({ content: 'Processing messages...', fetchReply: true });
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        for (const message of messages.values()) {
            if (count >= amount) break;
            if (message.id !== reply.id && messageFilter(message) && !message.pinned) { 
                try {
                    await messageAction(message); // Apply the action to the filtered message
                    count++;
                    await interaction.editReply(`Processed ${count} messages...`);
                } catch (err) {
                    console.error('Error while processing:', err);
                }
            }
        }
        await interaction.editReply(`Finished: Processed ${count} messages!`);
    } catch (err) {
        handleError(interaction, err); 
    }
}



/**
 * Applies a funcion to filtered member objects
 * @param {string} commandName - The name of the command being executed
 * @param {Interaction} interaction - The interaction object from discord.js
 * @param {Function} filterFunction - A function used to filter the guild member list
 * @param {Function} actionFunction - The function to be called for each filtered (included) member
 */
async function actionFilteredMembers(commandName, interaction, filterFunction, actionFunction) {
    try {
        await interaction.reply(`Processing ${commandName}...`);
        const members = await interaction.guild.members.fetch();
        const targetMembers = members.filter(filterFunction);
        const totalCount = targetMembers.size;
        let count = 0;
        for (const member of targetMembers.values()) {
            try {
                // Process members with a member function
                await actionFunction(member);
                count++;
                await interaction.editReply(`Processed ${commandName} for ${count}/${totalCount} members`);
            } catch (err) {
                console.error(`Error during processing ${commandName} for member ${member.user.tag}:`, err);
            }
        }
        await interaction.editReply(`${commandName.charAt(0).toUpperCase() + commandName.slice(1)} cleared.`);
    } catch (err) {
        handleError(interaction, err);
    }
}


/**DUPLICATE EXTRACT TO A MODULE
 * Updates the interaction response to display an error
 * @param {Interaction} interaction - the interaction created by discord.js
 * @param {error} err - the error object created when a command fails
 */
function handleError(interaction, err) {
    interaction.deleteReply();
    interaction.followUp(`Something went wrong:\n${err.message}`);
    console.error(err);
}


module.exports = {
    data: allCommands['clear'].rootCommand,

    async execute(interaction) {
        const cmdName = interaction.options.getSubcommand();
        const botUserId = interaction.client.user.id;
        const memberUserId = interaction.member.user.id;
        const user_perms = interaction.member.permissions;
        let filterCondition;
        if (user_perms.has(PermissionsBitField.Flags.Administrator)) {
            switch (cmdName) {
                /**
                 * discord does not provide a way to directly get the timeout list
                 * idea: look at the properties of the users and filter them before manipulating them
                 */
                case 'timeouts':
                    // An anonymous function to filter members based on timeout status
                    filterCondition = (member) => member.communicationDisabledUntilTimestamp > 0 && member.manageable;
                    actionFilteredMembers(cmdName, interaction, filterCondition, async (member) => {
                        try {
                            await member.timeout(null); //null removes timeout
                        } catch (err) {
                            console.error(`Error removing timeout for member ${member.user.tag}:`, err);
                        }
                    });
                    break;
                case 'nicknames':
                    filterCondition = (member) => member.nickname !== null && member.manageable;
                    actionFilteredMembers(cmdName, interaction, filterCondition, async (member) => {
                        try {
                            await member.setNickname(null); //null removes nickname
                        } catch (err) {
                            console.error(`Error setting nickname to null for member ${member.user.tag}:`, err);
                        }
                    });
                    break;
                case 'bans': //unique behaviour because it operates on the guildbanmanager, not a member object
                    try {
                        await interaction.reply('Starting to clear the ban list...');
                        const bans = await interaction.guild.bans.fetch();
                        const banCount = bans.size;
                        if (banCount === 0) {
                            await interaction.editReply('No members are banned in this server.');
                            return;
                        }
                        let count = 0;
                        for (const ban of bans.values()) {
                            try {
                                await interaction.guild.members.unban(ban.user);
                                count++;
                                await interaction.editReply(`Unbanned ${ban.user}: ${count}/${banCount} completed`);
                            } catch (err) {
                                console.error('Error while unbanning:', err);
                            }
                        }
                        await interaction.followUp('Finished!');
                    } catch (err) {
                        console.error(err);
                        await interaction.deleteReply();
                        await interaction.followUp('Something went wrong, check audit log');
                    }
                    break;
                case 'role':
                    const role = interaction.options.getRole('role');
                    filterCondition = (member) => member.roles.cache.has(role.id);
                    actionFilteredMembers(cmdName, interaction, filterCondition, async (member) => {
                        try {
                            await member.roles.remove(role);
                        } catch (err) {
                            console.error(`Error removing role ${role.name} from member ${member.user.tag}:`, err);
                        }
                    });
                    break;
                case 'reactions':
                    filterCondition = (msg) => msg.reactions.cache.size > 0; 
                    actionFilteredMessages(interaction, filterCondition, async (msg) => msg.reactions.removeAll());
                    break;
                case 'bot':
                    filterCondition = (msg) => msg.author.id === botUserId; 
                    actionFilteredMessages(interaction, filterCondition, async (msg) => msg.delete());
                    break;
                case 'user': //we need to reply first. causing problems.
                    const target = interaction.options.getUser('target');
                    filterCondition = (msg) => msg.author.id === target.id
                    actionFilteredMessages(interaction, filterCondition, async (msg) => msg.delete());
                    break;
                case 'all':
                    const amount = interaction.options.getNumber('amount') ?? 5;
                    filterCondition = (msg) => msg.author.id !== botUserId && msg.author.id !== memberUserId;
                    actionFilteredMessages(interaction, filterCondition, async (msg) => msg.delete(), amount);
                    break;
            }
        }
    },
};