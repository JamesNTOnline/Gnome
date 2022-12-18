/*
HOW TO READ COMMAND FILES:
 - Each command file contains a "group" of commands which fall under a particular umbrella.
   in this case - moderation activities; things server admins can use to keep the server safe and usable.

- the command group is at the top level, named 'mod'
- the subcommands are blocks of code which allocate the names, descriptions, and options for the actual callable commands.
- in discord this appears thusly: /mod kick, /mod ban, /mod masskick.
- /mod CANNOT be called by itself, as a consequence of being subcommanded
- for safety, subcommands with options that require some target should always be required = true

- at the end of the file is the interaction resolver. here, behaviour must be specified for each subcommand (or it will do nothing).
  retrieve the name and input of the interaction using interaction.options methods and go from there.
*/
// https://discordjs.guide/popular-topics/embeds.html#embed-preview
// https://www.codegrepper.com/tpc/avatar+command+discord.js
// see: https://discordjs.guide/slash-commands/advanced-creation.html#option-types for the allowed input types

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, PermissionsBitField } = require('discord.js');
const { EmbedBuilder } = require("discord.js");


/**
 * use to add a single target user subcommand to a given command (i.e. kick)
 * @param {SlashCommandBuilder, SlashSubCommandBuilder} builder - object to add options/subcommands to
 */
function addTargetUserOption(builder) {
    return builder
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Mention or ID of user to remove')
                .setRequired(true));
}


/**
 * Adds an Integer option to a command builder representing the amount of messages to delete
 * @param {SlashCommandBuilder, SlashCommandSubcommandBuilder} builder 
 */
function addDeleteOption(builder) {
    return builder
        .addIntegerOption(option =>
            option.setName('delete')
                .setDescription('Number of days worth of messages to purge')
                .addChoices(
                    //0, 6, 12, 24, 72, 168 hrs in seconds
                    { name: 'Don\'t delete any', value: 0 },
                    { name: 'Last day', value: 86400 },
                    { name: 'Last 3 days', value: 259200 },
                    { name: 'Last 7 days', value: 604800 }
                )
                .setMinValue(604800)
                .setMaxValue(0));
}

/**
 * adds a String option to a command builder representing the reason a user is being removed
 * @param {SlashCommandBuilder, SlashCommandSubcommandBuilder} builder - builder object to add the option to
 */
function addReasonOption(builder) {
    let is_required = false;
    if (builder.name.includes('ban')) { //ban commands should always have a reason (why? they have permanent effects)
        is_required = true;
    }
    return builder
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The behaviour the user is being punished for')
                .setMaxLength(512)
                .setRequired(is_required));
}


/** 
 * @param {String} name - the name of the subcommand
 * @param {String} desc - the description for what the subcommand does
 * @returns a subcommand builder object, representing a subcommand. this needs to be added onto a command builder object
 * TODO: refactor with above
 * ALL REQUIRED COMMANDS MUST COME BEFORE OPTIONALS
 * Ban/Softban: TARGET, REASON > DELETE
 * Kick/Masskick: TARGET, REASON
 * Tempban: TARGET, REASON, DURATION > DELETE
 */
function buildSubCommand(name, desc) {
    let sub_cmd = new SlashCommandSubcommandBuilder()
        .setName(name)
        .setDescription(desc)
    sub_cmd = addTargetUserOption(sub_cmd);
    sub_cmd = addReasonOption(sub_cmd);
    if (name.includes('temp')) {
        sub_cmd.addIntegerOption(option =>
            option.setName('duration')
                .setDescription('How long the user should stay banned for')
                .setRequired(true));
    }
    if (name.includes('ban') && !name.includes('soft')) {
        sub_cmd = addDeleteOption(sub_cmd)
    }
    return sub_cmd;
}


/**
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
    embed.setTitle('~ ' + name_formatted + ' Report ~')
        .setColor("#e56b00")
        .addFields(
            { name: 'Mod', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'User', value: `<@${target.id}>`, inline: true },
            { name: 'ID', value: `${target.id}`, inline: true },
            { name: 'Reason', value: reason }
        )
        .setThumbnail(`${target.displayAvatarURL({ dynamic: true })}`)
        .setTimestamp(interaction.createdTimestamp);
    return embed;
}

//all commands are unavailable in DM
let kick = buildSubCommand('kick', 'Kicks a user from the server.');
let masskick = buildSubCommand('masskick', 'Kicks multiple users from the server.');
let ban = buildSubCommand('ban', 'Bans a user from the server.');
let tempban = buildSubCommand('tempban', 'Bans a user for a specified amount of time [NYI].');
let softban = buildSubCommand('softban', 'Quickly bans and unbans a user and deletes their messages.');

//exporting a slashcommandbuilder object. this object needs to have a name and description (required by command.toJSON)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands')
        .setDMPermission(false) //unavailable in DM
        .addSubcommand(kick) //start adding subcommands to the command
        .addSubcommand(ban)
        .addSubcommand(tempban)
        .addSubcommand(softban)
        .addSubcommand(subcommand => //masskick is a unique case (all other commands only target 1 user) so build separately
            subcommand
                .setName('masskick')
                .setDescription('Kicks multiple users from the server at once.')
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('Users to remove, by @mention or ID, separated by a space')
                        .setRequired(true))),

    //Each subcommand requires a different resolution for their options
    //interaction.options methods return different things about what happened in the command (i.e. target)
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        const target = interaction.options.getMember('target') ?? interaction.options.getString('targets'); //the target(s) for the action member ?? string
        const delete_days = interaction.options.getInteger('delete') ?? 0;
        const user_perms = interaction.member.permissions;
        let target_ids = []; //target might be a string instead of a member  object. Need to put these in an array for processing
        let embed; //embed is conditionally assigned later but declared here due to block scoping
        if (!target) { // if for some reason there's no target, don't do anything
            interaction.reply('You didn\'t tell me who to gnome!');
        } else if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
            target_ids = target.match(re); //returns an array with the chars in re stripped out
            //tar_set = new Set(target_ids); Set O(1) faster than Array O(n), but using just a small # of items here so negligible
        }
        if (!cmd_name.includes('mass')) { //for a mass command we don't want the default embed
            embed = buildEmbed(interaction, cmd_name, target, reason);
        }
        //permission check -> don't allow bot to touch itself or the user
        if ((cmd_name.includes('kick') && !user_perms.has(PermissionsBitField.Flags.KickMembers))
            || (cmd_name.includes('ban') && !user_perms.has(PermissionsBitField.Flags.BanMembers))) {
            interaction.reply('You don\'t have permission for that, naughty!');
        } else if (target.id == interaction.client.user.id || target_ids.includes(interaction.client.user.id)) {
            interaction.reply('I aint gonna Gnome myself, blockhead!');
        } else if (target.id == interaction.user.id || target_ids.includes(interaction.user.id)) { //don't let the command user do anything to themselves
            interaction.reply('I can\'t help you Gnome yourself, idiot!');
        } else {
            //The command is good and has a legitimate target. Now process them
            switch (cmd_name) {
                case 'kick': //Required: target; Optional: reason
                    await target.kick(reason)
                        .then(() => {
                            console.log(`Kicked ${target.nickname} successfuly`);
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not kicked!');
                            console.error(err);
                        });
                    break;
                case 'masskick': //Required: a target list. 
                    //create embed
                    //await defer reply
                    //go through the targets list and kick each one
                    //add a field to the embed
                    //what if the person already left
                    //
                    await interaction.reply(target);
                    break;
                case 'ban': //Required: target; Optional: delete history (up to 7 days in secs), reason
                    await target.ban({ deleteMessageSeconds: delete_days, reason: reason })
                        .then(() => {
                            console.log(`Banned ${target.nickname} successfuly`);
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not banned!');
                            console.error(err);
                        });
                    break;
                case 'tempban': //Required: target, duration; Optional; delete history, reason
                    await interaction.reply('Command NYI');
                    //ban the target
                    //update a database of temp-banned users
                    break;
                case 'softban': //Required: target; Optional: reason
                    await target.ban({ deleteMessageSeconds: 86400, reason: reason })
                        .then(() => {
                            console.log(`Banned ${target.nickname} successfuly`);
                            interaction.reply({ embeds: [embed] });
                            interaction.guild.members.unban(target);
                            console.log(`Unbanned ${target.nickname} successfuly`);
                        })
                        .catch(err => { //can probably move this
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not banned!');
                            console.error(err);
                        });
                    break;
            }
        }
    },
};
