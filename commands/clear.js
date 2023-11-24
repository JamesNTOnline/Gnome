/**
 * These commands are intended to execute on groups of messages or groups of users
 * In general they are "clean up" commands which perform administration tasks in bulk
 * For example: /clear timeouts will reverse all of the currently active mutes on server members,
 * which saves a lot of individual clicks
 *
 */
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');
const buildSubcommandsFromJson = require('../utilities/sub-command-builder.js');


// Example usage
const clearSubcommands = buildSubcommandsFromJson('clear');
// Build the root command
const clearCommandBuilder = new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Commands which can tidy up a server quickly')
    .setDMPermission(false) // make these commands unavailable in direct messages;

// Add subcommands to the root command
clearSubcommands.forEach(subcommand => {
    clearCommandBuilder.addSubcommand(subcommand);
});


// // these commands modify groups of users
// let timeouts = new SubOptionBuilder('timeouts').getSubCmd();
// let nicknames = new SubOptionBuilder('nicknames').getSubCmd();
// let bans = new SubOptionBuilder('bans').getSubCmd();
// let role = new SubOptionBuilder('role').getSubCmd()
//     .addRoleOption(option =>
//         option.setName('role')
//             .setDescription('The role to remove from all members')
//             .setRequired(true));

// // these commands modify messages
// let reactions = new SubOptionBuilder('reactions').getSubCmd();
// let bot = new SubOptionBuilder('bot').getSubCmd();
// let purge = new SubOptionBuilder('user')
//     .addTargetUserOption()
//     .getSubCmd();
// let all = new SubOptionBuilder('all').getSubCmd()
//     .addNumberOption(option =>
//         option.setName('amount')
//             .setDescription('The number of messages to delete')
//             .setMaxValue(50)
//             .setMinValue(1)
//             .setRequired(false));


module.exports = {
    data: clearCommandBuilder,
    // data: new SlashCommandBuilder()
    //     .setName('clear')
    //     .setDescription('Commands which can tidy up a server quickly')
    //     .addSubcommand(timeouts) // undo all of the active timeouts
    //     .addSubcommand(nicknames) // undo all of the active nicknames
    //     .addSubcommand(bans) // undo all of the active bans
    //     .addSubcommand(role) // remove a specified role from every member who has it currently
    //     .addSubcommand(reactions) // remove all reactions from recent posts
    //     .addSubcommand(bot) // remove messages left by the bot itself
    //     .addSubcommand(purge) // remove recent messages sent by a particular user
    //     .addSubcommand(all), // remove recent messages from all users

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
                            await member.setNickname(null); // null removes nickname
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



/**
 * @todo - extend this with pagination?
 * @todo - make the pinned deletion an option
 * Applies an action to filtered message objects in a channel.
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


/** DUPLICATE EXTRACT TO A MODULE
 * Updates the interaction response to display an error
 * @param {Interaction} interaction - the interaction created by discord.js
 * @param {error} err - the error object created when a command fails
 */
function handleError(interaction, err) {
    interaction.deleteReply();
    interaction.followUp(`Something went wrong:\n${err.message}`);
    console.error(err);
}