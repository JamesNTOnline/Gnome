/**
 * kick
 * masskick
 * ban
 * softban
 * tempban
 * timeout 
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
        } else if (typeof target === 'string') {
            const re = /(?:\d+\.)?\d+/g; //regex for all non-digit chars
            target_ids = target.match(re); //returns an array with the chars in re stripped out
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

            //processing the options
            switch (cmd_name) {
                case 'kick': //Tar: Reason
                    if (!interaction.guild.members.cache.get(target.id)) {
                        interaction.reply('They\'re not in the server!');
                        break;
                    }
                    await interaction.guild.members.kick(target, reason)
                        .then(() => {
                            interaction.reply({ embeds: [embed] });
                        })
                        .catch(err => {
                            handleError(interaction, err);
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
                            interaction.reply({ embeds: [embed] });
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
function handleError(interaction, err){
    interaction.deleteReply();
    interaction.followUp('Something went wrong:\n${err.message}');
    console.error(err);
}