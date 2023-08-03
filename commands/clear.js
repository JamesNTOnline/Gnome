/**
 * @todo - command to list timeouts
 * @todo - command to remove a role from users
 * @todo - a more robust permission check
 * @todo - need to make sure pinned messages don't get changed
 * @todo - don't try to alter non-moderatable members
*/
const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const SubOptionBuilder = require('../builders/sub-option-builder');


let timeouts = new SubOptionBuilder('timeouts').getSubCmd();
let nicknames = new SubOptionBuilder('nicknames').getSubCmd();
let bans = new SubOptionBuilder('bans').getSubCmd();
let reactions = new SubOptionBuilder('reactions').getSubCmd();
let bot = new SubOptionBuilder('bot').getSubCmd();
let role = new SubOptionBuilder('role').getSubCmd()
    .addRoleOption(option =>
        option.setName('role')
            .setDescription('The role to remove from all members')
            .setRequired(true));

let purge = new SubOptionBuilder('purge')
    .addTargetUserOption()
    .getSubCmd();

let messages = new SubOptionBuilder('messages').getSubCmd()
    .addNumberOption(option =>
        option.setName('amount')
            .setDescription('The number of messages to delete')
            .setMaxValue(50)
            .setMinValue(1)
            .setRequired(false));


module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Commands which can tidy up a server quickly')
        .addSubcommand(timeouts)
        .addSubcommand(nicknames)
        .addSubcommand(bans)
        .addSubcommand(role)
        .addSubcommand(reactions)
        .addSubcommand(bot)
        .addSubcommand(purge)
        .addSubcommand(messages),

    async execute(interaction) {
        const cmdName = interaction.options.getSubcommand();
        const botUserId = interaction.client.user.id;
        const memberUserId = interaction.member.user.id;
        const user_perms = interaction.member.permissions;
        if (user_perms.has(PermissionsBitField.Flags.Administrator)) {
            switch (cmdName) {
                /**
                 * discord does not provide a way to directly get the timeout list
                 * idea: look at the properties of the users and filter them before manipulating them
                 */
                case 'timeouts':
                    //anon function to filter
                    const timeoutFilter = (member) => member.communicationDisabledUntilTimestamp > 0 && member.manageable;
                    processMembers(cmdName, interaction, timeoutFilter, async (member) => {
                        // Discord API function to apply a null timeout (removes timeout)
                        await member.timeout(null);
                    });
                    break;
                case 'nicknames':
                    const nickFilter = (member) => member.nickname !== null && member.manageable;
                    processMembers(cmdName, interaction, nickFilter, async (member) => {
                        // null removes nickname
                        await member.setNickname(null);
                    });
                    break;
                case 'bans': //processMembers could handle this.
                    // pass in the list to the function instead
                    await interaction.reply('Starting to clear the ban list...')
                        .then(async () => {
                            const bans = await interaction.guild.bans.fetch();
                            const banCount = bans.size;
                            if (banCount === 0) {
                                await interaction.editReply('No members are banned in this server.');
                                return;
                            }
                            let count = 0;
                            for (const ban of bans.values()) {
                                await interaction.guild.members.unban(ban.user)
                                    .then(async () => {
                                        count++;
                                        await interaction.editReply(`Unbanned ${ban.user}: ${count}/${banCount} completed`);
                                    })
                                    .catch((err) => {
                                        console.error('Error while unbanning:', err);
                                    });
                            }
                            await interaction.followUp(`Finished!`);
                        })
                        .catch(err => {
                            console.error(err);
                            interaction.deleteReply();
                            interaction.followUp('Something went wrong, check audit log');
                        });
                    break;
                case 'role':
                    const role = interaction.options.getRole('role');
                    const roleFilter = (member) => member.roles.cache.has(role.id);
                    processMembers(cmdName, interaction, roleFilter, async (member) => {
                        try {
                            // Discord API function to remove the role from the member
                            await member.roles.remove(role);
                        } catch (err) {
                            console.error(`Error removing role ${role.name} from member ${member.user.tag}:`, err);
                        }
                    });
                    break;
                case 'reactions':
                    const reactMsgFilter = (msg) => msg.reactions.cache.size > 0; //this code is kinda duplicate
                    filterMessages(interaction, reactMsgFilter, async (msg) => msg.reactions.removeAll());
                    break;
                case 'bot':
                    const botMsgFilter = (msg) => msg.author.id === botUserId; //this code is kinda duplicate
                    filterMessages(interaction, botMsgFilter, async (msg) => msg.delete());
                    break;
                case 'purge': //we need to reply first. causing problems.
                    const target = interaction.options.getUser('target');
                    const purgeMsgFilter = (msg) => msg.author.id === target.id
                    filterMessages(interaction, purgeMsgFilter, async (msg) => msg.delete());
                    break;
                case 'messages':
                    const userMsgFilter = (msg) => msg.author.id !== botUserId && msg.author.id !== memberUserId;
                    const amount = interaction.options.getNumber('amount') ?? 5;
                    filterMessages(interaction, userMsgFilter, async (msg) => msg.delete(), amount);
                    break;


            }
        }
    },
};



async function filterMessages(interaction, conditionCallback, processFunction, amount = 10) {
    let count = 0;
    try {
        const reply = await interaction.reply({content: 'Processing messages...', fetchReply: true});
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        //const fetchedReply = await interaction.fetchReply();
        for (const msg of messages.values()) {
            if (count >= amount) break;
            if (msg.id !== reply.id && conditionCallback(msg)) {
                try {
                    await processFunction(msg);
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
 * 
 * @param {string} cmdName - The name of the command
 * @param {Interaction} interaction - The interaction object from discord.js
 * @param {Function} conditionCallback - A function which filters the guildmember list
 * @param {Function} functionToCall - The function to be called for each filtered (included) member
 */
async function processMembers(cmdName, interaction, conditionCallback, functionToCall) {
    try {
        await interaction.reply(`Processing ${cmdName}...`);
        const members = await interaction.guild.members.fetch();
        const targetMembers = members.filter(conditionCallback);
        const totalCount = targetMembers.size;
        let count = 0;
        for (const member of targetMembers.values()) {
            try {
                // process members with a member function
                await functionToCall(member);
                count++;
                await interaction.editReply(`Processed ${cmdName} for ${count}/${totalCount} members`);
            } catch (err) {
                console.error(`Error during processing ${cmdName} for member ${member.user.tag}:`, err);
            }
        }
        await interaction.editReply(`${cmdName.charAt(0).toUpperCase() + cmdName.slice(1)} cleared.`);
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