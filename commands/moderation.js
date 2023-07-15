/**
 * TO DO: 
 * add logic to check for moderators/higher ranked users rather than fail the command
 * add DM code to all removal commands
 * move embed builder somewhere else - unused for now
 */

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const SubOptionBuilder = require('../builders/sub-option-builder.js');

/** function somewhere else
 * Builds the chat embed message (basically, a nice way to display a mod action)
 * @param {*} interaction 
 * @param {String} cmd_name - the name of the subcommand
 * @param {User} target - a user object representing a guild member
 * @param {String} reason - the reason for the action
 * @returns an embeddable message, this needs to be used in a reply statement to appear in chat
 */
function buildEmbed(interaction, cmd_name, target, reason) {
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
}


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
        .addSubcommand(ban)
        .addSubcommand(unban)
        .addSubcommand(tempban)
        .addSubcommand(softban)
        .addSubcommand(masskick),
    /*Each subcommand requires a different resolution for their options
    interaction.options methods return different things about what happened in the command (i.e. target)*/
    async execute(interaction) {
        let target_ids = []; //array for processing multiple users
        const cmd_name = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const target = interaction.options.getUser('target') ?? interaction.options.getString('targets'); //the target(s) for the action member ?? string
        const delete_days = interaction.options.getInteger('delete') ?? 0;

        if (!target) { // if for some reason there's no target, don't do anything
            interaction.reply('Target could not be found, did you enter it correctly?');
        }
        else if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
            target_ids = target.match(re); //returns an array with the chars in re stripped out
            // Remove entries with more or fewer than 18 characters
            target_ids = target_ids.filter(id => id.length === 18);
            console.log(target_ids);
            //tar_set = new Set(target_ids); Set O(1) faster than Array O(n) for lookup, but using just a small # of items here so negligible
        }

        if (checkPermissions(interaction, cmd_name, target, target_ids)){
            switch (cmd_name) { // processing the options
                /**
                 * Kicking a user removes them from the server without preventing them rejoining.
                 * The kick may fail still if the user leaves the server or the ID seems valid but isn't.
                 */
                case 'kick': 
                    if (!interaction.guild.members.cache.get(target.id)) { //move this - can also use fetch for
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
                 */
                case 'masskick': 
                    await interaction.reply('Trying to kick members...');
                    let response = `**Kicked: **`;
                    let invalid = `\n**Invalid: **`;
                    let invalidCount = 0;
                    //const invalidIds = []; //invalid IDs would be e.g. users not present on the server
                    try {
                        const promises = target_ids.map(async (id) => { 
                            const member = interaction.guild.members.cache.get(id);
                            if (member) { //member retrieved, send a message and try to kick them
                                await member.send(`You were kicked from ${interaction.guild.name} for: ${reason}`);
                                await interaction.guild.members.kick(member, reason);
                                response += `<@${id}> `; // add the user's tag to the response string
                            } else {
                                invalid += `${id}, `;
                                invalidCount++;
                                //invalidIds.push(id);
                            }
                        });
                        await Promise.all(promises); //wait for all of the promises to resolve
                        if (invalidCount > 0) {
                            invalid = invalid.slice(0, -2); // Removes the last comma and space
                            response += invalid;
                            //response += '\n**Invalid: **' + invalidIds.join(', ');
                        }
                        await interaction.editReply(response);
                    } catch (err) {
                        handleError(interaction, err);
                    }
                    break;
                /**
                 * Ban blocks the user from rejoining (and deletes some of their last posts) until reversed
                 */
                case 'ban':
                    const member = interaction.guild.members.cache.get(target.id);
                    if (!member) {
                        interaction.reply('Invalid ID - user may not be in this server');
                        break;
                    }
                    await member.send(generateOutputString(cmd_name, interaction.guild.name, reason))
                        .catch(() => {
                            console.log(`${member.id} has DMs closed or blocked the bot`)
                            // Sending a DM may fail due to a user's privacy settings - ignore any error from this
                        });
                    await interaction.guild.members.ban(member, { deleteMessageSeconds: delete_days, reason: reason })
                        .then(() => {
                            interaction.reply(`**Banned:** ${member}`);
                        })
                        .catch(err => {
                            handleError(interaction, err);
                        });
                    break;
                /**
                 * Tempban serves as a medium between a ban and a kick - a ban which will reverse itself after time
                 * NYI - need to track how long a user should stay banned for, and check for this elsewhere as an event to reverse
                 */
                case 'tempban': //Tar, Dur: Hist, Reason
                    await interaction.reply('[NYI]');
                    //ban the target
                    //update a database of temp-banned users
                    break;
                /**
                 * Softban is a ban followed by an immediate reversal, which serves to quickly purge messages instead of manually deleting them
                 * At the moment the amount of deleted messages is set to the max, but could be variable if the need arises
                 */
                case 'softban': //T: R
                    if (!interaction.guild.members.cache.get(target.id)) {
                        interaction.reply('Invalid ID - user may not be in this server');
                        break;
                    }
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
                 */
                case 'unban':
                    
                    guild.bans.fetch(target)
                    .then(console.log)
                        .catch(console.error);
                    await interaction.guild.members.unban(target)
                        .then(() => {
                            interaction.reply(`Unbanned ${target} because: ${reason}`)
                        })
                        .catch(err => {
                            handleError(interaction, err);
                        });
                    break;
            }
        }
    },
};


// checks whether the commands are allowed to process
function checkPermissions(interaction, cmd_name, target, target_ids) {
    const user_perms = interaction.member.permissions;
    if ((cmd_name.includes('kick') && !user_perms.has(PermissionsBitField.Flags.KickMembers))
        || (cmd_name.includes('ban') && !user_perms.has(PermissionsBitField.Flags.BanMembers))) {
        interaction.reply({content:'You don\'t have permission for that!', ephemeral: true });
    } else if (target.id == interaction.client.user.id || target_ids.includes(interaction.client.user.id)) {
        interaction.reply({content:'I can\'t Gnome myself!', ephemeral: true });
    } else if (target.id == interaction.member.id || target_ids.includes(interaction.member.id)) {
        interaction.reply({content:'I can\'t help you Gnome yourself!', ephemeral: true });
    } else {
        return true; // Only return true if all permission checks pass
    }

    return false; // Return false if any of the permission checks fail
}


//add some additional customisation code later if needed
function handleError(interaction, err) {
    interaction.deleteReply();
    interaction.followUp(`Something went wrong:\n${err.message}`);
    console.error(err);
}

//formats a nice output string that can be DMd to the user
function generateOutputString(cmd_name, guildName, reason) {
    let actionMessage = '';
  
    if (cmd_name.includes('kick')) {
      actionMessage = 'kicked';
    } else if (cmd_name.includes('ban')) {
      actionMessage = cmd_name + 'ned';
    }
  
    return `You were ${actionMessage} from ${guildName}:\n${reason}`;
  }