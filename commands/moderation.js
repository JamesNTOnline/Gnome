/**
 * @todo nothing!
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const SubOptionBuilder = require('../builders/sub-option-builder.js');

/* commands are more or less "modular" and can have any types of options added. A finished cmd is retrieved using getSubCmd()
ALL *REQUIRED* OPTIONS *MUST* COME BEFORE OPTIONALS */
let kick = new SubOptionBuilder('kick').getSubCmd();
//build ban cmd - add a delete option and then get the command
let banbuilder = new SubOptionBuilder('ban');
banbuilder.addDeleteOption();
let ban = banbuilder.getSubCmd(); //look at why i need to do this
let unban = new SubOptionBuilder('unban').getSubCmd();
let softban = new SubOptionBuilder('softban').getSubCmd();
let masskick = new SubOptionBuilder('masskick').getSubCmd();
let tempban = new SubOptionBuilder('tempban').getSubCmd();
let editban = new SubOptionBuilder('editban').getSubCmd();

/*
exporting a slashcommandbuilder object. 
this object needs to have a name and description (required by command.toJSON)
*/
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Commands to remove unruly users')
        .setDMPermission(false) //make these commands unavailable in direct messages
        .addSubcommand(kick) //start adding subcommands to the root command
        .addSubcommand(masskick)
        .addSubcommand(ban) //bans
        .addSubcommand(tempban)
        .addSubcommand(softban)
        .addSubcommand(unban) //updating bans
        .addSubcommand(editban),

    /*Each subcommand requires a different resolution for their options
    interaction.options methods return different things about what happened in the command (i.e. target)*/
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const target = interaction.options.getUser('target') ?? filterTargets(interaction.options.getString('targets')); //the target(s) for the action member ?? string
        const delete_days = interaction.options.getInteger('delete') ?? 0;

        if (!target) { //no target, don't do anything (should not happen anyway)
            interaction.reply('Target could not be found, did you enter it correctly?');
            return;
        }

        if (checkPermissions(interaction, cmd_name, target)) {
            switch (cmd_name) { // processing the options
                /**
                 * Kicking a user removes them from the server without preventing them rejoining.
                 * The kick may fail still if the user leaves the server or the ID seems valid but isn't.
                 * @todo
                 */
                case 'kick':
                    if (!interaction.guild.members.cache.get(target.id)) { //move this - can also use fetch
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
                            handleError(interaction, err);
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
                        handleError(interaction, err);
                    }
                    break;
                /**
                 * Ban blocks the user from rejoining (and deletes some of their last posts) until reversed
                 * @todo
                 */
                case 'ban':
                    // Check if target is already banned and skip the rest of the case if true
                    if (await checkIfBanned(interaction, target)) { //dont remove await, it's required or the command hangs here
                        break;
                    }
                    await attemptMessageTarget(interaction, target, cmd_name, reason)
                    // User is not already banned - ban them and post in the server
                    await interaction.guild.members.ban(target, { deleteMessageSeconds: delete_days, reason: reason })
                        .then(() => {
                            interaction.reply(`**Banned** ${target}: ${reason}`);
                        })
                        .catch(err => {
                            handleError(interaction, err);
                        });
                    break;
                /**
                 * Tempban serves as a medium between a ban and a kick - a ban which will reverse itself after time
                 * @todo NYI
                 */
                case 'tempban': //Tar, Dur: Hist, Reason
                    await interaction.reply('[NYI]');
                    //ban the target
                    //update a database of temp-banned users
                    break;
                /**
                 * Softban is a ban followed by an immediate reversal, which serves to quickly purge messages
                 * @todo: could make the delete_time variable. for now it is max
                 */
                case 'softban': 
                    if (await checkIfBanned(interaction, target)) { //dont remove await, ignore the warning
                        break;
                    }
                    await attemptMessageTarget(interaction, target, cmd_name, reason)
                    await interaction.guild.members.ban(target, { deleteMessageSeconds: 86400, reason: reason })
                        .then(() => {
                            interaction.reply(`**Purged:** <@${target.id}>`);
                            interaction.guild.members.unban(target);
                        })
                        .catch(err => { //can probably move this
                            handleError(interaction, err);
                        });
                    break;
                /**
                 * Reverses a ban for a specific user
                 * @todo
                 */
                case 'unban':
                    await interaction.guild.bans.fetch(target)
                        .then(async () => {
                            await interaction.guild.members.unban(target)
                                .then(() => {
                                    interaction.reply(`Unbanned ${target}: ${reason}`);
                                })
                                .catch((err) => {
                                    console.error('Error while unbanning:', err);
                                    handleError(interaction, err);
                                });
                        })
                        .catch(() => {
                            interaction.reply({ content: `${target} is not banned.`, ephemeral: true });
                        });
                    break;
                /**
                 * Removes a user's ban and bans them with a new reason
                 * @todo
                 */
                case 'editban': 
                    await interaction.guild.bans.fetch(target)
                    .then(async () => {
                        await interaction.guild.members.unban(target)
                        await interaction.guild.members.ban(target, {reason: reason })
                            .then(() => {
                                interaction.reply(`Updated ${target} ban reason: ${reason}`);
                            })
                            .catch((err) => {
                                console.error('Error while editing:', err);
                                handleError(interaction, err);
                            });
                    })
                    .catch(() => {
                        interaction.reply({ content: `${target} is not banned.`, ephemeral: true });
                    });
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
    let target_ids = targetString.match(re); //returns an array of matched identifiers
    target_ids = target_ids.filter(id => id.length === 18); //a valid ID is 18 characters
    console.log(target_ids);
    return target_ids;
}


/**
 * Checks for permissions and that the commands aren't being called on either the client or the caller
 * @todo this could be more even more specific; rn if a masskick is performed and one name is the mod, it will fail.
 * @param {Interaction} interaction - the interaction event from discord.js
 * @param {string} cmd_name - the name of the command
 * @param {User | Array} target - a User object or an array of IDs
 * @returns {boolean} whether the command is allowed to be carried out
 */
function checkPermissions(interaction, cmd_name, target) {
    const user_perms = interaction.member.permissions;
    const targetIds = Array.isArray(target) ? target : [target.id];
    const clientUserId = interaction.client.user.id;
    const memberUserId = interaction.member.id;
    //check the user perms
    if ((cmd_name.includes('kick') && !user_perms.has(PermissionsBitField.Flags.KickMembers))
        || (cmd_name.includes('ban') && !user_perms.has(PermissionsBitField.Flags.BanMembers))) {
        interaction.reply({ content: 'You don\'t have permission for that!', ephemeral: true });
    }
    //check the client isn't moderating itself
    else if (targetIds.includes(clientUserId)) {
        interaction.reply({ content: "I can't Gnome myself!", ephemeral: true });
    //check the user isn't moderating itself
    } else if (targetIds.includes(memberUserId)) {
        interaction.reply({ content: "I can't help you Gnome yourself!", ephemeral: true });
    } else {
        return true; // Only return true if permission checks pass
    }
    return false; // Return false if any of the permission checks fail
}


/**
 * Checks if a target user is already banned in the guild
 * @param {Interaction} interaction - An interaction object from Discord.js
 * @param {User} target - The target user the command is being used on
 * @returns {boolean} True if the target user is banned, false otherwise
 */
async function checkIfBanned(interaction, target) {
    const bannedUsers = await interaction.guild.bans.fetch();
    if (bannedUsers.get(target.id)) {
        interaction.reply({ content: `${target} is already banned.`, ephemeral: true });
        return true; // Target is already banned
    }
    return false; // Target is not banned
}


/**
 * Sends output to the target user if they are a member of the guild
 * @param {Interaction} interaction - An interaction object from Discord.js
 * @param {User} target - The target user to send a message to
 * @param {string} cmd_name - The name of the command
 * @param {string} reason - The reason for the action (optional)
 */
async function attemptMessageTarget(interaction, target, cmd_name, reason) {
    console.log("reached");
    if (interaction.guild.members.cache.has(target.id)) {
        await target.send(generateOutputString(cmd_name, interaction, reason))
            .catch(() => {
                console.log(`${target.id} has DMs closed or blocked the bot`);
                // Sending a DM may fail due to a user's privacy settings - ignore errors
            });
    }
}


//add some additional customisation code later if needed
function handleError(interaction, err) {
    interaction.deleteReply();
    interaction.followUp(`Something went wrong:\n${err.message}`);
    console.error(err);
}


//formats a nice output string that can be DMd to the user
function generateOutputString(cmd_name, interaction, reason) {
    let actionMessage = '';

    if (cmd_name.includes('kick')) {
        actionMessage = 'kicked';
    } else if (cmd_name.includes('ban')) {
        actionMessage = cmd_name + 'ned';
    }

    return `You were ${actionMessage} from ${interaction.guild.name}:\n${reason}`;
}