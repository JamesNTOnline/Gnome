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
        let embed;
        let response;
        const cmd_name = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const target = interaction.options.getUser('target') ?? interaction.options.getString('targets'); //the target(s) for the action member ?? string
        const delete_days = interaction.options.getInteger('delete') ?? 0;
        const user_perms = interaction.member.permissions;
        //console.log (target);
        if (!cmd_name.includes('mass')) { //MOVE THIS WHY BUILD THE EMBED IF COMMAND FAILS?
            embed = buildEmbed(interaction, cmd_name, target, reason);
        }

        if (!target) { // if for some reason there's no target, don't do anything
            interaction.reply('Target could not be found, did you enter it correctly?');
        } 
        else if (!interaction.guild.members.cache.get(target.id)) { //move this - can also use fetch for
            interaction.reply('They\'re not in the server!');
        }
        else if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
            target_ids = target.match(re); //returns an array with the chars in re stripped out
            // Remove entries with more or fewer than 18 characters
            target_ids = target_ids.filter(id => id.length === 18);
            console.log(target_ids);
            //tar_set = new Set(target_ids); Set O(1) faster than Array O(n) for lookup, but using just a small # of items here so negligible
        }

        //permission checks -> don't allow bot to touch itself or the user
        if ((cmd_name.includes('kick') && !user_perms.has(PermissionsBitField.Flags.KickMembers))
            || (cmd_name.includes('ban') && !user_perms.has(PermissionsBitField.Flags.BanMembers))) {
            interaction.reply('You don\'t have permission for that!');
        } else if (target.id == interaction.client.user.id || target_ids.includes(interaction.client.user.id)) {
            interaction.reply('I can\'t Gnome myself!');
        } else if (target.id == interaction.member.id || target_ids.includes(interaction.member.id)) { //don't let the command user do anything to themselves
            interaction.reply('I can\'t help you Gnome yourself!');
        } else {

            switch (cmd_name) { // processing the options
                case 'kick': 
                    if (!interaction.guild.members.cache.get(target.id)) { //move this - can also use fetch for
                        interaction.reply('They\'re not in the server!');
                        break;
                    }
                    //tell the member what happened
                    await member.send(`You were kicked from ${interaction.guild.name} for: ${reason}`);
                    await interaction.guild.members.kick(target, reason)
                        .then(() => {
                            interaction.reply(`**Kicked:** <@${target.id}>`);
                        })
                        .catch(err => {
                            handleError(interaction, err);
                        });
                    break; 
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
                            response += invalid; // Update the response with the invalid IDs
                            //response += '\n**Invalid: **' + invalidIds.join(', ');
                        }
                        await interaction.editReply(response);
                    } catch (err) {
                        handleError(interaction, err);
                    }
                    break;
                case 'ban':
                    if (!interaction.guild.members.cache.get(target.id)) {
                        interaction.reply('They\'re not in the server!');
                        break;
                    }
                    await member.send(`You were banned from ${interaction.guild.name} for: ${reason}`); // Send the reason to the member
                    await interaction.guild.members.ban(target, { deleteMessageSeconds: delete_days, reason: reason })
                        .then(() => {
                            interaction.reply(`**Banned:** <@${id}>`);
                        })
                        .catch(err => {
                            handleError(interaction, err);
                        });
                    break;
                case 'tempban': //Tar, Dur: Hist, Reason
                    await interaction.reply('[NYI]');
                    //ban the target
                    //update a database of temp-banned users
                    break;
                case 'softban': //T: R
                    await interaction.guild.members.ban(target, { deleteMessageSeconds: 86400, reason: reason })
                        .then(() => {
                            interaction.reply(`**Kicked:** <@${id}>`);
                            interaction.guild.members.unban(target);
                        })
                        .catch(err => { //can probably move this
                            handleError(interaction, err);
                        });
                    break;
                case 'unban':
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


//add some additional customisation code later if needed
function handleError(interaction, err) {
    interaction.deleteReply();
    interaction.followUp(`Something went wrong:\n${err.message}`);
    console.error(err);
}