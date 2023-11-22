/**
 * @todo - make sure this all uses try/catch not then/catch
 * @todo - 
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const SubOptionBuilder = require('../utilities/sub-option-builder.js');
const buildSubcommandsFromJson = require('../utilities/sub-command-builder.js');


// Example usage
const modSubcommands = buildSubcommandsFromJson('mod');

// Build the root command
const modCommandBuilder = new SlashCommandBuilder()
    .setName('mod')
    .setDescription('Commands to remove unruly users')
    .setDMPermission(false) // make these commands unavailable in direct messages;

// Add subcommands to the root command
modSubcommands.forEach(subcommand => {
    modCommandBuilder.addSubcommand(subcommand);
});

/*
exporting a slashcommandbuilder object. 
this object needs to have a name and description (required by command.toJSON)
*/
module.exports = {
    data: modCommandBuilder,

    /*Each subcommand requires a different resolution for their options
    interaction.options methods return different things about what happened in the command (i.e. target)*/
    async execute(interaction) {
        const cmdName = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const target = interaction.options.getUser('target') ?? filterTargets(interaction.options.getString('targets')); //the target(s) for the action member ?? string
        const deletePeriod = interaction.options.getInteger('delete') ?? 0;
        let success = false;
        if (!target) { //no target, don't do anything (should not happen anyway)
            console.log('mod command attempted without target');
            interaction.reply('Target could not be found, did you enter it correctly?');
            return;
        }

        if (checkPermissions(interaction, cmdName, target)) {
            switch (cmdName) { // processing the options
                /**
                 * Kicking can fail if a user leaves the server before the command is sent so check the ID is valid up front
                 */
                case 'kick':
                    if (!interaction.guild.members.cache.get(target.id)) { //move this - can also use fetch
                        console.log(`kick attempted on invalid ID: ${target.id}`);
                        interaction.reply('Invalid ID - user may not be in this server');
                        break;
                    }
                    //tell the member what happened (wont be received if bot is blocked. no way around this!)
                    await target.send(`You were kicked from ${interaction.guild.name} for: ${reason}`);
                    await interaction.guild.members.kick(target, reason)
                        .then(() => {
                            interaction.reply(`**Kicked:** <@${target.id}>`);
                        })
                        .catch(err => {
                            handleError(interaction, target, err);
                        });
                    break;
                /**
                 * Masskick is intended to allow removing multiple users in a single stroke
                 * Discord's API rate limits requests, so the command must respond and then updates its response afterwards
                 * Command can tolerate partial faultiness, so feedback to the caller what was un/successful!
                 * @todo
                 */
                case 'masskick':
                    await interaction.reply('Trying to kick members...');
                    let response = `**Kicked: **`;
                    let invalid = `\n**Invalid: **`;
                    let invalidCount = 0;
                    try {
                        const promises = target.map(async (id) => {
                            const member = interaction.guild.members.cache.get(id);
                            if (member && member.manageable) { //member retrieved, send a message and try to kick them
                                await member.send(`You were kicked from ${interaction.guild.name} for: ${reason}`);
                                await interaction.guild.members.kick(member, reason);
                                response += `<@${id}> `; 
                            } else {
                                invalid += `${id}, `;
                                invalidCount++;
                            }
                        });
                        await Promise.all(promises); //wait for all of the promises to resolve
                        if (invalidCount > 0) {
                            invalid = invalid.slice(0, -2); // Removes the last comma and space
                            response += invalid;
                        }
                        await interaction.editReply(response);
                    } catch (err) {
                        handleError(interaction, target, err);
                    }
                    break;
                /**
                 * Ban blocks the user from rejoining (and deletes some of their last posts) until reversed
                 * @todo implement tempban
                 * @todo testing for softban
                 */
                case 'ban':
                    success = tryBanUser(interaction, target, cmdName, reason, deletePeriod);
                    break;
                /**
                 * Tempban serves as a medium between a ban and a kick - a ban which will reverse itself after time
                 * @todo implement database that can store these temp bans
                 */
                case 'tempban': //Tar, Dur: Hist, Reason
                    await interaction.reply({content: '[NYI]', ephemeral:true});
                    //ban the target
                    //update a database of temp-banned users
                    break;
                /**
                 * Softban is a ban followed by an immediate reversal, which serves to quickly purge messages
                 */
                case 'softban':
                    try {
                        success = tryBanUser(interaction, target, cmdName, reason, 86400);
                        if (success) {
                            await interaction.guild.members.unban(target);
                        }
                    } catch (err) {
                        interaction.followUp({ content: `Something went wrong; user may still be banned`, ephemeral: true });
                        console.error(err);
                    }
                    break;
                /**
                 * Reverses a ban for a specific user
                 */
                case 'unban':
                    try {
                        await interaction.guild.bans.fetch(target);
                        await interaction.guild.members.unban(target);
                        interaction.reply(`Unbanned ${target}: ${reason}`);
                    } catch (err) {
                            handleError(interaction, target, err);
                    }
                    break;
                      
                /**
                 * Removes a user's ban and bans them with a new reason
                 * @todo
                 */
                case 'editban':
                    try {
                        await interaction.guild.bans.fetch(target);
                        await interaction.guild.members.unban(target);
                        await interaction.guild.members.ban(target, { reason: reason });
                        interaction.reply(`Updated ${target} ban reason: ${reason}`);
                    } catch (err) {
                            handleError(interaction, target, err);
                    }
                    break;
            }
        }
    },
};


/**
 * Removes any non-numerical characters (e.g. formatting, spaces) from a string of userIDs
 * @param {string} targetString A string object of space-separated IDs to be processed
 * @returns {Array} A collection of valid 18-digit IDs found in the string
 */
function filterTargets(targetString) {
    const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
    let targetIds = targetString.match(re); //returns an array of matched identifiers
    targetIds = targetIds.filter(id => id.length === 18); //a valid ID is 18 characters
    console.log(targetIds);
    return targetIds;
}


/**
 * Checks for permissions and that the commands aren't being called on either the client or the caller
 * @todo this could be more even more specific; rn if a masskick is performed and one name is the mod, it will fail.
 * @todo match the command to the permission somehow
 * @param {Interaction} interaction - the interaction event from discord.js
 * @param {string} cmdName - the name of the command
 * @param {User | Array} target - a User object or an array of IDs
 * @returns {boolean} whether the command is allowed to be carried out
 */
function checkPermissions(interaction, cmdName, target) {
    const userPerms = interaction.member.permissions;
    const targetIds = Array.isArray(target) ? target : [target.id];
    const clientUserId = interaction.client.user.id;
    const memberUserId = interaction.member.id;
    //check the user perms
    if ((cmdName.includes('kick') && !userPerms.has(PermissionsBitField.Flags.KickMembers))
        || (cmdName.includes('ban') && !userPerms.has(PermissionsBitField.Flags.BanMembers))) {
        console.log(`${cmdName} attempt without permission: ${userPerms}`);
        interaction.reply({ content: 'You don\'t have permission for that!', ephemeral: true });
    }
    else if (targetIds.includes(clientUserId)){ //check the client isn't moderating itself
        console.log('bot tried to moderate itself');
        interaction.reply({ content: "I can't Gnome myself!", ephemeral: true });
    } else if (targetIds.includes(memberUserId)){ //check the user isn't moderating itself
        console.log('user tried to moderate themselves');
        interaction.reply({ content: "I can't help you Gnome yourself!", ephemeral: true });
    } else {
        return true; // Only return true if permission checks pass
    }
    return false; // Return false if any of the permission checks fail
}



async function tryBanUser(interaction, target, cmdName, reason, deletePeriod) {
    try {
        const banList = await getBanList(interaction); //retrieve banned user collection
        if (banList) { 
            if (await isUserBanned(banList, target, interaction)) {
                return false; // user can't be banned
            }
            try {
                await sendDirectMessage(interaction, target, cmdName, reason);
            } catch (dmError) {
                console.log(`DM could not be sent. Error: ${dmError.message}`);
            }
            await interaction.guild.members.ban(target, { deleteMessageSeconds: deletePeriod, reason: reason });
            await interaction.reply(`**${cmdName.charAt(0).toUpperCase() + cmdName.slice(1)}ned** ${target}: ${reason}`);
            return true; // successful ban
        } else {
            await interaction.reply({ content: 'Something went wrong while fetching the ban list - try again in a moment.', ephemeral: true });
            return false; //failed ban
        }
    }
    catch (err) {
        handleError(interaction, err);
        return false;
    }
}



/**
 * Retrieves the ban list for the guild from the Discord API.
 * This operation may fail due to rate limiting, server issues, or some other issue
 * @param {Interaction} interaction - An interaction object from Discord.js
 * @returns {Collection|null} A collection of banned users, or null if there's an error
 */
async function getBanList(interaction) {
    try {
        const bannedUsers = await interaction.guild.bans.fetch();
        return bannedUsers;
    } catch (error) {
        console.error(`ERROR fetching ban list: ${error.message}`);
        return null; //is this bad practice in js?
    }
}


/**
 * Checks if a target user is banned in the guild
 * @param {Collection} banList - A collection of banned users
 * @param {User} target - The target user for the command
 * @param {Interaction} interaction - An interaction object from Discord.js
 * @returns {boolean} True if the target user is banned, false otherwise
 */
async function isUserBanned(banList, target, interaction) {
    if (banList.get(target.id)) {
        console.log('BAN was called on a banned user');
        await interaction.reply({ content: `${target} is already banned.`, ephemeral: true });
        return true; // target already banned
    }
    return false; // target not currently banned
}


/**
 * Sends output to the target user if they are a member of the guild
 * @param {Interaction} interaction - An interaction object from Discord.js
 * @param {User} target - The target user to send a message to
 * @param {string} cmd_name - The name of the command
 * @param {string} reason - The reason for the action (optional)
 */
async function sendDirectMessage(interaction, target, cmd_name, reason) {
    if (interaction.guild.members.cache.has(target.id)) { // this shouldn't be cache.
        await target.send(buildMessage(cmd_name, interaction, reason));
    }
}

/**
 * Creates a formatted output string explaining the action taken; maybe make this an embed?
 * @param {string} cmd_name - The name of the command
 * @param {Interaction} interaction - The interaction object created by discord.js
 * @param {string} reason - The reaction the command was used
 * @returns {string} A summary of what the command did and why
 */
function buildMessage(cmd_name, interaction, reason) {
    let actionMessage = cmd_name.includes('kick') ? 'kicked' : cmd_name.includes('ban') ? cmd_name + 'ned' : '';
    return `You were ${actionMessage} from ${interaction.guild.name}:\n${reason}`;
}



/** DUPLICATE EXTRACT TO A MODULE
 * Updates the interaction response to display an error
 * @param {Interaction} interaction - the interaction created by discord.js
 * @param {error} err - the error object created when a command fails
 */
function handleError(interaction, target, err) {
    if (err.code === 10026) { // discord's api error for an unknown ban
        interaction.reply({ content: `${target} is not banned.`, ephemeral: true });
    } else {
    interaction.deleteReply();
    interaction.followUp({ content: `Something went wrong:\n${err.message}`, ephemeral: true});
    console.error(err);
    }
}
