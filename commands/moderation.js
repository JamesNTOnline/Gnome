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

const { SlashCommandBuilder, SlashCommandSubcommandBuilder, Constants } = require('discord.js');
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
                ));
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
        .setDescription(desc);
    sub_cmd = addTargetUserOption(sub_cmd);
    sub_cmd = addReasonOption(sub_cmd);
    if(name.includes('temp')){
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


/*
KICK - removes a single user from the server
Required: target; Optional: reason
*/
let kick = buildSubCommand('kick', 'Kicks a user from the server.');

/*
MASSKICK - used to purge multiple users at a time
Required: a target list. This must be a String as Mentionable and User would only let us access one object
*/
let masskick = buildSubCommand('masskick', 'Kicks multiple users from the server.');

/* 
BAN - remove a single user from the server permanently
Required: target; Optional: delete history (up to 7 days in secs), reason
*/
let ban = buildSubCommand('ban', 'Bans a user from the server.');

/*
TEMPBAN Command - Bans a user for a specified amount of time
Required: target, duration; Optional; delete history, reason
*/
let tempban = buildSubCommand('tempban', 'Bans a user for a specified amount of time [NYI].');

/*

*/
let softban = buildSubCommand('softban', 'Quickly bans and unbans a user and deletes their messages.');


//exporting a slashcommandbuilder object. this object needs to have a name and description, and subcommands
module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Moderation commands') //note: even though this is invisible to the user, it is *required* by command.tojson
        .addSubcommand(kick)
        .addSubcommand(ban)
        .addSubcommand(tempban)
        .addSubcommand(softban)
        .addSubcommand(subcommand =>
            subcommand
                .setName('masskick')
                .setDescription('Kicks multiple users from the server at once.')
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('Users to remove, by @mention or ID, separated by a space')
                        .setRequired(true))),

    //Resolve the interaction here - each subcommand requires a different resolution.
    //interaction methods return different things about what happened in the command (i.e. target)
    async execute(interaction) {
        const cmd_name = interaction.options.getSubcommand(); //name of the called command
        const reason = interaction.options.getString('reason') ?? 'No reason provided.'; //nullish coalescing operator
        const target = interaction.options.getMember('target') ?? interaction.options.getString('targets'); //grab the target for the action
        if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex all non-digit characters
            let target_ids = target.match(re); //array of target IDs
            console.log(target_ids);
        }
        if (!cmd_name.includes('masskick')) { //for a masskick we don't want this type of embed
            const embed = buildEmbed(interaction, cmd_name, target, reason);
        }
        if (target.id == interaction.client.user.id) { //don't let the Gnome do anything to itself
            interaction.reply('I aint gonna Gnome myself, boss!');
        } else if (target.id == interaction.user.id) { //don't let the command user do anything to themselves
            interaction.reply('I can\'t Gnome you - you\'re da boss');
        } else {



            switch (cmd_name) {
                case 'kick':
                    if (!target) { // if for some reason there's no target, don't do anything
                        interaction.reply('There is no such user');
                        break;
                    }
                    /* TODO: Check user has kick permissions*/
                    await target.kick(reason)
                        .then(() => {
                            console.log('Kick successful');
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            interaction.deleteReply();
                            interaction.followUp('something went wrong, user not kicked!');
                            console.error(err);
                        });
                    break;

                case 'masskick':
                    await interaction.reply(target);
                    break;

                case 'ban':
                    console.log(target);
                    break;

                case 'tempban':
                    await interaction.reply('I am ready to work!');
                    break;

                case 'softban':
                    await interaction.reply('I am ready to work!');
                    break;
            }
        }
    },
};
