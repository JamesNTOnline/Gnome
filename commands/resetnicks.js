const Discord = require("discord.js");

module.exports.run = async (bot, message, args) => {
  if (!message.member.hasPermission("BAN_MEMBERS")) return message.channel.send("You don't have permission, faggot");
  var whitey = message.guild.roles.get("439523422930862082");
  var whiteyList = message.guild.roles.get('439523422930862082').members.map(m=>m);
  var len = whiteyList.length;
  //console.log(whiteyList);
  for(var i = 0; i<len; i++){
    var member = whiteyList[i];
    if(member.nickname == "simp"){
    member.setNickname('');
  }
  }
}

exports.help = {
  name: "resetnicks"
}
