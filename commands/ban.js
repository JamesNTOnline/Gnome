const Discord = require("discord.js");

/*This is the banning function. Want to do some checking to disallow certain users
  from accessing this function*/
module.exports.run = async (bot, message, args) => {
  let bannedUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
  if (!bannedUser) return message.channel.send("Can't find this user!");
  let banReason = args.join(" ").slice(22);
  if (!banReason) banReason = ("No reason provided")
  if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You don't have permission, faggot");
  if (bannedUser.hasPermission("BAN_MEMBERS")) return message.channel.send("That person can't be banned!");



//setting up an embedded message to be sent
  let banEmbed = new Discord.RichEmbed()
    .setDescription(":hammer: **Ban Report** :point_right::skin-tone-1::door:")
    .setColor("#ff1616")
    .addField("Banned User: ", `${bannedUser} / ${bannedUser.displayName} / ${bannedUser.id}`)
    .addField("Banned By: ", `<@${message.author.id}>`)
    .addField("Reason: ", banReason)

  await bannedUser.send(banEmbed)
    .catch(error => console.log(error));
  bannedUser.ban(banReason)
  message.channel.send(banEmbed);

}

module.exports.help = {
  name: "ban"
}

/*  bannedUser.ban({
  }).then(() => {
    bannedUser.send(banEmbed)
    message.channel.send(banEmbed);
  }).catch(error => {
    message.reply("Couldn't ban that user")
    console.log(error);
  });*/

/*var banReport = "```prolog ~Ban Report~ \n"
  + "Banned User: " + `${bannedUser} with ID ${bannedUser.id}\n`
  + "Banned By: " + `<@${message.author.id}> with ID ${message.author.id}\n`
  + "Ban Reason: " + banReason + "\nAt: " + message.createdAt + "\n```";*/
