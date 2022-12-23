/**
 * kick
 * masskick
 * ban
 * softban
 * tempban
 * timeout 
 */

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
                .setMinValue(0)
                .setMaxValue(604800));
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
    if (target)
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
let kick = buildSubCommand('kick', 'kicks a user from the server');
let masskick = buildSubCommand('masskick', 'kicks multiple users from the server');
let ban = buildSubCommand('ban', 'bans a user from the server');
let tempban = buildSubCommand('tempban', 'bans a user for a specified amount of time [NYI]');
let softban = buildSubCommand('softban', 'quickly bans and unbans a user and deletes their messages');

//exporting a slashcommandbuilder object. this object needs to have a name and description (required by command.toJSON)
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('moderation commands')
        .setDMPermission(false) //unavailable in DM. at present can't set this stuff for individual subcommands
        .addSubcommand(kick) //start adding subcommands to the command
        .addSubcommand(ban)
        .addSubcommand(tempban)
        .addSubcommand(softban)
        .addSubcommand(subcommand => //masskick is a unique case (all other commands only target 1 user) so build separately
            subcommand
                .setName('masskick')
                .setDescription('kicks multiple users from the server at once')
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('users to remove, by @mention or ID, separated by a space')
                        .setRequired(true))),

    //Each subcommand requires a different resolution for their options
    //interaction.options methods return different things about what happened in the command (i.e. target)
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand();
        const reason = interaction.options.getString('reason') ?? 'No reason provided.';
        let target = interaction.options.getUser('target') ?? interaction.options.getString('targets'); //the target(s) for the action member ?? string
        const delete_days = interaction.options.getInteger('delete') ?? 0;
        const user_perms = interaction.member.permissions;
        //console.log (target);
        let target_ids = []; //array for processing multiple users
        let embed; //embed declared here due to block scoping
        if (!cmd_name.includes('mass')) {
            embed = buildEmbed(interaction, cmd_name, target, reason);
        }
        if (!target) { // if for some reason there's no target, don't do anything
            interaction.reply('Target could not be found, did you enter it correctly?');
        } else if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
            target_ids = target.match(re); //returns an array with the chars in re stripped out
            //tar_set = new Set(target_ids); Set O(1) faster than Array O(n) for lookup, but using just a small # of items here so negligible
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
            //processing the options
            switch (cmd_name) {
                case 'kick': //Tar: Reason
                    if(!interaction.guild.members.cache.get(target.id)){
                        interaction.reply('They aint here, bub!');
                        break;
                    }
                    await interaction.guild.members.kick(target, reason)
                        .then(() => {
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not kicked!');
                            console.error(err);
                        });
                    break;
                case 'masskick': //TarList
                    //create embed
                    //await defer reply
                    //go through the targets list and kick each one
                    //add a field to the embed
                    //what if the person already left
                    //
                    await interaction.reply('[NYI - Coming Soon!]');
                    break;
                case 'ban': //Tar: Hist, Reason
                    await interaction.guild.members.ban(target, { deleteMessageSeconds: delete_days, reason: reason })
                        .then(() => {
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not banned!');
                            console.error(err);
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
                            interaction.reply({ embeds: [embed] });
                            interaction.guild.members.unban(target);
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
