/*const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {
  let kickUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
  if (!kickUser) return message.channel.send("Can't find this user!");
  let kickReason = args.join(" ").slice(22);
  if (!kickReason) kickReason = ("No reason provided")

  if (!message.member.hasPermission("MANAGE_MESSAGES")) return message.channel.send("No can do!");
  if (kickUser.hasPermission("MANAGE_MESSAGES")) return message.channel.send("That person can't be kicked!");

  let kickEmbed = new Discord.RichEmbed()
    .setDescription("~Kick Report~")
    .setColor("#e56b00")
    .addField("Kicked User", `${kickUser} with ID ${kickUser.id}`)
    .addField("Kicked By", `<@${message.author.id}> with ID ${message.author.id}`)
    .addField("Reason", kickReason)
    .setTimestamp(message.createdAt)

  await kickUser.kick(kickReason)
    .catch(error => message.reply("something went wrong..."));
  message.channel.send(kickEmbed);
}

module.exports.help = {
  name: "kick"
}*/
