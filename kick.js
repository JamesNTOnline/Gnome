
    /*     /*MASSKICK - used to purge multiple users at a time
        Required: a target list.
        This must be a String as Mentionable and User would only let us access one object*/
/*         .addSubcommand(subcommand =>
            subcommand
                .setName('masskick')
                .setDescription('Kicks multiple users from the server at once.')
                .addStringOption(option =>
                    option.setName('targets')
                        .setDescription('Users to remove, by @mention or ID, separated by a space')
                        .setRequired(true))), */

        /* BAN - remove a single user from the server permanently
        Required: target; Optional: delete history (up to 7 days in secs), reason*/
        /*         .addSubcommand(subcommand =>
                    subcommand
                        .setName('ban')
                        .setDescription('Bans a user')
                        .addUserOption(option =>
                            option.setName('target')
                                .setDescription('Mention or ID of user to ban')
                                .setRequired(true))
                        .addIntegerOption(option =>
                            option.setName('delete')
                                .setDescription('How much of the message history to delete')
                                .addChoices(
                                    //0, 6, 12, 24, 72, 168 hrs in seconds
                                    { name: 'Don\'t delete any', value: 0 },
                                    { name: 'Last day', value: 86400 },
                                    { name: 'Last 3 days', value: 259200 },
                                    { name: 'Last 7 days', value: 604800 }
                                ))
                        .addStringOption(option =>
                            option.setName('reason')
                                .setDescription('The behaviour the user is being banned for')
                                .setMaxLength(512))) */


        //TEMPBAN Command - Bans a user for a specified amount of time
/*         .addSubcommand(subcommand =>
            subcommand
                .setName('tempban')
                .setDescription('Bans a user for a specified amount of time [NYI]')
                //a string option will allow all inputs. these need to be resolved appropriately
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Mention or ID or user to remove')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('duration')
                        .setDescription('How long the user should stay banned for')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('delete')
                        .setDescription('How much of the message history to delete')
                        .addChoices(
                            //0, 6, 12, 24, 72, 168 hrs in seconds
                            { name: 'Don\'t delete any', value: 0 },
                            { name: 'Last day', value: 86400 },
                            { name: 'Last 3 days', value: 259200 },
                            { name: 'Last 7 days', value: 604800 }
                        ))
                .addStringOption(option =>
                    option.setName('reason')
                        .setDescription('The behaviour the user is being banned for')
                        .setMaxLength(512))) */


        //SOFTBAN Command - Bans and unbans a member to purge messages
/*         .addSubcommand(subcommand =>
            subcommand
                .setName('softban')
                .setDescription('Quickly bans and unbans a user; deletes a day\'s worth of messages')
                //a string option will allow all inputs. these need to be resolved appropriately
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('Mention or ID or user to remove')
                        .setRequired(true))), */ 



/**
 * OLD KICK JS
 */
// // const Discord = require("discord.js");
// //
// // module.exports.run = async (bot, message, args) => {
// //   let kickUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
// //   if (!kickUser) return message.channel.send("Can't find this user!");
// //   let kickReason = args.join(" ").slice(22);
// //   if (!kickReason) kickReason = ("No reason provided")
// //
// //   if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("No can do!");
// //   if (kickUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be kicked!");
// //
// //   let kickEmbed = new Discord.RichEmbed()
// //     .setDescription("~Kick Report~")
// //     .setColor("#e56b00")
// //     .addField("Kicked User", `${kickUser} with ID ${kickUser.id}`)
// //     .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
// //     .addField("Reason", kickReason)
// //     .setTimestamp(message.createdAt)
// //
// //   await kickUser.kick(kickReason)
// //     .catch(error => message.reply("something went wrong..."));
// //   message.channel.send(kickEmbed);
// // }
// //
// // exports.help = {
// //   name: "kick"
// // }
//
// const Discord = require("discord.js");
//
// module.exports.run = async (bot, message, args) => {
//   let fakeUser = message.guild.member(message.author);
//   let kickUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
//   if (kickUser == fakeUser) return message.channel.send("DONT USE MY BOT TO COMMIT SUSANSIDE!");
//   if (!kickUser) return message.channel.send("Can't find this user!");
//   let kickReason = args.join(" ").slice(22);
//   if (!kickReason) kickReason = ("No reason provided");
//   if (kickUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be kicked!");
//
//   let kickEmbed = new Discord.RichEmbed()
//     .setDescription("~Kick Report~")
//     .setColor("#e56b00")
//     .addField("Kicked User", `${kickUser} with ID ${kickUser.id}`)
//     .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
//     .addField("Reason", kickReason)
//     .setTimestamp(message.createdAt)
//
//   if (fakeUser.hasPermission("MANAGE_MESSAGES")) {
//     await kickUser.kick(kickReason)
//       .catch(error => message.reply("something went wrong..."));
//     message.channel.send("Kicked User: " + `${kickUser}`);
//   } else {
//     let chance = Math.round(Math.random() + 0.4);
//     console.log(chance);
//     if(chance == 0){
//     await kickUser.kick(kickReason)
//       .catch(error => message.reply("something went wrong..."));
//     message.channel.send("Kicked User: " + `${kickUser}`);
//   } else if (chance == 1){
//     await fakeUser.kick(kickReason)
//       .catch(error => message.reply("something went wrong..."));
//     message.channel.send("Kicked User: " + `${kickUser}`);
//   }
//   }
// }
//
// exports.help = {
//   name: "kick"
// }
